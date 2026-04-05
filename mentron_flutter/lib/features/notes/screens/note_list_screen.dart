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
import '../../../data/models/note_model.dart';

class NoteListScreen extends StatefulWidget {
  final String deptCode;
  final String year;
  const NoteListScreen({super.key, required this.deptCode, required this.year});

  @override
  State<NoteListScreen> createState() => _NoteListScreenState();
}

class _NoteListScreenState extends State<NoteListScreen> {
  List<Note> _notes = [];
  bool _isLoading = true;
  String? _currentUserId;
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _loadUserAndNotes();
  }

  Future<void> _loadUserAndNotes() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    _currentUserId = supabase.currentUser?.id;
    
    // Fetch current user's role from profiles
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
    
    await _fetchNotes();
    _setupRealtime();
  }

  Future<void> _fetchNotes() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      // Fetch ALL notes for this department first (avoid type mismatch on year column)
      final response = await supabase
          .from('notes')
          .select('*, profiles!notes_created_by_fkey(full_name)')
          .eq('department', widget.deptCode)
          .order('created_at', ascending: false);

      final allNotes = (response as List).map((json) => Note.fromJson(json)).toList();

      // Filter by year client-side
      final filtered = allNotes.where((n) => n.year == widget.year).toList();

      if (mounted) {
        setState(() {
          _notes = filtered;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching notes: $e'); // ADDED THIS
      if (mounted) setState(() { _notes = []; _isLoading = false; });
    }
  }

  void _setupRealtime() {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    supabase.subscribeToTable(table: 'notes', onUpdate: (_) => _fetchNotes());
  }

  bool _canDelete(Note note) {
    if (_currentUserId == null) return false;
    // Allow if uploader OR if user is exec/panel
    return note.profileId == _currentUserId || _currentUserRole == 'exec' || _currentUserRole == 'panel';
  }

  Future<void> _deleteNote(Note note) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Note?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete "${note.title}"? This cannot be undone.',
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('DELETE', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final supabase = Provider.of<SupabaseService>(context, listen: false);
    try {
      // Delete from database
      await supabase.client.from('notes').delete().eq('id', note.id);
      
      // Try to delete the file from storage too
      if (note.fileUrl.contains('notes_bucket')) {
        final filePath = note.fileUrl.split('notes_bucket/').last;
        await supabase.client.storage.from('notes_bucket').remove([filePath]);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(backgroundColor: Colors.green, content: Text('Note deleted successfully')),
        );
        setState(() => _notes.removeWhere((n) => n.id == note.id));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))),
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
        title: Column(
          children: [
            Text(widget.deptCode, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 2)),
            Text('Year ${widget.year}', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
          : _notes.isEmpty
            ? _buildEmptyState()
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                itemCount: _notes.length,
                itemBuilder: (context, index) {
                  return RepaintBoundary(child: _buildNoteCard(_notes[index], index));
                },
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🔭', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 16),
          const Text('No notes found here yet.', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('Be the first to contribute!', style: TextStyle(color: AppTheme.textMuted.withOpacity(0.5), fontSize: 10)),
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _buildNoteCard(Note note, int index) {
    final canDelete = _canDelete(note);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.description_outlined, color: AppTheme.accentSecondary, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    note.title,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                ),
                // Delete button — only shown if user has permission
                if (canDelete)
                  IconButton(
                    onPressed: () => _deleteNote(note),
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                    tooltip: 'Delete Note',
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              note.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('UPLOADED BY', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    Text(note.uploaderName ?? 'Student', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
                // Open file button
                GestureDetector(
                  onTap: () => _downloadAndOpenNote(note),
                  child: GlassContainer(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    borderRadius: 14,
                    child: const Row(
                      children: [
                        Icon(Icons.open_in_new_rounded, color: AppTheme.accentSecondary, size: 16),
                        SizedBox(width: 8),
                        Text('OPEN', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: (index * 80).ms).slideY(begin: 0.05);
  }

  /// Downloads the gzipped note, decompresses it, saves as .pdf and opens it.
  Future<void> _downloadAndOpenNote(Note note) async {
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
      final urlPath = note.fileUrl;

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
      String cleanName = note.title
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
      if (mounted) {
        final nav = Navigator.of(context, rootNavigator: true);
        if (nav.canPop()) nav.pop();
      }

      final result = await OpenFile.open(file.path);
      if (result.type != ResultType.done && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text('Could not open PDF: ${result.message}')),
        );
      }
    } catch (e) {
      if (mounted) {
        final nav = Navigator.of(context, rootNavigator: true);
        if (nav.canPop()) nav.pop(); // dismiss dialog safely
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text(e.toString())),
        );
      }
    }
  }
}
