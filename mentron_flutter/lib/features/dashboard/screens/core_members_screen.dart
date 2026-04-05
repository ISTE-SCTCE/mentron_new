import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';

class CoreMembersScreen extends StatefulWidget {
  const CoreMembersScreen({super.key});
  @override
  State<CoreMembersScreen> createState() => _CoreMembersScreenState();
}

class _CoreMembersScreenState extends State<CoreMembersScreen> {
  List<Map<String, dynamic>> _members = [];
  bool _isLoading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _fetchMembers();
  }

  Future<void> _fetchMembers() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final res = await supabase
          .from('profiles')
          .select('id, full_name, role, department, year')
          .neq('role', 'core')
          .order('name');
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

  @override
  Widget build(BuildContext context) {
    final filtered = _members.where((m) {
      final q = _search.toLowerCase();
      return (m['full_name'] ?? '').toLowerCase().contains(q) ||
             (m['email'] ?? '').toLowerCase().contains(q) ||
             (m['department'] ?? '').toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          const Text('MANAGE', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Members', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: Column(
          children: [
            // Search bar
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 110, 24, 0),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: TextField(
                  onChanged: (val) => setState(() => _search = val),
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Search members…',
                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 13),
                    prefixIcon: Icon(Icons.search, color: Colors.white.withOpacity(0.4), size: 18),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ).animate().fadeIn(),
            ),
            const SizedBox(height: 16),
            // Member list
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
                  : filtered.isEmpty
                      ? const Center(child: Text('No members found', style: TextStyle(color: AppTheme.textMuted)))
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

  Widget _buildMemberCard(Map<String, dynamic> member, int index) {
    final isExec = member['role'] == 'exec';
    final color = isExec ? AppTheme.accentPrimary : AppTheme.accentSecondary;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassContainer(
        padding: const EdgeInsets.all(18),
        border: isExec ? Border.all(color: AppTheme.accentPrimary.withOpacity(0.4)) : null,
        child: Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Center(
              child: Text(
                (member['full_name'] ?? 'U').substring(0, 1).toUpperCase(),
                style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 18),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(member['full_name'] ?? 'Unknown', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 4),
              Row(children: [
                if ((member['department'] ?? '').isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.07), borderRadius: BorderRadius.circular(6)),
                    child: Text(member['department'] ?? '', style: const TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900)),
                  ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                  child: Text(
                    (member['role'] ?? 'member').toUpperCase(),
                    style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w900),
                  ),
                ),
              ]),
            ]),
          ),
          // Toggle role button
          GestureDetector(
            onTap: () => _showRoleDialog(member),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: (isExec ? Colors.red : Colors.green).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: (isExec ? Colors.red : Colors.green).withOpacity(0.3)),
              ),
              child: Text(
                isExec ? 'Demote' : 'Promote',
                style: TextStyle(
                  color: isExec ? Colors.redAccent : Colors.greenAccent,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
        ]),
      ).animate().fadeIn(delay: (index * 40).ms),
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
}
