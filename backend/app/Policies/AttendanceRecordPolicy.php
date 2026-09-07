<?php

namespace App\Policies;

use App\Models\AttendanceRecord;
use App\Models\User;

class AttendanceRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isRegistrar() || $user->isTeacher() || $user->isStudent();
    }

    public function view(User $user, AttendanceRecord $attendance): bool
    {
        if ($user->isSuperAdmin() || $user->isRegistrar()) return true;
        if ($user->isTeacher()) return $attendance->schoolClass?->teacher_id === $user->id;
        return $attendance->student?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isRegistrar() || $user->isTeacher();
    }

    public function update(User $user, AttendanceRecord $attendance): bool
    {
        return $this->view($user, $attendance) && ($user->isSuperAdmin() || $user->isRegistrar() || $user->isTeacher());
    }

    public function delete(User $user, AttendanceRecord $attendance): bool
    {
        return $this->update($user, $attendance);
    }
}
