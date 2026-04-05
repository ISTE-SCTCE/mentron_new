import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';
import '../../../data/models/project_model.dart';

class ProjectApplicationsScreen extends StatefulWidget {
  final Project project;
  const ProjectApplicationsScreen({super.key, required this.project});

  @override
  State<ProjectApplicationsScreen> createState() => _ProjectApplicationsScreenState();
}

class _ProjectApplicationsScreenState extends State<ProjectApplicationsScreen> {
  List<Map<String, dynamic>> _applications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchApplications();
  }

  Future<void> _fetchApplications() async {
    if (mounted) setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      // Fetch applications with FULL profile info joined
      final response = await supabase
          .from('project_applications')
          .select('*, profiles!project_applications_profile_id_fkey(full_name, department, roll_number, year, role)')
          .eq('project_id', widget.project.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _applications = List<Map<String, dynamic>>.from(response as List);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(Map<String, dynamic> app, String status) async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      await supabase
          .from('project_applications')
          .update({'status': status})
          .eq('id', app['id']);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: status == 'accepted' ? Colors.green : Colors.redAccent,
            content: Text(status == 'accepted' ? '✅ Application accepted!' : '❌ Application rejected.'),
          ),
        );
        _fetchApplications();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))),
        );
      }
    }
  }

  void _showApplicantProfile(Map<String, dynamic> app) {
    final profile = app['profiles'] as Map<String, dynamic>?;
    if (profile == null) return;

    final name = profile['full_name'] ?? 'Unknown';
    final department = profile['department'] ?? 'N/A';
    final rollNumber = profile['roll_number'] ?? 'N/A';
    final year = profile['year'] ?? 'N/A';
    final role = profile['role'] ?? 'member';
    final initials = name.isNotEmpty ? name[0].toUpperCase() : 'A';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 28),
              // Avatar
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppTheme.accentPrimary, AppTheme.accentSecondary],
                  ),
                ),
                child: Center(
                  child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                ),
              ),
              const SizedBox(height: 16),
              Text(name, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.accentPrimary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.accentPrimary.withOpacity(0.3)),
                ),
                child: Text(role.toUpperCase(), style: const TextStyle(color: AppTheme.accentPrimary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
              ),
              const SizedBox(height: 28),
              // Profile Info Grid
              _buildProfileInfoRow(Icons.school_outlined, 'Department', department),
              const Divider(color: Colors.white12, height: 24),
              _buildProfileInfoRow(Icons.badge_outlined, 'Roll Number', rollNumber.toUpperCase()),
              const Divider(color: Colors.white12, height: 24),
              _buildProfileInfoRow(Icons.calendar_today_outlined, 'Academic Year', year.toString()),
              const SizedBox(height: 28),
              // Status badge
              _buildStatusBadge(app['status'] ?? 'pending'),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ).animate().slideY(begin: 1, end: 0, duration: 300.ms, curve: Curves.easeOut),
    );
  }

  Widget _buildProfileInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 18, color: AppTheme.accentSecondary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    Color c;
    String label;
    IconData icon;
    switch (status.toLowerCase()) {
      case 'accepted':
        c = Colors.greenAccent; label = 'ACCEPTED'; icon = Icons.check_circle_outline; break;
      case 'rejected':
        c = Colors.redAccent; label = 'REJECTED'; icon = Icons.cancel_outlined; break;
      default:
        c = Colors.amber; label = 'PENDING REVIEW'; icon = Icons.hourglass_empty_rounded;
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: c.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.withOpacity(0.3)),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: c, size: 18),
        const SizedBox(width: 8),
        Text(label, style: TextStyle(color: c, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1)),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          Text(widget.project.title.toUpperCase(), style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
          Text('Applications (${_applications.length})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : _applications.isEmpty
                ? _buildEmpty()
                : RefreshIndicator(
                    onRefresh: _fetchApplications,
                    backgroundColor: AppTheme.surfaceColor,
                    color: AppTheme.accentSecondary,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                      itemCount: _applications.length,
                      itemBuilder: (context, index) => _buildApplicationCard(_applications[index], index),
                    ),
                  ),
      ),
    );
  }

  Widget _buildApplicationCard(Map<String, dynamic> app, int index) {
    final profile = app['profiles'] as Map<String, dynamic>?;
    final name = profile?['full_name'] ?? 'Unknown Applicant';
    final dept = profile?['department'] ?? 'N/A';
    final status = (app['status'] ?? 'pending') as String;
    final isAccepted = status.toLowerCase() == 'accepted';
    final isRejected = status.toLowerCase() == 'rejected';
    final initials = name.isNotEmpty ? name[0].toUpperCase() : 'A';

    Color statusColor = isAccepted ? Colors.greenAccent : isRejected ? Colors.redAccent : Colors.amber;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        border: Border.all(color: statusColor.withOpacity(0.2)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Applicant header - tappable to reveal full profile
          GestureDetector(
            onTap: () => _showApplicantProfile(app),
            child: Row(children: [
              CircleAvatar(
                backgroundColor: AppTheme.accentSecondary.withOpacity(0.15),
                child: Text(initials, style: const TextStyle(color: AppTheme.accentSecondary, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(dept, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
                ]),
              ),
              // Tap hint
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(children: [
                  Icon(Icons.person_outline_rounded, size: 12, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  const Text('PROFILE', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                ]),
              ),
            ]),
          ),
          const SizedBox(height: 12),
          // Status chip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ),
          const SizedBox(height: 16),
          // Action buttons
          if (!isAccepted && !isRejected) Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  'REJECT', Icons.close_rounded, Colors.redAccent,
                  () => _updateStatus(app, 'rejected'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionButton(
                  'ACCEPT', Icons.check_rounded, Colors.greenAccent,
                  () => _updateStatus(app, 'accepted'),
                ),
              ),
            ],
          ) else if (isAccepted)
            SizedBox(
              width: double.infinity,
              child: _buildActionButton('VIEW PROFILE', Icons.person_rounded, AppTheme.accentSecondary, () => _showApplicantProfile(app)),
            ),
        ]),
      ),
    ).animate().fadeIn(delay: (index * 80).ms).slideX(begin: 0.05);
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: color, size: 15),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
        ]),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('📂', style: TextStyle(fontSize: 48)),
        const SizedBox(height: 16),
        const Text('No applications yet.', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('When users apply, they\'ll show up here.', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
      ]).animate().fadeIn(),
    );
  }
}
