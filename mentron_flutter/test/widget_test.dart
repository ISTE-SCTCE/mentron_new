import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mentron_flutter/design/campus_widgets.dart';

void main() {
  testWidgets('Header keeps profile, community and unread inbox accessible', (
    tester,
  ) async {
    var profile = 0, community = 0, inbox = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CampusHeader(
            name: 'Alex',
            product: 'Mentron',
            subtitle: 'Your study space',
            unread: 3,
            onProfile: () => profile++,
            onCommunity: () => community++,
            onNotifications: () => inbox++,
          ),
        ),
      ),
    );
    await tester.tap(find.byTooltip('Your profile'));
    await tester.tap(find.byTooltip('Community discussions'));
    await tester.tap(find.byTooltip('Notifications, 3 unread'));
    expect([profile, community, inbox], [1, 1, 1]);
    expect(tester.takeException(), isNull);
  });
}
