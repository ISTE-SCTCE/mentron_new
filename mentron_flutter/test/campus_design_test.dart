import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mentron_flutter/design/campus_widgets.dart';
import 'package:mentron_flutter/platform/product_access.dart';
import 'package:mentron_flutter/platform/product_switcher.dart';

void main() {
  setUpAll(() async {
    final icons = FontLoader('MaterialIcons');
    icons.addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
    await icons.load();
    final font = Platform.environment['PREVIEW_FONT'];
    if (font != null) {
      final loader = FontLoader('PreviewSans');
      loader.addFont(
        Future.value(ByteData.sublistView(File(font).readAsBytesSync())),
      );
      await loader.load();
    }
  });

  for (final learning in [true, false]) {
    for (final width in [320.0, 390.0, 900.0]) {
      for (final scale in [1.0, 2.0]) {
        testWidgets(
          '${learning ? "Mentron" : "Mlynq"} at $width with text scale $scale',
          (tester) async {
            tester.view.physicalSize = Size(width, 1050);
            tester.view.devicePixelRatio = 1;
            addTearDown(tester.view.resetPhysicalSize);
            addTearDown(tester.view.resetDevicePixelRatio);
            var opened = false;
            var selected = -1;
            final captureKey = GlobalKey();
            await tester.pumpWidget(
              MaterialApp(
                theme: ThemeData(fontFamily: 'PreviewSans', useMaterial3: true),
                builder: (context, child) => MediaQuery(
                  data: MediaQuery.of(
                    context,
                  ).copyWith(textScaler: TextScaler.linear(scale)),
                  child: child!,
                ),
                home: RepaintBoundary(
                  key: captureKey,
                  child: Scaffold(
                    backgroundColor: learning
                        ? const Color(0xfff8f6ff)
                        : const Color(0xffebf3fc),
                    body: Column(
                      children: [
                        ProductSwitcher(
                          selected: learning
                              ? PlatformProduct.mentron
                              : PlatformProduct.mlynq,
                          onChanged: (_) {},
                        ),
                        Expanded(
                          child: SingleChildScrollView(
                            child: Column(
                              children: [
                                CampusHeader(
                                  name: 'Alex',
                                  product: learning ? 'Mentron' : 'Mlynq',
                                  subtitle: learning
                                      ? 'Your study space. Your next possibility.'
                                      : 'Your people. Your moments. Your campus.',
                                  onProfile: () {},
                                  onCommunity: learning ? () {} : null,
                                  onNotifications: learning ? () {} : null,
                                ),
                                CampusSpotlight(
                                  learning: learning,
                                  onOpen: () => opened = true,
                                  status: learning
                                      ? null
                                      : 'Active ISTE member',
                                  notesCount: learning ? 247 : null,
                                  xp: learning ? 120 : null,
                                ),
                                if (learning)
                                  const CampusSectionHeading('Quick Actions'),
                                CampusActionGrid(
                                  children: [
                                    CampusActionCard(
                                      title: learning
                                          ? 'Study Notes'
                                          : 'Show up.',
                                      subtitle: learning
                                          ? 'Notes & PYQs'
                                          : 'Explore campus events',
                                      icon: learning
                                          ? Icons.menu_book_outlined
                                          : Icons.calendar_month_outlined,
                                      tint: learning
                                          ? const Color(0xffeeecff)
                                          : const Color(0xffd9e9f9),
                                      onTap: () {},
                                    ),
                                    CampusActionCard(
                                      title: learning
                                          ? 'Projects'
                                          : 'Make it count.',
                                      subtitle: learning
                                          ? 'Build & earn XP'
                                          : 'Your earned certificates',
                                      icon: learning
                                          ? Icons.rocket_launch_outlined
                                          : Icons.workspace_premium_outlined,
                                      tint: const Color(0xfffbE4D5),
                                      onTap: () {},
                                    ),
                                  ],
                                ),
                                CampusSectionHeading(
                                  learning
                                      ? 'Featured Courses'
                                      : 'Around your campus',
                                  onSeeAll: () {},
                                ),
                                const SizedBox(height: 100),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    bottomNavigationBar: Padding(
                      padding: const EdgeInsets.fromLTRB(8, 0, 8, 12),
                      child: CampusBottomNav(
                        learning: learning,
                        selected: 0,
                        onSelected: (i) => selected = i,
                        items: learning
                            ? const [
                                CampusNavItem('Home', Icons.home_outlined),
                                CampusNavItem(
                                  'Study',
                                  Icons.menu_book_outlined,
                                ),
                                CampusNavItem(
                                  'Projects',
                                  Icons.assignment_outlined,
                                ),
                                CampusNavItem(
                                  'Shop',
                                  Icons.shopping_bag_outlined,
                                ),
                                CampusNavItem('Saved', Icons.download_outlined),
                                CampusNavItem(
                                  'Inbox',
                                  Icons.notifications_outlined,
                                ),
                              ]
                            : const [
                                CampusNavItem('Home', Icons.home_outlined),
                                CampusNavItem(
                                  'Events',
                                  Icons.calendar_month_outlined,
                                ),
                                CampusNavItem('My QR', Icons.qr_code_2),
                                CampusNavItem(
                                  'Awards',
                                  Icons.workspace_premium_outlined,
                                ),
                              ],
                      ),
                    ),
                  ),
                ),
              ),
            );
            await tester.pumpAndSettle();
            expect(tester.takeException(), isNull);
            final output = Platform.environment['PREVIEW_OUTPUT'];
            if (output != null && width == 390 && scale == 1) {
              final boundary =
                  captureKey.currentContext!.findRenderObject()!
                      as RenderRepaintBoundary;
              await tester.runAsync(() async {
                final image = await boundary.toImage(pixelRatio: 2);
                final bytes = await image.toByteData(
                  format: ui.ImageByteFormat.png,
                );
                await Directory(output).create(recursive: true);
                await File(
                  '$output/flutter-${learning ? "mentron" : "mlynq"}.png',
                ).writeAsBytes(bytes!.buffer.asUint8List());
                image.dispose();
              });
            }
            await tester.ensureVisible(find.byType(FilledButton).last);
            await tester.tap(
              find.text(learning ? 'Open study library' : 'Open attendance QR'),
            );
            expect(opened, isTrue);
            await tester.tap(find.text(learning ? 'Saved' : 'Awards'));
            expect(selected, learning ? 4 : 3);
            expect(tester.takeException(), isNull);
          },
        );
      }
    }
  }
}
