<?php

namespace Tests\Feature;

use App\Models\AssessmentScore;
use App\Models\GradingConfig;
use App\Models\Intake;
use App\Models\Program;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssessmentScoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_teacher_can_create_update_and_list_a_weighted_score(): void
    {
        [$teacher, $class, $student] = $this->assessmentContext();
        GradingConfig::create(['program_id' => $class->program_id, 'category' => 'theory', 'weight_percentage' => 30]);

        $response = $this->actingAs($teacher, 'sanctum')->postJson('/api/assessments', [
            'student_id' => $student->id,
            'class_id' => $class->id,
            'category' => 'theory',
            'raw_score' => 80,
            'sub_items' => ['midterm' => 30, 'final' => 50],
        ]);

        $response->assertCreated()->assertJsonPath('data.weighted_score', '24.00');
        $assessment = AssessmentScore::firstOrFail();
        $this->actingAs($teacher, 'sanctum')->patchJson('/api/assessments/'.$assessment->id, ['raw_score' => 90])
            ->assertOk()->assertJsonPath('data.weighted_score', '27.00');
        $this->actingAs($teacher, 'sanctum')->getJson('/api/classes/'.$class->id.'/assessments')
            ->assertOk()->assertJsonPath('data.0.student.id', $student->id);
    }

    public function test_duplicate_and_cross_class_score_changes_are_rejected(): void
    {
        [$teacher, $class, $student] = $this->assessmentContext();
        $payload = ['student_id' => $student->id, 'class_id' => $class->id, 'category' => 'practical', 'raw_score' => 10];
        $this->actingAs($teacher, 'sanctum')->postJson('/api/assessments', $payload)->assertCreated();
        $this->actingAs($teacher, 'sanctum')->postJson('/api/assessments', $payload)->assertStatus(409);

        $otherTeacher = User::factory()->create(['role' => 'teacher']);
        $this->actingAs($otherTeacher, 'sanctum')->getJson('/api/classes/'.$class->id.'/assessments')->assertForbidden();
        $this->actingAs($otherTeacher, 'sanctum')->getJson('/api/assessments/'.AssessmentScore::first()->id)->assertForbidden();
    }

    public function test_unauthenticated_and_student_access_are_scoped(): void
    {
        [, $class, $student] = $this->assessmentContext();
        $this->getJson('/api/assessments')->assertUnauthorized();
        $this->actingAs($student->user, 'sanctum')->getJson('/api/students/'.$student->id.'/assessments')->assertOk();
    }

    private function assessmentContext(): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $program = Program::create([
            'name' => 'Beauty', 'slug' => 'beauty-'.uniqid(), 'category' => 'Beauty', 'level' => 'Professional',
            'status' => 'open', 'tuition_fee' => 1000, 'fee_currency' => 'USD', 'duration_weeks' => 12,
        ]);
        $intake = Intake::create(['program_id' => $program->id, 'name' => 'Current', 'status' => 'open']);
        $class = SchoolClass::create(['program_id' => $program->id, 'intake_id' => $intake->id, 'teacher_id' => $teacher->id, 'name' => 'A', 'capacity' => 20, 'schedule' => []]);
        $studentUser = User::factory()->create(['role' => 'student']);
        $student = Student::create(['user_id' => $studentUser->id, 'class_id' => $class->id, 'status' => 'active']);

        return [$teacher, $class, $student];
    }
}
