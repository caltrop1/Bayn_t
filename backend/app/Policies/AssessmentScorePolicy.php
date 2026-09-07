<?php

namespace App\Policies;

use App\Models\AssessmentScore;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;

class AssessmentScorePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isRegistrar() || $user->isTeacher() || $user->isStudent();
    }

    public function view(User $user, AssessmentScore $assessment): bool
    {
        if ($user->isSuperAdmin() || $user->isRegistrar()) {
            return true;
        }

        if ($user->isTeacher()) {
            return $assessment->schoolClass?->teacher_id === $user->id;
        }

        return $user->id === $assessment->student?->user_id;
    }

    public function create(User $user, SchoolClass $class, Student $student): bool
    {
        if ($student->class_id !== $class->id) {
            return false;
        }

        return $user->isSuperAdmin()
            || $user->isRegistrar()
            || ($user->isTeacher() && $class->teacher_id === $user->id);
    }

    public function update(User $user, AssessmentScore $assessment): bool
    {
        return $this->view($user, $assessment)
            && ($user->isSuperAdmin() || $user->isRegistrar() || $user->isTeacher());
    }

    public function delete(User $user, AssessmentScore $assessment): bool
    {
        return $this->update($user, $assessment);
    }
}
