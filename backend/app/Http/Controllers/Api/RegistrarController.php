<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Enums\PaymentStatus;
use App\Enums\StudentStatus;
use App\Events\ApplicationReviewed;
use App\Events\PaymentStatusChanged;
use App\Events\StudentEnrolled;
use App\Http\Controllers\Controller;
use App\Http\Requests\EnrollApplicationRequest;
use App\Http\Requests\ReviewApplicationRequest;
use App\Http\Requests\UpdateStudentStatusRequest;
use App\Http\Resources\ApplicationResource;
use App\Http\Resources\ClassResource;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\StudentResource;
use App\Models\Application;
use App\Models\Document;
use App\Models\Payment;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use App\Services\AuditLogService;

class RegistrarController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function dashboard(): JsonResponse
    {
        $count = fn (string $status) => Application::query()->where('status', $status)->count();
        $successfulPayments = Payment::query()->where('status', PaymentStatus::Successful->value)->count();
        $openIntakes = DB::table('intakes')->whereIn('status', ['open', 'upcoming'])->count();
        $classes = SchoolClass::query()->withCount('students')->get(['id', 'capacity']);

        return response()->json(['data' => [
            'applications' => [
                'total' => Application::count(),
                'submitted' => $count('submitted'),
                'under_review' => $count('under_review'),
                'approved' => $count('approved'),
                'rejected' => $count('rejected'),
                'pending_payment' => $count('payment_pending'),
            ],
            'payments' => [
                'successful' => $successfulPayments,
                'pending' => Payment::where('status', PaymentStatus::Pending->value)->count(),
                'failed' => Payment::whereIn('status', ['failed', 'cancelled', 'refunded'])->count(),
            ],
            'students' => [
                'enrolled' => Student::count(),
                'active' => Student::where('status', StudentStatus::Active->value)->count(),
            ],
            'open_intakes' => $openIntakes,
            'available_class_capacity' => max(0, (int) $classes->sum(fn ($class) => $class->capacity - $class->students_count)),
        ]]);
    }

    public function applications(Request $request)
    {
        Gate::authorize('viewAny', Application::class);
        $search = $request->input('search');
        $sort = in_array($request->input('sort'), ['created_at', 'submitted_at', 'applicant_name', 'status'], true)
            ? $request->input('sort') : 'created_at';
        $applications = Application::query()->with(['program', 'intake'])
            ->when($request->input('status'), fn (Builder $q, $v) => $q->where('status', $v))
            ->when($request->input('program_id'), fn (Builder $q, $v) => $q->where('program_id', $v))
            ->when($request->input('intake_id'), fn (Builder $q, $v) => $q->where('intake_id', $v))
            ->when($request->input('reference_number'), fn (Builder $q, $v) => $q->where('reference_number', $v))
            ->when($request->input('from'), fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->input('to'), fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($search, fn (Builder $q, $v) => $q->where(function (Builder $query) use ($v) {
                $query->where('applicant_name', 'like', "%{$v}%")
                    ->orWhere('applicant_email', 'like', "%{$v}%")
                    ->orWhere('reference_number', 'like', "%{$v}%");
            }))
            ->orderBy($sort, $request->input('direction') === 'asc' ? 'asc' : 'desc')
            ->paginate(min($request->integer('per_page', 20), 100));

        return ApplicationResource::collection($applications);
    }

    public function showApplication(Application $application): ApplicationResource
    {
        Gate::authorize('view', $application);
        return new ApplicationResource($application->load(['program', 'intake', 'reviewedBy', 'documents', 'payments', 'student']));
    }

    public function review(ReviewApplicationRequest $request, Application $application): ApplicationResource
    {
        Gate::authorize('approve', $application);
        $status = ApplicationStatus::from($request->validated('status'));
        $this->validateReviewTransition($application, $status);
        $before = $this->snapshot($application);

        $application->forceFill([
            'status' => $status,
            'rejection_reason' => $status === ApplicationStatus::Rejected ? $request->validated('rejection_reason') : null,
            'reviewed_by' => $request->user()->id,
        ])->save();

        $this->audit($request, 'application_reviewed', $application, $before, $this->snapshot($application));
        event(new ApplicationReviewed($application, $status));

        return new ApplicationResource($application->refresh()->load(['program', 'intake', 'reviewedBy']));
    }

    public function documents(Application $application): JsonResponse
    {
        Gate::authorize('viewDocument', $application);
        return response()->json(['data' => DocumentResource::collection($application->documents()->latest()->get())->resolve()]);
    }

    public function documentUrl(Document $document): JsonResponse
    {
        if ($document->application_id) {
            Gate::authorize('viewDocument', $document->application);
        } else {
            Gate::authorize('viewDocument', $document->student);
        }
        $expiresAt = now()->addMinutes(15);
        return response()->json([
            'temporary_url' => Storage::disk('private_documents')->temporaryUrl($document->file_path, $expiresAt),
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    public function payments(Request $request)
    {
        $payments = Payment::query()->with(['application', 'student'])
            ->when($request->input('status'), fn (Builder $q, $v) => $q->where('status', $v))
            ->when($request->input('application_id'), fn (Builder $q, $v) => $q->where('application_id', $v))
            ->latest()->paginate(min($request->integer('per_page', 20), 100));
        return PaymentResource::collection($payments);
    }

    public function showPayment(Payment $payment): PaymentResource
    {
        return new PaymentResource($payment->load(['application', 'student']));
    }

    public function verifyPayment(Request $request, Payment $payment): PaymentResource
    {
        abort_if($payment->status !== PaymentStatus::Pending, 409, 'Only pending payments can be verified.');
        $before = $this->snapshot($payment);
        $payment->forceFill(['status' => PaymentStatus::Successful, 'paid_at' => now()])->save();
        $this->audit($request, 'payment_verified', $payment, $before, $this->snapshot($payment));
        event(new PaymentStatusChanged($payment, PaymentStatus::Successful));
        return new PaymentResource($payment->refresh());
    }

    public function enroll(EnrollApplicationRequest $request, Application $application): StudentResource
    {
        Gate::authorize('assignClass', $application);
        $student = DB::transaction(function () use ($request, $application) {
            $application = Application::query()->lockForUpdate()->with('payments')->findOrFail($application->id);
            abort_if($application->status !== ApplicationStatus::Approved, 409, 'Only approved applications can be enrolled.');
            abort_if($application->student()->exists(), 409, 'The application is already enrolled.');
            if ($application->payments->isNotEmpty()) {
                abort_unless($application->payments->contains(fn (Payment $p) => $p->status === PaymentStatus::Successful), 409, 'A successful payment is required before enrollment.');
            }
            $class = SchoolClass::query()->lockForUpdate()->findOrFail($request->validated('class_id'));
            abort_if($class->program_id !== $application->program_id || $class->intake_id !== $application->intake_id, 422, 'The class does not match the application program and intake.');
            abort_if($class->students()->count() >= $class->capacity, 409, 'The class is full.');

            $userId = DB::table('users')->where('email', $application->applicant_email)->value('id');
            $student = Student::create([
                'application_id' => $application->id,
                'user_id' => $userId,
                'class_id' => $class->id,
                'status' => StudentStatus::Active,
                'enrolled_at' => now(),
            ]);
            $application->update(['status' => ApplicationStatus::Enrolled]);
            return $student;
        });

        $this->audit($request, 'student_enrolled', $student, null, $this->snapshot($student));
        event(new StudentEnrolled($student));
        return new StudentResource($student->load(['user', 'application', 'schoolClass.program', 'schoolClass.intake']));
    }

    public function students(Request $request)
    {
        Gate::authorize('viewAny', Student::class);
        $search = $request->input('search');
        $students = Student::query()->with(['user', 'application.program', 'application.intake', 'schoolClass'])
            ->when($request->input('status'), fn (Builder $q, $v) => $q->where('status', $v))
            ->when($request->input('class_id'), fn (Builder $q, $v) => $q->where('class_id', $v))
            ->when($request->input('program_id'), fn (Builder $q, $v) => $q->whereHas('application', fn (Builder $a) => $a->where('program_id', $v)))
            ->when($request->input('intake_id'), fn (Builder $q, $v) => $q->whereHas('application', fn (Builder $a) => $a->where('intake_id', $v)))
            ->when($request->input('from'), fn (Builder $q, $v) => $q->whereDate('enrolled_at', '>=', $v))
            ->when($request->input('to'), fn (Builder $q, $v) => $q->whereDate('enrolled_at', '<=', $v))
            ->when($search, fn (Builder $q, $v) => $q->whereHas('user', fn (Builder $u) => $u->where('name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%")->orWhere('phone', 'like', "%{$v}%")))
            ->latest()->paginate(min($request->integer('per_page', 20), 100));
        return StudentResource::collection($students);
    }

    public function showStudent(Student $student): StudentResource
    {
        Gate::authorize('view', $student);
        return new StudentResource($student->load(['user', 'application.program', 'application.intake', 'schoolClass.program', 'schoolClass.intake', 'documents', 'payments']));
    }

    public function updateStudentStatus(UpdateStudentStatusRequest $request, Student $student): StudentResource
    {
        Gate::authorize('updateStatus', $student);
        $status = StudentStatus::from($request->validated('status'));
        $before = $this->snapshot($student);
        $student->update(['status' => $status]);
        $this->audit($request, 'student_status_changed', $student, $before, $this->snapshot($student));
        return new StudentResource($student->refresh()->load(['user', 'schoolClass']));
    }

    public function classes(Request $request)
    {
        $classes = SchoolClass::query()->with(['program', 'intake'])->withCount('students')
            ->when($request->input('program_id'), fn (Builder $q, $v) => $q->where('program_id', $v))
            ->when($request->input('intake_id'), fn (Builder $q, $v) => $q->where('intake_id', $v))
            ->latest()->paginate(min($request->integer('per_page', 20), 100));
        return ClassResource::collection($classes);
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q'));
        abort_if($q === '', 422, 'A search query is required.');
        return response()->json(['data' => [
            'applications' => ApplicationResource::collection(Application::where('reference_number', 'like', "%{$q}%")->orWhere('applicant_name', 'like', "%{$q}%")->limit(10)->get())->resolve(),
            'students' => StudentResource::collection(Student::with('user')->whereHas('user', fn (Builder $u) => $u->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"))->limit(10)->get())->resolve(),
        ]]);
    }

    private function validateReviewTransition(Application $application, ApplicationStatus $status): void
    {
        $current = $application->status;
        $allowed = match ($current) {
            ApplicationStatus::Submitted, ApplicationStatus::Paid => [ApplicationStatus::UnderReview],
            ApplicationStatus::UnderReview => [ApplicationStatus::Approved, ApplicationStatus::Rejected],
            default => [],
        };
        abort_unless(in_array($status, $allowed, true), 409, 'Invalid application status transition.');
        if ($status === ApplicationStatus::Approved) {
            abort_unless($application->payments()->where('status', PaymentStatus::Successful->value)->exists(), 409, 'A successful payment is required before approval.');
        }
    }

    private function snapshot($model): array
    {
        return collect($model->only(['id', 'status', 'reviewed_by', 'rejection_reason', 'application_id', 'class_id', 'user_id', 'enrolled_at', 'paid_at']))
            ->map(fn ($value) => $value instanceof \BackedEnum ? $value->value : $value)
            ->all();
    }

    private function audit(Request $request, string $action, $target, ?array $before, array $after): void
    {
        $this->auditLog->log($action, $target, $before, $after, $request->user()->id);
    }
}
