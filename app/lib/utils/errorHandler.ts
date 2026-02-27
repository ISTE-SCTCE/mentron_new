/**
 * Centralized error handler for the React/Next.js web app.
 * Maps raw Supabase / network exceptions to user-friendly messages.
 * Import and call `friendlyError(error)` wherever you catch exceptions.
 */

export function friendlyError(error: unknown): string {
    if (!error) return 'Something went wrong. Please try again.';

    const msg =
        (error instanceof Error ? error.message : String(error)).toLowerCase();

    // ── Network ────────────────────────────────────────────────
    if (
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('network') ||
        msg.includes('connection')
    ) {
        return 'No internet connection. Please check your network.';
    }

    if (msg.includes('timeout') || msg.includes('timed out')) {
        return 'The request timed out. Please try again.';
    }

    // ── Supabase Auth ──────────────────────────────────────────
    if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
        return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('user already registered') || msg.includes('already been registered')) {
        return 'An account with this email already exists.';
    }
    if (msg.includes('email not confirmed')) {
        return 'Please verify your email before logging in.';
    }
    if (msg.includes('password') && msg.includes('weak')) {
        return 'Password must be at least 6 characters.';
    }
    if (msg.includes('signup_disabled')) {
        return 'New registrations are currently disabled.';
    }
    if (msg.includes('jwt') || msg.includes('session_not_found')) {
        return 'Your session has expired. Please log in again.';
    }

    // ── Supabase DB / Storage ──────────────────────────────────
    if (msg.includes('duplicate') || msg.includes('unique')) {
        return 'This already exists. No duplicate entries allowed.';
    }
    if (msg.includes('foreign key') || msg.includes('not-null')) {
        return 'Some required information is missing.';
    }
    if (msg.includes('permission denied') || msg.includes('rls')) {
        return 'You do not have permission to do that.';
    }
    if (msg.includes('storage') || msg.includes('bucket')) {
        return 'File upload failed. Please try a different file.';
    }
    if (msg.includes('too large') || msg.includes('payload too large')) {
        return 'The file is too large. Please choose a smaller one.';
    }

    // ── HTTP server errors ─────────────────────────────────────
    if (msg.includes('500') || msg.includes('internal server')) {
        return 'Server error. Please try again later.';
    }
    if (msg.includes('503') || msg.includes('service unavailable')) {
        return 'Service temporarily unavailable. Try again shortly.';
    }
    if (msg.includes('401') || msg.includes('unauthorized')) {
        return 'You need to be logged in to do that.';
    }
    if (msg.includes('403') || msg.includes('forbidden')) {
        return 'You do not have permission to do that.';
    }
    if (msg.includes('404') || msg.includes('not found')) {
        return 'The requested resource could not be found.';
    }

    // ── Fallback ───────────────────────────────────────────────
    return 'Something went wrong. Please try again.';
}
