import '../../../design/creative_surfaces.dart';
import '../../../design/campus_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme.dart';
import '../../shared/mlynq_illustrations.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _ongoingEvents = [];
  List<Map<String, dynamic>> _upcomingEvents = [];
  List<Map<String, dynamic>> _pastEvents = [];
  List<Map<String, dynamic>> _announcements = [];
  bool _isLoading = true;
  bool _loadFailed = false;
  String _selectedCategory = 'All';

  // Cached section widgets — rebuilt only when data or category changes
  List<Widget>? _cachedSections;
  String? _cachedSectionsCategory;

  final List<String> _categories = [
    'All',
    'Announcements',
    'Workshops',
    'Tech Talks',
    'Hackathons',
    'Meetups',
    'Seminars',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _loadFailed = false;
      _cachedSections = null;
    });
    try {
      final auth = ref.read(authProvider);
      final futures = await Future.wait([
        _supabase
            .from('events')
            .select(
              'id, title, date, location, type, description, poster_url, is_paid, member_price',
            )
            .order('date', ascending: true),
        _supabase
            .from('announcements')
            .select('id, title, content, visibility, created_at')
            .order('created_at', ascending: false),
        _supabase
            .from('member_attendance')
            .select('id')
            .eq('user_id', auth.user?.id ?? ''),
      ]);
      if (mounted) {
        final allEvents = (futures[0] as List).cast<Map<String, dynamic>>();
        final now = DateTime.now();

        final ongoing = <Map<String, dynamic>>[];
        final upcoming = <Map<String, dynamic>>[];
        final past = <Map<String, dynamic>>[];

        final todayStr =
            "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";

        for (var e in allEvents) {
          final eventDate = e['date'] as String? ?? '';
          final eventDateOnly = eventDate.split('T').first;
          if (eventDateOnly == todayStr) {
            ongoing.add(e);
          } else if (eventDateOnly.compareTo(todayStr) > 0) {
            upcoming.add(e);
          } else {
            past.add(e);
          }
        }

        setState(() {
          _ongoingEvents = ongoing;
          _upcomingEvents = upcoming;
          _pastEvents = past.reversed.toList(); // most recent past first
          _announcements = (futures[1] as List).cast<Map<String, dynamic>>();
          // futures[2] = attendance count (reserved for future badge display)
          _isLoading = false;
          _cachedSections = null; // invalidate section cache on data refresh
        });
      }
    } catch (e) {
      _loadFailed = true;
      if (mounted) {
        setState(() {
          _isLoading = false;
          _cachedSections = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final firstName = auth.name.isNotEmpty
        ? auth.name.split(' ').first
        : 'Member';
    final membershipValid = auth.isMembershipValid;

    return Scaffold(
      backgroundColor: MemberTheme.mBackground,
      body: Stack(
        children: [
          // Background soft design halo
          Positioned(
            top: -50,
            left: -50,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFC5D9EB).withOpacity(0.3),
              ),
            ),
          ),

          SafeArea(
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: CampusHeader(
                    name: firstName,
                    product: 'Mlynq',
                    subtitle: 'Your people. Your moments. Your campus.',
                    onProfile: () => context.push('/membership'),
                  ),
                ),
                SliverToBoxAdapter(
                  child: CampusSpotlight(
                    learning: false,
                    status: membershipValid
                        ? 'Active ISTE member'
                        : 'Guest account',
                    onOpen: () => context.push('/qr'),
                  ),
                ),
                SliverToBoxAdapter(
                  child: CampusActionGrid(
                    children: [
                      CampusActionCard(
                        title: 'Show up.',
                        subtitle: 'Explore campus events',
                        icon: Icons.calendar_month_outlined,
                        tint: MemberTheme.mPastelBlue,
                        onTap: () => context.push('/events'),
                      ),
                      CampusActionCard(
                        title: 'Make it count.',
                        subtitle: 'Your earned certificates',
                        icon: Icons.workspace_premium_outlined,
                        tint: MemberTheme.mPastelPeach,
                        onTap: () => context.push('/certificates'),
                      ),
                    ],
                  ),
                ),
                const SliverToBoxAdapter(
                  child: CampusSectionHeading('Around your campus'),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
                    child: _buildCategoryRow(),
                  ),
                ),

                // Main Card Illustration List
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  sliver: Builder(
                    builder: (context) {
                      // Rebuild sections only when category changes or data reloads
                      if (_cachedSections == null ||
                          _cachedSectionsCategory != _selectedCategory) {
                        _cachedSections = _buildSections();
                        _cachedSectionsCategory = _selectedCategory;
                      }
                      final sections = _cachedSections!;
                      return SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) =>
                              index < sections.length ? sections[index] : null,
                          childCount: sections.length,
                        ),
                      );
                    },
                  ),
                ),
                // Spacer for Bottom Nav padding
                const SliverToBoxAdapter(child: SizedBox(height: 120)),
              ],
            ),
          ),

          // Floating capsule navigation bar
          Positioned(
            bottom: MediaQuery.paddingOf(context).bottom + 12,
            left: 24,
            right: 24,
            child: _buildFloatingBottomNav(),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildSections() {
    if (_loadFailed) {
      return [
        Column(
          children: [
            const Text('We couldn’t load your campus updates.'),
            TextButton(onPressed: _loadData, child: const Text('Try again')),
          ],
        ),
      ];
    }
    if (_isLoading) {
      return [
        const Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: CircularProgressIndicator(),
          ),
        ),
      ];
    }

    final styles = [
      {
        'bg': MemberTheme.mSlate,
        'text': Colors.white,
        'btn': Colors.white,
        'btnText': MemberTheme.mDarkCharcoal,
        'illustration': const MlynqDeskIllustration(
          baseColor: Color(0xFFFBE4D5),
        ),
      },
      {
        'bg': MemberTheme.mPastelLavender,
        'text': MemberTheme.mDarkCharcoal,
        'btn': MemberTheme.mDarkCharcoal,
        'btnText': Colors.white,
        'illustration': const MlynqDeskIllustration(
          baseColor: MemberTheme.mSlate,
        ),
      },
      {
        'bg': MemberTheme.mPastelPeach,
        'text': MemberTheme.mDarkCharcoal,
        'btn': MemberTheme.mDarkCharcoal,
        'btnText': Colors.white,
        'illustration': const MlynqDeskIllustration(
          baseColor: Colors.orangeAccent,
        ),
      },
    ];

    List<Widget> widgets = [];
    int styleIdx = 0;

    void addEventList(
      String title,
      List<Map<String, dynamic>> items,
      bool isAnnouncement,
    ) {
      final filtered = _selectedCategory == 'All'
          ? items
          : (isAnnouncement
                ? (_selectedCategory == 'Announcements' ? items : [])
                : items
                      .where(
                        (e) =>
                            e['type'] == _selectedCategory ||
                            (e['type'] as String?)?.toLowerCase() ==
                                _selectedCategory.toLowerCase(),
                      )
                      .toList());

      if (filtered.isEmpty) return;

      widgets.add(
        Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 16),
          child: Text(
            title,
            style: GoogleFonts.spaceGrotesk(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: MemberTheme.mDarkCharcoal,
            ),
          ),
        ),
      );

      for (var e in filtered) {
        final s = styles[styleIdx % styles.length];
        styleIdx++;

        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: isAnnouncement
                ? _buildPromoCard(
                    title: e['title'] ?? 'Announcement',
                    subtitle: e['content'] ?? 'Updates & Info',
                    backgroundColor: s['bg'] as Color,
                    textColor: s['text'] as Color,
                    btnLabel: 'View Details',
                    btnColor: s['btn'] as Color,
                    btnTextColor: s['btnText'] as Color,
                    illustration: s['illustration'] as Widget,
                    onTap: () {},
                  )
                : _buildEventPromoCard(
                    title: e['title'] ?? 'Event',
                    subtitle: e['type'] ?? 'General Event',
                    backgroundColor: s['bg'] as Color,
                    textColor: s['text'] as Color,
                    illustration: s['illustration'] as Widget,
                    onMoreDetails: () => context.push('/events/${e['id']}'),
                    // Register Now navigates to the same detail screen
                    // where the user can see registration options
                    onRegister: () => context.push('/events/${e['id']}'),
                  ),
          ),
        );
      }
    }

    if (_selectedCategory == 'All' || _selectedCategory == 'Announcements') {
      addEventList('Latest Announcements', _announcements, true);
    }

    if (_selectedCategory != 'Announcements') {
      addEventList('Ongoing Events', _ongoingEvents, false);
      addEventList('Upcoming Events', _upcomingEvents, false);
      addEventList('Past Events', _pastEvents, false);
    }

    if (widgets.isEmpty) {
      return [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            children: [
              const Icon(Icons.event_available_outlined, size: 32),
              const SizedBox(height: 12),
              const Text('Nothing here just yet.'),
              const SizedBox(height: 6),
              const Text('Try another category or check back soon.'),
              TextButton(
                onPressed: _loadData,
                child: const Text('Refresh updates'),
              ),
            ],
          ),
        ),
      ];
    }
    return widgets;
  }

  Widget _buildCategoryRow() {
    return SizedBox(
      height: 44,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat;
          return GestureDetector(
            onTap: () => setState(() => _selectedCategory = cat),
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? MemberTheme.mWhite : Colors.transparent,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isSelected
                      ? MemberTheme.mDarkCharcoal
                      : MemberTheme.mDarkCharcoal.withOpacity(0.08),
                  width: isSelected ? 1.8 : 1,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: MemberTheme.mDarkCharcoal.withOpacity(0.06),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Center(
                child: Text(
                  cat,
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: MemberTheme.mDarkCharcoal,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEventPromoCard({
    required String title,
    required String subtitle,
    required Color backgroundColor,
    required Color textColor,
    required Widget illustration,
    required VoidCallback onMoreDetails,
    required VoidCallback onRegister,
  }) {
    return Container(
      width: double.infinity,
      height: 230,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: StudioCorners.card,
        border: Border.all(color: MemberTheme.mDarkCharcoal, width: 2),
      ),
      child: Stack(
        children: [
          // Illustration alignment
          Positioned(
            bottom: MediaQuery.paddingOf(context).bottom + 12,
            right: 14,
            child: Opacity(
              opacity: 0.8,
              child: SizedBox(width: 140, height: 140, child: illustration),
            ),
          ),

          // Content Left side
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: textColor.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),

                // Two Buttons (More Details & Register Now)
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: onMoreDetails,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: StudioCorners.card,
                            border: Border.all(
                              color: MemberTheme.mDarkCharcoal,
                              width: 1.5,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              'More Details',
                              style: GoogleFonts.spaceGrotesk(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: MemberTheme.mDarkCharcoal,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: GestureDetector(
                        onTap: onRegister,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: MemberTheme.mDarkCharcoal,
                            borderRadius: StudioCorners.card,
                            border: Border.all(
                              color: MemberTheme.mDarkCharcoal,
                              width: 1.5,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              'Register Now',
                              style: GoogleFonts.spaceGrotesk(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoCard({
    required String title,
    required String subtitle,
    required Color backgroundColor,
    required Color textColor,
    required String btnLabel,
    required Color btnColor,
    required Color btnTextColor,
    required Widget illustration,
    required VoidCallback onTap,
  }) {
    return Container(
      width: double.infinity,
      height: 230,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: StudioCorners.card,
        border: Border.all(color: MemberTheme.mDarkCharcoal, width: 2),
      ),
      child: Stack(
        children: [
          // Illustration alignment
          Positioned(
            bottom: MediaQuery.paddingOf(context).bottom + 12,
            right: 14,
            child: illustration,
          ),

          // Content Left side
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: textColor.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),

                // Bottom Button and Icon Action row
                Row(
                  children: [
                    // Pill CTA label
                    GestureDetector(
                      onTap: onTap,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 22,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: btnColor,
                          borderRadius: StudioCorners.card,
                          border: Border.all(
                            color: MemberTheme.mDarkCharcoal,
                            width: 1.5,
                          ),
                        ),
                        child: Text(
                          btnLabel,
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: btnTextColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Black Play button circle
                    GestureDetector(
                      onTap: onTap,
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          color: MemberTheme.mDarkCharcoal,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingBottomNav() => CampusBottomNav(
    selected: 0,
    onSelected: (index) {
      const routes = ['/home', '/events', '/qr', '/certificates'];
      if (index != 0) context.push(routes[index]);
    },
    items: const [
      CampusNavItem('Home', Icons.home_outlined),
      CampusNavItem('Events', Icons.calendar_month_outlined),
      CampusNavItem('My QR', Icons.qr_code_2),
      CampusNavItem('Awards', Icons.workspace_premium_outlined),
    ],
  );
}
