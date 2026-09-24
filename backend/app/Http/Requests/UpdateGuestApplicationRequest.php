<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGuestApplicationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'required', 'integer', 'exists:programs,id'],
            'intake_id' => ['sometimes', 'required', 'integer', 'exists:intakes,id'],
            'applicant_name' => ['sometimes', 'required', 'string', 'max:255'],
            'applicant_phone' => ['sometimes', 'required', 'string', 'max:50'],
            'city' => ['sometimes', 'required', 'string', 'max:255'],
            'area' => ['sometimes', 'required', 'string', 'max:255'],
            'landmark' => ['sometimes', 'nullable', 'string', 'max:255'],
            'education' => ['sometimes', 'required', 'string', 'max:255'],
            'experience' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $application = $this->route('application');
            $programId = $this->input('program_id', $application?->program_id);
            $intakeId = $this->input('intake_id', $application?->intake_id);
            if ($programId && $intakeId && ! \App\Models\Intake::query()->whereKey($intakeId)->where('program_id', $programId)->exists()) {
                $validator->errors()->add('intake_id', 'The intake must belong to the selected program.');
            }
        });
    }
}
