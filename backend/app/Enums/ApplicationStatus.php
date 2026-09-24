<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case PaymentPending = 'payment_pending';
    case Paid = 'paid';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case NeedsInformation = 'needs_information';
    case Enrolled = 'enrolled';
}
