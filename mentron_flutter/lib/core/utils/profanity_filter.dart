class ProfanityFilter {
  static final List<String> _badWords = [
    'fuck',
    'motherfucker',
    'fucker',
    'fucking',
    'shit',
    'asshole',
    'bitch',
    'dumbass',
    'porn',
    'bastard',
  ];

  /// Checks if the given text contains any inappropriate words.
  /// Uses word boundaries to avoid false positives (e.g. "assessment").
  static bool hasProfanity(String text) {
    if (text.isEmpty) return false;
    
    final lowercaseText = text.toLowerCase();
    
    for (final word in _badWords) {
      // \b matches word boundaries
      final regex = RegExp('\\b$word\\b');
      if (regex.hasMatch(lowercaseText)) {
        return true;
      }
    }
    
    return false;
  }
}
