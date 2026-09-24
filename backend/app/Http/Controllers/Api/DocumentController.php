<?php

namespace App\Http\Controllers\Api;

use App\Enums\DocumentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\StoreApplicationDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Application;
use App\Models\Document;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\DocumentGenerationService;
use Symfony\Component\HttpFoundation\Response;

class DocumentController extends Controller
{
    public function certificate(Request $request, Student $student, DocumentGenerationService $generator): JsonResponse
    {
        Gate::authorize('view', $student);
        abort_unless($request->user()->isSuperAdmin() || $request->user()->isRegistrar(), 403, 'Only authorized staff can generate certificates.');
        $document = $generator->certificate($student, $request->user()->id);
        return (new DocumentResource($document))->response()->setStatusCode(201);
    }

    public function certificateView(Request $request, Student $student): JsonResponse
    {
        Gate::authorize('view', $student);
        $document = $student->documents()->where('type', DocumentType::Certificate->value)->latest()->first();
        abort_unless($document, 404, 'No certificate has been generated.');
        $expiresAt = now()->addMinutes(15);
        return response()->json(['data' => new DocumentResource($document), 'temporary_url' => Storage::disk('private_documents')->temporaryUrl($document->file_path, $expiresAt), 'expires_at' => $expiresAt->toIso8601String()]);
    }

    /** Serve the generated certificate as an authenticated PDF response. */
    public function certificateDownload(Request $request, Student $student): Response
    {
        Gate::authorize('view', $student);
        $document = $student->documents()
            ->where('type', DocumentType::Certificate->value)
            ->latest()
            ->firstOrFail();

        $disk = Storage::disk('private_documents');
        abort_unless($disk->exists($document->file_path), 404, 'Certificate file not found.');

        return response($disk->get($document->file_path), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.basename($document->file_path).'"',
            'Cache-Control' => 'private, max-age=0, no-store',
        ]);
    }
    public function storeForApplication(StoreApplicationDocumentRequest $request, Application $application): JsonResponse
    {
        Gate::authorize('uploadDocument', $application);
        abort_unless(in_array($application->status?->value, ['draft', 'rejected', 'needs_information'], true), 409, 'Documents can only be uploaded to draft, rejected, or information-requested applications.');

        $file = $request->file('file');
        $filePath = $file->storeAs(
            "applications/{$application->id}",
            Str::uuid()->toString().'.'.$file->extension(),
            'private_documents'
        );
        $document = Document::create([
            'application_id' => $application->id,
            'type' => DocumentType::from($request->validated('type')),
            'file_path' => $filePath,
            'uploaded_at' => now(),
        ]);

        return (new DocumentResource($document))->response()->setStatusCode(201);
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $application = null;
        $student = null;

        if (! empty($validated['application_id'])) {
            $application = Application::query()->findOrFail($validated['application_id']);
            Gate::authorize('uploadDocument', $application);
        } else {
            $student = Student::query()->findOrFail($validated['student_id']);
            Gate::authorize('uploadDocument', $student);
        }

        $file = $request->file('file');
        $directory = $application
            ? "applications/{$application->id}"
            : "students/{$student->id}";

        $fileName = Str::uuid()->toString().'.'.$file->extension();
        $filePath = $file->storeAs($directory, $fileName, 'private_documents');

        $document = Document::create([
            'application_id' => $application?->id,
            'student_id' => $student?->id,
            'type' => DocumentType::from($validated['type']),
            'file_path' => $filePath,
            'uploaded_at' => now(),
        ]);

        return (new DocumentResource($document))->response()->setStatusCode(201);
    }

    public function temporaryUrl(Document $document): JsonResponse
    {
        $this->authorizeDocumentAccess($document, 'viewDocument');

        $expiresAt = now()->addMinutes(15);
        $temporaryUrl = Storage::disk('private_documents')->temporaryUrl($document->file_path, $expiresAt);

        return response()->json([
            'temporary_url' => $temporaryUrl,
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    public function download(Request $request, Document $document): Response
    {
        $path = Storage::disk('private_documents')->path($document->file_path);

        abort_unless(is_file($path), 404);

        if (str_ends_with(strtolower($document->file_path), '.pdf')) {
            return response()->file($path, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($document->file_path).'"',
            ]);
        }

        return Storage::disk('private_documents')->download($document->file_path, basename($document->file_path));
    }

    private function authorizeDocumentAccess(Document $document, string $ability): void
    {
        if ($document->application_id) {
            Gate::authorize($ability, $document->application);

            return;
        }

        Gate::authorize($ability, $document->student);
    }
}
