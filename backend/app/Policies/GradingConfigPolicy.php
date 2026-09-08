<?php

namespace App\Policies;

use App\Models\GradingConfig;
use App\Models\User;

class GradingConfigPolicy
{
    public function viewAny(User $user): bool { return $user->isSuperAdmin() || $user->isRegistrar(); }
    public function view(User $user, GradingConfig $config): bool { return $this->viewAny($user); }
    public function create(User $user): bool { return $this->viewAny($user); }
    public function update(User $user, GradingConfig $config): bool { return $this->viewAny($user); }
    public function delete(User $user, GradingConfig $config): bool { return $this->viewAny($user); }
}
