import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({super.key});

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  List<Map<String, dynamic>> _pendingProjects = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAll();
  }

  Future<void> _fetchAll() async {
    if (mounted) setState(() => _isLoading = true);
    final client = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final projects = await client
          .from('pending_projects')
          .select()
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _pendingProjects = List<Map<String, dynamic>>.from(projects as List);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ─── Approve Project ──────────────────────────────────────────────────────
  Future<void> _approveProject(Map<String, dynamic> item) async {
    final client = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      // Use posted_by to match the live projects table schema
      await client.from('projects').insert({
        'title': item['title'],
        'description': item['description'],
        'role': item['role'] ?? 'Open',
        'duration': item['duration'] ?? 'Flexible',
        'category': item['category'] ?? 'General',
        'posted_by': item['posted_by'],
      });
      await client.from('pending_projects').delete().eq('id', item['id']);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(backgroundColor: Colors.green, content: Text('✅ Project approved and published!')),
        );
        _fetchAll();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 6),
            content: Text('Project error: ${e.toString()}'),
          ),
        );
      }
    }
  }

  // ─── Reject Project ───────────────────────────────────────────────────────
  Future<void> _rejectProject(String id) async {
    final client = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      await client.from('pending_projects').delete().eq('id', id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(backgroundColor: Colors.redAccent, content: Text('🗑️ Project rejected and removed.')),
        );
        _fetchAll();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorHandler.friendly(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalPending = _pendingProjects.length;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(children: [
          const Text('EXECOM', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          Text(
            totalPending > 0 ? 'Requests ($totalPending pending)' : 'Requests',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
          ),
        ]),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : _buildProjectsList(),
      ),
    );
  }

  Widget _buildProjectsList() {
    if (_pendingProjects.isEmpty) {
      return _buildEmpty('No pending projects', '🚀');
    }
    return RefreshIndicator(
      onRefresh: _fetchAll,
      backgroundColor: AppTheme.surfaceColor,
      color: AppTheme.accentSecondary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 120, 20, 40),
        itemCount: _pendingProjects.length,
        itemBuilder: (context, i) => RepaintBoundary(child: _buildProjectCard(_pendingProjects[i], i)),
      ),
    );
  }

  Widget _buildProjectCard(Map<String, dynamic> item, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        border: Border.all(color: AppTheme.accentPrimary.withOpacity(0.2)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.accentPrimary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                item['category'] ?? 'General',
                style: const TextStyle(color: AppTheme.accentPrimary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1),
              ),
            ),
          ]),
          const SizedBox(height: 12),
          Text(
            item['title'] ?? 'Untitled Project',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Text(
            item['description'] ?? 'No description provided.',
            style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.5),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildActionBtn('REJECT', Icons.close_rounded, Colors.redAccent, () => _rejectProject(item['id']))),
              const SizedBox(width: 12),
              Expanded(child: _buildActionBtn('APPROVE', Icons.check_rounded, Colors.green, () => _approveProject(item))),
            ],
          ),
        ]),
      ).animate().slideX(begin: 0.1, delay: Duration(milliseconds: 50 * index)).fadeIn(),
    );
  }

  Widget _buildActionBtn(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
        ]),
      ),
    );
  }

  Widget _buildEmpty(String message, String emoji) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(emoji, style: const TextStyle(fontSize: 48)),
        const SizedBox(height: 16),
        Text(message, style: const TextStyle(color: AppTheme.textMuted, fontSize: 14)),
        const SizedBox(height: 8),
        const Text('All caught up! 🎉', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
      ]).animate().fadeIn(),
    );
  }
}
