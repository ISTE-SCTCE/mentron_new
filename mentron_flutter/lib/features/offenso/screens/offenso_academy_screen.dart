import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../screens/video_player_screen.dart';
import '../../../services/offline_storage_service.dart';
import '../../../widgets/download_progress_widget.dart';
import '../../notes/screens/note_viewer_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// OFFENSO ACADEMY — Main Screen (entry point)
// Dark cyberpunk minimalism. Serves as the shell for the full academy module.
// ─────────────────────────────────────────────────────────────────────────────

class OffensoAcademyScreen extends StatefulWidget {
  const OffensoAcademyScreen({super.key});

  @override
  State<OffensoAcademyScreen> createState() => _OffensoAcademyScreenState();
}

class _OffensoAcademyScreenState extends State<OffensoAcademyScreen> {
  // ── Brand palette ────────────────────────────────────────────────────────
  static const Color _neonGreen       = Color(0xFF00FF41);
  static const Color _surfaceDark     = Color(0xFF0A0E27);
  static const Color _surfaceMid      = Color(0xFF1A1F3A);
  static const Color _surfaceElevated = Color(0xFF252D4A);
  static const Color _textPrimary     = Color(0xFFF0F0F0);
  static const Color _textSecondary   = Color(0xFFA0A0A0);
  static const Color _border          = Color(0xFF2A3A5A);

  bool _isLoading = true;
  bool _isExec = false;
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _folders = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final user = supabase.currentUser;
    if (user != null) {
      try {
        final profileRes = await supabase.client
            .from('profiles')
            .select('role, full_name, xp')
            .eq('id', user.id)
            .maybeSingle();
        if (mounted && profileRes != null) {
          final role = profileRes['role'] as String? ?? 'member';
          setState(() {
            _profile = profileRes;
            _isExec = role == 'exec' || role == 'core' || role == 'admin';
          });
        }
      } catch (_) {}
    }
    await _fetchFolders();
  }

  Future<void> _fetchFolders() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      // Fetch folders and count of lectures
      final response = await supabase
          .from('academy_folders')
          .select('*, academy_lectures(count)')
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _folders = List<Map<String, dynamic>>.from(response);
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showCreateFolderDialog() async {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    bool isSaving = false;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: _surfaceMid,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: _border),
            ),
            title: const Text(
              'Create Folder',
              style: TextStyle(
                color: _textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  style: const TextStyle(color: _textPrimary),
                  decoration: const InputDecoration(
                    labelText: 'Folder Name',
                    labelStyle: TextStyle(color: _textSecondary),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: _border),
                    ),
                    focusedBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: _neonGreen),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descController,
                  style: const TextStyle(color: _textPrimary),
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    labelStyle: TextStyle(color: _textSecondary),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: _border),
                    ),
                    focusedBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: _neonGreen),
                    ),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: isSaving ? null : () => Navigator.pop(context),
                child: const Text(
                  'CANCEL',
                  style: TextStyle(color: _textSecondary),
                ),
              ),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        final name = nameController.text.trim();
                        if (name.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Name is required')),
                          );
                          return;
                        }

                        setDialogState(() => isSaving = true);
                        try {
                          final supabase = Provider.of<SupabaseService>(
                            context,
                            listen: false,
                          );
                          await supabase.client.from('academy_folders').insert({
                            'name': name,
                            'description': descController.text.trim(),
                            'created_by': supabase.currentUser?.id,
                          });
                          _fetchFolders();
                          if (context.mounted) Navigator.pop(context);
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                        } finally {
                          setDialogState(() => isSaving = false);
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _neonGreen,
                  foregroundColor: _surfaceDark,
                ),
                child: isSaving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: _surfaceDark,
                        ),
                      )
                    : const Text(
                        'CREATE',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _deleteFolder(String folderId, String folderName) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _surfaceMid,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: _border),
        ),
        title: const Text('Delete Folder?', style: TextStyle(color: _textPrimary)),
        content: Text(
          'Are you sure you want to delete "$folderName" and all its lectures?',
          style: const TextStyle(color: _textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL', style: TextStyle(color: _textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('DELETE', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      await supabase.from('academy_folders').delete().eq('id', folderId);
      _fetchFolders();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Folder deleted')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _surfaceDark,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── Sticky header bar ─────────────────────────────────────────
            SliverPersistentHeader(
              pinned: true,
              delegate: _StickyHeaderDelegate(
                minHeight: 56,
                maxHeight: 56,
                child: _buildHeader(),
              ),
            ),

            // ── Status card (profile / level / XP) ───────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: _buildStatusCard(),
              ).animate().fadeIn(delay: 50.ms).slideY(begin: 0.06, curve: Curves.easeOut),
            ),

            // ── Section: All Folders ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: _sectionLabel(
                  'ALL FOLDERS',
                  count: _folders.length,
                  action: _isExec
                      ? GestureDetector(
                          onTap: _showCreateFolderDialog,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: _neonGreen.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: _neonGreen),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.add, color: _neonGreen, size: 12),
                                SizedBox(width: 4),
                                Text(
                                  'ADD FOLDER',
                                  style: TextStyle(
                                    color: _neonGreen,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      : null,
                ),
              ).animate().fadeIn(delay: 100.ms),
            ),

            // ── Folder list ───────────────────────────────────────────────
            if (_isLoading)
              const SliverToBoxAdapter(
                child: Center(
                  child: Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: CircularProgressIndicator(color: _neonGreen),
                  ),
                ),
              )
            else if (_folders.isEmpty)
              SliverToBoxAdapter(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 60),
                    child: Column(
                      children: [
                        const Icon(Icons.folder_open_outlined,
                            size: 48, color: _textSecondary),
                        const SizedBox(height: 12),
                        const Text(
                          'No folders created yet',
                          style: TextStyle(
                            color: _textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (_isExec) ...[
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: _showCreateFolderDialog,
                            child: const Text('Add your first folder',
                                style: TextStyle(color: _neonGreen)),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    child: _buildFolderCard(_folders[i], i),
                  )
                      .animate()
                      .fadeIn(delay: (100 + i * 50).ms)
                      .slideY(begin: 0.06, curve: Curves.easeOut),
                  childCount: _folders.length,
                ),
              ),

            const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
          ],
        ),
      ),
    );
  }

  // ── Header ────────────────────────────────────────────────────────────────

  Widget _buildHeader() {
    return Container(
      color: _surfaceDark,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _surfaceMid,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _border),
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: _neonGreen,
                size: 16,
              ),
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Text(
              'OFFENSO ACADEMY',
              style: TextStyle(
                color: _textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Status card ────────────────────────────────────────────────────────────

  Widget _buildStatusCard() {
    final name = _profile?['full_name']?.toString() ?? 'Student';
    final role = _profile?['role']?.toString().toUpperCase() ?? 'MEMBER';
    final xp = int.tryParse(_profile?['xp']?.toString() ?? '0') ?? 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_surfaceMid, _surfaceElevated],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _neonGreen.withOpacity(0.25),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: _neonGreen.withOpacity(0.05),
            blurRadius: 20,
            spreadRadius: 4,
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [_neonGreen, Color(0xFF00CC35)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Center(
              child: Text(
                '⚡',
                style: TextStyle(fontSize: 20),
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Name + level badge
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Level/Position badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _neonGreen,
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: Text(
                    role,
                    style: const TextStyle(
                      color: _surfaceDark,
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  name,
                  style: const TextStyle(
                    color: _textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Text(
                  'Begin your hacking journey',
                  style: TextStyle(
                    color: _textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Circular XP ring
          _CircularXpRing(
            progress: (xp % 1000) / 1000.0,
            xp: xp,
            maxXp: 1000,
          ),
        ],
      ),
    );
  }

  // ── Folder card ───────────────────────────────────────────────────────

  Widget _buildFolderCard(Map<String, dynamic> folder, int index) {
    // Count is nested inside academy_lectures list
    final lecturesRelation = folder['academy_lectures'] as List?;
    final count = lecturesRelation != null && lecturesRelation.isNotEmpty
        ? (lecturesRelation.first['count'] ?? 0)
        : 0;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        AppTransitions.slideUp(AcademyFolderDetailScreen(
          folderId: folder['id'],
          folderName: folder['name'],
          folderDescription: folder['description'] ?? 'No description',
          isExec: _isExec,
        )),
      ).then((_) => _fetchFolders()),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _surfaceMid,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: _border, width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _neonGreen.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _neonGreen.withOpacity(0.25),
                ),
              ),
              child: const Icon(Icons.folder_open_rounded, color: _neonGreen, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    folder['name'] ?? 'Unnamed Folder',
                    style: const TextStyle(
                      color: _textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    folder['description'] ?? 'No description.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: _textSecondary,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$count Material${count == 1 ? '' : 's'}',
                    style: const TextStyle(
                      color: _neonGreen,
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            if (_isExec) ...[
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded,
                    color: Colors.redAccent, size: 20),
                onPressed: () => _deleteFolder(folder['id'], folder['name']),
              ),
            ],
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: _textSecondary,
              size: 12,
            ),
          ],
        ),
      ),
    );
  }



  Widget _sectionLabel(String label, {int? count, Widget? action}) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 14,
          decoration: BoxDecoration(
            color: _neonGreen,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            color: _textSecondary,
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 2.5,
          ),
        ),
        if (count != null) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: _neonGreen.withOpacity(0.12),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: _neonGreen.withOpacity(0.35)),
            ),
            child: Text(
              '$count',
              style: const TextStyle(
                color: _neonGreen,
                fontSize: 9,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
        const Spacer(),
        if (action != null) action,
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMY FOLDER DETAIL SCREEN
// ─────────────────────────────────────────────────────────────────────────────

class AcademyFolderDetailScreen extends StatefulWidget {
  final String folderId;
  final String folderName;
  final String folderDescription;
  final bool isExec;

  const AcademyFolderDetailScreen({
    super.key,
    required this.folderId,
    required this.folderName,
    required this.folderDescription,
    required this.isExec,
  });

  @override
  State<AcademyFolderDetailScreen> createState() => _AcademyFolderDetailScreenState();
}

class _AcademyFolderDetailScreenState extends State<AcademyFolderDetailScreen> {
  static const Color _neonGreen       = Color(0xFF00FF41);
  static const Color _surfaceDark     = Color(0xFF0A0E27);
  static const Color _surfaceMid      = Color(0xFF1A1F3A);
  static const Color _textPrimary     = Color(0xFFF0F0F0);
  static const Color _textSecondary   = Color(0xFFA0A0A0);
  static const Color _border          = Color(0xFF2A3A5A);

  List<Map<String, dynamic>> _lectures = [];
  bool _isLoading = true;
  bool _isUploading = false;

  // ── Offline download state ──────────────────────────────────────────────
  final _offlineService = OfflineStorageService();
  final Map<String, double> _downloadProgress = {};
  final Map<String, bool> _isDownloading = {};
  final Set<String> _downloaded = {};

  @override
  void initState() {
    super.initState();
    _fetchLectures();
    _initOffline();
  }

  Future<void> _initOffline() async {
    await _offlineService.initializeStorage();
    final existing = _offlineService.getDownloadedContent();
    if (mounted) {
      setState(() {
        _downloaded.clear();
        _downloaded.addAll(existing.map((e) => e.id));
      });
    }
  }

  Future<void> _fetchLectures() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('academy_lectures')
          .select('*')
          .eq('folder_id', widget.folderId)
          .order('created_at', ascending: true);
      if (mounted) {
        setState(() {
          _lectures = List<Map<String, dynamic>>.from(response);
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickAndUploadLecture() async {
    final result = await FilePicker.pickFiles(
      type: FileType.video,
      allowMultiple: false,
    );
    if (result == null || result.files.single.path == null || !mounted) return;

    final titleController = TextEditingController();
    final descController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: _surfaceMid,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: _border),
        ),
        title: const Text('New Video Lecture', style: TextStyle(color: _textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              style: const TextStyle(color: _textPrimary),
              decoration: const InputDecoration(
                labelText: 'Title',
                labelStyle: TextStyle(color: _textSecondary),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _border)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _neonGreen)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              style: const TextStyle(color: _textPrimary),
              decoration: const InputDecoration(
                labelText: 'Description',
                labelStyle: TextStyle(color: _textSecondary),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _border)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _neonGreen)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL', style: TextStyle(color: _textSecondary)),
          ),
          TextButton(
            onPressed: () {
              if (titleController.text.trim().isEmpty) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text('Title is required')),
                );
                return;
              }
              Navigator.pop(ctx, true);
            },
            child: const Text('UPLOAD', style: TextStyle(color: _neonGreen, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isUploading = true;
    });

    try {
      final file = File(result.files.single.path!);
      final bytes = await file.readAsBytes();
      final extension = result.files.single.extension ?? 'mp4';
      final fileName = '${DateTime.now().millisecondsSinceEpoch}.$extension';
      final storagePath = 'videos/$fileName';

      final supabase = Provider.of<SupabaseService>(context, listen: false);

      // Upload to Storage
      await supabase.client.storage
          .from('academy-lectures')
          .uploadBinary(
            storagePath,
            bytes,
            fileOptions: FileOptions(
              contentType: 'video/$extension',
              upsert: true,
            ),
          );

      // Get public URL
      final publicUrl = supabase.client.storage
          .from('academy-lectures')
          .getPublicUrl(storagePath);

      // Save metadata to DB
      await supabase.client.from('academy_lectures').insert({
        'folder_id': widget.folderId,
        'title': titleController.text.trim(),
        'description': descController.text.trim(),
        'video_url': publicUrl,
        'lecture_type': 'video',
        'created_by': supabase.currentUser?.id,
      });

      _fetchLectures();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lecture uploaded successfully!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  Future<void> _pickAndUploadNotes() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'docx', 'pptx', 'jpg', 'jpeg', 'png'],
      allowMultiple: false,
    );
    if (result == null || result.files.single.path == null || !mounted) return;

    final titleController = TextEditingController();
    final descController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: _surfaceMid,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: _border),
        ),
        title: const Text('New Notes / Document', style: TextStyle(color: _textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              style: const TextStyle(color: _textPrimary),
              decoration: const InputDecoration(
                labelText: 'Title',
                labelStyle: TextStyle(color: _textSecondary),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _border)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _neonGreen)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              style: const TextStyle(color: _textPrimary),
              decoration: const InputDecoration(
                labelText: 'Description',
                labelStyle: TextStyle(color: _textSecondary),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _border)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _neonGreen)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL', style: TextStyle(color: _textSecondary)),
          ),
          TextButton(
            onPressed: () {
              if (titleController.text.trim().isEmpty) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text('Title is required')),
                );
                return;
              }
              Navigator.pop(ctx, true);
            },
            child: const Text('UPLOAD', style: TextStyle(color: _neonGreen, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isUploading = true;
    });

    try {
      final file = File(result.files.single.path!);
      final bytes = await file.readAsBytes();
      final extension = result.files.single.extension ?? 'pdf';
      final fileName = '${DateTime.now().millisecondsSinceEpoch}.$extension';
      final storagePath = 'notes/$fileName';

      String contentType = 'application/pdf';
      if (['jpg', 'jpeg', 'png'].contains(extension.toLowerCase())) {
        contentType = 'image/$extension';
      }

      final supabase = Provider.of<SupabaseService>(context, listen: false);

      // Upload to Storage
      await supabase.client.storage
          .from('academy-lectures')
          .uploadBinary(
            storagePath,
            bytes,
            fileOptions: FileOptions(
              contentType: contentType,
              upsert: true,
            ),
          );

      // Get public URL
      final publicUrl = supabase.client.storage
          .from('academy-lectures')
          .getPublicUrl(storagePath);

      // Save metadata to DB
      await supabase.client.from('academy_lectures').insert({
        'folder_id': widget.folderId,
        'title': titleController.text.trim(),
        'description': descController.text.trim(),
        'notes_url': publicUrl,
        'lecture_type': 'notes',
        'created_by': supabase.currentUser?.id,
      });

      _fetchLectures();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notes uploaded successfully!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  Future<void> _downloadLecture(Map<String, dynamic> lecture) async {
    final id = lecture['id'] as String;
    final isNotes = lecture['lecture_type'] == 'notes';
    final url = (isNotes ? lecture['notes_url'] : lecture['video_url']) as String? ?? '';
    if (_isDownloading[id] == true || url.isEmpty) return;

    setState(() {
      _isDownloading[id] = true;
      _downloadProgress[id] = 0.0;
    });

    try {
      await _offlineService.downloadContent(
        contentId: id,
        title: lecture['title'] ?? 'Lecture',
        url: url,
        contentType: 'academy_videos',
        onProgress: (p) {
          if (mounted) setState(() => _downloadProgress[id] = p);
        },
      );
      if (mounted) {
        setState(() {
          _downloaded.add(id);
          _isDownloading[id] = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('"${lecture['title']}" saved for offline'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isDownloading[id] = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Download failed: $e'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  Future<void> _removeDownloadedLecture(String id, String title) async {
    await _offlineService.deleteDownloadedContent(id);
    if (mounted) {
      setState(() {
        _downloaded.remove(id);
        _isDownloading.remove(id);
        _downloadProgress.remove(id);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('"$title" removed from offline storage'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  Future<void> _deleteLecture(String id, String title) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _surfaceMid,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: _border),
        ),
        title: const Text('Delete Lecture?', style: TextStyle(color: _textPrimary)),
        content: Text(
          'Are you sure you want to delete "$title"?',
          style: const TextStyle(color: _textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL', style: TextStyle(color: _textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('DELETE', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      await supabase.from('academy_lectures').delete().eq('id', id);
      _fetchLectures();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lecture deleted')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _surfaceDark,
      appBar: AppBar(
        backgroundColor: _surfaceDark,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: _neonGreen, size: 16),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.folderName,
          style: const TextStyle(
            color: _textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.0,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Folder description
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Text(
                widget.folderDescription,
                style: const TextStyle(color: _textSecondary, fontSize: 13),
              ),
            ),

            if (_isUploading) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _surfaceMid,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: _border),
                  ),
                  child: const Row(
                    children: [
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: _neonGreen, strokeWidth: 2),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Uploading video lecture to Academy...',
                          style: TextStyle(color: _neonGreen, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Add lecture/notes buttons
            if (widget.isExec && !_isUploading) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _pickAndUploadLecture,
                        icon: const Icon(Icons.video_library_rounded, size: 16),
                        label: const Text('UPLOAD VIDEO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _neonGreen.withOpacity(0.08),
                          foregroundColor: _neonGreen,
                          side: BorderSide(color: _neonGreen.withOpacity(0.2)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _pickAndUploadNotes,
                        icon: const Icon(Icons.description_rounded, size: 16),
                        label: const Text('UPLOAD NOTES', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _neonGreen.withOpacity(0.08),
                          foregroundColor: _neonGreen,
                          side: BorderSide(color: _neonGreen.withOpacity(0.2)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: _neonGreen))
                  : _lectures.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.video_collection_outlined, size: 48, color: _textSecondary),
                              SizedBox(height: 12),
                              Text(
                                'No lectures in this folder yet',
                                style: TextStyle(color: _textPrimary, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _lectures.length,
                          itemBuilder: (ctx, i) {
                            final lecture = _lectures[i];
                            final id = lecture['id'] as String;
                            final isDownloaded = _downloaded.contains(id);
                            final isDownloading = _isDownloading[id] == true;
                            final progress = _downloadProgress[id] ?? 0.0;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: _surfaceMid,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: _border),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      GestureDetector(
                                        onTap: () {
                                          final isNotes = lecture['lecture_type'] == 'notes';
                                          final fileUrl = (isNotes ? lecture['notes_url'] : lecture['video_url']) as String? ?? '';
                                          if (isNotes) {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => NoteViewerScreen(
                                                  url: fileUrl,
                                                  title: lecture['title'] ?? 'Notes',
                                                ),
                                              ),
                                            );
                                          } else {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => VideoPlayerScreen(
                                                  networkUrl: fileUrl,
                                                  title: lecture['title'] ?? 'Lecture',
                                                ),
                                              ),
                                            );
                                          }
                                        },
                                        child: Container(
                                          width: 44,
                                          height: 44,
                                          decoration: BoxDecoration(
                                            color: _neonGreen.withOpacity(0.12),
                                            shape: BoxShape.circle,
                                            border: Border.all(color: _neonGreen.withOpacity(0.3)),
                                          ),
                                          child: Icon(
                                            lecture['lecture_type'] == 'notes'
                                                ? Icons.description_rounded
                                                : Icons.play_arrow_rounded,
                                            color: _neonGreen,
                                            size: 24,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              lecture['title'] ?? 'Untitled Lecture',
                                              style: const TextStyle(
                                                color: _textPrimary,
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              lecture['description'] ?? 'No description provided.',
                                              style: const TextStyle(color: _textSecondary, fontSize: 11),
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Download button
                                      if (isDownloading)
                                        SizedBox(
                                          width: 22,
                                          height: 22,
                                          child: CircularProgressIndicator(
                                            value: progress,
                                            color: _neonGreen,
                                            strokeWidth: 2,
                                          ),
                                        )
                                      else if (isDownloaded)
                                        IconButton(
                                          icon: const Icon(Icons.download_done_rounded, color: _neonGreen, size: 20),
                                          onPressed: () => _removeDownloadedLecture(id, lecture['title'] ?? ''),
                                          tooltip: 'Remove offline copy',
                                        )
                                      else
                                        IconButton(
                                          icon: const Icon(Icons.download_outlined, color: _textSecondary, size: 20),
                                          onPressed: () => _downloadLecture(lecture),
                                          tooltip: 'Download for offline',
                                        ),
                                      if (widget.isExec) ...[
                                        const SizedBox(width: 4),
                                        IconButton(
                                          icon: const Icon(Icons.delete_outline_rounded,
                                              color: Colors.redAccent, size: 20),
                                          onPressed: () => _deleteLecture(lecture['id'], lecture['title']),
                                        ),
                                      ],
                                    ],
                                  ),
                                  if (isDownloading) ...[
                                    const SizedBox(height: 10),
                                    DownloadProgressWidget(
                                      title: lecture['title'] ?? 'Lecture',
                                      progress: progress,
                                    ),
                                  ],
                                ],
                              ),
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper Models / Widgets
// ─────────────────────────────────────────────────────────────────────────────

class _CircularXpRing extends StatelessWidget {
  final double progress;
  final int xp;
  final int maxXp;
  const _CircularXpRing({
    required this.progress,
    required this.xp,
    required this.maxXp,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 64,
      height: 64,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            painter: _RingPainter(progress: progress),
            size: const Size(64, 64),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$xp',
                style: const TextStyle(
                  color: Color(0xFF00FF41),
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const Text(
                'XP',
                style: TextStyle(
                  color: Color(0xFFA0A0A0),
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  const _RingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    const strokeWidth = 3.0;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - strokeWidth / 2;

    // Track
    final trackPaint = Paint()
      ..color = const Color(0xFF2A3A5A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = const Color(0xFF00FF41)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress;
}

class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double minHeight;
  final double maxHeight;
  final Widget child;
  const _StickyHeaderDelegate({
    required this.minHeight,
    required this.maxHeight,
    required this.child,
  });

  @override
  double get minExtent => minHeight;

  @override
  double get maxExtent => maxHeight;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return SizedBox.expand(child: child);
  }

  @override
  bool shouldRebuild(_StickyHeaderDelegate old) {
    return old.maxHeight != maxHeight ||
        old.minHeight != minHeight ||
        old.child != child;
  }
}
