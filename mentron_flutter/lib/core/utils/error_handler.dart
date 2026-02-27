/// Centralized error handler — maps raw exceptions to user-friendly messages.
/// Never shows technical stack traces or internal error codes to the user.
class ErrorHandler {
  /// Returns a clean, friendly message from any caught exception.
  static String friendly(Object? error) {
    if (error == null) return 'Something went wrong. Please try again.';

    final msg = error.toString().toLowerCase();

    // ── Network / Connection ──────────────────────────────────
    if (msg.contains('socketexception') ||
        msg.contains('failed host lookup') ||
        msg.contains('network') ||
        msg.contains('connection') ||
        msg.contains('internet')) {
      return 'No internet connection. Please check your network and try again.';
    }

    // ── Timeout ───────────────────────────────────────────────
    if (msg.contains('timeout') || msg.contains('timed out')) {
      return 'The request timed out. Please try again.';
    }

    // ── Supabase Auth ─────────────────────────────────────────
    if (msg.contains('invalid login credentials') ||
        msg.contains('invalid email or password')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (msg.contains('user already registered') ||
        msg.contains('already been registered')) {
      return 'An account with this email already exists.';
    }
    if (msg.contains('email not confirmed')) {
      return 'Please verify your email before logging in.';
    }
    if (msg.contains('weak password') || msg.contains('password')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.contains('signup_disabled')) {
      return 'New registrations are currently disabled.';
    }
    if (msg.contains('jwt') || msg.contains('session')) {
      return 'Your session has expired. Please log in again.';
    }

    // ── Supabase Database / Storage ───────────────────────────
    if (msg.contains('violates') || msg.contains('duplicate')) {
      return 'This record already exists.';
    }
    if (msg.contains('foreign key') || msg.contains('not-null')) {
      return 'Some required information is missing.';
    }
    if (msg.contains('permission denied') || msg.contains('rls')) {
      return 'You do not have permission to do that.';
    }
    if (msg.contains('storage') || msg.contains('bucket')) {
      return 'File upload failed. Please try a different file.';
    }
    if (msg.contains('too large') || msg.contains('payload')) {
      return 'The file is too large. Please choose a smaller file.';
    }

    // ── Server errors ─────────────────────────────────────────
    if (msg.contains('500') || msg.contains('server error')) {
      return 'Server error. Please try again later.';
    }
    if (msg.contains('503') || msg.contains('unavailable')) {
      return 'Service temporarily unavailable. Try again shortly.';
    }

    // ── Fallback ──────────────────────────────────────────────
    return 'Something went wrong. Please try again.';
  }
}
