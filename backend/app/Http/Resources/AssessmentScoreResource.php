<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssessmentScoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'class_id' => $this->class_id,
            'category' => $this->category?->value,
            'sub_items' => $this->sub_items,
            'raw_score' => $this->raw_score,
            'weighted_score' => $this->weighted_score,
            'graded_by' => $this->graded_by,
            'student' => new StudentResource($this->whenLoaded('student')),
            'class' => new ClassResource($this->whenLoaded('schoolClass')),
            'grader' => new UserResource($this->whenLoaded('gradedBy')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
