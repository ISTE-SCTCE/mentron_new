import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:http/http.dart' as http;
import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';
import 'package:archive/archive.dart';
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
  List<ProjectApplication> _applications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchApplications();
  }

  Future<void> _fetchApplications() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('project_applications')
          .select('*, profiles!project_applications_profile_id_fkey(full_name)')
          .eq('project_id', widget.project.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _applications = (response as List).map((json) => ProjectApplication.fromJson(json)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(ProjectApplication app, String status) async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      await supabase
          .from('project_applications')
          .update({'status': status})
          .eq('id', app.id);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.green, content: Text('Application $status!')),
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

  Future<void> _downloadAndOpenCV(ProjectApplication app) async {
    // Reusing the robust download/decompress logic from NoteListScreen
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppTheme.accentSecondary),
            SizedBox(height: 16),
            Text('Downloading CV...', style: TextStyle(color: Colors.white, decoration: TextDecoration.none, fontSize: 14)),
          ],
        ),
      ),
    );

    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false).client;
      String bucket = 'cv_bucket';
      String filePath = '';
      final urlPath = app.cvUrl;

      // Extract path
      if (urlPath.startsWith('/api/files/')) {
        final rest = urlPath.replaceFirst('/api/files/', '');
        final idx = rest.indexOf('/');
        if (idx != -1) { bucket = rest.substring(0, idx); filePath = rest.substring(idx + 1); }
      } else if (urlPath.contains('/storage/v1/object/')) {
        for (final pat in ['/object/public/', '/object/sign/']) {
          if (urlPath.contains(pat)) {
            final rest = urlPath.split(pat).last;
            final idx = rest.indexOf('/');
            if (idx != -1) { bucket = rest.substring(0, idx); filePath = rest.substring(idx + 1).split('?').first; }
            break;
          }
        }
      }

      if (filePath.isEmpty) throw Exception('Cannot determine file path from URL');

      final signedUrl = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600);
      final response = await http.get(Uri.parse(signedUrl));
      if (response.statusCode != 200) throw Exception('Download failed (${response.statusCode})');
      
      final compressedBytes = response.bodyBytes;
      Uint8List pdfBytes;
      try {
        final decoded = GZipDecoder().decodeBytes(compressedBytes);
        pdfBytes = Uint8List.fromList(decoded);
      } catch (_) {
        pdfBytes = compressedBytes;
      }

      final fileName = 'CV_${app.applicantName?.replaceAll(' ', '_') ?? 'Applicant'}.pdf';
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/$fileName');
      await file.writeAsBytes(pdfBytes);

      if (mounted) Navigator.of(context, rootNavigator: true).pop();

      final result = await OpenFile.open(file.path);
      if (result.type != ResultType.done && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text('Could not open CV: ${result.message}')),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text(e.toString())),
        );
      }
    }
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
          const Text('Applications', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
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
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                    itemCount: _applications.length,
                    itemBuilder: (context, index) => _buildApplicationCard(_applications[index], index),
                  ),
      ),
    );
  }

  Widget _buildApplicationCard(ProjectApplication app, int index) {
    final isAccepted = app.status.toLowerCase() == 'accepted';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            CircleAvatar(
              backgroundColor: AppTheme.accentSecondary.withOpacity(0.1),
              child: Text(app.applicantName?.substring(0, 1).toUpperCase() ?? 'A', style: const TextStyle(color: AppTheme.accentSecondary, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(app.applicantName ?? 'Unknown Applicant', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                Text(app.status.toUpperCase(), style: TextStyle(color: isAccepted ? Colors.greenAccent : Colors.amber, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ]),
            ),
          ]),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _downloadAndOpenCV(app),
                icon: const Icon(Icons.description_outlined, size: 16),
                label: const Text('VIEW CV'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white.withOpacity(0.05),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            if (!isAccepted) ...[
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _updateStatus(app, 'accepted'),
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: const Text('ACCEPT'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.greenAccent.withOpacity(0.1),
                    foregroundColor: Colors.greenAccent,
                    side: const BorderSide(color: Colors.greenAccent),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ]),
        ]),
      ),
    ).animate().fadeIn(delay: (index * 80).ms).slideX(begin: 0.05);
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('📂', style: TextStyle(fontSize: 48)),
        const SizedBox(height: 16),
        const Text('No applications yet.', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
      ]).animate().fadeIn(),
    );
  }
}
