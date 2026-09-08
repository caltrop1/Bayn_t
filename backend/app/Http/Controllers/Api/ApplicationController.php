<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Enums\DocumentType;
use App\Events\ApplicationSubmitted;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\SubmitApplicationRequest;
use App\Http\Requests\UpdateApplicationStepRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Models\Intake;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use App\Services\AuditLogService;

class ApplicationController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $applications = Application::query()
            ->where('applicant_email', $request->user()->email)
            ->with(['program', 'intake', 'documents'])
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 100));

        return ApplicationResource::collection($applications);
    }

    public function store(StoreApplicationRequest $request): ApplicationResource
    {
        $application = DB::transaction(function () use ($request): Application {
            $validated = $request->validated();
            $validated['applicant_email'] = $request->user()->email;
            $validated['status'] = ApplicationStatus::Draft;
            $validated['reference_number'] = $this->referenceNumber();

            $application = Application::create($validated);
            $this->audit($request, 'application_created', $application, null, $this->snapshot($application));

            return $application;
        });

        return new ApplicationResource($application->load(['program', 'intake', 'documents']));
    }

    public function show(Application $application): ApplicationResource
    {
        Gate::authorize('view', $application);
        return new ApplicationResource($application->load(['program', 'intake', 'documents', 'payments']));
    }

    public function updateStep(UpdateApplicationStepRequest $request, Application $application): ApplicationResource
    {
        Gate::authorize('update', $application);
        $application->update($request->validated());
        return new ApplicationResource($application->refresh()->load(['program', 'intake', 'documents']));
    }

    public function documents(Application $application): JsonResponse
    {
        Gate::authorize('viewDocument', $application);
        return response()->json(['data' => \App\Http\Resources\DocumentResource::collection(
            $application->documents()->latest()->get()
        )->resolve()]);
    }

    public function submit(SubmitApplicationRequest $request, Application $application): ApplicationResource
    {
        Gate::authorize('submit', $application);
        $submitted = DB::transaction(function () use ($request, $application): Application {
            $locked = Application::query()->lockForUpdate()->findOrFail($application->id);
            if ($locked->status !== ApplicationStatus::Draft) {
                abort(409, 'Only draft applications can be submitted.');
            }

            $errors = [];
            foreach (['program_id', 'intake_id', 'applicant_name', 'applicant_email', 'applicant_phone'] as $field) {
                if (blank($locked->{$field})) {
                    $errors[$field] = ['The '.$field.' field is required before submission.'];
                }
            }
            if ($locked->program_id && $locked->intake_id && ! Intake::query()
                ->whereKey($locked->intake_id)->where('program_id', $locked->program_id)->exists()) {
                $errors['intake_id'] = ['The intake must belong to the selected program.'];
            }
            if (! $locked->documents()->where('type', DocumentType::IdPhoto->value)->exists()) {
                $errors['documents.id_photo'] = ['An ID photo is required before submission.'];
            }
            if ($errors !== []) {
                return $this->throwSubmissionErrors($errors);
            }

            $before = $this->snapshot($locked);
            $locked->forceFill(['status' => ApplicationStatus::Submitted, 'submitted_at' => now()])->save();
            $this->audit($request, 'application_submitted', $locked, $before, $this->snapshot($locked));
            event(new ApplicationSubmitted($locked));
            return $locked;
        });

        return new ApplicationResource($submitted->refresh()->load(['program', 'intake', 'documents', 'payments']));
    }

    private function throwSubmissionErrors(array $errors): never
    {
        throw \Illuminate\Validation\ValidationException::withMessages($errors);
    }

    private function referenceNumber(): string
    {
        return 'APP-'.now()->format('Y').'-'.str_pad((string) ((int) Application::query()->max('id') + 1), 6, '0', STR_PAD_LEFT);
    }

    private function snapshot(Application $application): array
    {
        return collect($application->only(['id', 'reference_number', 'program_id', 'intake_id', 'applicant_name', 'applicant_email', 'applicant_phone', 'status', 'submitted_at']))
            ->map(fn ($value) => $value instanceof \BackedEnum ? $value->value : $value)
            ->all();
    }

    private function audit($request, string $action, Application $application, ?array $before, ?array $after): void
    {
        $this->auditLog->log($action, $application, $before, $after, $request->user()->id);
    }
}
