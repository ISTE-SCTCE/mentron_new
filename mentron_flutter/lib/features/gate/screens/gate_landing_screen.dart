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
import 'gate_dept_folders_screen.dart';

class GateLandingScreen extends StatefulWidget {
  const GateLandingScreen({super.key});

  @override
  State<GateLandingScreen> createState() => _GateLandingScreenState();
}

class _GateLandingScreenState extends State<GateLandingScreen> {
  late GateService _gateService;
  List<GateDepartment> _departments = [];
  bool _isLoading = true;
  bool _isPrivileged = false;

  static const Map<String, _ColorConfig> _colorConfigs = {
    'cyan': _ColorConfig(
      primary: Color(0xFF00C6FF),
      border: Color(0xFF06B6D4),
      bg: [Color(0xFF0C243B), Color(0xFF071221)],
    ),
    'orange': _ColorConfig(
      primary: Color(0xFFF97316),
      border: Color(0xFFEA580C),
      bg: [Color(0xFF331604), Color(0xFF1B0A02)],
    ),
    'purple': _ColorConfig(
      primary: Color(0xFFA855F7),
      border: Color(0xFF9333EA),
      bg: [Color(0xFF260D38), Color(0xFF140520)],
    ),
    'blue': _ColorConfig(
      primary: Color(0xFF3B82F6),
      border: Color(0xFF2563EB),
      bg: [Color(0xFF0D1D3A), Color(0xFF060E1E)],
    ),
    'emerald': _ColorConfig(
      primary: Color(0xFF10B981),
      border: Color(0xFF059669),
      bg: [Color(0xFF08261C), Color(0xFF03140E)],
    ),
    'rose': _ColorConfig(
      primary: Color(0xFFF43F5E),
      border: Color(0xFFE11D48),
      bg: [Color(0xFF2E0916), Color(0xFF17040A)],
    ),
  };

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

      bool privileged = false;
      if (userId != null) {
        final profile = await supa.client
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();
        final role = profile?['role'] as String?;
        privileged = role == 'exec' || role == 'core' || role == 'admin';
      }

      final depts = await _gateService.fetchDepartments();

      if (mounted) {
        setState(() {
          _isPrivileged = privileged;
          _departments = depts;
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

  void _showAddDepartmentDialog() {
    final keyController = TextEditingController();
    final labelController = TextEditingController();
    String selectedEmoji = '🏛️';
    String selectedColor = 'cyan';
    bool isSubmitting = false;

    const emojis = ['🏛️', '📡', '⚙️', '💻', '⚡', '🔬', '🚀', '🏗️', '🧪'];
    const colors = ['cyan', 'orange', 'purple', 'blue', 'emerald', 'rose'];

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
              Text('🏛️ ', style: TextStyle(fontSize: 20)),
              Text(
                'Add Gate Department',
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
                const Text(
                  'Department Code (e.g. ECE, ME, EEE)',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: keyController,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: 'e.g. EEE',
                    hintStyle: const TextStyle(color: Color(0xFF475569)),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.05),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Full Department Name',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: labelController,
                  textCapitalization: TextCapitalization.words,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'e.g. Electrical & Electronics Engineering',
                    hintStyle: const TextStyle(color: Color(0xFF475569)),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.05),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Department Emoji',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: emojis.map((em) {
                    final isSel = selectedEmoji == em;
                    return GestureDetector(
                      onTap: () => setDialogState(() => selectedEmoji = em),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isSel ? const Color(0xFF00C6FF).withValues(alpha: 0.2) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isSel ? const Color(0xFF00C6FF) : Colors.white.withValues(alpha: 0.1),
                          ),
                        ),
                        child: Text(em, style: const TextStyle(fontSize: 18)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Theme Color',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: colors.map((col) {
                    final cfg = _colorConfigs[col] ?? _colorConfigs['cyan']!;
                    final isSel = selectedColor == col;
                    return GestureDetector(
                      onTap: () => setDialogState(() => selectedColor = col),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: cfg.primary.withValues(alpha: isSel ? 0.3 : 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isSel ? cfg.primary : cfg.primary.withValues(alpha: 0.2),
                            width: isSel ? 2 : 1,
                          ),
                        ),
                        child: Text(
                          col.toUpperCase(),
                          style: TextStyle(
                            color: cfg.primary,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
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
                      final key = keyController.text.trim().toUpperCase();
                      final label = labelController.text.trim();
                      if (key.isEmpty || label.isEmpty) return;

                      setDialogState(() => isSubmitting = true);
                      try {
                        final created = await _gateService.createDepartment(
                          key: key,
                          label: label,
                          emoji: selectedEmoji,
                          color: selectedColor,
                        );
                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                        }
                        if (mounted) {
                          setState(() => _departments.add(created));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: Colors.green,
                              content: Text('Created portal for ${created.label}'),
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
        title: const Column(
          children: [
            Text(
              'DIRECT ACADEMIC PORTALS',
              style: TextStyle(
                color: Color(0xFF00C6FF),
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.5,
              ),
            ),
            Text(
              'Mentron Gate Initiative',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
            ),
          ],
        ),
        actions: [
          if (_isPrivileged)
            IconButton(
              icon: const Icon(Icons.add_rounded, color: Color(0xFF00C6FF)),
              tooltip: 'Add Department',
              onPressed: _showAddDepartmentDialog,
            ),
        ],
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const _GateSkeletonGrid()
            : RefreshIndicator(
                onRefresh: _loadData,
                color: const Color(0xFF00C6FF),
                backgroundColor: const Color(0xFF0F172A),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 110, 20, 40),
                  children: [
                    // ── Header Tagline & Summary ──
                    Container(
                      margin: const EdgeInsets.only(bottom: 20),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFF00C6FF).withValues(alpha: 0.1),
                            const Color(0xFF7000DF).withValues(alpha: 0.1),
                          ],
                        ),
                        border: Border.all(
                          color: const Color(0xFF00C6FF).withValues(alpha: 0.25),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Text('🚀 ', style: TextStyle(fontSize: 16)),
                              Text(
                                'FLAT NOTES ARCHIVE',
                                style: TextStyle(
                                  color: Color(0xFF00C6FF),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Organized directly by department and subject folder — no year or semester restrictions.',
                            style: TextStyle(
                              color: Color(0xFFCBD5E1),
                              fontSize: 12,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Text(
                                '${_departments.length} Department${_departments.length == 1 ? '' : 's'} Active',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const Spacer(),
                              GestureDetector(
                                onTap: () => Navigator.pop(context),
                                child: const Row(
                                  children: [
                                    Text(
                                      'Standard Library',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(width: 4),
                                    Icon(Icons.arrow_forward_rounded, size: 12, color: Colors.white70),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ).animate().fadeIn(duration: 220.ms).slideY(begin: 0.04),

                    // ── Department Cards Grid ──
                    if (_departments.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: Text(
                            'No departments initialized yet.',
                            style: TextStyle(color: Color(0xFF64748B)),
                          ),
                        ),
                      )
                    else
                      ..._departments.asMap().entries.map((entry) {
                        final index = entry.key;
                        final dept = entry.value;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: _buildDepartmentCard(dept, index),
                        );
                      }),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildDepartmentCard(GateDepartment dept, int index) {
    final cfg = _colorConfigs[dept.color] ?? _colorConfigs['cyan']!;

    return PressableScale(
      onTap: () {
        Navigator.push(
          context,
          AppTransitions.slideRight(GateDeptFoldersScreen(department: dept)),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: cfg.bg,
          ),
          border: Border.all(
            color: cfg.border.withValues(alpha: 0.4),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: cfg.primary.withValues(alpha: 0.15),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: cfg.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Center(
                    child: Text(dept.emoji, style: const TextStyle(fontSize: 24)),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: cfg.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: cfg.primary.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    dept.key,
                    style: TextStyle(
                      color: cfg.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              dept.label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.folder_outlined, size: 14, color: cfg.primary),
                const SizedBox(width: 6),
                Text(
                  '${dept.folderCount} ${dept.folderCount == 1 ? 'Subject Folder' : 'Subject Folders'}',
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.only(top: 14),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: Colors.white.withValues(alpha: 0.08),
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'OPEN PORTAL',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_rounded,
                    color: cfg.primary,
                    size: 16,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate(delay: (index * 40).ms).fadeIn(duration: 240.ms).slideY(begin: 0.04);
  }
}

class _ColorConfig {
  final Color primary;
  final Color border;
  final List<Color> bg;

  const _ColorConfig({
    required this.primary,
    required this.border,
    required this.bg,
  });
}

class _GateSkeletonGrid extends StatelessWidget {
  const _GateSkeletonGrid();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 110, 20, 40),
      children: [
        const SkeletonBox(height: 90, borderRadius: 20, margin: EdgeInsets.only(bottom: 20)),
        ...List.generate(
          3,
          (i) => const SkeletonBox(
            height: 160,
            borderRadius: 22,
            margin: EdgeInsets.only(bottom: 14),
          ),
        ),
      ],
    );
  }
}
