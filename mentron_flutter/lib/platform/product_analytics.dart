import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
class ProductRouteObserver extends NavigatorObserver {
  final String product;
  ProductRouteObserver(this.product);
  @override
  void didPush(Route<dynamic> route,Route<dynamic>? previousRoute) {
    super.didPush(route,previousRoute); unawaited(_track(route));
  }
  @override
  void didPop(Route<dynamic> route,Route<dynamic>? previousRoute) {
    super.didPop(route,previousRoute);
    if(previousRoute!=null) unawaited(_track(previousRoute));
  }
  Future<void> _track(Route<dynamic> route) async {
    final client=Supabase.instance.client;
    final user=client.auth.currentUser;
    if(user==null) return;
    const known={'home','events','qr','membership','certificates','notifications','dashboard','notes','projects','marketplace','settings'};
    final name=(route.settings.name??'/').split(RegExp(r'[?#]')).first;
    final template=name.split('/').map((part)=>part.isEmpty||known.contains(part)?part:':item').join('/');
    try {
      await client.from('analytics_events').insert({
        'profile_id':user.id,'product':product,'event_name':'page_view',
        'properties':{'client':'flutter','route':template},
      });
    } catch (_) { /* Analytics never interrupts navigation. */ }
  }
}
