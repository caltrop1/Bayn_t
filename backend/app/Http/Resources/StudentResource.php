<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'status' => $this->status?->value,
            'enrolled_at' => $this->enrolled_at,
            'class' => new ClassResource($this->whenLoaded('schoolClass')),
            'application' => new ApplicationResource($this->whenLoaded('application')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'documents' => DocumentResource::collection($this->whenLoaded('documents')),
            'attendance_summary' => $this->whenLoaded('attendanceRecords', function (): array {
                $records = $this->attendanceRecords;
                $present = $records->filter(fn ($record) => in_array($record->status?->value, ['present', 'late'], true))->count();
                return [
                    'total_days' => $records->count(),
                    'present_or_late' => $present,
                    'attendance_percentage' => $records->count() ? round($present / $records->count() * 100, 2) : 0,
                ];
            }),
            'course_progress' => $this->whenLoaded('assessmentScores', function (): array {
                return [
                    'assessment_count' => $this->assessmentScores->count(),
                    'total_raw_score' => round((float) $this->assessmentScores->sum('raw_score'), 2),
                    'total_weighted_score' => round((float) $this->assessmentScores->sum('weighted_score'), 2),
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
