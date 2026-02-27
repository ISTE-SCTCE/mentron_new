import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';

class TeamScreen extends StatefulWidget {
  const TeamScreen({super.key});
  @override
  State<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends State<TeamScreen> {
  List<Map<String, dynamic>> _members = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchTeam();
  }

  Future<void> _fetchTeam() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase.from('profiles').select('full_name, department, role, xp').eq('role', 'exec');
      if (mounted) setState(() { _members = List<Map<String, dynamic>>.from(response); _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
        title: Column(children: [
          const Text('THE TEAM', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('EXECOM Members', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : _members.isEmpty
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Text('👥', style: TextStyle(fontSize: 48)),
                    const SizedBox(height: 16),
                    const Text('No executive members found.', style: TextStyle(color: AppTheme.textMuted))
                  ]).animate().fadeIn())
                : GridView.builder(
                    padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 0.9),
                    itemCount: _members.length,
                    itemBuilder: (context, index) {
                      final member = _members[index];
                      final name = member['full_name'] ?? 'Member';
                      final initial = name.isNotEmpty ? name[0].toUpperCase() : 'M';
                      return GlassContainer(
                        padding: const EdgeInsets.all(20),
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Container(
                            width: 60, height: 60,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(colors: [AppTheme.accentPrimary, AppTheme.accentSecondary]),
                            ),
                            child: Center(child: Text(initial, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white))),
                          ),
                          const SizedBox(height: 12),
                          Text(name, textAlign: TextAlign.center, maxLines: 2, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
                          const SizedBox(height: 4),
                          Text(member['department'] ?? 'Executive', style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                          const SizedBox(height: 8),
                          Text('${member['xp'] ?? 0} XP', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                        ]),
                      ).animate().fadeIn(delay: (index * 80).ms).scale(begin: const Offset(0.95, 0.95));
                    },
                  ),
      ),
    );
  }
}
