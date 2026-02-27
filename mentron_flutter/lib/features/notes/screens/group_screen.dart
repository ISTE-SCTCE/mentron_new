import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/department_mapper.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import 'note_list_screen.dart';

class GroupScreen extends StatefulWidget {
  const GroupScreen({super.key});

  @override
  State<GroupScreen> createState() => _GroupScreenState();
}

class _GroupScreenState extends State<GroupScreen> {
  String? _userDept;
  String? _userYear;
  String? _userRoll;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final user = supabase.currentUser;
    if (user == null) { setState(() => _isLoading = false); return; }

    try {
      final profile = await supabase.client
          .from('profiles')
          .select('department, roll_number, year')
          .eq('id', user.id)
          .maybeSingle();

      if (mounted && profile != null) {
        final roll = profile['roll_number'] as String?;

        // Always auto-detect from roll number first
        final detected = DepartmentMapper.getDepartmentFromRoll(roll);
        String? dept;
        if (detected != 'Other') {
          dept = detected;
        } else {
          // Fallback: use stored code if meaningful
          final stored = (profile['department'] as String? ?? '').trim();
          if (stored.isNotEmpty && stored.toLowerCase() != 'other') {
            dept = stored;
          }
        }

        setState(() {
          _userRoll = roll;
          _userDept = dept;
          _userYear = profile['year']?.toString();
          _isLoading = false;
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
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
          const Text('ACADEMIC', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Library', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : ListView(
                padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
                children: [
                  // ── Auto-detected Department Banner ──
                  if (_userDept != null) ...[
                    _buildSectionHeader('AUTO-DETECTED FOR YOU'),
                    const SizedBox(height: 12),
                    _buildMyDeptCard(),
                    const SizedBox(height: 32),
                  ] else ...[
                    GlassContainer(
                      padding: const EdgeInsets.all(20),
                      border: Border.all(color: Colors.orangeAccent.withOpacity(0.3)),
                      child: Row(children: [
                        const Icon(Icons.warning_amber_rounded, color: Colors.orangeAccent, size: 20),
                        const SizedBox(width: 12),
                        const Expanded(child: Text(
                          'Set your Roll Number in your profile to auto-detect your department.',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 12, height: 1.5),
                        )),
                      ]),
                    ).animate().fadeIn(),
                    const SizedBox(height: 32),
                  ],

                  // ── All Departments ──
                  _buildSectionHeader('ALL DEPARTMENTS'),
                  const SizedBox(height: 16),
                  ...DepartmentMapper.departments.map((dept) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildDeptFolder(dept['code']!, dept['name']!),
                  )),
                ],
              ),
      ),
    );
  }

  Widget _buildMyDeptCard() {
    final deptName = DepartmentMapper.getName(_userDept!);
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      border: Border.all(color: AppTheme.accentPrimary.withOpacity(0.5), width: 1.5),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppTheme.accentPrimary, AppTheme.accentSecondary]),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.folder_special_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('YOUR DEPARTMENT', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 2)),
            Text(deptName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            if (_userRoll != null)
              Text(_userRoll!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, letterSpacing: 1)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: AppTheme.accentPrimary.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
            child: Text(_userDept!, style: const TextStyle(color: AppTheme.accentPrimary, fontSize: 10, fontWeight: FontWeight.w900)),
          ),
        ]),
        const SizedBox(height: 16),
        // Quick Year Buttons — based on their stored year + all others
        const Text('SELECT YEAR', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
        const SizedBox(height: 10),
        Row(children: List.generate(4, (i) {
          final year = '${i + 1}';
          final isMyYear = _userYear == year;
          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(right: i < 3 ? 8 : 0),
              child: GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => NoteListScreen(deptCode: _userDept!, year: year),
                )),
                child: Container(
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: isMyYear ? LinearGradient(colors: [AppTheme.accentPrimary, AppTheme.accentSecondary]) : null,
                    color: isMyYear ? null : Colors.white.withOpacity(0.07),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isMyYear ? AppTheme.accentPrimary : Colors.white.withOpacity(0.12),
                      width: isMyYear ? 0 : 1,
                    ),
                  ),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text(year, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isMyYear ? Colors.black : Colors.white)),
                    if (isMyYear)
                      const Text('MINE', style: TextStyle(fontSize: 7, fontWeight: FontWeight.w900, color: Colors.black54, letterSpacing: 1)),
                  ]),
                ),
              ),
            ),
          );
        })),
      ]),
    ).animate().fadeIn().slideY(begin: 0.05);
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 3));
  }

  Widget _buildDeptFolder(String deptCode, String deptName) {
    final isMyDept = deptCode == _userDept;
    return InkWell(
      onTap: () => _showYearPicker(deptCode),
      borderRadius: BorderRadius.circular(20),
      child: GlassContainer(
        padding: const EdgeInsets.all(18),
        border: isMyDept ? Border.all(color: AppTheme.accentSecondary.withOpacity(0.4)) : null,
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (isMyDept ? AppTheme.accentPrimary : AppTheme.accentSecondary).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.folder_rounded, color: isMyDept ? AppTheme.accentPrimary : AppTheme.accentSecondary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(deptName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
            Text(deptCode, style: TextStyle(color: isMyDept ? AppTheme.accentPrimary : AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ])),
          if (isMyDept)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: AppTheme.accentSecondary.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
              child: const Text('YOURS', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
            )
          else
            Icon(Icons.chevron_right_rounded, color: AppTheme.textMuted),
        ]),
      ),
    ).animate().fadeIn().slideX(begin: -0.03);
  }

  void _showYearPicker(String deptCode) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => GlassContainer(
        padding: const EdgeInsets.all(32),
        borderRadius: 0,
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('SELECT YEAR — $deptCode', style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
          const SizedBox(height: 8),
          Text(DepartmentMapper.getName(deptCode), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [1, 2, 3, 4].map((year) => _buildYearCircle(deptCode, year.toString())).toList(),
          ),
          const SizedBox(height: 32),
        ]),
      ),
    );
  }

  Widget _buildYearCircle(String deptCode, String year) {
    final isMyYear = _userYear == year && deptCode == _userDept;
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        Navigator.push(context, MaterialPageRoute(builder: (_) => NoteListScreen(deptCode: deptCode, year: year)));
      },
      child: Container(
        width: 64, height: 64,
        decoration: BoxDecoration(
          gradient: isMyYear ? LinearGradient(colors: [AppTheme.accentPrimary, AppTheme.accentSecondary]) : null,
          color: isMyYear ? null : Colors.white10,
          shape: BoxShape.circle,
          border: Border.all(color: isMyYear ? Colors.transparent : Colors.white24, width: 1),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(year, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: isMyYear ? Colors.black : Colors.white)),
          if (isMyYear)
            const Text('YOU', style: TextStyle(fontSize: 7, fontWeight: FontWeight.w900, color: Colors.black54)),
        ]),
      ).animate().scale(delay: (int.parse(year) * 80).ms),
    );
  }
}
