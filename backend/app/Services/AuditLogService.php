<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    private const SENSITIVE_KEYS = [
        'password', 'password_confirmation', 'remember_token', 'token',
        'access_token', 'refresh_token', 'secret', 'client_secret',
    ];

    public function log(string $action, Model $target, ?array $before = null, ?array $after = null, ?int $actorId = null): AuditLog
    {
        return AuditLog::create([
            'actor_id' => $actorId ?? Auth::id(),
            'action' => $action,
            'target_type' => $target::class,
            'target_id' => $target->getKey(),
            'before_snapshot' => $this->sanitize($before),
            'after_snapshot' => $this->sanitize($after),
        ]);
    }

    public function snapshot(?Model $model): ?array
    {
        return $model ? $this->sanitize($model->toArray()) : null;
    }

    private function sanitize(?array $snapshot): ?array
    {
        if ($snapshot === null) return null;

        return Arr::where($this->sanitizeValue($snapshot), fn ($value, $key) => !in_array(strtolower((string) $key), self::SENSITIVE_KEYS, true));
    }

    private function sanitizeValue(mixed $value): mixed
    {
        if (!is_array($value)) return $value;

        $result = [];
        foreach ($value as $key => $nested) {
            if (in_array(strtolower((string) $key), self::SENSITIVE_KEYS, true)) continue;
            $result[$key] = $this->sanitizeValue($nested);
        }
        return $result;
    }
}
