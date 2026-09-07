<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherStudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->user?->name,
            'user_id' => $this->user_id,
            'status' => $this->status?->value,
            'class' => $this->schoolClass?->only(['id', 'name', 'program_id', 'intake_id']),
        ];
    }
}
