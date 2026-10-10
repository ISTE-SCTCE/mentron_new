import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router.dart';
import 'core/theme.dart';
class MemberApp extends ConsumerWidget {
  const MemberApp({super.key});
  @override
  Widget build(BuildContext context,WidgetRef ref) {
    return MaterialApp.router(
      title:'Mlynq',debugShowCheckedModeBanner:false,
      theme:MemberTheme.darkTheme,routerConfig:ref.watch(routerProvider),
    );
  }
}
