<?php

namespace App\Services;

use App\Enums\AssessmentCategory;
use App\Models\AssessmentScore;
use App\Models\GradingConfig;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\DB;

class AssessmentService
{
    public function weightedScore(SchoolClass $class, AssessmentCategory|string $category, string|int|float $rawScore): ?float
    {
        $category = $category instanceof AssessmentCategory ? $category : AssessmentCategory::from($category);
        $config = GradingConfig::query()
            ->where('category', $category->value)
            ->where(function ($query) use ($class) {
                $query->where('program_id', $class->program_id)->orWhereNull('program_id');
            })
            ->orderByRaw('CASE WHEN program_id IS NULL THEN 1 ELSE 0 END')
            ->first();

        return $config ? round((float) $rawScore * ((float) $config->weight_percentage / 100), 2) : null;
    }

    public function create(array $data, SchoolClass $class, int $graderId): AssessmentScore
    {
        return DB::transaction(function () use ($data, $class, $graderId) {
            $data['graded_by'] = $graderId;
            $data['weighted_score'] = $this->weightedScore($class, $data['category'], $data['raw_score']);

            return AssessmentScore::create($data)->load(['student.user', 'schoolClass.program', 'gradedBy']);
        });
    }

    public function update(AssessmentScore $assessment, array $data): AssessmentScore
    {
        return DB::transaction(function () use ($assessment, $data) {
            $category = $data['category'] ?? $assessment->category;
            $rawScore = $data['raw_score'] ?? $assessment->raw_score;
            $data['weighted_score'] = $this->weightedScore($assessment->schoolClass, $category, $rawScore);
            $assessment->update($data);

            return $assessment->refresh()->load(['student.user', 'schoolClass.program', 'gradedBy']);
        });
    }
}
