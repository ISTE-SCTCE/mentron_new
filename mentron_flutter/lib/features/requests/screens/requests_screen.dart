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

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({super.key});

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _pendingNotes = [];
  List<Map<String, dynamic>> _pendingProjects = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchAll();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchAll() async {
    if (mounted) setState(() => _isLoading = true);
    final client = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final notes = await client
          .from('pending_notes')
          .select()
          .order('created_at', ascending: false);
      final projects = await client
          .from('pending_projects')
          .select()
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _pendingNotes = List<Map<String, dynamic>>.from(notes as List);
          _pendingProjects = List<Map<String, dynamic>>.from(projects as List);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ─── Approve Note ────────────────────────────────────────────────────────
  Future<void> _approveNote(Map<String, dynamic> item) async {
    final client = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      // Insert into live notes table
      await client.from('notes').insert({
        'title': item['title'],
        'description': item['description'],
        'department': item['department'],
        'year': item['year'],
        'file_url': item['file_url'],
        'profile_id': item['profile_id'],
      });
      // Delete from pending
      await client.from('pending_notes').delete().eq('id', item['id']);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(backgroundColor: Colors.green, content: Text('✅ Note approved and published!')),
        );
        _fetchAll();
      }
    } catch (e) {
      if (mounted) {
        // Show raw error so we can see exactly what Supabase returns
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 6),
            content: Text('Note error: ${e.toString()}'),
          ),
        );
      }
    }
  }

  // ─── Reject Note ─────────────────────────────────────────────────────────
  Future<void> _rejectNote(String id) async {
    final client = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      await client.from('pending_notes').delete().eq('id', id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(backgroundColor: Colors.redAccent, content: Text('🗑️ Note rejected and removed.')),
        );
        _fetchAll();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorHandler.friendly(e))));
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
        // Show raw error so we can see exactly what Supabase returns
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

  /// Downloads the gzipped note, decompresses it, saves as .pdf and opens it.
  Future<void> _downloadAndOpenNote(Map<String, dynamic> item) async {
    // Show loading dialog
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
            Text('Downloading...', style: TextStyle(color: Colors.white, decoration: TextDecoration.none, fontSize: 14)),
          ],
        ),
      ),
    );

    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false).client;

      // ── Step 1: Extract bucket + file path from any URL format ──
      String bucket = 'notes_bucket';
      String filePath = '';
      final urlPath = item['file_url'] as String;

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

      // ── Step 2: Get a 1-hour signed URL ──
      final signedUrl = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600);

      // ── Step 3: Download the gzipped bytes ──
      final response = await http.get(Uri.parse(signedUrl));
      if (response.statusCode != 200) throw Exception('Download failed (${response.statusCode})');
      final compressedBytes = response.bodyBytes;

      // ── Step 4: Decompress gzip → raw PDF bytes ──
      Uint8List pdfBytes;
      try {
        final decoded = GZipDecoder().decodeBytes(compressedBytes);
        pdfBytes = Uint8List.fromList(decoded);
      } catch (_) {
        // Not gzipped (e.g. old upload or already raw PDF)
        pdfBytes = compressedBytes;
      }

      // ── Step 5: Build a clean .pdf filename ──
      String cleanName = (item['title'] as String)
          .replaceAll(RegExp(r'[^\w\s-]'), '')
          .trim()
          .replaceAll(RegExp(r'\s+'), '_');
      if (cleanName.isEmpty) cleanName = 'note';
      final pdfFileName = '$cleanName.pdf';

      // ── Step 6: Save to temp directory ──
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/$pdfFileName');
      await file.writeAsBytes(pdfBytes);

      // ── Step 7: Dismiss loading, open with device PDF viewer / Drive ──
      if (mounted) Navigator.of(context, rootNavigator: true).pop();

      final result = await OpenFile.open(file.path);
      if (result.type != ResultType.done && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text('Could not open PDF: ${result.message}')),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop(); // dismiss dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalPending = _pendingNotes.length + _pendingProjects.length;

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
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.accentSecondary,
          labelColor: AppTheme.accentSecondary,
          unselectedLabelColor: AppTheme.textMuted,
          labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1),
          tabs: [
            Tab(text: 'NOTES (${_pendingNotes.length})'),
            Tab(text: 'PROJECTS (${_pendingProjects.length})'),
          ],
        ),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildNotesList(),
                  _buildProjectsList(),
                ],
              ),
      ),
    );
  }

  Widget _buildNotesList() {
    if (_pendingNotes.isEmpty) {
      return _buildEmpty('No pending notes', '📝');
    }
    return RefreshIndicator(
      onRefresh: _fetchAll,
      backgroundColor: AppTheme.surfaceColor,
      color: AppTheme.accentSecondary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 160, 20, 40),
        itemCount: _pendingNotes.length,
        itemBuilder: (context, i) => RepaintBoundary(child: _buildNoteCard(_pendingNotes[i], i)),
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
        padding: const EdgeInsets.fromLTRB(20, 160, 20, 40),
        itemCount: _pendingProjects.length,
        itemBuilder: (context, i) => RepaintBoundary(child: _buildProjectCard(_pendingProjects[i], i)),
      ),
    );
  }

  Widget _buildNoteCard(Map<String, dynamic> item, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        border: Border.all(color: AppTheme.accentSecondary.withOpacity(0.2)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header row
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.accentSecondary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${item['department'] ?? '?'} · Year ${item['year'] ?? '?'}',
                style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1),
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.amber.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
              child: const Text('PENDING', style: TextStyle(color: Colors.amber, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ),
          ]),
          const SizedBox(height: 12),
          Text(item['title'] ?? 'Untitled', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
          if (item['description'] != null && (item['description'] as String).isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(item['description'], maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, height: 1.4)),
          ],
          const SizedBox(height: 16),
          // Action buttons
          Row(children: [
            Expanded(
              child: _buildActionBtn('OPEN', Icons.open_in_new_rounded, AppTheme.accentSecondary, () => _downloadAndOpenNote(item)),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildActionBtn('APPROVE', Icons.check_rounded, Colors.greenAccent, () => _approveNote(item)),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildActionBtn('REJECT', Icons.close_rounded, Colors.redAccent, () => _rejectNote(item['id'])),
            ),
          ]),
        ]),
      ),
    ).animate().fadeIn(delay: (index * 80).ms).slideY(begin: 0.1);
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
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.amber.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
              child: const Text('PENDING', style: TextStyle(color: Colors.amber, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ),
          ]),
          const SizedBox(height: 12),
          Text(item['title'] ?? 'Untitled', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
          if (item['description'] != null && (item['description'] as String).isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(item['description'], maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, height: 1.4)),
          ],
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _buildActionBtn('APPROVE', Icons.check_rounded, Colors.greenAccent, () => _approveProject(item))),
            const SizedBox(width: 10),
            Expanded(child: _buildActionBtn('REJECT', Icons.close_rounded, Colors.redAccent, () => _rejectProject(item['id']))),
          ]),
        ]),
      ),
    ).animate().fadeIn(delay: (index * 80).ms).slideY(begin: 0.1);
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
