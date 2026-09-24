<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateApplicantAccountRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->isSuperAdmin() || $this->user()?->isRegistrar(); }

    public function rules(): array
    {
        return ['password' => ['nullable', 'string', 'min:8']];
    }
}
