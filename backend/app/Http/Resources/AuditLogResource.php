<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'actor_id' => $this->actor_id, 'actor' => new UserResource($this->whenLoaded('actor')), 'action' => $this->action, 'target_type' => $this->target_type, 'target_id' => $this->target_id, 'before' => $this->before_snapshot, 'after' => $this->after_snapshot, 'created_at' => $this->created_at];
    }
}
