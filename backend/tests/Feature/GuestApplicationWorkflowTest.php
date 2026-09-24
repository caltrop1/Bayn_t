<?php

namespace Tests\Feature;

use App\Enums\DocumentType;
use App\Enums\UserRole;
use App\Models\Application;
use App\Models\Intake;
use App\Models\Program;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GuestApplicationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_application_can_be_reviewed_enrolled_and_given_a_login(): void
    {
        Storage::fake('private_documents');
        $registrar = User::factory()->create(['role' => UserRole::REGISTRAR, 'is_active' => true]);
        [$program, $intake] = $this->programAndIntake();
        $class = SchoolClass::create([
            'program_id' => $program->id,
            'intake_id' => $intake->id,
            'name' => 'Morning cohort',
            'capacity' => 10,
            'schedule' => ['days' => ['Monday', 'Wednesday'], 'time' => '09:00 - 12:00'],
        ]);

        $created = $this->postJson('/api/guest-applications', [
            'program_id' => $program->id,
            'intake_id' => $intake->id,
            'applicant_name' => 'Abebe',
            'applicant_email' => 'abebe@example.com',
            'applicant_phone' => '+251900000000',
            'city' => 'Addis Ababa',
            'area' => 'Bole',
            'education' => 'Diploma',
            'experience' => 'Beginner',
        ])->assertCreated();

        $applicationId = $created->json('data.id');
        $token = $created->json('guest_access_token');
        $headers = ['X-Application-Token' => $token];

        $this->withHeaders($headers)->post("/api/guest-applications/{$applicationId}/documents", [
            'type' => DocumentType::IdPhoto->value,
            'file' => UploadedFile::fake()->create('id.pdf', 10, 'application/pdf'),
        ])->assertCreated();
        $this->withHeaders($headers)->post("/api/guest-applications/{$applicationId}/documents", [
            'type' => DocumentType::Other->value,
            'file' => UploadedFile::fake()->create('profile.pdf', 10, 'application/pdf'),
        ])->assertCreated();

        $this->withHeaders($headers)->postJson("/api/guest-applications/{$applicationId}/submit")
            ->assertOk()->assertJsonPath('data.status', 'submitted');
        $this->assertDatabaseHas('notifications', [
            'user_id' => $registrar->id,
            'type' => 'application_submitted',
        ]);

        $staffHeaders = ['Authorization' => 'Bearer '.$registrar->createToken('test')->plainTextToken];
        $this->withHeaders($staffHeaders)->getJson('/api/registrar/applications')
            ->assertOk()->assertJsonFragment(['applicant_name' => 'Abebe']);
        $this->withHeaders($staffHeaders)->patchJson("/api/registrar/applications/{$applicationId}", ['status' => 'approved'])
            ->assertOk()->assertJsonPath('data.status', 'approved');

        $this->withHeaders($staffHeaders)->postJson("/api/registrar/applications/{$applicationId}/enroll", ['class_id' => $class->id])
            ->assertCreated()->assertJsonPath('data.status', 'active');
        $this->withHeaders($staffHeaders)->postJson("/api/registrar/applications/{$applicationId}/account", ['password' => 'abebe-temp-123'])
            ->assertCreated()
            ->assertJsonMissing(['password' => 'abebe-temp-123'])
            ->assertJsonPath('data.user.email', 'abebe@example.com')
            ->assertJsonPath('data.user.must_change_password', true);

        $this->assertDatabaseCount('users', 2);
        $createdUser = User::where('email', 'abebe@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('abebe-temp-123', $createdUser->password));

        $login = $this->postJson('/api/auth/login', ['email' => 'abebe@example.com', 'password' => 'abebe-temp-123']);
        $login->assertOk();
        $changed = $this->actingAs($createdUser, 'sanctum')
            ->postJson('/api/auth/change-password', ['current_password' => 'abebe-temp-123', 'password' => 'abebe-new-123', 'password_confirmation' => 'abebe-new-123'])
            ->assertOk();
        $studentResponse = $this->actingAs($createdUser->refresh(), 'sanctum')->getJson('/api/student/me');
        $studentResponse
            ->assertOk()
            ->assertJsonPath('data.user.email', 'abebe@example.com')
            ->assertJsonPath('data.class.name', 'Morning cohort')
            ->assertJsonPath('data.class.schedule.time', '09:00 - 12:00');
    }

    public function test_incomplete_guest_application_cannot_be_approved(): void
    {
        $registrar = User::factory()->create(['role' => UserRole::REGISTRAR, 'is_active' => true]);
        [$program, $intake] = $this->programAndIntake();
        $application = Application::create([
            'reference_number' => 'APP-2026-INCOMPLETE',
            'program_id' => $program->id,
            'intake_id' => $intake->id,
            'applicant_name' => 'Incomplete Applicant',
            'applicant_email' => 'incomplete@example.com',
            'status' => 'submitted',
            'guest_access_token_hash' => hash('sha256', 'token'),
            'guest_access_expires_at' => now()->addDay(),
        ]);

        $this->actingAs($registrar, 'sanctum')->postJson("/api/registrar/applications/{$application->id}/request-information", ['rejection_reason' => 'Please provide the missing application details.'])
            ->assertOk()->assertJsonPath('data.status', 'needs_information');
        $this->actingAs($registrar, 'sanctum')->patchJson("/api/registrar/applications/{$application->id}", ['status' => 'approved'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['applicant_phone', 'documents.id_photo']);
    }

    public function test_duplicate_guest_email_and_duplicate_account_are_rejected(): void
    {
        $registrar = User::factory()->create(['role' => UserRole::REGISTRAR, 'is_active' => true]);
        [$program, $intake] = $this->programAndIntake();
        $payload = [
            'program_id' => $program->id,
            'intake_id' => $intake->id,
            'applicant_name' => 'Abebe',
            'applicant_email' => 'duplicate@example.com',
            'applicant_phone' => '+251900000000',
            'city' => 'Addis Ababa',
            'area' => 'Bole',
            'education' => 'Diploma',
            'experience' => 'Beginner',
        ];
        $this->postJson('/api/guest-applications', $payload)->assertCreated();
        $this->postJson('/api/guest-applications', $payload)->assertUnprocessable()->assertJsonValidationErrors('applicant_email');

        $application = Application::latest('id')->firstOrFail();
        $application->update(['status' => 'enrolled']);
        $class = SchoolClass::create([
            'program_id' => $program->id, 'intake_id' => $intake->id, 'name' => 'Cohort', 'capacity' => 2, 'schedule' => [],
        ]);
        $student = $application->student()->create(['class_id' => $class->id, 'status' => 'active', 'enrolled_at' => now()]);
        User::factory()->create(['email' => 'duplicate@example.com', 'role' => UserRole::STUDENT]);

        $this->actingAs($registrar, 'sanctum')->postJson("/api/registrar/applications/{$application->id}/account")
            ->assertConflict()
            ->assertJsonPath('message', 'An account already exists for this email address. No duplicate account was created.');
        $this->assertNull($student->fresh()->user_id);
    }

    private function programAndIntake(): array
    {
        $program = Program::create([
            'name' => 'Program', 'slug' => 'program-'.uniqid(), 'category' => 'General',
            'level' => 'Beginner', 'status' => 'open', 'tuition_fee' => 100,
            'fee_currency' => 'ETB', 'duration_weeks' => 12,
        ]);
        $intake = Intake::create(['program_id' => $program->id, 'name' => 'September', 'status' => 'open']);
        return [$program, $intake];
    }
}
