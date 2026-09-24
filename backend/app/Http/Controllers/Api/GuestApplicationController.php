<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Enums\DocumentType;
use App\Events\ApplicationSubmitted;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGuestApplicationDocumentRequest;
use App\Http\Requests\StoreGuestApplicationRequest;
use App\Http\Requests\UpdateGuestApplicationRequest;
use App\Http\Resources\ApplicationResource;
use App\Http\Resources\DocumentResource;
use App\Models\Application;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GuestApplicationController extends Controller
{
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function store(StoreGuestApplicationRequest $request): JsonResponse
    {
        $token = Str::random(64);
        $application = Application::create([
            ...$request->validated(),
            'status' => ApplicationStatus::Draft,
            'reference_number' => $this->referenceNumber(),
            'guest_access_token_hash' => hash('sha256', $token),
            'guest_access_expires_at' => now()->addDays(30),
        ]);

        $this->audit->log('guest_application_created', $application, null, $application->only(['id', 'reference_number', 'applicant_email']), null);

        return response()->json([
            'data' => new ApplicationResource($application->load(['program', 'intake', 'documents'])),
            'guest_access_token' => $token,
        ], 201);
    }

    public function show(Application $application): ApplicationResource
    {
        return new ApplicationResource($application->load(['program', 'intake', 'documents', 'payments']));
    }

    public function update(UpdateGuestApplicationRequest $request, Application $application): ApplicationResource
    {
        $application->update($request->validated());
        return new ApplicationResource($application->refresh()->load(['program', 'intake', 'documents']));
    }

    public function upload(StoreGuestApplicationDocumentRequest $request, Application $application): JsonResponse
    {
        abort_unless(in_array($application->status?->value, ['draft', 'rejected', 'needs_information'], true), 409, 'Documents can no longer be uploaded for this application.');
        $validatedType = DocumentType::from($request->validated('type'));
        $file = $request->file('file');
        $path = $file->storeAs('applications/' . $application->id, Str::uuid()->toString() . '.' . $file->extension(), 'private_documents');
        $document = $application->documents()->create([
            'type' => $validatedType,
            'file_path' => $path,
            'uploaded_at' => now(),
        ]);

        if ($validatedType === DocumentType::IdPhoto) {
            $application->documents()->where('id', '!=', $document->id)->where('type', DocumentType::IdPhoto->value)->delete();
        }

        return (new DocumentResource($document))->response()->setStatusCode(201);
    }

    public function submit(Application $application): ApplicationResource
    {
        abort_unless(in_array($application->status?->value, ['draft', 'rejected', 'needs_information'], true), 409, 'Only draft applications can be submitted.');
        $errors = collect($application->missingRequirements())
            ->map(fn (string $message) => [$message.' before submission.'])
            ->all();
        if ($errors)
            throw \Illuminate\Validation\ValidationException::withMessages($errors);

        DB::transaction(function () use ($application): void {
            $application->forceFill(['status' => ApplicationStatus::Submitted, 'submitted_at' => now(), 'rejection_reason' => null])->save();
            $this->audit->log('guest_application_submitted', $application, null, $application->only(['id', 'reference_number', 'status']), null);
        });
        event(new ApplicationSubmitted($application->refresh()));
        return new ApplicationResource($application->load(['program', 'intake', 'documents', 'payments']));
    }

    public function deferPayment(Application $application): ApplicationResource
    {
        return new ApplicationResource($application->load(['program', 'intake', 'documents', 'payments']));
    }

    private function referenceNumber(): string
    {
        do {
            $reference = 'APP-' . now()->format('Y') . '-' . Str::upper(Str::random(10));
        }
        while (Application::query()->where('reference_number', $reference)->exists());
        return $reference;
    }
}
