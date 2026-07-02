// lib/utils/validators.dart
//
// Client-side input validation for Mentron.
// All validation happens before any network call.

import 'constants.dart';

/// Holds the result of a validation check.
class ValidationResult {
  final bool isValid;
  final String? error;
  const ValidationResult.ok() : isValid = true, error = null;
  const ValidationResult.fail(this.error) : isValid = false;
}

class MentronValidators {
  MentronValidators._();

  // ── Email ─────────────────────────────────────────────────────────────────

  static const _emailRegex =
      r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
      r'(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$';


  static ValidationResult validateEmail(String? email) {
    if (email == null || email.trim().isEmpty) {
      return const ValidationResult.fail('Email is required');
    }
    final trimmed = email.trim();
    if (!RegExp(_emailRegex).hasMatch(trimmed)) {
      return const ValidationResult.fail('Enter a valid email address');
    }
    return const ValidationResult.ok();
  }

  // ── Password ──────────────────────────────────────────────────────────────

  static ValidationResult validatePassword(String? password) {
    if (password == null || password.isEmpty) {
      return const ValidationResult.fail('Password is required');
    }
    if (password.length < 8) {
      return const ValidationResult.fail(
          'Password must be at least 8 characters');
    }
    return const ValidationResult.ok();
  }

  // ── PIN ───────────────────────────────────────────────────────────────────

  static ValidationResult validatePin(String? pin) {
    if (pin == null || pin.isEmpty) {
      return const ValidationResult.fail('PIN is required');
    }
    if (!RegExp(r'^\d{4,6}$').hasMatch(pin)) {
      return const ValidationResult.fail('PIN must be 4–6 digits');
    }
    return const ValidationResult.ok();
  }

  // ── File Size ─────────────────────────────────────────────────────────────

  static ValidationResult validateVideoSize(int fileSizeBytes) {
    if (fileSizeBytes <= 0) {
      return const ValidationResult.fail('File is empty or unreadable');
    }
    if (fileSizeBytes > MentronConstants.kMaxVideoSizeBytes) {
      final maxMb = MentronConstants.kMaxVideoSizeBytes ~/ (1024 * 1024);
      return ValidationResult.fail('Video exceeds the $maxMb MB limit');
    }
    return const ValidationResult.ok();
  }

  static ValidationResult validateNotesSize(int fileSizeBytes) {
    if (fileSizeBytes <= 0) {
      return const ValidationResult.fail('File is empty or unreadable');
    }
    if (fileSizeBytes > MentronConstants.kMaxNotesSizeBytes) {
      final maxMb = MentronConstants.kMaxNotesSizeBytes ~/ (1024 * 1024);
      return ValidationResult.fail('Notes file exceeds the $maxMb MB limit');
    }
    return const ValidationResult.ok();
  }

  // ── String Sanitisation ───────────────────────────────────────────────────

  /// Strips null bytes, control characters, and truncates to [maxLength].
  static String sanitize(String input,
      {int maxLength = MentronConstants.kMaxStringLength}) {
    return input
        .replaceAll(RegExp(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'), '')
        .trim()
        .substring(0, input.length.clamp(0, maxLength));
  }

  static ValidationResult validateString(String? value,
      {String fieldName = 'Field',
      bool required = true,
      int maxLength = MentronConstants.kMaxStringLength}) {
    if (required && (value == null || value.trim().isEmpty)) {
      return ValidationResult.fail('$fieldName is required');
    }
    if (value != null && value.length > maxLength) {
      return ValidationResult.fail(
          '$fieldName exceeds the $maxLength character limit');
    }
    return const ValidationResult.ok();
  }

  // ── URL ───────────────────────────────────────────────────────────────────

  static ValidationResult validateUrl(String? url) {
    if (url == null || url.trim().isEmpty) {
      return const ValidationResult.fail('URL is required');
    }
    final uri = Uri.tryParse(url.trim());
    if (uri == null || (!uri.isScheme('http') && !uri.isScheme('https'))) {
      return const ValidationResult.fail(
          'URL must start with http:// or https://');
    }
    return const ValidationResult.ok();
  }

  // ── Content Type ──────────────────────────────────────────────────────────

  static const _validVideoExtensions = {'mp4', 'mov', 'mkv', 'webm'};
  static const _validNotesExtensions = {'pdf', 'docx', 'pptx', 'jpg', 'jpeg', 'png'};

  static ValidationResult validateContentExtension(
      String filename, String contentType) {
    final ext = filename.split('.').last.toLowerCase();
    if (contentType == 'video' && !_validVideoExtensions.contains(ext)) {
      return ValidationResult.fail(
          'Invalid video format. Allowed: ${_validVideoExtensions.join(', ')}');
    }
    if (contentType == 'notes' && !_validNotesExtensions.contains(ext)) {
      return ValidationResult.fail(
          'Invalid notes format. Allowed: ${_validNotesExtensions.join(', ')}');
    }
    return const ValidationResult.ok();
  }
}
