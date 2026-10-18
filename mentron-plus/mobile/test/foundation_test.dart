import 'package:campus_app/main.dart';
import 'package:campus_app/core/theme/world_theme.dart';
import 'package:campus_app/core/widgets/states.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  Future<SharedPreferences> preferences([String world = 'learn']) async {
    SharedPreferences.setMockInitialValues({'campus.world': world});
    return SharedPreferences.getInstance();
  }

  testWidgets('world switch changes navigation and remembers selection', (
    tester,
  ) async {
    final prefs = await preferences();
    await tester.pumpWidget(CampusApp(preferences: prefs));
    await tester.pumpAndSettle();
    expect(find.text('Hey, Alex.'), findsOneWidget);
    await tester.tap(find.text('Campus'));
    await tester.pumpAndSettle();
    expect(prefs.getString('campus.world'), 'campus');
    expect(find.byType(NavigationDestination), findsNWidgets(5));
    expect(find.text('My QR'), findsWidgets);
    // Framework reports uncaught layout errors at test end.
  });
  testWidgets('small screen does not overflow', (tester) async {
    tester.view.physicalSize = const Size(375, 812);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(CampusApp(preferences: await preferences()));
    await tester.pumpAndSettle();
    // Framework reports uncaught layout errors at test end.
    await tester.drag(
      find.byType(CustomScrollView).first,
      const Offset(0, -600),
    );
    await tester.pumpAndSettle();
    // Framework reports uncaught layout errors at test end.
  });
  testWidgets('reduced-motion loader stays static', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: campusTheme(CampusWorld.learn),
        home: const MediaQuery(
          data: MediaQueryData(disableAnimations: true),
          child: SignatureLoader(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.hasRunningAnimations, isFalse);
  });
  testWidgets('restored Campus preference starts in Campus', (tester) async {
    await tester.pumpWidget(
      CampusApp(preferences: await preferences('campus')),
    );
    await tester.pumpAndSettle();
    expect(find.text('YOUR PEOPLE. YOUR POSSIBILITIES.'), findsOneWidget);
    expect(find.text('My QR'), findsWidgets);
  });
}
