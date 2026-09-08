<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;

class AuditLogPolicy
{
    public function viewAny(User $user): bool { return $user->isSuperAdmin() || $user->isRegistrar(); }
    public function view(User $user, AuditLog $log): bool { return $this->viewAny($user); }
}
