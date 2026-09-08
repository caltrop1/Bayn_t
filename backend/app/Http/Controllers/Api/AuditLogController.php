<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', AuditLog::class);
        $logs = AuditLog::query()->with('actor')
            ->when($request->filled('actor_id'), fn ($q) => $q->where('actor_id', $request->integer('actor_id')))
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->string('action')->value()))
            ->when($request->filled('target_type'), fn ($q) => $q->where('target_type', $request->string('target_type')->value()))
            ->when($request->filled('target_id'), fn ($q) => $q->where('target_id', $request->integer('target_id')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('to')))
            ->latest('created_at')->paginate(min($request->integer('per_page', 20), 100));
        return AuditLogResource::collection($logs);
    }

    public function show(AuditLog $auditLog): AuditLogResource
    {
        Gate::authorize('view', $auditLog);
        return new AuditLogResource($auditLog->load('actor'));
    }
}
