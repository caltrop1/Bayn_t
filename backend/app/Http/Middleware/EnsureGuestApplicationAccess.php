<?php

namespace App\Http\Middleware;

use App\Models\Application;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureGuestApplicationAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $application = $request->route('application');
        $token = $request->header('X-Application-Token');

        abort_unless($application instanceof Application && filled($token), 401, 'Application access token is required.');
        abort_unless(filled($application->guest_access_token_hash)
            && hash_equals((string) $application->guest_access_token_hash, hash('sha256', $token)), 403, 'The application access token is invalid.');
        abort_if($application->guest_access_expires_at?->isPast(), 403, 'The application access token has expired.');
        abort_unless(in_array($application->status?->value, ['draft', 'rejected', 'needs_information', 'submitted', 'payment_pending'], true), 403, 'This application can no longer be changed.');

        $request->attributes->set('guest_application', $application);
        return $next($request);
    }
}
