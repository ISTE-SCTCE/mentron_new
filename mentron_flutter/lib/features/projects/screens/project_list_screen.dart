import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../data/models/project_model.dart';
import 'project_detail_screen.dart';
import 'add_project_screen.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/app_transitions.dart';

class ProjectListScreen extends StatefulWidget {
  const ProjectListScreen({super.key});
  @override
  State<ProjectListScreen> createState() => _ProjectListScreenState();
}

class _ProjectListScreenState extends State<ProjectListScreen> {
  List<Project> _projects = [];
  bool _isLoading = true;
  String? _currentUserId;
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _loadUserAndProjects();
  }

  Future<void> _loadUserAndProjects() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    _currentUserId = supabase.currentUser?.id;
    if (_currentUserId != null) {
      try {
        final profile = await supabase.client.from('profiles').select('role').eq('id', _currentUserId!).maybeSingle();
        if (mounted && profile != null) setState(() => _currentUserRole = profile['role']);
      } catch (_) {}
    }
    await _fetchProjects();
    _setupRealtime();
  }

  Future<void> _fetchProjects() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase.from('projects').select().order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _projects = (response as List).map((json) => Project.fromJson(json)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _setupRealtime() {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    supabase.subscribeToTable(table: 'projects', onUpdate: (_) => _fetchProjects());
  }

  bool _canDelete(Project project) {
    if (_currentUserId == null) return false;
    return project.profileId == _currentUserId || _currentUserRole == 'exec';
  }

  Future<void> _deleteProject(Project project) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Project?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('Delete "${project.title}"? This will also remove all applications.', style: const TextStyle(color: AppTheme.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('DELETE', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirm != true) return;

    final supabase = Provider.of<SupabaseService>(context, listen: false);
    try {
      // Delete applications first, then the project
      await supabase.client.from('project_applications').delete().eq('project_id', project.id);
      await supabase.client.from('projects').delete().eq('id', project.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(backgroundColor: Colors.green, content: Text('Project deleted')));
        setState(() => _projects.removeWhere((p) => p.id == project.id));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: Column(children: [
          const Text('INCUBATION', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Projects', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : RefreshIndicator(
                onRefresh: _fetchProjects,
                backgroundColor: AppTheme.surfaceColor, color: AppTheme.accentSecondary,
                child: _projects.isEmpty
                    ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                        const Text('🚀', style: TextStyle(fontSize: 48)),
                        const SizedBox(height: 16),
                        const Text('No projects yet.', style: TextStyle(color: AppTheme.textMuted)),
                        const SizedBox(height: 8),
                        const Text('Be the first to post one!', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                      ]).animate().fadeIn())
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                        itemCount: _projects.length,
                        itemBuilder: (context, index) => RepaintBoundary(child: _buildProjectCard(_projects[index], index)),
                      ),
              ),
      ),
    );
  }

  Widget _buildProjectCard(Project project, int index) {
    final canDelete = _canDelete(project);
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      child: GlassContainer(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppTheme.accentSecondary.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.accentSecondary.withOpacity(0.2))),
              child: Text(project.category.toUpperCase(), style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ),
            Row(children: [
              Text('ACTIVE', style: TextStyle(color: Colors.greenAccent.withOpacity(0.7), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
              if (canDelete) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _deleteProject(project),
                  child: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                ),
              ],
            ]),
          ]),
          const SizedBox(height: 16),
          Text(project.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white)),
          const SizedBox(height: 8),
          Text(project.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5)),
          const SizedBox(height: 20),
          Row(children: [
            _buildInfoItem(Icons.work_outline_rounded, project.role),
            const SizedBox(width: 24),
            _buildInfoItem(Icons.timer_outlined, project.duration),
          ]),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.push(context, AppTransitions.slideLeft(ProjectDetailScreen(project: project))),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.white.withOpacity(0.05), foregroundColor: Colors.white, side: BorderSide(color: Colors.white.withOpacity(0.1))),
              child: const Text('VIEW DETAILS & APPLY'),
            ),
          ),
        ]),
      ),
    ).animate().fadeIn(delay: (index * 100).ms).slideY(begin: 0.1);
  }

  Widget _buildInfoItem(IconData icon, String label) {
    return Row(children: [
      Icon(icon, size: 14, color: AppTheme.textMuted),
      const SizedBox(width: 6),
      Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
    ]);
  }
}
