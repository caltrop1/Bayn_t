<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\Intake;
use App\Models\Program;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_create_and_update_attendance_without_spoofing_marker(): void
    {
        [$teacher, $class, $student] = $this->context();
        $this->actingAs($teacher, 'sanctum')->postJson('/api/attendance', [
            'student_id' => $student->id, 'class_id' => $class->id, 'date' => '2026-09-07', 'status' => 'present', 'marked_by' => 999,
        ])->assertCreated()->assertJsonPath('data.marked_by', $teacher->id);

        $attendance = AttendanceRecord::firstOrFail();
        $this->actingAs($teacher, 'sanctum')->patchJson('/api/attendance/'.$attendance->id, ['status' => 'excused'])->assertOk();
        $this->assertDatabaseHas('attendance_records', ['id' => $attendance->id, 'status' => 'excused', 'marked_by' => $teacher->id]);
    }

    public function test_teacher_cannot_access_another_teachers_class_or_attendance(): void
    {
        [$teacher, $class, $student] = $this->context();
        $other = User::factory()->create(['role' => 'teacher']);
        $attendance = AttendanceRecord::create(['student_id' => $student->id, 'class_id' => $class->id, 'date' => '2026-09-07', 'status' => 'present', 'marked_by' => $teacher->id]);

        $this->actingAs($other, 'sanctum')->getJson('/api/classes/'.$class->id.'/attendance')->assertForbidden();
        $this->actingAs($other, 'sanctum')->getJson('/api/attendance/'.$attendance->id)->assertForbidden();
        $this->actingAs($other, 'sanctum')->getJson('/api/teacher/students')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_bulk_attendance_is_atomic_and_idempotent(): void
    {
        [$teacher, $class, $student] = $this->context();
        $otherStudent = Student::create(['class_id' => $class->id, 'status' => 'active']);
        $payload = ['date' => '2026-09-07', 'records' => [['student_id' => $student->id, 'status' => 'present'], ['student_id' => $otherStudent->id, 'status' => 'absent']]];
        $this->actingAs($teacher, 'sanctum')->postJson('/api/classes/'.$class->id.'/attendance', $payload)->assertOk();
        $this->actingAs($teacher, 'sanctum')->postJson('/api/classes/'.$class->id.'/attendance', $payload)->assertOk();
        $this->assertDatabaseCount('attendance_records', 2);
    }

    public function test_student_summary_returns_zero_percentage_without_records(): void
    {
        [$teacher, $class, $student] = $this->context();
        $this->actingAs($teacher, 'sanctum')->getJson('/api/students/'.$student->id.'/attendance/summary')->assertOk()->assertJsonPath('data.attendance_percentage', 0);
    }

    private function context(): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $program = Program::create(['name' => 'Program', 'slug' => 'program', 'status' => 'active', 'tuition_fee' => 0, 'fee_currency' => 'ETB', 'duration_weeks' => 1]);
        $intake = Intake::create(['program_id' => $program->id, 'name' => 'Intake', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31', 'status' => 'upcoming']);
        $class = SchoolClass::create(['program_id' => $program->id, 'intake_id' => $intake->id, 'teacher_id' => $teacher->id, 'name' => 'A', 'capacity' => 10, 'schedule' => []]);
        $student = Student::create(['class_id' => $class->id, 'status' => 'active']);
        return [$teacher, $class, $student];
    }
}
