import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';

class PermissionManagementScreen extends StatefulWidget {
  const PermissionManagementScreen({super.key});

  @override
  State<PermissionManagementScreen> createState() => _PermissionManagementScreenState();
}

class _PermissionManagementScreenState extends State<PermissionManagementScreen> {
  List<Map<String, dynamic>> _members = [];
  List<Map<String, dynamic>> _filteredMembers = [];
  bool _isLoading = true;
  String _searchQuery = '';
  Map<String, dynamic>? _selectedMember;

  @override
  void initState() {
    super.initState();
    _fetchMembers();
  }

  Future<void> _fetchMembers() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    try {
      final response = await supabase.client
          .from('profiles')
          .select('id, full_name, roll_number, department, role, iste_position, permissions')
          .inFilter('role', ['core', 'exec'])
          .order('full_name');
      
      final List<Map<String, dynamic>> list = List<Map<String, dynamic>>.from(response);
      if (mounted) {
        setState(() {
          _members = list;
          _filteredMembers = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _filterMembers(String query) {
    setState(() {
      _searchQuery = query;
      _filteredMembers = _members.where((m) {
        final name = (m['full_name'] ?? '').toString().toLowerCase();
        final roll = (m['roll_number'] ?? '').toString().toLowerCase();
        return name.contains(query.toLowerCase()) || roll.contains(query.toLowerCase());
      }).toList();
    });
  }

  Future<void> _updatePermission(String permKey, bool value) async {
    if (_selectedMember == null) return;

    final name = _selectedMember!['full_name'];
    final permLabel = _getPermissionLabel(permKey);
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: Text(value ? 'Grant Permission' : 'Revoke Permission', style: const TextStyle(color: Colors.white)),
        content: Text('Are you sure you want to ${value ? 'grant' : 'revoke'} "$permLabel" for $name?', style: const TextStyle(color: AppTheme.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text(value ? 'Grant' : 'Revoke', style: TextStyle(color: value ? Colors.blue : Colors.redAccent))),
        ],
      ),
    );

    if (confirm != true) return;

    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final currentPerms = Map<String, dynamic>.from(_selectedMember!['permissions'] ?? {
      'can_see_member_info': false,
      'can_delete_account': false,
      'can_upload_notes': true,
    });
    
    currentPerms[permKey] = value;

    try {
      await supabase.client
          .from('profiles')
          .update({'permissions': currentPerms})
          .eq('id', _selectedMember!['id']);
      
      setState(() {
        _selectedMember!['permissions'] = currentPerms;
        final idx = _members.indexWhere((m) => m['id'] == _selectedMember!['id']);
        if (idx != -1) _members[idx]['permissions'] = currentPerms;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Permissions updated successfully'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Update failed: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  String _getPermissionLabel(String key) {
    switch (key) {
      case 'can_see_member_info': return 'See Member Info';
      case 'can_delete_account': return 'Delete Account';
      case 'can_upload_notes': return 'Upload Notes';
      default: return key;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Permission Board', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 110, 20, 20),
          child: Column(
            children: [
              _buildSearchBar(),
              const SizedBox(height: 20),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
                    : _buildMemberList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: TextField(
        onChanged: _filterMembers,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          icon: Icon(Icons.search, color: Colors.white.withValues(alpha: 0.3), size: 20),
          hintText: 'Search Execom / Core...',
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildMemberList() {
    if (_filteredMembers.isEmpty) {
      return const Center(child: Text('No members found', style: TextStyle(color: AppTheme.textMuted)));
    }
    return ListView.builder(
      padding: EdgeInsets.zero,
      itemCount: _filteredMembers.length,
      itemBuilder: (context, index) {
        final member = _filteredMembers[index];
        final isSelected = _selectedMember?['id'] == member['id'];
        
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            children: [
              GestureDetector(
                onTap: () => setState(() => _selectedMember = isSelected ? null : member),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  border: isSelected ? Border.all(color: Colors.blue.withValues(alpha: 0.5)) : null,
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: AppTheme.accentPrimary,
                        radius: 20,
                        child: Text(member['full_name']?[0] ?? '?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(member['full_name'] ?? 'Unknown', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            Text('${member['role']} • ${member['iste_position'] ?? 'Member'}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
                          ],
                        ),
                      ),
                      Icon(isSelected ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: AppTheme.textMuted),
                    ],
                  ),
                ),
              ),
              if (isSelected) _buildPermissionToggles(member),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPermissionToggles(Map<String, dynamic> member) {
    final perms = member['permissions'] ?? {
      'can_see_member_info': false,
      'can_delete_account': false,
      'can_upload_notes': true,
    };

    return Container(
      margin: const EdgeInsets.only(top: 8, left: 8, right: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        children: [
          _buildToggleItem('can_see_member_info', perms['can_see_member_info'] == true, Icons.info_outline),
          const Divider(color: Colors.white10),
          _buildToggleItem('can_delete_account', perms['can_delete_account'] == true, Icons.person_remove_outlined),
          const Divider(color: Colors.white10),
          _buildToggleItem('can_upload_notes', perms['can_upload_notes'] == true, Icons.upload_file_outlined),
        ],
      ),
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildToggleItem(String key, bool val, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.accentSecondary, size: 18),
        const SizedBox(width: 12),
        Expanded(child: Text(_getPermissionLabel(key), style: const TextStyle(color: Colors.white, fontSize: 13))),
        Switch(
          value: val,
          onChanged: (newVal) => _updatePermission(key, newVal),
          activeColor: Colors.blue,
          inactiveTrackColor: Colors.white10,
        ),
      ],
    );
  }
}
