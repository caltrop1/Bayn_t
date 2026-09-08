<?php

namespace App\Services;

use App\Models\AssessmentScore;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\DB;

class AssessmentService
{
    public function __construct(private readonly GradingService $grading, private readonly AuditLogService $audit) {}

    public function create(array $data, SchoolClass $class, int $graderId): AssessmentScore
    {
        return DB::transaction(function () use ($data, $class, $graderId) {
            $data['graded_by'] = $graderId;
            $data['weighted_score'] = $this->grading->weightedScore($class, $data['category'], $data['raw_score']);
            $score = AssessmentScore::create($data)->load(['student.user', 'schoolClass.program', 'gradedBy']);
            $this->audit->log('assessment.created', $score, null, $this->audit->snapshot($score));
            return $score;
        });
    }

    public function update(AssessmentScore $assessment, array $data): AssessmentScore
    {
        return DB::transaction(function () use ($assessment, $data) {
            $category = $data['category'] ?? $assessment->category;
            $rawScore = $data['raw_score'] ?? $assessment->raw_score;
            $data['weighted_score'] = $this->grading->weightedScore($assessment->schoolClass, $category, $rawScore);
            $before = $this->audit->snapshot($assessment);
            $assessment->update($data);
            $score = $assessment->refresh()->load(['student.user', 'schoolClass.program', 'gradedBy']);
            $this->audit->log('assessment.updated', $score, $before, $this->audit->snapshot($score));
            return $score;
        });
    }
}
