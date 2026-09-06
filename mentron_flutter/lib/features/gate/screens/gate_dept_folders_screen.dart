import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../core/utils/error_handler.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../shared/widgets/pressable_scale.dart';
import '../../../shared/widgets/skeleton_shimmer.dart';
import '../../../services/gate_service.dart';
import 'gate_folder_notes_screen.dart';

class GateDeptFoldersScreen extends StatefulWidget {
  final GateDepartment department;

  const GateDeptFoldersScreen({super.key, required this.department});

  @override
  State<GateDeptFoldersScreen> createState() => _GateDeptFoldersScreenState();
}

class _GateDeptFoldersScreenState extends State<GateDeptFoldersScreen> {
  late GateService _gateService;
  List<GateFolder> _folders = [];
  bool _isLoading = true;
  String _searchQuery = '';
  bool _canCreateFolder = false;
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

      bool canCreate = false;
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
        canCreate = isPrivileged || perms['can_upload_notes'] == true;
      }

      final folders = await _gateService.fetchFolders(widget.department.id);

      if (mounted) {
        setState(() {
          _canCreateFolder = canCreate;
          _folders = folders;
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

  void _showCreateFolderDialog() {
    final nameController = TextEditingController();
    bool isSubmitting = false;

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
              Text('📁 ', style: TextStyle(fontSize: 20)),
              Text(
                'New Subject Folder',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Department: ${widget.department.label}',
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameController,
                textCapitalization: TextCapitalization.words,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  hintText: 'e.g. Signals & Systems',
                  hintStyle: const TextStyle(color: Color(0xFF475569)),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.05),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
            ),
            ElevatedButton(
              onPressed: isSubmitting
                  ? null
                  : () async {
                      final name = nameController.text.trim();
                      if (name.isEmpty) return;

                      setDialogState(() => isSubmitting = true);
                      try {
                        final created = await _gateService.createFolder(
                          departmentId: widget.department.id,
                          name: name,
                        );
                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                        }
                        if (mounted) {
                          setState(() => _folders.insert(0, created));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: Colors.green,
                              content: Text('Folder "$name" created'),
                            ),
                          );
                        }
                      } catch (e) {
                        setDialogState(() => isSubmitting = false);
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
              child: isSubmitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('CREATE', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteFolder(GateFolder folder) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        title: const Text('Delete Folder?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete "${folder.name}" and all notes inside it? This cannot be undone.',
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
        await _gateService.deleteFolder(folder.id);
        setState(() => _folders.removeWhere((f) => f.id == folder.id));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(backgroundColor: Colors.green, content: Text('Deleted folder "${folder.name}"')),
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

  @override
  Widget build(BuildContext context) {
    final filtered = _folders.where((f) =>
      f.name.toLowerCase().contains(_searchQuery.toLowerCase())
    ).toList();

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
              'GATE / ${widget.department.key}',
              style: const TextStyle(
                color: Color(0xFF00C6FF),
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.5,
              ),
            ),
            Text(
              widget.department.label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
            ),
          ],
        ),
        actions: [
          if (_canCreateFolder)
            IconButton(
              icon: const Icon(Icons.create_new_folder_outlined, color: Color(0xFF00C6FF)),
              tooltip: 'New Subject Folder',
              onPressed: _showCreateFolderDialog,
            ),
        ],
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const _FoldersSkeletonList()
            : RefreshIndicator(
                onRefresh: _loadData,
                color: const Color(0xFF00C6FF),
                backgroundColor: const Color(0xFF0F172A),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 110, 20, 40),
                  children: [
                    // ── Search & Filter ──
                    Container(
                      margin: const EdgeInsets.only(bottom: 20),
                      child: TextField(
                        onChanged: (val) => setState(() => _searchQuery = val),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'Search subject folders...',
                          hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF00C6FF), size: 18),
                          filled: true,
                          fillColor: const Color(0xFF0F172A).withValues(alpha: 0.6),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFF00C6FF), width: 1.5),
                          ),
                        ),
                      ),
                    ),

                    // ── Folder Count Header ──
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${filtered.length} SUBJECT FOLDER${filtered.length == 1 ? '' : 'S'}',
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                          ),
                        ),
                        if (_canCreateFolder)
                          GestureDetector(
                            onTap: _showCreateFolderDialog,
                            child: const Row(
                              children: [
                                Icon(Icons.add_rounded, size: 14, color: Color(0xFF00C6FF)),
                                SizedBox(width: 4),
                                Text(
                                  'New Folder',
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

                    // ── Folders List ──
                    if (filtered.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 48),
                          child: Column(
                            children: [
                              const Text('📁', style: TextStyle(fontSize: 36)),
                              const SizedBox(height: 12),
                              Text(
                                _searchQuery.isEmpty ? 'No subject folders yet' : 'No folders matching "$_searchQuery"',
                                style: const TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold),
                              ),
                              if (_canCreateFolder && _searchQuery.isEmpty) ...[
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: _showCreateFolderDialog,
                                  icon: const Icon(Icons.add_rounded, size: 16),
                                  label: const Text('Create First Folder'),
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
                      ...filtered.asMap().entries.map((entry) {
                        final index = entry.key;
                        final folder = entry.value;
                        final bool canDelete = _canCreateFolder &&
                            (folder.createdBy == _currentUserId || _currentUserId != null);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _buildFolderCard(folder, index, canDelete),
                        );
                      }),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildFolderCard(GateFolder folder, int index, bool canDelete) {
    return PressableScale(
      onTap: () {
        Navigator.push(
          context,
          AppTransitions.slideRight(
            GateFolderNotesScreen(
              department: widget.department,
              folder: folder,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withValues(alpha: 0.7),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: const Color(0xFF00C6FF).withValues(alpha: 0.2),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF00C6FF).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: Text('📁', style: TextStyle(fontSize: 22)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    folder.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '${folder.noteCount} ${folder.noteCount == 1 ? 'Note' : 'Notes'}',
                        style: const TextStyle(
                          color: Color(0xFF00C6FF),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (folder.creatorName != null) ...[
                        const Text(' • ', style: TextStyle(color: Color(0xFF475569))),
                        Text(
                          folder.creatorName!,
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            if (canDelete)
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                onPressed: () => _deleteFolder(folder),
                tooltip: 'Delete Folder',
              ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF64748B),
              size: 20,
            ),
          ],
        ),
      ),
    ).animate(delay: (index * 35).ms).fadeIn(duration: 220.ms).slideY(begin: 0.04);
  }
}

class _FoldersSkeletonList extends StatelessWidget {
  const _FoldersSkeletonList();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 110, 20, 40),
      children: [
        const SkeletonBox(height: 48, borderRadius: 16, margin: EdgeInsets.only(bottom: 24)),
        ...List.generate(
          4,
          (i) => const SkeletonBox(
            height: 74,
            borderRadius: 18,
            margin: EdgeInsets.only(bottom: 12),
          ),
        ),
      ],
    );
  }
}
