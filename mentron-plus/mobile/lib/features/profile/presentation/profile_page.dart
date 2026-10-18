import 'package:flutter/material.dart';
import '../../../core/theme/world_theme.dart';
import '../../../core/widgets/campus_widgets.dart';
import '../../../core/widgets/states.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({
    super.key,
    required this.onNavigate,
    required this.onPerformance,
  });
  final void Function(String) onNavigate;
  final ValueChanged<bool> onPerformance;
  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _overlay = false;
  String _state = 'Ready';
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(24),
    children: [
      const Eyebrow('YOUR OWN CORNER OF CAMPUS'),
      const SizedBox(height: 13),
      Text(
        'Good to have\nyou here.',
        style: Theme.of(context).textTheme.headlineLarge,
      ),
      const SizedBox(height: 25),
      Container(
        padding: const EdgeInsets.all(25),
        decoration: BoxDecoration(
          color: WorldTheme.of(context).surface,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 35,
              backgroundColor: Color(0xFFE1D5BD),
              child: Text(
                'AM',
                style: TextStyle(fontSize: 22, color: Color(0xFF756043)),
              ),
            ),
            const SizedBox(height: 17),
            Text('Alex Morgan', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text(
              'Electronics · Semester 4',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 12),
            const Eyebrow('SAMPLE STUDENT PROFILE'),
          ],
        ),
      ),
      const SizedBox(height: 20),
      for (final item in [
        ('Saved notes', 'Notes', Icons.bookmark_outline),
        ('Certificates', 'Certificates', Icons.workspace_premium_outlined),
        ('Attendance & history', 'Attendance', Icons.history),
        ('Downloads', 'Downloads', Icons.download_outlined),
      ])
        ListTile(
          contentPadding: const EdgeInsets.symmetric(vertical: 7),
          leading: Icon(item.$3, color: WorldTheme.of(context).accent),
          title: Text(item.$1, style: const TextStyle(fontSize: 14)),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => widget.onNavigate(item.$2),
        ),
      const SectionHeading('The foundation, in motion.'),
      const Text('Preview states', style: TextStyle(fontSize: 12)),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        runSpacing: 5,
        children: [
          for (final label in ['Ready', 'Loading', 'Empty', 'Error', 'Offline'])
            ChoiceChip(
              label: Text(label, style: const TextStyle(fontSize: 10)),
              selected: _state == label,
              onSelected: (_) => setState(() => _state = label),
            ),
        ],
      ),
      const SizedBox(height: 20),
      OfflineBanner(visible: _state == 'Offline'),
      if (_state == 'Loading')
        const SkeletonSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonBox(height: 150),
              SizedBox(height: 18),
              SkeletonBox(width: 200),
              SizedBox(height: 12),
              SkeletonBox(width: 140),
              SizedBox(height: 24),
              Center(child: SignatureLoader()),
            ],
          ),
        ),
      if (_state == 'Empty' || _state == 'Error')
        EmptyState(
          title: _state == 'Error'
              ? 'That didn’t quite load.'
              : 'A little room for something new.',
          message: _state == 'Error'
              ? 'Your place is saved. Give it another try.'
              : 'Your saved things will find a home here.',
          action: 'Try again',
          icon: _state == 'Error'
              ? Icons.cloud_off_outlined
              : Icons.layers_outlined,
          onAction: () => setState(() => _state = 'Ready'),
        ),
      SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: const Text(
          'Performance overlay',
          style: TextStyle(fontSize: 13),
        ),
        subtitle: const Text(
          'Development preview',
          style: TextStyle(fontSize: 10),
        ),
        value: _overlay,
        onChanged: (v) {
          setState(() => _overlay = v);
          widget.onPerformance(v);
        },
      ),
      const SizedBox(height: 20),
      const Text(
        'Design foundation · Sample data\nLive account actions arrive after the data phase.',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 10, height: 1.7, color: Color(0xFF83768F)),
      ),
    ],
  );
}
