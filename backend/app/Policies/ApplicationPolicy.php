<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isRegistrar();
    }

    public function view(User $user, Application $application): bool
    {
        if ($user->isSuperAdmin() || $user->isRegistrar()) {
            return true;
        }

        return $user->email === $application->applicant_email;
    }

    public function approve(User $user, Application $application): bool
    {
        return $user->isSuperAdmin() || $user->isRegistrar();
    }

    public function reject(User $user, Application $application): bool
    {
        return $user->isSuperAdmin() || $user->isRegistrar();
    }

    public function assignClass(User $user, Application $application): bool
    {
        return $user->isSuperAdmin() || $user->isRegistrar();
    }

    public function createAccount(User $user, Application $application): bool
    {
        return ($user->isSuperAdmin() || $user->isRegistrar()) && $user->is_active;
    }

    public function uploadDocument(User $user, Application $application): bool
    {
        if ($user->isSuperAdmin() || $user->isRegistrar()) {
            return true;
        }

        return $user->email === $application->applicant_email;
    }

    public function update(User $user, Application $application): bool
    {
        return in_array($application->status?->value, ['draft', 'rejected', 'needs_information'], true) && $this->view($user, $application);
    }

    public function submit(User $user, Application $application): bool
    {
        return in_array($application->status?->value, ['draft', 'rejected', 'needs_information'], true) && $this->view($user, $application);
    }

    public function viewDocument(User $user, Application $application): bool
    {
        return $this->view($user, $application);
    }
}
