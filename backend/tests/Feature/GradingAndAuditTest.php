<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\GradingConfig;
use App\Models\Intake;
use App\Models\Program;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradingAndAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_configuration_crud_and_program_override(): void
    {
        [$admin, $program] = $this->context();
        $this->actingAs($admin, 'sanctum')->postJson('/api/grading-configs', ['program_id' => null, 'category' => 'theory', 'weight_percentage' => 30])->assertCreated();
        $this->actingAs($admin, 'sanctum')->postJson('/api/grading-configs', ['program_id' => $program->id, 'category' => 'theory', 'weight_percentage' => 40])->assertCreated();
        $this->actingAs($admin, 'sanctum')->postJson('/api/grading-configs', ['program_id' => $program->id, 'category' => 'theory', 'weight_percentage' => 40])->assertUnprocessable();
        $this->assertSame(2, GradingConfig::count());
    }

    public function test_configuration_rejects_invalid_values_and_teacher_changes(): void
    {
        [$admin, $program, $teacher] = $this->context();
        $this->actingAs($teacher, 'sanctum')->postJson('/api/grading-configs', ['program_id' => $program->id, 'category' => 'theory', 'weight_percentage' => 30])->assertForbidden();
        $this->actingAs($admin, 'sanctum')->postJson('/api/grading-configs', ['program_id' => $program->id, 'category' => 'invalid', 'weight_percentage' => 101])->assertUnprocessable();
    }

    public function test_assessment_requires_configuration_calculates_server_score_and_audits(): void
    {
        [$admin, $program, $teacher, $class, $student] = $this->context(true);
        $response = $this->actingAs($teacher, 'sanctum')->postJson('/api/assessments', ['student_id' => $student->id, 'class_id' => $class->id, 'category' => 'theory', 'raw_score' => 80, 'weighted_score' => 999]);
        $response->assertCreated()->assertJsonPath('data.weighted_score', '24.00');
        $this->assertDatabaseHas('audit_logs', ['action' => 'assessment.created', 'actor_id' => $teacher->id]);
        $this->actingAs($admin, 'sanctum')->getJson('/api/audit-logs?action=assessment.created')->assertOk()->assertJsonPath('data.0.action', 'assessment.created');
    }

    public function test_missing_configuration_is_a_business_validation_error(): void
    {
        [, , $teacher, $class, $student] = $this->context(true);
        $this->actingAs($teacher, 'sanctum')->postJson('/api/assessments', ['student_id' => $student->id, 'class_id' => $class->id, 'category' => 'theory', 'raw_score' => 80])->assertUnprocessable();
    }

    private function context(bool $withClass = false): array
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $program = Program::create(['name' => 'Beauty', 'slug' => 'beauty-'.uniqid(), 'category' => 'Beauty', 'level' => 'Professional', 'status' => 'open', 'tuition_fee' => 1000, 'fee_currency' => 'USD', 'duration_weeks' => 12]);
        if (!$withClass) return [$admin, $program, $teacher];
        $intake = Intake::create(['program_id' => $program->id, 'name' => 'Current', 'status' => 'open']);
        $class = SchoolClass::create(['program_id' => $program->id, 'intake_id' => $intake->id, 'teacher_id' => $teacher->id, 'name' => 'A', 'capacity' => 20, 'schedule' => []]);
        $studentUser = User::factory()->create(['role' => 'student']);
        $student = Student::create(['user_id' => $studentUser->id, 'class_id' => $class->id, 'status' => 'active']);
        GradingConfig::create(['program_id' => $program->id, 'category' => 'theory', 'weight_percentage' => 30]);
        return [$admin, $program, $teacher, $class, $student];
    }
}
