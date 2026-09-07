<?php

namespace App\Http\Requests;

use App\Enums\AssessmentCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssessmentScoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['sometimes', Rule::enum(AssessmentCategory::class)],
            'sub_items' => ['sometimes', 'nullable', 'array'],
            'sub_items.*' => ['numeric', 'min:0'],
            'raw_score' => ['sometimes', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
