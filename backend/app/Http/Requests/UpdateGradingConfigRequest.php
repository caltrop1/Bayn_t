<?php

namespace App\Http\Requests;

use App\Enums\AssessmentCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGradingConfigRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $config = $this->route('grading_config');
        return [
            'program_id' => ['sometimes', 'nullable', 'integer', 'exists:programs,id'],
            'category' => ['sometimes', Rule::enum(AssessmentCategory::class), Rule::unique('grading_configs')->ignore($config)->where(fn ($q) => $q->where('program_id', $this->input('program_id', $config?->program_id)))],
            'weight_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
