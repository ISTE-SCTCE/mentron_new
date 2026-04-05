import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../data/models/forum_model.dart';
import '../../../core/utils/app_transitions.dart';
import 'add_question_screen.dart';
import 'question_detail_screen.dart';
import 'package:intl/intl.dart';

class ForumListScreen extends StatefulWidget {
  const ForumListScreen({super.key});

  @override
  State<ForumListScreen> createState() => _ForumListScreenState();
}

class _ForumListScreenState extends State<ForumListScreen> {
  List<ForumQuestion> _questions = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedTopic = 'All';

  final List<String> _topics = [
    'All',
    'General',
    'Academics',
    'Events',
    'Placements',
    'Tech',
  ];

  @override
  void initState() {
    super.initState();
    _fetchQuestions();

    // Subscribe to new questions
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    supabase.subscribeToTable(
      table: 'forum_questions',
      onUpdate: (_) => _fetchQuestions(),
    );
  }

  Future<void> _fetchQuestions() async {
    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;
    try {
      var query = supabase
          .from('forum_questions')
          .select('*, profiles(full_name), forum_answers!question_id(count)');

      if (_selectedTopic != 'All') {
        query = query.eq('topic', _selectedTopic);
      }

      if (_searchQuery.isNotEmpty) {
        query = query.ilike('title', '%$_searchQuery%');
      }

      final response = await query.order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _questions = (response as List)
              .map((json) => ForumQuestion.fromJson(json))
              .toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(
          context,
          AppTransitions.slideUp(const AddQuestionScreen()),
        ).then((_) => _fetchQuestions()),
        backgroundColor: AppTheme.accentPrimary,
        icon: const Icon(Icons.add_comment_rounded),
        label: const Text(
          'ASK A QUESTION',
          style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
        ),
      ).animate().scale(delay: 500.ms),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(
          children: [
            const Text(
              'COMMUNITY',
              style: TextStyle(
                color: AppTheme.accentSecondary,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 3,
              ),
            ),
            const Text(
              'Q&A Forum',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
            size: 18,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: Column(
          children: [
            // Safe area space + top padding
            const SizedBox(height: 100),

            // Search & Filter Block
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: GlassContainer(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                child: TextField(
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  onChanged: (val) {
                    _searchQuery = val;
                    if (val.isEmpty || val.length > 2) _fetchQuestions();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search discussions...',
                    hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                    border: InputBorder.none,
                    icon: Icon(
                      Icons.search,
                      color: Colors.white.withValues(alpha: 0.3),
                    ),
                  ),
                ),
              ),
            ).animate().slideY(begin: -0.2),

            const SizedBox(height: 16),

            // Topics Scroll
            SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _topics.length,
                itemBuilder: (context, index) {
                  final topic = _topics[index];
                  final isSelected = _selectedTopic == topic;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(
                        topic,
                        style: TextStyle(
                          color: isSelected ? Colors.black : Colors.white70,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.normal,
                          fontSize: 12,
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: AppTheme.accentSecondary,
                      backgroundColor: Colors.white.withValues(alpha: 0.05),
                      side: BorderSide(
                        color: isSelected
                            ? AppTheme.accentSecondary
                            : Colors.white.withValues(alpha: 0.1),
                      ),
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedTopic = topic;
                            _isLoading = true;
                          });
                          _fetchQuestions();
                        }
                      },
                    ),
                  );
                },
              ),
            ).animate().fadeIn(delay: 100.ms),

            const SizedBox(height: 16),

            // List View
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppTheme.accentSecondary,
                      ),
                    )
                  : _questions.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('💬', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 16),
                          const Text(
                            'No questions found.',
                            style: TextStyle(color: AppTheme.textMuted),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Be the first to ask!',
                            style: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ).animate().fadeIn(),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                      itemCount: _questions.length,
                      itemBuilder: (context, index) {
                        final question = _questions[index];
                        return _buildQuestionCard(question, index);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionCard(ForumQuestion question, int index) {
    final displayName = question.isAnonymous
        ? 'Anonymous Student'
        : (question.authorName ?? 'Student');

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => Navigator.push(
          context,
          AppTransitions.fade(QuestionDetailScreen(questionId: question.id)),
        ).then((_) => _fetchQuestions()),
        child: GlassContainer(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Topic & Resolution status
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.accentPrimary.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppTheme.accentPrimary.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      question.topic.toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.accentPrimary,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  const Spacer(),
                  if (question.resolved)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.check_circle_rounded,
                            color: Colors.greenAccent,
                            size: 12,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'RESOLVED',
                            style: TextStyle(
                              color: Colors.greenAccent,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Title
              Text(
                question.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),

              // Excerpt
              Text(
                question.content,
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 13,
                  height: 1.4,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),

              // Footer
              Row(
                children: [
                  CircleAvatar(
                    radius: 10,
                    backgroundColor: question.isAnonymous
                        ? Colors.white10
                        : AppTheme.accentSecondary.withValues(alpha: 0.2),
                    child: question.isAnonymous
                        ? const Icon(
                            Icons.masks_rounded,
                            size: 12,
                            color: Colors.white54,
                          )
                        : Text(
                            displayName[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.accentSecondary,
                            ),
                          ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    displayName,
                    style: TextStyle(
                      color: question.isAnonymous
                          ? Colors.white54
                          : AppTheme.accentSecondary,
                      fontSize: 11,
                      fontWeight: question.isAnonymous
                          ? FontWeight.normal
                          : FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '•  ${DateFormat('MMM d').format(question.createdAt)}',
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 10,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.chat_bubble_outline_rounded,
                    color: Colors.white.withValues(alpha: 0.5),
                    size: 14,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${question.answerCount}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ).animate().fadeIn(delay: (index * 50).ms).slideY(begin: 0.1),
    );
  }
}
