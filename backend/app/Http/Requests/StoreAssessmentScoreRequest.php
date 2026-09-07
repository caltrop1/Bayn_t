<?php

namespace App\Http\Requests;

use App\Enums\AssessmentCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssessmentScoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'category' => ['required', Rule::enum(AssessmentCategory::class)],
            'sub_items' => ['nullable', 'array'],
            'sub_items.*' => ['numeric', 'min:0'],
            'raw_score' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
