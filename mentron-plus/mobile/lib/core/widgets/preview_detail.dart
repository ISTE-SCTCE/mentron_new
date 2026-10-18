import 'package:flutter/material.dart';
import '../theme/world_theme.dart';
import 'campus_widgets.dart';

@immutable
class DetailArguments {
  const DetailArguments(this.title);
  final String title;
}

class PreviewDetail extends StatelessWidget {
  const PreviewDetail({super.key, required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('A closer look')),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Eyebrow('DESIGN PREVIEW'),
        const SizedBox(height: 16),
        Text(title, style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 25),
        Container(
          height: 230,
          decoration: BoxDecoration(
            color: WorldTheme.of(context).surface,
            borderRadius: BorderRadius.circular(24),
          ),
          child: const BookIllustration(),
        ),
        const SizedBox(height: 25),
        Text(
          'A little curiosity can take you somewhere good.',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 14),
        Text(
          'This is a preview of the shared detail layout. Live content, permissions and protected actions connect in the data phase.',
          style: TextStyle(
            color: WorldTheme.of(context).muted,
            height: 1.7,
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 24),
        FilledButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back, size: 17),
          label: const Text('Back to exploring'),
        ),
      ],
    ),
  );
}
