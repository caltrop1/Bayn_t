<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'class_id' => $this->class_id,
            'date' => $this->date?->toDateString(),
            'status' => $this->status?->value,
            'marked_by' => $this->marked_by,
            'student' => new StudentResource($this->whenLoaded('student')),
            'class' => new ClassResource($this->whenLoaded('schoolClass')),
            'marker' => new UserResource($this->whenLoaded('markedBy')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
