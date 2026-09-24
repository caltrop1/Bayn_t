<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGuestApplicationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'program_id' => ['nullable', 'integer', Rule::exists('programs', 'id')->where(fn ($query) => $query->where('status', 'open'))],
            'intake_id' => ['nullable', 'integer', Rule::exists('intakes', 'id')->whereIn('status', ['open', 'upcoming'])],
            'applicant_name' => ['nullable', 'string', 'max:255'],
            'applicant_email' => ['required', 'email', 'max:255'],
            'applicant_phone' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'education' => ['nullable', 'string', 'max:255'],
            'experience' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $email = strtolower(trim((string) $this->input('applicant_email')));
            if ($email !== '' && \App\Models\Application::query()
                ->whereRaw('LOWER(applicant_email) = ?', [$email])
                ->whereNotIn('status', ['rejected'])
                ->exists()) {
                $validator->errors()->add('applicant_email', 'An active application already exists for this email address.');
            }

            if ($this->filled('intake_id') && $this->filled('program_id') && ! \App\Models\Intake::query()->whereKey($this->integer('intake_id'))->where('program_id', $this->integer('program_id'))->exists()) {
                $validator->errors()->add('intake_id', 'The intake must belong to the selected program.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('applicant_email')) {
            $this->merge(['applicant_email' => strtolower(trim((string) $this->input('applicant_email')))]);
        }
    }
}
