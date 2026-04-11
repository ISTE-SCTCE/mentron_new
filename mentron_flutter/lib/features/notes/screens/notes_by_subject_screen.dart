import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';
import 'package:archive/archive.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../data/models/note_model.dart';
import 'add_note_screen.dart';
import '../../../core/utils/app_transitions.dart';

class NotesBySubjectScreen extends StatefulWidget {
  final String subjectName;
  final Color color;
  final String? year;
  final String? semester;
  final String? dept;

  const NotesBySubjectScreen({
    super.key,
    required this.subjectName,
    required this.color,
    this.year,
    this.semester,
    this.dept,
  });

  @override
  State<NotesBySubjectScreen> createState() => _NotesBySubjectScreenState();
}

class _NotesBySubjectScreenState extends State<NotesBySubjectScreen> {
  List<Note> _notes = [];
  bool _isLoading = true;
  String? _currentUserIsteId;
  String? _currentUserId;
  String? _currentUserRole;
  bool _isLeadership = false;
  Map<String, bool> _permissions = {};

  @override
  void initState() {
    super.initState();
    _loadNotesAndPermissions();
  }

  Future<void> _loadNotesAndPermissions() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    _currentUserId = supabase.currentUser?.id;
    _isLeadership = await supabase.isLeadershipPosition();
    _permissions = await supabase.getPermissions();

    if (_currentUserId != null) {
      try {
        final profile = await supabase.client
            .from('profiles')
            .select('role, iste_id')
            .eq('id', _currentUserId!)
            .maybeSingle();
        if (mounted && profile != null) {
          setState(() {
            _currentUserRole = profile['role'];
            _currentUserIsteId = profile['iste_id'];
          });
        }
      } catch (_) {}
    }

    // Filter by exact subject + department + year + semester if provided
    try {
      final supabaseClient = supabase.client;
      var query = supabaseClient
          .from('notes')
          .select('*, profiles!notes_created_by_fkey(full_name)')
          .eq('subject', widget.subjectName);

      if (widget.dept != null && widget.dept!.isNotEmpty) {
        query = query.eq('department', widget.dept!);
      }
      if (widget.year != null && widget.year!.isNotEmpty) {
        query = query.eq('year', int.tryParse(widget.year!) ?? 1);
      }
      if (widget.semester != null && widget.semester!.isNotEmpty) {
        query = query.eq('semester', widget.semester!);
      }

      final response = await query.order('created_at', ascending: false);
      final notes = (response as List).map((j) => Note.fromJson(j)).toList();
      if (mounted) setState(() { _notes = notes; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  bool _canDelete(Note note) =>
      note.profileId == _currentUserId || _currentUserRole == 'exec' || _currentUserRole == 'core';

  Future<void> _deleteNote(Note note) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Note?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('Delete "${note.title}"?', style: const TextStyle(color: AppTheme.textMuted, fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('DELETE', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirm != true) return;
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    await supabase.client.from('notes').delete().eq('id', note.id);
    setState(() => _notes.removeWhere((n) => n.id == note.id));
  }

  Future<void> _openNote(Note note) async {
    if (!mounted) return;

    // 1. Check if user already has a valid ISTE ID or is admin
    bool isAuthorized = (_currentUserRole == 'exec' || _currentUserRole == 'core' || _currentUserIsteId != null);

    if (!isAuthorized) {
      final String? enteredId = await showDialog<String>(
        context: context,
        barrierDismissible: true,
        builder: (ctx) {
          final controller = TextEditingController();
          bool isValidating = false;
          return StatefulBuilder(
            builder: (ctx, setDialogState) {
              return AlertDialog(
                backgroundColor: AppTheme.surfaceColor,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                title: const Text('ISTE Membership Required', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'This resource is exclusive to ISTE members. Please provide your ISTE Membership ID to access it.',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      child: TextField(
                        controller: controller,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: const InputDecoration(
                          hintText: 'Enter ISTE ID',
                          hintStyle: TextStyle(color: Colors.white38),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ],
                ),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
                  ElevatedButton(
                    onPressed: isValidating ? null : () async {
                      final id = controller.text.trim();
                      if (id.isEmpty) return;
                      
                      setDialogState(() => isValidating = true);
                      try {
                        final supabase = Provider.of<SupabaseService>(context, listen: false);
                        // Cross-project validation via FDW
                        final member = await supabase.client
                            .from('project_a.members')
                            .select('ui_id')
                            .eq('ui_id', id)
                            .maybeSingle();

                        if (member != null) {
                          // Success! Save ID to profile
                          await supabase.client
                              .from('profiles')
                              .update({'iste_id': id})
                              .eq('id', _currentUserId!);
                          
                          if (mounted) {
                            setState(() => _currentUserIsteId = id);
                            Navigator.pop(ctx, id);
                          }
                        } else {
                          if (mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(backgroundColor: Colors.redAccent, content: Text('Invalid ISTE ID. Please check and try again.')),
                            );
                          }
                        }
                      } catch (e) {
                         if (mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString())));
                      } finally {
                        if (mounted) setDialogState(() => isValidating = false);
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentSecondary, foregroundColor: Colors.black),
                    child: isValidating 
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : const Text('VERIFY', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              );
            }
          );
        },
      );

      if (enteredId == null) return; // User cancelled
    }

    // Now proceed with normal download logic
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(color: AppTheme.accentSecondary),
          SizedBox(height: 16),
          Text('Downloading...', style: TextStyle(color: Colors.white, decoration: TextDecoration.none, fontSize: 14)),
        ],
      )),
    );
    try {
      final supabaseClient = Provider.of<SupabaseService>(context, listen: false).client;
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
      if (filePath.isEmpty) throw Exception('Cannot determine file path');
      
      // Determine extension from filePath
      final ext = filePath.split('.').last.toLowerCase();
      final hasExtension = filePath.contains('.');

      final signedUrl = await supabaseClient.storage.from(bucket).createSignedUrl(filePath, 3600);
      final response = await http.get(Uri.parse(signedUrl));
      if (response.statusCode != 200) throw Exception('Download failed');
      
      Uint8List fileBytes;
      try { 
        fileBytes = Uint8List.fromList(GZipDecoder().decodeBytes(response.bodyBytes)); 
      } catch (_) { 
        fileBytes = response.bodyBytes; 
      }

      String cleanName = note.title.replaceAll(RegExp(r'[^\w\s-]'), '').trim().replaceAll(RegExp(r'\s+'), '_');
      if (cleanName.isEmpty) cleanName = 'note';
      
      final fileName = hasExtension ? '$cleanName.$ext' : '$cleanName.pdf';

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/$fileName');
      await file.writeAsBytes(fileBytes);
      
      if (mounted) {
        final nav = Navigator.of(context, rootNavigator: true);
        if (nav.canPop()) nav.pop();
      }
      await OpenFile.open(file.path);

    } catch (e) {
      if (mounted) {
        final nav = Navigator.of(context, rootNavigator: true);
        if (nav.canPop()) nav.pop();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.red, content: Text(e.toString())));
      }
    }
  }

  Widget _buildFolderCard({
    required BuildContext context,
    required String emoji,
    required String title,
    required String subtitle,
    required String type,
  }) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          AppTransitions.slideRight(
            NotesBySubjectScreen(
              subjectName: '$type${widget.subjectName}',
              color: widget.color,
              year: widget.year,
              semester: widget.semester,
              dept: widget.dept,
            ),
          ),
        );
      },
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
                  Text(subtitle, style: const TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1, overflow: TextOverflow.ellipsis)),
                ],
              ),
            ),
          ],
        ),
      ),
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
          Text('SUBJECT NOTES', style: TextStyle(color: widget.color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          Text(
            widget.subjectName.length > 30 ? '${widget.subjectName.substring(0, 28)}…' : widget.subjectName,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900),
          ),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isLeadership || _permissions['can_upload_notes'] == true)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: TextButton.icon(
                onPressed: () => Navigator.push(context, AppTransitions.slideUp(const AddNoteScreen())),
                icon: Icon(Icons.add_rounded, color: widget.color, size: 18),
                label: Text('Add', style: TextStyle(color: widget.color, fontWeight: FontWeight.w900, fontSize: 11)),
              ),
            ),
        ],
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : Column(
                children: [
                  // Subject header card
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 110, 24, 0),
                    child: GlassContainer(
                      padding: const EdgeInsets.all(20),
                      border: Border.all(color: widget.color.withValues(alpha: 0.3)),
                      child: Row(children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(color: widget.color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                          child: Icon(Icons.menu_book_rounded, color: widget.color, size: 22),
                        ),
                        const SizedBox(width: 14),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(widget.subjectName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14, height: 1.3)),
                          const SizedBox(height: 4),
                          Text('${_notes.length} note${_notes.length == 1 ? '' : 's'} found', style: TextStyle(color: widget.color.withValues(alpha: 0.7), fontSize: 11)),
                        ])),
                      ]),
                    ).animate().fadeIn(),
                  ),
                  const SizedBox(height: 16),
                  
                  // Virtual Folders
                  if (!widget.subjectName.startsWith('PYQ - ') && !widget.subjectName.startsWith('Video - '))
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Row(
                        children: [
                          Expanded(
                            child: _buildFolderCard(
                              context: context,
                              emoji: '📂',
                              title: 'PYQs',
                              subtitle: 'Past Year',
                              type: 'PYQ - ',
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildFolderCard(
                              context: context,
                              emoji: '🎬',
                              title: 'Videos',
                              subtitle: 'Lectures',
                              type: 'Video - ',
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),
                  
                  // Notes list
                  Expanded(
                    child: _notes.isEmpty
                        ? Center(
                            child: Column(mainAxisSize: MainAxisSize.min, children: [
                              const Text('📭', style: TextStyle(fontSize: 40)),
                              const SizedBox(height: 12),
                              const Text('No notes for this subject yet', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              if (_isLeadership || _permissions['can_upload_notes'] == true)
                                TextButton(
                                  onPressed: () => Navigator.push(context, AppTransitions.slideUp(const AddNoteScreen())),
                                  child: Text('Be the first to contribute →', style: TextStyle(color: widget.color, fontWeight: FontWeight.bold)),
                                ),
                            ]),
                          ).animate().fadeIn()
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
                            itemCount: _notes.length,
                            itemBuilder: (ctx, i) {
                              final note = _notes[i];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 14),
                                child: GlassContainer(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Row(children: [
                                      Icon(Icons.description_outlined, color: widget.color, size: 18),
                                      const SizedBox(width: 10),
                                      Expanded(child: Text(note.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16))),
                                      if (_canDelete(note))
                                        IconButton(
                                          onPressed: () => _deleteNote(note),
                                          icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                                        ),
                                    ]),
                                    const SizedBox(height: 8),
                                    Text(note.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, height: 1.4)),
                                    const SizedBox(height: 16),
                                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                        const Text('UPLOADED BY', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
                                        Text(note.uploaderName ?? 'Student', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                      ]),
                                      GestureDetector(
                                        onTap: () => _openNote(note),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                          decoration: BoxDecoration(
                                            color: widget.color.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: widget.color.withValues(alpha: 0.3)),
                                          ),
                                          child: Row(children: [
                                            Icon(Icons.open_in_new_rounded, color: widget.color, size: 14),
                                            const SizedBox(width: 6),
                                            Text('OPEN', style: TextStyle(color: widget.color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                                          ]),
                                        ),
                                      ),
                                    ]),
                                  ]),
                                ).animate().fadeIn(delay: (i * 60).ms).slideY(begin: 0.04),
                              );
                            },
                          ),
                  ),
                ],
              ),
      ),
    );
  }
}
