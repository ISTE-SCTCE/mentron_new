import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/profanity_filter.dart';

class AddQuestionScreen extends StatefulWidget {
  const AddQuestionScreen({super.key});

  @override
  State<AddQuestionScreen> createState() => _AddQuestionScreenState();
}

class _AddQuestionScreenState extends State<AddQuestionScreen> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  String _selectedTopic = 'General';
  bool _isAnonymous = true;
  bool _isSubmitting = false;

  final List<String> _topics = [
    'General',
    'Academics',
    'Events',
    'Placements',
    'Tech',
  ];

  Future<void> _submitQuestion() async {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();

    if (title.isEmpty || content.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }

    if (ProfanityFilter.hasProfanity(title) || ProfanityFilter.hasProfanity(content)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text('🚫 Inappropriate content detected. Please keep the community safe.'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;

    try {
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('User not logged in');

      await supabase.from('forum_questions').insert({
        'author_id': userId,
        'title': title,
        'content': content,
        'topic': _selectedTopic,
        'is_anonymous': _isAnonymous,
      });

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.green,
            content: Text('Question posted successfully!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text(ErrorHandler.friendly(e)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(
          children: [
            const Text(
              'COMMUNITY FORUM',
              style: TextStyle(
                color: AppTheme.accentSecondary,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 3,
              ),
            ),
            const Text(
              'Ask a Question',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          _isSubmitting
              ? const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppTheme.accentPrimary,
                    ),
                  ),
                )
              : IconButton(
                  icon: const Icon(
                    Icons.send_rounded,
                    color: AppTheme.accentPrimary,
                  ),
                  onPressed: _submitQuestion,
                ),
        ],
      ),
      body: LiquidBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(
            top: 100,
            left: 24,
            right: 24,
            bottom: 40,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Anonymous Toggle
              GlassContainer(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _isAnonymous
                            ? Colors.purpleAccent.withValues(alpha: 0.2)
                            : Colors.white10,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _isAnonymous
                            ? Icons.masks_rounded
                            : Icons.person_rounded,
                        color: _isAnonymous
                            ? Colors.purpleAccent
                            : Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Post Anonymously',
                            style: TextStyle(
                              color: _isAnonymous
                                  ? Colors.white
                                  : Colors.white70,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _isAnonymous
                                ? 'Your identity will be hidden.'
                                : 'Your name will be visible.',
                            style: const TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: _isAnonymous,
                      activeThumbColor: Colors.purpleAccent,
                      onChanged: (val) => setState(() => _isAnonymous = val),
                    ),
                  ],
                ),
              ).animate().fadeIn().slideY(begin: 0.1),

              const SizedBox(height: 24),

              // Title Field
              GlassContainer(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: TextField(
                  controller: _titleController,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Question Title...',
                    hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3),
                      fontWeight: FontWeight.normal,
                    ),
                    border: InputBorder.none,
                  ),
                  maxLength: 100,
                  buildCounter:
                      (
                        context, {
                        required currentLength,
                        required isFocused,
                        maxLength,
                      }) => null,
                ),
              ).animate().fadeIn(delay: 50.ms).slideY(begin: 0.1),

              const SizedBox(height: 16),

              // Topic Dropdown
              GlassContainer(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedTopic,
                    dropdownColor: AppTheme.surfaceColor,
                    isExpanded: true,
                    icon: const Icon(
                      Icons.arrow_drop_down_rounded,
                      color: Colors.white54,
                    ),
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    items: _topics.map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: (newValue) {
                      if (newValue != null) {
                        setState(() => _selectedTopic = newValue);
                      }
                    },
                  ),
                ),
              ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1),

              const SizedBox(height: 16),

              // Content Field
              GlassContainer(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: TextField(
                  controller: _contentController,
                  maxLines: 12,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    height: 1.5,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Elaborate on your question or doubt here...',
                    hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                    border: InputBorder.none,
                  ),
                ),
              ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.1),
            ],
          ),
        ),
      ),
    );
  }
}
