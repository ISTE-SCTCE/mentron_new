import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class MyContributionsScreen extends StatefulWidget {
  const MyContributionsScreen({super.key});

  @override
  State<MyContributionsScreen> createState() => _MyContributionsScreenState();
}

class _MyContributionsScreenState extends State<MyContributionsScreen> {
  List<Map<String, dynamic>> _contributions = [];
  bool _isLoading = true;
  final Map<String, int> _dateMap = {};

  @override
  void initState() {
    super.initState();
    _fetchContributions();
  }

  Future<void> _fetchContributions() async {
    if (mounted) setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    if (userId == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final response = await supabase.client
          .from('project_applications')
          .select('*, projects(*, profiles(full_name))')
          .eq('profile_id', userId)
          .eq('status', 'approved')
          .order('created_at', ascending: false);

      final List<Map<String, dynamic>> data = List<Map<String, dynamic>>.from(response as List);
      
      _dateMap.clear();
      for (var app in data) {
        final createdAtStr = app['created_at'] as String?;
        if (createdAtStr != null) {
          final date = DateTime.parse(createdAtStr).toLocal();
          final dateKey = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
          _dateMap[dateKey] = (_dateMap[dateKey] ?? 0) + 1;
        }
      }

      if (mounted) {
        setState(() {
          _contributions = data;
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

  List<List<DateTime>> _generateGrid() {
    final today = DateTime.now();
    // 24 weeks * 7 days = 168 days
    final startDate = today.subtract(const Duration(days: 168));
    
    // Align to nearest Sunday
    final alignedStartDate = startDate.subtract(Duration(days: startDate.weekday % 7));
    
    List<List<DateTime>> grid = [];
    var currentDate = alignedStartDate;
    
    for (int w = 0; w < 24; w++) {
      List<DateTime> week = [];
      for (int d = 0; d < 7; d++) {
        week.add(currentDate);
        currentDate = currentDate.add(const Duration(days: 1));
      }
      grid.add(week);
    }
    
    return grid;
  }

  Color _getCellColor(int count) {
    if (count == 0) return Colors.white.withValues(alpha: 0.05);
    if (count == 1) return AppTheme.accentPrimary.withValues(alpha: 0.25);
    if (count == 2) return AppTheme.accentPrimary.withValues(alpha: 0.50);
    if (count == 3) return AppTheme.accentPrimary.withValues(alpha: 0.75);
    return AppTheme.accentPrimary;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          const Text('COLLABORATION', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
          const Text('My Contributions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: Theme.of(context).colorScheme.onSurface, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : RefreshIndicator(
                onRefresh: _fetchContributions,
                backgroundColor: AppTheme.surfaceColor,
                color: AppTheme.accentSecondary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeatmapCard(),
                      const SizedBox(height: 32),
                      _buildProjectSection(),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildHeatmapCard() {
    final grid = _generateGrid();
    
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'CONTRIBUTION GRAPH',
                style: TextStyle(
                  color: AppTheme.accentPrimary,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.accentPrimary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${_contributions.length} TOTAL',
                  style: const TextStyle(
                    color: AppTheme.accentPrimary,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Scrollable Heatmap grid
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Day Labels
                const Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SizedBox(height: 2),
                    Text('S', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
                    SizedBox(height: 6),
                    Text('M', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
                    SizedBox(height: 6),
                    Text('T', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
                    SizedBox(height: 6),
                    Text('W', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
                    SizedBox(height: 6),
                    Text('T', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
                    SizedBox(height: 6),
                    Text('F', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
                    SizedBox(height: 6),
                    Text('S', style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(width: 8),
                // Heatmap Weeks
                Row(
                  children: List.generate(grid.length, (wIndex) {
                    final week = grid[wIndex];
                    return Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: Column(
                        children: List.generate(week.length, (dIndex) {
                          final date = week[dIndex];
                          final dateKey = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                          final count = _dateMap[dateKey] ?? 0;
                          
                          return Container(
                            width: 10,
                            height: 10,
                            margin: const EdgeInsets.only(bottom: 4),
                            decoration: BoxDecoration(
                              color: _getCellColor(count),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          );
                        }),
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              const Text('Less ', style: TextStyle(color: AppTheme.textMuted, fontSize: 9)),
              _buildLegendSquare(0),
              const SizedBox(width: 3),
              _buildLegendSquare(1),
              const SizedBox(width: 3),
              _buildLegendSquare(2),
              const SizedBox(width: 3),
              _buildLegendSquare(3),
              const SizedBox(width: 3),
              _buildLegendSquare(4),
              const Text(' More', style: TextStyle(color: AppTheme.textMuted, fontSize: 9)),
            ],
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.05);
  }

  Widget _buildLegendSquare(int count) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: _getCellColor(count),
        borderRadius: BorderRadius.circular(1.5),
      ),
    );
  }

  Widget _buildProjectSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 16),
          child: Text(
            'CONTRIBUTED PROJECTS',
            style: TextStyle(
              color: AppTheme.accentSecondary,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
          ),
        ),
        if (_contributions.isEmpty)
          Center(
            child: GlassContainer(
              padding: const EdgeInsets.all(32),
              child: const Column(
                children: [
                  Text('🌱', style: TextStyle(fontSize: 36)),
                  SizedBox(height: 12),
                  Text(
                    'No contributions yet',
                    style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Get accepted into projects to show up here.',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn()
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _contributions.length,
            itemBuilder: (context, index) {
              final item = _contributions[index];
              final project = item['projects'] as Map<String, dynamic>?;
              if (project == null) return const SizedBox.shrink();

              final title = project['title'] ?? 'Untitled Project';
              final desc = project['description'] ?? 'No description.';
              final category = project['category'] ?? 'General';
              final role = project['role'] ?? 'Open';
              final duration = project['duration'] ?? 'Flexible';
              
              final acceptedDate = DateTime.parse(item['created_at']).toLocal();
              final acceptedDateStr = '${acceptedDate.day} ${_getMonthName(acceptedDate.month)} ${acceptedDate.year}';
              
              final leadName = project['profiles']?['full_name'] ?? 'Anonymous';

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.accentPrimary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.accentPrimary.withValues(alpha: 0.2)),
                            ),
                            child: Text(
                              category.toString().toUpperCase(),
                              style: const TextStyle(color: AppTheme.accentPrimary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1),
                            ),
                          ),
                          Text(
                            'Accepted: $acceptedDateStr',
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        title,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.textMain),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        desc,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, height: 1.4),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.work_outline_rounded, size: 12, color: AppTheme.textMuted),
                              const SizedBox(width: 4),
                              Text(role, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(width: 16),
                          Row(
                            children: [
                              const Icon(Icons.timer_outlined, size: 12, color: AppTheme.textMuted),
                              const SizedBox(width: 4),
                              Text(duration, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                      const Divider(color: Colors.white10, height: 24),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 8,
                            backgroundColor: Colors.emerald.withValues(alpha: 0.15),
                            child: Text(
                              leadName.isNotEmpty ? leadName[0].toUpperCase() : 'A',
                              style: const TextStyle(color: Colors.greenAccent, fontSize: 8, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Lead: $leadName',
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ).animate().fadeIn(delay: (index * 80).ms).slideY(begin: 0.05);
            },
          ),
      ],
    );
  }

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }
}
