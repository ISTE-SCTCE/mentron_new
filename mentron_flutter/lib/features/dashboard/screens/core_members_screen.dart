import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../admin/screens/permission_management_screen.dart';

class CoreMembersScreen extends StatefulWidget {
  const CoreMembersScreen({super.key});
  @override
  State<CoreMembersScreen> createState() => _CoreMembersScreenState();
}

class _CoreMembersScreenState extends State<CoreMembersScreen> {
  List<Map<String, dynamic>> _members = [];
  bool _isLoading = true;
  String _search = '';
  String _filterDept = 'All';
  String _filterYear = 'All';
  bool _isLeadership = false;
  Map<String, bool> _permissions = {};

  @override
  void initState() {
    super.initState();
    _initPermissions();
    _fetchMembers();
  }

  Future<void> _initPermissions() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final leadership = await supabase.isLeadershipPosition();
    final perms = await supabase.getPermissions();
    if (mounted) {
      setState(() {
        _isLeadership = leadership;
        _permissions = perms;
      });
    }
  }

  Future<void> _fetchMembers() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final res = await supabase
          .from('profiles')
          .select('id, full_name, roll_number, role, department, year')
          .not('role', 'in', '("core", "exec")')
          .order('full_name');
      if (mounted) setState(() { _members = List<Map<String, dynamic>>.from(res); _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleRole(Map<String, dynamic> member) async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    final newRole = member['role'] == 'exec' ? 'member' : 'exec';

    try {
      await supabase.from('profiles').update({'role': newRole}).eq('id', member['id']);
      setState(() {
        final idx = _members.indexWhere((m) => m['id'] == member['id']);
        if (idx != -1) _members[idx]['role'] = newRole;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          backgroundColor: Colors.green,
          content: Text('${member['full_name']} is now $newRole'),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.red, content: Text(e.toString())));
      }
    }
  }

  Future<void> _deleteMember(Map<String, dynamic> member) async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      await supabase.from('profiles').delete().eq('id', member['id']);
      setState(() {
        _members.removeWhere((m) => m['id'] == member['id']);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          backgroundColor: Colors.green,
          content: Text('Account deleted successfully.'),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.red, content: Text('Deletion failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // 1. Get unique departments and years for dropdowns
    final depts = ['All'];
    final years = ['All', '1', '2', '3', '4'];
    for (var m in _members) {
      final d = m['department'] as String?;
      if (d != null && d.isNotEmpty && !depts.contains(d)) depts.add(d);
    }

    // 2. Filter logic
    final filtered = _members.where((m) {
      final q = _search.toLowerCase();
      final matchesSearch = (m['full_name'] ?? '').toLowerCase().contains(q) ||
             (m['roll_number'] ?? '').toLowerCase().contains(q) ||
             (m['department'] ?? '').toLowerCase().contains(q);
      final matchesDept = _filterDept == 'All' || m['department'] == _filterDept;
      final matchesYear = _filterYear == 'All' || m['year']?.toString() == _filterYear;
      return matchesSearch && matchesDept && matchesYear;
    }).toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          const Text('STUDENT', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Directory', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white)),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isLeadership)
            IconButton(
              icon: const Icon(Icons.admin_panel_settings_outlined, color: AppTheme.accentSecondary, size: 22),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const PermissionManagementScreen()),
                ).then((_) => _initPermissions()); // Refresh permissions when returning
              },
            ),
        ],
      ),
      body: LiquidBackground(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 110, 24, 0),
              child: Column(
                children: [
                  // Search bar
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: TextField(
                      onChanged: (val) => setState(() => _search = val),
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search roll no, name...',
                        hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 13),
                        prefixIcon: Icon(Icons.search, color: Colors.white.withValues(alpha: 0.4), size: 18),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Filters UI
                  Row(
                    children: [
                      Expanded(
                        child: _buildDropdown(
                          value: _filterDept,
                          items: depts,
                          label: 'Dept',
                          onChanged: (val) => setState(() => _filterDept = val!),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildDropdown(
                          value: _filterYear,
                          items: years,
                          label: 'Year',
                          onChanged: (val) => setState(() => _filterYear = val!),
                        ),
                      ),
                    ],
                  ),
                ],
              ).animate().fadeIn(),
            ),
            const SizedBox(height: 16),
            // Member list
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
                  : filtered.isEmpty
                      ? const Center(child: Text('No students match filters', style: TextStyle(color: AppTheme.textMuted)))
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
                          itemCount: filtered.length,
                          itemBuilder: (ctx, i) => _buildMemberCard(filtered[i], i),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String value,
    required List<String> items,
    required String label,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: items.contains(value) ? value : items.first,
          isExpanded: true,
          icon: Icon(Icons.filter_list_rounded, color: Colors.white.withValues(alpha: 0.3), size: 16),
          dropdownColor: AppTheme.surfaceColor,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
          onChanged: onChanged,
          items: items.map((item) {
            return DropdownMenuItem(
              value: item,
              child: Text(item == 'All' ? 'All $label' : item),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildMemberCard(Map<String, dynamic> member, int index) {
    final role = (member['role'] ?? 'member') as String;
    final isCore = role == 'core';
    final isExec = role == 'exec';
    
    // Choose theme colors based on role
    Color color = isCore
        ? Colors.purpleAccent
        : isExec
            ? AppTheme.accentPrimary
            : AppTheme.accentSecondary;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        child: Column(
          children: [
            // Top Section: Avatar & Badges
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(16)),
                  child: Center(
                    child: Text(
                      (member['full_name'] ?? 'U').substring(0, 1).toUpperCase(),
                      style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 22),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        member['full_name'] ?? 'Unknown',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                            child: Text(
                              role.toUpperCase(),
                              style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            (_permissions['can_see_member_info'] == true) 
                                ? (member['roll_number'] ?? 'No Roll No')
                                : '••••••••',
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            // Middle section: Info Grid
            const SizedBox(height: 20),
            if (_permissions['can_see_member_info'] == true)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('DEPARTMENT', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
                          const SizedBox(height: 4),
                          Text(member['department'] ?? '—', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.1)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('CLASS YEAR', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
                          const SizedBox(height: 4),
                          Text(member['year'] != null ? 'Year ${member['year']}' : '—', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.lock_outline_rounded, color: Colors.white24, size: 20),
                    SizedBox(height: 4),
                    Text('INFO RESTRICTED', style: TextStyle(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  ],
                ),
              ),
            
            // Bottom Section: Actions
            const SizedBox(height: 16),
            Row(
              children: [
                if (!isCore)
                  Expanded(
                    child: GestureDetector(
                      onTap: () => _showRoleDialog(member),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: (isExec ? Colors.red : Colors.green).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: (isExec ? Colors.red : Colors.green).withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          isExec ? 'DEMOTE MEMBER' : 'PROMOTE TO EXEC',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isExec ? Colors.redAccent : Colors.greenAccent,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ),
                  ),
                
                // Manage Permissions Button
                if (_isLeadership) ...[
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const PermissionManagementScreen()),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.accentSecondary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.accentSecondary.withValues(alpha: 0.3)),
                      ),
                      child: const Icon(Icons.security_rounded, color: AppTheme.accentSecondary, size: 18),
                    ),
                  ),
                ],

                // Show delete button
                if (_permissions['can_delete_account'] == true) ...[
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _showDeleteDialog(member),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                      ),
                      child: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ).animate().fadeIn(delay: (index * 50).ms).slideY(begin: 0.05, curve: Curves.easeOut),
    );
  }

  void _showRoleDialog(Map<String, dynamic> member) {
    final isExec = member['role'] == 'exec';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(isExec ? 'Demote Member?' : 'Promote to Exec?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(
          isExec
              ? '${member['full_name']} will become a normal member.'
              : '${member['full_name']} will become an executive member with elevated permissions.',
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          TextButton(
            onPressed: () { Navigator.pop(ctx); _toggleRole(member); },
            child: Text(isExec ? 'DEMOTE' : 'PROMOTE', style: TextStyle(color: isExec ? Colors.redAccent : Colors.greenAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(Map<String, dynamic> member) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Account?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to permanently delete ${member['full_name']}? This action cannot be undone and will revoke their access to Mentron.',
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          TextButton(
            onPressed: () { Navigator.pop(ctx); _deleteMember(member); },
            child: const Text('DELETE', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

