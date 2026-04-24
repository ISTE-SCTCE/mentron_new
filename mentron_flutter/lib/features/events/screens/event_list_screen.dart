import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import 'event_detail_screen.dart';
import '../../../core/utils/app_transitions.dart';


class EventListScreen extends StatefulWidget {
  const EventListScreen({super.key});
  @override
  State<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends State<EventListScreen> {
  List<Map<String, dynamic>> _events = [];
  List<Map<String, dynamic>> _concepts = [];
  bool _isLoading = true;
  bool _isLeader = false;
  RealtimeChannel? _voteSubscription;

  @override
  void initState() {
    super.initState();
    _fetchData();
    _setupVoteSubscription();
  }

  @override
  void dispose() {
    _voteSubscription?.unsubscribe();
    super.dispose();
  }

  Future<void> _fetchData() async {
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    
    // Check if current user is exec/core/leadership
    _isLeader = await supabaseService.isLeadershipPosition();

    await Future.wait([
      _fetchEvents(),
      _fetchConcepts(),
    ]);
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchEvents() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('event_cal')
          .select('*')
          .order('created_at', ascending: false);
      _events = List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint('Error fetching events: $e');
    }
  }

  Future<void> _fetchConcepts() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('event_concepts')
          .select('*, profiles(full_name), event_concept_votes(vote_value, user_id)')
          .order('created_at', ascending: false);
      
      if (mounted) {
        setState(() {
          _concepts = List<Map<String, dynamic>>.from(response);
        });
      }
    } catch (e) {
      debugPrint('Error fetching concepts: $e');
    }
  }

  void _setupVoteSubscription() {
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    _voteSubscription = supabaseService.subscribeToTable(
      table: 'event_concept_votes',
      onUpdate: (payload) {
        // Simple strategy: re-fetch concepts to update scores and UI
        _fetchConcepts();
      },
    );
  }

  Future<void> _handleVote(String conceptId, int value) async {
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    final supabase = supabaseService.client;
    final userId = supabaseService.currentUser?.id;

    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to vote')),
      );
      return;
    }

    // Optmistic Update for zero-lag UI
    setState(() {
      final conceptIndex = _concepts.indexWhere((c) => c['id'].toString() == conceptId);
      if (conceptIndex >= 0) {
        final concept = _concepts[conceptIndex];
        final votes = List<Map<String, dynamic>>.from(concept['event_concept_votes'] ?? []);
        final userVoteIndex = votes.indexWhere((v) => v['user_id'] == userId);
        
        if (userVoteIndex >= 0) {
          if (votes[userVoteIndex]['vote_value'] == value) {
            votes.removeAt(userVoteIndex); // Toggle off
          } else {
            votes[userVoteIndex]['vote_value'] = value; // Switch vote
          }
        } else {
          votes.add({'user_id': userId, 'vote_value': value}); // New vote
        }
        _concepts[conceptIndex]['event_concept_votes'] = votes;
      }
    });

    try {
      // Check for existing vote
      final existingVote = await supabase
          .from('event_concept_votes')
          .select('*')
          .eq('concept_id', conceptId)
          .eq('user_id', userId)
          .maybeSingle();

      if (existingVote != null) {
        if (existingVote['vote_value'] == value) {
          // Toggle off
          await supabase.from('event_concept_votes').delete().eq('id', existingVote['id']);
        } else {
          // Switch direction
          await supabase.from('event_concept_votes').update({'vote_value': value}).eq('id', existingVote['id']);
        }
      } else {
        // New vote
        await supabase.from('event_concept_votes').insert({
          'concept_id': conceptId,
          'user_id': userId,
          'vote_value': value,
        });
      }
      // UI will update via real-time subscription for other users
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vote failed. Reverting... $e')),
      );
      _fetchConcepts(); // Fallback to server state
    }
  }

  Future<void> _handleDelete(String conceptId) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.bgColor,
        title: const Text('Delete Concept?', style: TextStyle(color: Colors.white)),
        content: const Text('Are you sure you want to delete this event concept?', style: TextStyle(color: AppTheme.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (shouldDelete != true) return;

    // Optimistic delete
    setState(() => _concepts.removeWhere((c) => c['id'].toString() == conceptId));

    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false).client;
      await supabase.from('event_concepts').delete().eq('id', conceptId);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete: $e')));
      _fetchConcepts(); // Revert
    }
  }

  void _showProposeSheet() {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: GlassContainer(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('PROPOSE CONCEPT', style: TextStyle(color: AppTheme.accentPrimary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white, size: 20)),
                  ],
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: titleController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Concept Title', hintText: 'e.g. 24hr AI Hackathon'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descController,
                  maxLines: 4,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Description', hintText: 'Explain your idea...'),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isSubmitting ? null : () async {
                      if (titleController.text.isEmpty || descController.text.isEmpty) return;
                      setSheetState(() => isSubmitting = true);
                      
                      final supabaseService = Provider.of<SupabaseService>(context, listen: false);
                      try {
                        await supabaseService.client.from('event_concepts').insert({
                          'user_id': supabaseService.currentUser?.id,
                          'title': titleController.text,
                          'description': descController.text,
                        });
                        if (mounted) {
                          Navigator.pop(context);
                          _fetchConcepts();
                        }
                      } catch (e) {
                        setSheetState(() => isSubmitting = false);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(isSubmitting ? 'SUBMITTING...' : 'SUBMIT PROPOSAL', style: const TextStyle(fontWeight: FontWeight.w900)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(children: [
          const Text('ISTE SCTCE', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Events & Concepts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // --- Upcoming Events Section ---
                    const Text('UPCOMING EVENTS', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
                    const SizedBox(height: 16),
                    if (_events.isEmpty)
                      const Center(child: Text('No upcoming events', style: TextStyle(color: AppTheme.textMuted)))
                    else
                      ...List.generate(_events.length, (index) => _buildEventCard(_events[index], index)),
                    
                    const SizedBox(height: 48),

                    // --- Community Forum Section ---
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('COMMUNITY FORUM', style: TextStyle(color: AppTheme.accentPrimary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
                            Text('Event Concepts', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
                          ],
                        ),
                        IconButton(
                          onPressed: _showProposeSheet,
                          icon: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: AppTheme.accentPrimary.withValues(alpha: 0.1), shape: BoxShape.circle),
                            child: const Icon(Icons.add_rounded, color: AppTheme.accentPrimary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    if (_concepts.isEmpty)
                      const Center(child: Text('No concepts proposed yet', style: TextStyle(color: AppTheme.textMuted)))
                    else
                      ..._concepts.map((concept) => _buildConceptCard(concept)),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildEventCard(Map<String, dynamic> event, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => Navigator.push(context, AppTransitions.slideLeft(
          EventDetailScreen(eventId: event['id'].toString()),
        )),
        child: GlassContainer(
          padding: const EdgeInsets.all(28),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppTheme.accentPrimary.withValues(alpha: 0.15), shape: BoxShape.circle),
                child: const Icon(Icons.event_rounded, color: AppTheme.accentPrimary, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(child: Text(event['event_name'] ?? 'Event', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white))),
              const Icon(Icons.arrow_forward_ios_rounded, color: AppTheme.textMuted, size: 14),
            ]),
            if (event['venue'] != null) ...[
              const SizedBox(height: 12),
              Row(children: [
                const Icon(Icons.location_on_rounded, color: AppTheme.accentSecondary, size: 14),
                const SizedBox(width: 6),
                Text(event['venue'], style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
              ]),
            ],
            if (event['description'] != null && event['description'].toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(event['description'], maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5)),
            ],
          ]),
        ),
      ),
    ).animate().fadeIn(delay: (index * 80).ms).slideY(begin: 0.05);
  }

  Widget _buildConceptCard(Map<String, dynamic> concept) {
    final votes = List<Map<String, dynamic>>.from(concept['event_concept_votes'] ?? []);
    final score = votes.fold<int>(0, (sum, v) => sum + (v['vote_value'] as int));
    
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabaseService.currentUser?.id;
    final userVoteEntry = userId != null ? votes.where((v) => v['user_id'] == userId).firstOrNull : null;
    final userVote = userVoteEntry != null ? userVoteEntry['vote_value'] as int : 0;
    
    // Delete condition: User owns the concept OR user is leadership (exec/core)
    final isOwner = userId != null && userId == concept['user_id'];
    final canDelete = isOwner || _isLeader;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), shape: BoxShape.circle),
                  child: const Icon(Icons.person_rounded, color: AppTheme.textMuted, size: 14),
                ),
                const SizedBox(width: 8),
                Text(
                  'u/${(concept['profiles']?['full_name'] ?? 'Member').toString().replaceAll(' ', '')}',
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                // Delete Icon if Owner or Admin
                if (canDelete)
                  IconButton(
                    onPressed: () => _handleDelete(concept['id'].toString()),
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.white54, size: 18),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  )
                else
                  const Icon(Icons.more_horiz_rounded, color: AppTheme.textMuted, size: 16),
              ],
            ),
            const SizedBox(height: 12),
            Text(concept['title'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
            const SizedBox(height: 8),
            Text(concept['description'] ?? '', style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.4)),
            const SizedBox(height: 20),
            
            // --- Bottom Navigation/Voting Section ---
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(30)),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: () => _handleVote(concept['id'], 1),
                    icon: Icon(
                      Icons.arrow_upward_rounded, 
                      size: 20, 
                      color: userVote == 1 ? Colors.orange : AppTheme.textMuted
                    ),
                  ),
                  Text(
                    '$score', 
                    style: TextStyle(
                      fontWeight: FontWeight.w900, 
                      color: score > 0 ? Colors.orange : (score < 0 ? Colors.blue : Colors.white)
                    )
                  ),
                  IconButton(
                    onPressed: () => _handleVote(concept['id'], -1),
                    icon: Icon(
                      Icons.arrow_downward_rounded, 
                      size: 20, 
                      color: userVote == -1 ? Colors.blue : AppTheme.textMuted
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn().slideY(begin: 0.05);
  }
}

