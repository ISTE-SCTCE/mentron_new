import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mentron_flutter/platform/product_access.dart';
import 'package:mentron_flutter/platform/product_switcher.dart';
void main() {
  test('membership alone does not enroll either product',() {
    final profile={'status':'active','is_iste_member':true};
    expect(canOpenProduct(profile,PlatformProduct.mlynq),false);
    expect(canOpenProduct(profile,PlatformProduct.mentron),false);
  });
  test('one enrollment never grants the other product',() {
    final profile={'status':'active','is_mlynq_user':true,'is_mentron_user':false};
    expect(canOpenProduct(profile,PlatformProduct.mlynq),true);
    expect(canOpenProduct(profile,PlatformProduct.mentron),false);
    expect(canOpenProduct({...profile,'is_mentron_user':'true'},PlatformProduct.mentron),false);
  });
  test('suspended users cannot open an enrolled product',() {
    expect(canOpenProduct({'status':'suspended','is_mentron_user':true},PlatformProduct.mentron),false);
    expect(canOpenProduct({'status':'active','is_mlynq_user':true,'suspended_until':'2999-01-01'},PlatformProduct.mlynq),false);
  });
  testWidgets('switcher fits a narrow phone with enlarged text and selects the intended product',(tester) async {
    tester.view.physicalSize=const Size(320,640);
    tester.view.devicePixelRatio=1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    PlatformProduct? picked;
    await tester.pumpWidget(MaterialApp(home:MediaQuery(
      data:const MediaQueryData(size:Size(320,640),textScaler:TextScaler.linear(2)),
      child:Scaffold(body:ProductSwitcher(selected:PlatformProduct.mlynq,onChanged:(value)=>picked=value)),
    )));
    expect(tester.takeException(),isNull);
    await tester.tap(find.text('Mentron'));
    expect(picked,PlatformProduct.mentron);
    expect(tester.takeException(),isNull);
  });
}
