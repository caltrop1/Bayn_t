<?php

namespace App\Services;

use App\Enums\AssessmentCategory;
use App\Models\GradingConfig;
use App\Models\SchoolClass;
use Illuminate\Validation\ValidationException;

class GradingService
{
    public function resolveConfig(SchoolClass|int $class, AssessmentCategory|string $category): GradingConfig
    {
        $category = $category instanceof AssessmentCategory ? $category->value : $category;
        $programId = $class instanceof SchoolClass ? $class->program_id : $class;
        $config = GradingConfig::query()
            ->where('category', $category)
            ->where(fn ($query) => $query->where('program_id', $programId)->orWhereNull('program_id'))
            ->orderByRaw('CASE WHEN program_id IS NULL THEN 1 ELSE 0 END')
            ->first();

        if (!$config) {
            throw ValidationException::withMessages([
                'category' => ['No grading configuration exists for this category and program.'],
            ]);
        }

        return $config;
    }

    public function weightedScore(SchoolClass|int $class, AssessmentCategory|string $category, string|int|float $rawScore): string
    {
        $config = $this->resolveConfig($class, $category);
        $rawMinor = $this->toMinorUnits((string) $rawScore);
        $weightBasisPoints = $this->toMinorUnits((string) $config->weight_percentage);
        $weightedMinor = intdiv(($rawMinor * $weightBasisPoints) + 5000, 10000);

        return number_format($weightedMinor / 100, 2, '.', '');
    }

    private function toMinorUnits(string $value): int
    {
        $value = trim($value);
        if (!preg_match('/^\d+(?:\.\d{1,2})?$/', $value)) {
            throw ValidationException::withMessages(['raw_score' => ['The score must have at most two decimal places.']]);
        }
        [$whole, $fraction] = array_pad(explode('.', $value, 2), 2, '');
        return ((int) $whole * 100) + (int) str_pad($fraction, 2, '0');
    }
}
