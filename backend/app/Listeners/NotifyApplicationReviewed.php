<?php

namespace App\Listeners;

use App\Enums\ApplicationStatus;
use App\Events\ApplicationReviewed;
use App\Models\User;
use App\Services\NotificationService;

class NotifyApplicationReviewed
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(ApplicationReviewed $event): void
    {
        $status = $event->status instanceof ApplicationStatus ? $event->status : ApplicationStatus::from($event->status);
        if (! in_array($status, [ApplicationStatus::Approved, ApplicationStatus::Rejected, ApplicationStatus::NeedsInformation], true)) {
            return;
        }

        $application = $event->application;
        $type = 'application_'.$status->value;
        $message = "Application {$application->reference_number} was {$status->value}.";
        $user = User::query()->where('email', $application->applicant_email)->where('is_active', true)->first();

        if ($user) {
            $this->notifications->createOnce($user, $type, $message);
        }
    }
}
