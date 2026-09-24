<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Enums\DocumentType;
use App\Enums\PaymentStatus;
use App\Enums\StudentStatus;
use App\Enums\UserRole;
use App\Events\ApplicationReviewed;
use App\Events\PaymentStatusChanged;
use App\Events\StudentEnrolled;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateApplicantAccountRequest;
use App\Http\Requests\EnrollApplicationRequest;
use App\Http\Requests\ReviewApplicationRequest;
use App\Http\Requests\UpdateStudentStatusRequest;
use App\Http\Resources\ApplicationResource;
use App\Http\Resources\ClassResource;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\StudentResource;
use App\Http\Resources\UserResource;
use App\Models\Application;
use App\Models\Document;
use App\Models\Payment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
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
            'user' => ['name' => auth()->user()->name],
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
        if ($status === ApplicationStatus::Approved) {
            $missing = $application->missingRequirements();
            if ($missing !== []) {
                throw \Illuminate\Validation\ValidationException::withMessages(
                    collect($missing)->map(fn (string $message) => [$message])->all()
                );
            }
        }
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

    public function requestInformation(Request $request, Application $application): ApplicationResource
    {
        Gate::authorize('approve', $application);
        abort_unless(in_array($application->status?->value, ['submitted', 'under_review'], true), 409, 'Information can only be requested from an active review.');
        $validated = $request->validate(['rejection_reason' => ['required', 'string', 'max:5000']]);
        $before = $this->snapshot($application);
        $application->forceFill([
            'status' => ApplicationStatus::NeedsInformation,
            'rejection_reason' => $validated['rejection_reason'],
            'reviewed_by' => $request->user()->id,
        ])->save();
        $this->audit($request, 'application_information_requested', $application, $before, $this->snapshot($application));
        event(new ApplicationReviewed($application, ApplicationStatus::NeedsInformation));

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

        $application = $payment->application;
        if ($application && in_array($application->status, [ApplicationStatus::Submitted, ApplicationStatus::PaymentPending])) {
            $beforeApp = $this->snapshot($application);
            $application->forceFill(['status' => ApplicationStatus::Paid])->save();
            $this->audit($request, 'application_paid', $application, $beforeApp, $this->snapshot($application));
        }

        if ($application && ! Document::query()->where('application_id', $application->id)->where('type', DocumentType::Receipt->value)->exists()) {
            Document::create([
                'application_id' => $application->id,
                'student_id' => $payment->student_id,
                'type' => DocumentType::Receipt->value,
                'file_path' => 'receipts/receipt_app_' . $application->id . '_pay_' . $payment->id . '.pdf',
                'uploaded_at' => now(),
            ]);
        }

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

    public function createAccount(CreateApplicantAccountRequest $request, Application $application): JsonResponse
    {
        Gate::authorize('createAccount', $application);

        $student = DB::transaction(function () use ($request, $application): Student {
            $lockedApplication = Application::query()->lockForUpdate()->findOrFail($application->id);
            abort_unless($lockedApplication->status === ApplicationStatus::Enrolled, 409, 'The application must be enrolled in a class before an account can be created.');

            $student = $lockedApplication->student()->lockForUpdate()->first();
            abort_unless($student, 409, 'Assign the applicant to a class before creating a student account.');
            abort_if($student->user_id, 409, 'A student account is already linked to this application.');

            $email = strtolower(trim($lockedApplication->applicant_email));
            $existingUser = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
            abort_if($existingUser, 409, 'An account already exists for this email address. No duplicate account was created.');

            $password = $request->validated('password') ?: config('academy.default_temporary_password');
            $user = User::create([
                'name' => $lockedApplication->applicant_name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => UserRole::STUDENT,
                'phone' => $lockedApplication->applicant_phone,
                'is_active' => true,
                'must_change_password' => true,
            ]);

            $student->update(['user_id' => $user->id]);
            return $student->refresh();
        });

        $this->audit($request, 'student_account_created', $student, null, $this->snapshot($student));

        return response()->json([
            'message' => 'Student account created. The temporary password is not returned by the API.',
            'data' => new StudentResource($student->load(['user', 'application.program', 'application.intake', 'schoolClass.program', 'schoolClass.intake'])),
        ], 201);
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
        return new StudentResource($student->load(['user', 'application.program', 'application.intake', 'schoolClass.program', 'schoolClass.intake', 'schoolClass.teacher', 'documents', 'payments']));
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
        $classes = SchoolClass::query()->with(['program', 'intake', 'teacher'])->withCount('students')
            ->when($request->input('program_id'), fn (Builder $q, $v) => $q->where('program_id', $v))
            ->when($request->input('intake_id'), fn (Builder $q, $v) => $q->where('intake_id', $v))
            ->latest()->paginate(min($request->integer('per_page', 20), 100));
        return ClassResource::collection($classes);
    }

    public function teachers()
    {
        return UserResource::collection(
            User::query()
                ->where('role', 'teacher')
                ->where('is_active', true)
                ->with('programs')
                ->orderBy('name')
                ->get()
        );
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
            ApplicationStatus::Submitted, ApplicationStatus::Paid => [ApplicationStatus::UnderReview, ApplicationStatus::Approved, ApplicationStatus::Rejected],
            ApplicationStatus::UnderReview => [ApplicationStatus::Approved, ApplicationStatus::Rejected],
            ApplicationStatus::NeedsInformation => [ApplicationStatus::UnderReview, ApplicationStatus::Approved, ApplicationStatus::Rejected],
            default => [],
        };
        abort_unless(in_array($status, $allowed, true), 409, 'Invalid application status transition.');
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
