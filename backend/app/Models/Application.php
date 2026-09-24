<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_number',
        'program_id',
        'intake_id',
        'applicant_name',
        'applicant_email',
        'applicant_phone',
        'city',
        'area',
        'landmark',
        'education',
        'experience',
        'status',
        'rejection_reason',
        'reviewed_by',
        'submitted_at',
        'guest_access_token_hash',
        'guest_access_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApplicationStatus::class,
            'submitted_at' => 'datetime',
            'guest_access_expires_at' => 'datetime',
        ];
    }

    public function isGuest(): bool
    {
        return filled($this->guest_access_token_hash);
    }

    /** @return array<string, string> */
    public function missingRequirements(): array
    {
        $missing = [];

        foreach (['program_id', 'intake_id', 'applicant_name', 'applicant_email', 'applicant_phone', 'city', 'area', 'education', 'experience'] as $field) {
            if (blank($this->{$field})) {
                $missing[$field] = 'This field is required.';
            }
        }

        if (!$this->documents()->where('type', 'id_photo')->exists()) {
            $missing['documents.id_photo'] = 'An identity document is required.';
        }

        if ($this->isGuest() && !$this->documents()->whereIn('type', ['other', 'registration_doc'])->exists()) {
            $missing['documents.profile_photo'] = 'A profile or supporting document is required.';
        }

        return $missing;
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function intake(): BelongsTo
    {
        return $this->belongsTo(Intake::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
