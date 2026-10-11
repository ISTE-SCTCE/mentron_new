import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mentron_flutter/design/creative_motion.dart';
import 'package:mentron_flutter/core/utils/app_transitions.dart';

void main() {
  testWidgets('Reduced motion shows entrance content immediately', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(disableAnimations: true),
          child: CreativeEntrance(child: Text('Visible content')),
        ),
      ),
    );
    expect(find.text('Visible content'), findsOneWidget);
    expect(find.byType(TweenAnimationBuilder<double>), findsNothing);
    expect(find.byType(Opacity), findsNothing);
  });

  testWidgets(
    'Creative routes preserve push, back and reduced-motion visibility',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(disableAnimations: true),
            child: child!,
          ),
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () => Navigator.of(context).push(
                  AppTransitions.slideLeft(
                    const Scaffold(body: Text('Project details')),
                  ),
                ),
                child: const Text('Open project'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open project'));
      await tester.pump();
      // Navigator lays out a newly pushed route offstage in its first frame.
      await tester.pump(const Duration(milliseconds: 16));
      expect(find.text('Project details'), findsOneWidget);
      await tester.pumpAndSettle();
      final navigator = tester.state<NavigatorState>(find.byType(Navigator));
      navigator.pop();
      await tester.pumpAndSettle();
      expect(find.text('Open project'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
