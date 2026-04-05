import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';
import '../../../data/models/project_model.dart';

class ProjectDetailScreen extends StatefulWidget {
  final Project project;
  const ProjectDetailScreen({super.key, required this.project});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  bool _isApplying = false;
  bool _hasApplied = false;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _checkIfApplied();
  }

  Future<void> _checkIfApplied() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    _currentUserId = supabase.currentUser?.id;
    if (_currentUserId == null) return;

    try {
      final response = await supabase.client
          .from('project_applications')
          .select('id')
          .eq('project_id', widget.project.id)
          .eq('profile_id', _currentUserId!)
          .maybeSingle();

      if (mounted) {
        setState(() => _hasApplied = response != null);
      }
    } catch (_) {}
  }

  Future<void> _handleApply() async {
    if (_currentUserId == null) return;

    setState(() => _isApplying = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;

    try {
      // Simple profile-based application — no CV needed
      await supabase.from('project_applications').insert({
        'project_id': widget.project.id,
        'profile_id': _currentUserId,
        'cv_url': '',   // kept for schema compatibility
        'status': 'pending',
      });

      if (mounted) {
        setState(() {
          _hasApplied = true;
          _isApplying = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.green,
            content: Text('🎉 Application submitted! The project owner will review your profile.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isApplying = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOwner = _currentUserId == widget.project.profileId;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: LiquidBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildProjectHeader(),
              const SizedBox(height: 32),
              _buildDescription(),
              const SizedBox(height: 40),
              if (!isOwner) _buildApplicationSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProjectHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.project.category.toUpperCase(),
          style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2),
        ),
        const SizedBox(height: 12),
        Text(
          widget.project.title,
          style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 32),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            _buildBadge(Icons.work_outline_rounded, widget.project.role, AppTheme.accentPrimary),
            const SizedBox(width: 12),
            _buildBadge(Icons.timer_outlined, widget.project.duration, Colors.orangeAccent),
          ],
        ),
      ],
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _buildBadge(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildDescription() {
    return GlassContainer(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'PROJECT MISSION',
            style: TextStyle(color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2),
          ),
          const SizedBox(height: 16),
          Text(
            widget.project.description,
            style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.6),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildApplicationSection() {
    return GlassContainer(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'APPLY TO PROJECT',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 1),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Your Mentron profile info will be shared with the project owner for review.',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 12, height: 1.5),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          if (_hasApplied)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: Colors.greenAccent.withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.greenAccent.withOpacity(0.3)),
              ),
              child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.check_circle_outline_rounded, color: Colors.greenAccent, size: 20),
                SizedBox(width: 8),
                Text('APPLICATION SUBMITTED', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.w900, letterSpacing: 1, fontSize: 13)),
              ]),
            )
          else
            ElevatedButton.icon(
              onPressed: _isApplying ? null : _handleApply,
              icon: _isApplying
                  ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Icon(Icons.send_rounded, size: 18),
              label: Text(_isApplying ? 'APPLYING...' : 'APPLY NOW'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms);
  }
}
