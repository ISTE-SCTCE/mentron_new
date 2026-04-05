import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../data/models/forum_model.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/profanity_filter.dart';
import 'package:intl/intl.dart';

class QuestionDetailScreen extends StatefulWidget {
  final String questionId;
  const QuestionDetailScreen({super.key, required this.questionId});

  @override
  State<QuestionDetailScreen> createState() => _QuestionDetailScreenState();
}

class _QuestionDetailScreenState extends State<QuestionDetailScreen> {
  ForumQuestion? _question;
  List<ForumAnswer> _answers = [];
  bool _isLoading = true;
  String? _currentUserId;
  String? _currentUserRole;

  final _answerController = TextEditingController();
  bool _isAnonymous = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadData();
    _setupRealtime();
  }

  Future<void> _loadData() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    _currentUserId = supabase.currentUser?.id;

    if (_currentUserId != null) {
      try {
        final profile = await supabase.client
            .from('profiles')
            .select('role')
            .eq('id', _currentUserId!)
            .maybeSingle();
        if (mounted && profile != null) {
          setState(() => _currentUserRole = profile['role']);
        }
      } catch (_) {}
    }

    await Future.wait([_fetchQuestion(), _fetchAnswers()]);

    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchQuestion() async {
    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;
    try {
      final response = await supabase
          .from('forum_questions')
          .select('*, profiles(full_name)')
          .eq('id', widget.questionId)
          .single();
      if (mounted) setState(() => _question = ForumQuestion.fromJson(response));
    } catch (_) {}
  }

  Future<void> _fetchAnswers() async {
    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;
    try {
      final response = await supabase
          .from('forum_answers')
          .select('*, profiles(full_name)')
          .eq('question_id', widget.questionId)
          .order('is_best_answer', ascending: false)
          .order('upvotes', ascending: false)
          .order('created_at', ascending: true);

      // Check which answers the current user has upvoted
      List<String> upvotedIds = [];
      if (_currentUserId != null) {
        final votesRes = await supabase
            .from('forum_votes')
            .select('answer_id')
            .eq('user_id', _currentUserId!)
            .eq('vote_type', 1);
        upvotedIds = (votesRes as List)
            .map((v) => v['answer_id'] as String)
            .toList();
      }

      if (mounted) {
        setState(() {
          _answers = (response as List).map((json) {
            final answer = ForumAnswer.fromJson(json);
            answer.hasUpvoted = upvotedIds.contains(answer.id);
            return answer;
          }).toList();
        });
      }
    } catch (_) {}
  }

  void _setupRealtime() {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    // Subscribe to answer updates
    supabase.subscribeToTable(
      table: 'forum_answers',
      onUpdate: (_) => _fetchAnswers(),
    );
    // Subscribe to question updates (resolved state)
    supabase.subscribeToTable(
      table: 'forum_questions',
      onUpdate: (_) => _fetchQuestion(),
    );
  }

  Future<void> _submitAnswer() async {
    final content = _answerController.text.trim();
    if (content.isEmpty) return;
    if (_currentUserId == null) return;

    if (ProfanityFilter.hasProfanity(content)) {
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
      await supabase.from('forum_answers').insert({
        'question_id': widget.questionId,
        'author_id': _currentUserId,
        'content': content,
        'is_anonymous': _isAnonymous,
      });

      if (mounted) {
        _answerController.clear();
        FocusScope.of(context).unfocus();
        await _fetchAnswers();
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

  Future<void> _toggleVote(ForumAnswer answer) async {
    if (_currentUserId == null) return;
    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;

    // Optimistic UI updates
    setState(() {
      if (answer.hasUpvoted) {
        answer.upvotes -= 1;
        answer.hasUpvoted = false;
      } else {
        answer.upvotes += 1;
        answer.hasUpvoted = true;
      }
    });

    try {
      // Use the RPC to safely handle atomicity
      await supabase.rpc(
        'handle_forum_vote',
        params: {
          'p_answer_id': answer.id,
          'p_user_id': _currentUserId,
          'p_vote_value': 1, // Only 1 (upvote) supported right now in UI
        },
      );
      // Silent refresh to sync actual count
      await _fetchAnswers();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text(ErrorHandler.friendly(e)),
          ),
        );
      }
      await _fetchAnswers(); // Revert on failure
    }
  }

  Future<void> _markBestAnswer(ForumAnswer answer) async {
    if (_currentUserId == null || _question?.authorId != _currentUserId) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Mark as Best Answer?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'This will pin the answer to the top and mark your question as resolved. You can change this later.',
          style: TextStyle(color: AppTheme.textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'MARK BEST',
              style: TextStyle(
                color: Colors.greenAccent,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;
    try {
      // 1. Unmark all other answers
      await supabase
          .from('forum_answers')
          .update({'is_best_answer': false})
          .eq('question_id', widget.questionId);
      // 2. Mark this answer
      await supabase
          .from('forum_answers')
          .update({'is_best_answer': true})
          .eq('id', answer.id);
      // 3. Resolve the question
      await supabase
          .from('forum_questions')
          .update({'resolved': true})
          .eq('id', widget.questionId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.green,
            content: Text('Best answer marked!'),
          ),
        );
        _loadData();
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
    }
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: LiquidBackground(
          child: Center(
            child: CircularProgressIndicator(color: AppTheme.accentSecondary),
          ),
        ),
      );
    }

    if (_question == null) {
      return Scaffold(
        extendBodyBehindAppBar: true,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: const LiquidBackground(
          child: Center(
            child: Text(
              'Question not found',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ),
      );
    }

    final q = _question!;
    final authorDisplayName = q.isAnonymous
        ? 'Anonymous Student'
        : (q.authorName ?? 'Student');
    final isQuestionAuthor = _currentUserId == q.authorId;
    final isExec = _currentUserRole == 'exec' || _currentUserRole == 'admin';

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
            size: 18,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (isQuestionAuthor || isExec)
            IconButton(
              icon: const Icon(
                Icons.delete_outline_rounded,
                color: Colors.redAccent,
                size: 20,
              ),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppTheme.surfaceColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    title: const Text(
                      'Delete Question?',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    content: const Text(
                      'This will permanently delete this question and all its answers.',
                      style: TextStyle(color: AppTheme.textMuted),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text(
                          'DELETE',
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  try {
                    final supabase = Provider.of<SupabaseService>(
                      context,
                      listen: false,
                    ).client;
                    await supabase
                        .from('forum_questions')
                        .delete()
                        .eq('id', q.id);
                    if (mounted) Navigator.pop(context);
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: Colors.red,
                          content: Text('Error: $e'),
                        ),
                      );
                    }
                  }
                }
              },
            ),
        ],
      ),
      body: LiquidBackground(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(top: 100, bottom: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // --- THE QUESTION ---
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.accentPrimary.withOpacity(
                                    0.2,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: AppTheme.accentPrimary.withOpacity(
                                      0.3,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  q.topic.toUpperCase(),
                                  style: const TextStyle(
                                    color: AppTheme.accentPrimary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              if (q.resolved)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
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
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            q.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 14,
                                backgroundColor: q.isAnonymous
                                    ? Colors.white10
                                    : AppTheme.accentSecondary.withValues(alpha: 0.2),
                                child: q.isAnonymous
                                    ? const Icon(
                                        Icons.masks_rounded,
                                        size: 16,
                                        color: Colors.white54,
                                      )
                                    : Text(
                                        authorDisplayName[0].toUpperCase(),
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.accentSecondary,
                                        ),
                                      ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    authorDisplayName,
                                    style: TextStyle(
                                      color: q.isAnonymous
                                          ? Colors.white54
                                          : Colors.white,
                                      fontSize: 13,
                                      fontWeight: q.isAnonymous
                                          ? FontWeight.normal
                                          : FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    DateFormat(
                                      'MMM d, yyyy • h:mm a',
                                    ).format(q.createdAt.toLocal()),
                                    style: const TextStyle(
                                      color: AppTheme.textMuted,
                                      fontSize: 10,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          Text(
                            q.content,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 15,
                              height: 1.6,
                            ),
                          ),
                          const SizedBox(height: 32),
                          const Divider(color: Colors.white10),
                          const SizedBox(height: 16),
                          Text(
                            '${_answers.length} ANSWERS',
                            style: const TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2,
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ).animate().fadeIn().slideY(begin: -0.1),

                    // --- THE ANSWERS ---
                    if (_answers.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Column(
                            children: [
                              const Text('⏳', style: TextStyle(fontSize: 40)),
                              const SizedBox(height: 12),
                              const Text(
                                'No answers yet.',
                                style: TextStyle(color: Colors.white54),
                              ),
                            ],
                          ).animate().fadeIn(),
                        ),
                      )
                    else
                      ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _answers.length,
                        itemBuilder: (context, index) {
                          final ans = _answers[index];
                          final ansAuthorName = ans.isAnonymous
                              ? 'Anonymous Student'
                              : (ans.authorName ?? 'Student');
                          final canDelete =
                              _currentUserId == ans.authorId || isExec;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: GlassContainer(
                              padding: const EdgeInsets.all(16),
                              border: ans.isBestAnswer
                                  ? Border.all(
                                      color: Colors.greenAccent.withOpacity(
                                        0.5,
                                      ),
                                      width: 2,
                                    )
                                  : Border.all(
                                      color: Colors.white.withValues(alpha: 0.1),
                                    ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (ans.isBestAnswer) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.greenAccent.withOpacity(
                                          0.2,
                                        ),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.star_rounded,
                                            color: Colors.greenAccent,
                                            size: 14,
                                          ),
                                          SizedBox(width: 4),
                                          Text(
                                            'BEST ANSWER',
                                            style: TextStyle(
                                              color: Colors.greenAccent,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w900,
                                              letterSpacing: 1,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                  ],
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 12,
                                        backgroundColor: ans.isAnonymous
                                            ? Colors.white10
                                            : Colors.blueAccent.withOpacity(
                                                0.2,
                                              ),
                                        child: ans.isAnonymous
                                            ? const Icon(
                                                Icons.masks_rounded,
                                                size: 14,
                                                color: Colors.white54,
                                              )
                                            : Text(
                                                ansAuthorName[0].toUpperCase(),
                                                style: const TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.blueAccent,
                                                ),
                                              ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        ansAuthorName,
                                        style: TextStyle(
                                          color: ans.isAnonymous
                                              ? Colors.white54
                                              : Colors.white,
                                          fontSize: 12,
                                          fontWeight: ans.isAnonymous
                                              ? FontWeight.normal
                                              : FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        DateFormat(
                                          'MMM d',
                                        ).format(ans.createdAt.toLocal()),
                                        style: const TextStyle(
                                          color: AppTheme.textMuted,
                                          fontSize: 10,
                                        ),
                                      ),
                                      const Spacer(),
                                      if (canDelete)
                                        GestureDetector(
                                          onTap: () async {
                                            final supabase =
                                                Provider.of<SupabaseService>(
                                                  context,
                                                  listen: false,
                                                ).client;
                                            await supabase
                                                .from('forum_answers')
                                                .delete()
                                                .eq('id', ans.id);
                                          },
                                          child: const Icon(
                                            Icons.delete_outline_rounded,
                                            color: Colors.redAccent,
                                            size: 16,
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    ans.content,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 14,
                                      height: 1.5,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      // Upvote button
                                      GestureDetector(
                                        onTap: () => _toggleVote(ans),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color: ans.hasUpvoted
                                                ? AppTheme.accentSecondary
                                                      .withValues(alpha: 0.2)
                                                : Colors.white.withOpacity(
                                                    0.05,
                                                  ),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            border: Border.all(
                                              color: ans.hasUpvoted
                                                  ? AppTheme.accentSecondary
                                                  : Colors.transparent,
                                            ),
                                          ),
                                          child: Row(
                                            children: [
                                              Icon(
                                                Icons.thumb_up_alt_rounded,
                                                color: ans.hasUpvoted
                                                    ? AppTheme.accentSecondary
                                                    : Colors.white54,
                                                size: 14,
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                '${ans.upvotes}',
                                                style: TextStyle(
                                                  color: ans.hasUpvoted
                                                      ? AppTheme.accentSecondary
                                                      : Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      const Spacer(),
                                      // Mark as best answer - only question author sees this, and only if not already best
                                      if (isQuestionAuthor && !ans.isBestAnswer)
                                        TextButton(
                                          onPressed: () => _markBestAnswer(ans),
                                          style: TextButton.styleFrom(
                                            foregroundColor: Colors.greenAccent,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 12,
                                              vertical: 4,
                                            ),
                                            minimumSize: Size.zero,
                                            tapTargetSize: MaterialTapTargetSize
                                                .shrinkWrap,
                                          ),
                                          child: const Text(
                                            'Mark Best',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.05),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),

            // --- ANSWER COMPOSER SECTION ---
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                border: const Border(top: BorderSide(color: Colors.white10)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  children: [
                    // Anonymity Toggle
                    Row(
                      children: [
                        Transform.scale(
                          scale: 0.7,
                          child: Switch(
                            value: _isAnonymous,
                            activeThumbColor: Colors.purpleAccent,
                            onChanged: (val) =>
                                setState(() => _isAnonymous = val),
                          ),
                        ),
                        Text(
                          _isAnonymous
                              ? 'Answering anonymously'
                              : 'Answering publically',
                          style: TextStyle(
                            color: _isAnonymous
                                ? Colors.purpleAccent
                                : Colors.white54,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Input Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.1),
                              ),
                            ),
                            child: TextField(
                              controller: _answerController,
                              maxLines: 4,
                              minLines: 1,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                              decoration: const InputDecoration(
                                hintText: 'Write your answer...',
                                hintStyle: TextStyle(color: Colors.white30),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        _isSubmitting
                            ? const Padding(
                                padding: EdgeInsets.all(12),
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    color: AppTheme.accentPrimary,
                                    strokeWidth: 2,
                                  ),
                                ),
                              )
                            : CircleAvatar(
                                radius: 22,
                                backgroundColor: AppTheme.accentPrimary,
                                child: IconButton(
                                  icon: const Icon(
                                    Icons.send_rounded,
                                    color: Colors.black,
                                    size: 20,
                                  ),
                                  onPressed: _submitAnswer,
                                ),
                              ),
                      ],
                    ),
                  ],
                ),
              ),
            ).animate().slideY(begin: 1.0, duration: 300.ms),
          ],
        ),
      ),
    );
  }
}
