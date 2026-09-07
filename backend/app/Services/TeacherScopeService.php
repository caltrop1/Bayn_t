<?php

namespace App\Services;

use App\Models\AssessmentScore;
use App\Models\AttendanceRecord;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class TeacherScopeService
{
    public function classes(User $user): Builder
    {
        return SchoolClass::query()->when($user->isTeacher(), fn (Builder $q) => $q->where('teacher_id', $user->id));
    }

    public function students(User $user): Builder
    {
        return Student::query()->when($user->isTeacher(), fn (Builder $q) =>
            $q->whereHas('schoolClass', fn (Builder $class) => $class->where('teacher_id', $user->id))
        );
    }

    public function attendance(User $user): Builder
    {
        return AttendanceRecord::query()
            ->when($user->isTeacher(), fn (Builder $q) =>
                $q->whereHas('schoolClass', fn (Builder $class) => $class->where('teacher_id', $user->id))
            )
            ->when($user->isStudent(), fn (Builder $q) =>
                $q->whereHas('student', fn (Builder $student) => $student->where('user_id', $user->id))
            );
    }

    public function assessments(User $user): Builder
    {
        return AssessmentScore::query()->when($user->isTeacher(), fn (Builder $q) =>
            $q->whereHas('schoolClass', fn (Builder $class) => $class->where('teacher_id', $user->id))
        );
    }

    public function canAccessClass(User $user, SchoolClass $class): bool
    {
        return ! $user->isTeacher() || $class->teacher_id === $user->id;
    }

    public function canAccessStudent(User $user, Student $student): bool
    {
        return ! $user->isTeacher() || $student->schoolClass?->teacher_id === $user->id;
    }
}
