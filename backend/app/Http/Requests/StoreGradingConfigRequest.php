<?php

namespace App\Http\Requests;

use App\Enums\AssessmentCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGradingConfigRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
            'category' => ['required', Rule::enum(AssessmentCategory::class), Rule::unique('grading_configs')->where(fn ($q) => $q->where('program_id', $this->input('program_id')))],
            'weight_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
