import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../core/utils/error_handler.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../shared/widgets/pressable_scale.dart';
import '../../../shared/widgets/skeleton_shimmer.dart';
import '../../../services/gate_service.dart';
import '../../notes/screens/note_viewer_screen.dart';

class GateFolderNotesScreen extends StatefulWidget {
  final GateDepartment department;
  final GateFolder folder;

  const GateFolderNotesScreen({
    super.key,
    required this.department,
    required this.folder,
  });

  @override
  State<GateFolderNotesScreen> createState() => _GateFolderNotesScreenState();
}

class _GateFolderNotesScreenState extends State<GateFolderNotesScreen> {
  late GateService _gateService;
  List<GateNote> _notes = [];
  bool _isLoading = true;
  bool _canUpload = false;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    final client = Provider.of<SupabaseService>(context, listen: false).client;
    _gateService = GateService(client);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final supa = Provider.of<SupabaseService>(context, listen: false);
      final userId = supa.currentUser?.id;
      _currentUserId = userId;

      bool canUpload = false;
      if (userId != null) {
        final profile = await supa.client
            .from('profiles')
            .select('role, permissions')
            .eq('id', userId)
            .maybeSingle();

        final role = profile?['role'] as String?;
        final isPrivileged = role == 'exec' || role == 'core' || role == 'admin';

        Map<String, dynamic> perms = {};
        if (profile?['permissions'] is Map) {
          perms = profile!['permissions'] as Map<String, dynamic>;
        }
        canUpload = isPrivileged || perms['can_upload_notes'] == true;
      }

      final notes = await _gateService.fetchNotes(widget.folder.id);

      if (mounted) {
        setState(() {
          _canUpload = canUpload;
          _notes = notes;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))),
        );
      }
    }
  }

  void _showUploadNoteDialog() {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    File? pickedFile;
    String? pickedFileName;
    double progress = 0.0;
    bool isUploading = false;
    String stage = 'idle';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
          title: const Row(
            children: [
              Text('📄 ', style: TextStyle(fontSize: 20)),
              Text(
                'Upload Gate Note',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${widget.department.key} • ${widget.folder.name}',
                  style: const TextStyle(color: Color(0xFF00C6FF), fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 14),

                // File Picker Box
                GestureDetector(
                  onTap: isUploading
                      ? null
                      : () async {
                          final result = await FilePicker.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
                          );
                          if (result != null && result.files.single.path != null) {
                            final file = File(result.files.single.path!);
                            final name = result.files.single.name;
                            setDialogState(() {
                              pickedFile = file;
                              pickedFileName = name;
                              if (titleController.text.trim().isEmpty) {
                                final clean = name.replaceAll(RegExp(r'\.[^/.]+$'), '').replaceAll(RegExp(r'[-_]'), ' ');
                                titleController.text = clean;
                              }
                            });
                          }
                        },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: pickedFile != null
                            ? const Color(0xFF00C6FF)
                            : Colors.white.withValues(alpha: 0.15),
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          pickedFile != null ? Icons.check_circle_rounded : Icons.cloud_upload_outlined,
                          color: pickedFile != null ? const Color(0xFF00C6FF) : const Color(0xFF94A3B8),
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                pickedFileName ?? 'Tap to select PDF/document',
                                style: TextStyle(
                                  color: pickedFile != null ? Colors.white : const Color(0xFF94A3B8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                pickedFile != null ? 'File attached' : 'Supports PDF, DOC, PPT',
                                style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // Note Title
                const Text(
                  'Note Title',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  textCapitalization: TextCapitalization.sentences,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: 'e.g. Module 1 Complete Notes',
                    hintStyle: const TextStyle(color: Color(0xFF475569)),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.05),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 14),

                // Note Description
                const Text(
                  'Description (Optional)',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: descController,
                  maxLines: 2,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    hintText: 'Brief summary of note contents...',
                    hintStyle: const TextStyle(color: Color(0xFF475569)),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.05),
                    contentPadding: const EdgeInsets.all(12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),

                if (isUploading) ...[
                  const SizedBox(height: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            stage == 'preparing'
                                ? 'Authorizing upload...'
                                : stage == 'uploading'
                                    ? 'Uploading document...'
                                    : 'Saving metadata...',
                            style: const TextStyle(color: Color(0xFF00C6FF), fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${(progress * 100).toInt()}%',
                            style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress > 0 ? progress : null,
                          backgroundColor: Colors.white.withValues(alpha: 0.1),
                          valueColor: const AlwaysStoppedAnimation(Color(0xFF00C6FF)),
                          minHeight: 4,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isUploading ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              onPressed: isUploading
                  ? null
                  : () async {
                      if (pickedFile == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please select a file to upload')),
                        );
                        return;
                      }
                      final title = titleController.text.trim();
                      if (title.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter a note title')),
                        );
                        return;
                      }

                      setDialogState(() {
                        isUploading = true;
                        stage = 'preparing';
                        progress = 0.1;
                      });

                      try {
                        setDialogState(() {
                          stage = 'uploading';
                          progress = 0.5;
                        });

                        final created = await _gateService.uploadGateNote(
                          folderId: widget.folder.id,
                          title: title,
                          description: descController.text.trim(),
                          file: pickedFile!,
                          onProgress: (p) => setDialogState(() => progress = p),
                        );

                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                        }
                        if (mounted) {
                          setState(() => _notes.insert(0, created));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: Colors.green,
                              content: Text('Note "$title" uploaded successfully'),
                            ),
                          );
                        }
                      } catch (e) {
                        setDialogState(() => isUploading = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))),
                          );
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C6FF),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: isUploading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('UPLOAD', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteNote(GateNote note) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        title: const Text('Delete Note?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete "${note.title}"? This cannot be undone.',
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('DELETE', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _gateService.deleteNote(note.id);
        setState(() => _notes.removeWhere((n) => n.id == note.id));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(backgroundColor: Colors.green, content: Text('Deleted note "${note.title}"')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))),
          );
        }
      }
    }
  }

  void _openNote(GateNote note) {
    Navigator.push(
      context,
      AppTransitions.slideUp(
        NoteViewerScreen(
          url: note.fileUrl,
          title: note.title,
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          children: [
            Text(
              '${widget.department.key} / ${widget.folder.name}'.toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF00C6FF),
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const Text(
              'Subject Notes',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
            ),
          ],
        ),
        actions: [
          if (_canUpload)
            IconButton(
              icon: const Icon(Icons.upload_file_rounded, color: Color(0xFF00C6FF)),
              tooltip: 'Upload Note',
              onPressed: _showUploadNoteDialog,
            ),
        ],
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const _NotesSkeletonList()
            : RefreshIndicator(
                onRefresh: _loadData,
                color: const Color(0xFF00C6FF),
                backgroundColor: const Color(0xFF0F172A),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 110, 20, 40),
                  children: [
                    // ── Header Summary ──
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${_notes.length} NOTE${_notes.length == 1 ? '' : 'S'} IN FOLDER',
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                          ),
                        ),
                        if (_canUpload)
                          GestureDetector(
                            onTap: _showUploadNoteDialog,
                            child: const Row(
                              children: [
                                Icon(Icons.add_rounded, size: 14, color: Color(0xFF00C6FF)),
                                SizedBox(width: 4),
                                Text(
                                  'Upload Note',
                                  style: TextStyle(
                                    color: Color(0xFF00C6FF),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // ── Notes List ──
                    if (_notes.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 48),
                          child: Column(
                            children: [
                              const Text('📭', style: TextStyle(fontSize: 36)),
                              const SizedBox(height: 12),
                              const Text(
                                'No notes uploaded in this folder yet.',
                                style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold),
                              ),
                              if (_canUpload) ...[
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: _showUploadNoteDialog,
                                  icon: const Icon(Icons.cloud_upload_outlined, size: 16),
                                  label: const Text('Upload First Note'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF00C6FF).withValues(alpha: 0.15),
                                    foregroundColor: const Color(0xFF00C6FF),
                                    side: const BorderSide(color: Color(0xFF00C6FF)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      )
                    else
                      ..._notes.asMap().entries.map((entry) {
                        final index = entry.key;
                        final note = entry.value;
                        final bool canDelete = _canUpload &&
                            (note.profileId == _currentUserId || _currentUserId != null);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: _buildNoteCard(note, index, canDelete),
                        );
                      }),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildNoteCard(GateNote note, int index, bool canDelete) {
    final dateStr = note.createdAt != null
        ? DateFormat('MMM d, y').format(note.createdAt!)
        : 'Recent';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF00C6FF).withValues(alpha: 0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFF00C6FF).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Icon(Icons.description_outlined, color: Color(0xFF00C6FF), size: 22),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      note.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.2,
                      ),
                    ),
                    if (note.description != null && note.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        note.description!,
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              if (canDelete)
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                  onPressed: () => _deleteNote(note),
                  tooltip: 'Delete Note',
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'UPLOADED BY',
                    style: TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    '${note.uploaderName ?? 'Student'} • $dateStr',
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              PressableScale(
                onTap: () => _openNote(note),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00C6FF).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFF00C6FF).withValues(alpha: 0.35),
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.open_in_new_rounded, color: Color(0xFF00C6FF), size: 14),
                      SizedBox(width: 6),
                      Text(
                        'OPEN',
                        style: TextStyle(
                          color: Color(0xFF00C6FF),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate(delay: (index * 35).ms).fadeIn(duration: 240.ms).slideY(begin: 0.04);
  }
}

class _NotesSkeletonList extends StatelessWidget {
  const _NotesSkeletonList();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 110, 20, 40),
      children: [
        const SkeletonBox(height: 30, borderRadius: 8, margin: EdgeInsets.only(bottom: 20)),
        ...List.generate(
          3,
          (i) => const SkeletonBox(
            height: 120,
            borderRadius: 20,
            margin: EdgeInsets.only(bottom: 14),
          ),
        ),
      ],
    );
  }
}
