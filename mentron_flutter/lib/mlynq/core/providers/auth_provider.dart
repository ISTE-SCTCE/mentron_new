import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MemberAuthState {
  final User? user;
  final Map<String,dynamic>? profile;
  final bool isLoading;
  final String? error;
  const MemberAuthState({this.user,this.profile,this.isLoading=true,this.error});
  bool get isAuthenticated => user != null && profile != null && profile!['status']=='active'
      && !(DateTime.tryParse(profile!['suspended_until']?.toString()??'')?.isAfter(DateTime.now())??false);
  bool get isIsteMember => profile?['is_iste_member']==true;
  bool get isRegistered => profile?['is_registered']==true;
  bool get isMlynqUser => profile?['is_mlynq_user']==true;
  bool get isMentronUser => profile?['is_mentron_user']==true;
  String get name => profile?['name'] as String? ?? '';
  String get role => profile?['role'] as String? ?? 'member';
  String get membershipId => profile?['iste_membership_id'] as String? ?? '';
  DateTime? get validityEnd => DateTime.tryParse(profile?['expiry_date']?.toString()??'');
  bool get isMembershipValid => isIsteMember && membershipId.isNotEmpty
      && (validityEnd==null || !validityEnd!.isBefore(DateTime.now()));
  int? get daysUntilExpiry => validityEnd?.difference(DateTime.now()).inDays;
}
class AuthNotifier extends StateNotifier<MemberAuthState> {
  AuthNotifier():super(const MemberAuthState()) {
    _subscription = _client.auth.onAuthStateChange.listen((event) {
      Future(() { if(mounted) return _loadProfile(event.session?.user); });
    });
    _loadProfile(_client.auth.currentUser);
  }
  final _client = Supabase.instance.client;
  StreamSubscription<AuthState>? _subscription;
  Map<String,dynamic>? _pending;
  int _request=0;
  @override
  void dispose() { ++_request; _subscription?.cancel(); super.dispose(); }
  Future<void> _loadProfile(User? user) async {
    final request = ++_request;
    if(!mounted) return;
    state = MemberAuthState(user:user,isLoading:true);
    try {
      if(user==null) {
        state = const MemberAuthState(isLoading:false); return;
      }
      final profile = await _client.from('profiles').select().eq('id',user.id).single();
      if(!mounted || request!=_request) return;
      state = MemberAuthState(user:user,profile:{
        ...profile,'membership_id':profile['iste_membership_id'],'validity_end':profile['expiry_date'],
      },isLoading:false);
    } catch(_) {
      if(mounted && request==_request) state = MemberAuthState(user:user,isLoading:false,
        error:'Your profile could not be loaded. Please retry.');
    }
  }
  Future<void> setPendingSignUpData(Map<String,dynamic> data) async {
    _pending = {for(final field in ['name','phone','roll_number','college'])
      if(data[field] != null) field:data[field].toString().trim()};
  }
  Future<Map<String,dynamic>?> checkEmailMembership(String email) async {
    // An email address is never evidence of membership or an authorization claim.
    // Existing and new accounts can both verify an email before reading their own profile.
    return {'status':'guest_login','is_iste_member':false};
  }
  Future<void> requestOTP(String email,{bool isSignUp=false}) async {
    await _client.auth.signInWithOtp(
      email:email.trim().toLowerCase(),shouldCreateUser:isSignUp,
      data:isSignUp ? _pending : null,
    );
  }
  Future<void> verifyOTP(String email,String otp) async {
    final response = await _client.auth.verifyOTP(email:email.trim().toLowerCase(),token:otp.trim(),type:OtpType.email);
    if(response.user==null) throw const AuthException('Verification failed. Please try again.');
    if(_pending != null && _pending!.isNotEmpty) {
      await _client.from('profiles').update(_pending!).eq('id',response.user!.id);
    }
    await _client.rpc('enroll_current_user',params:{'p_product':'mlynq'});
    _pending=null;
    await _loadProfile(response.user);
  }
  Future<void> signOut() async {
    ++_request; _pending=null; await _client.auth.signOut();
    if(mounted) state = const MemberAuthState(isLoading:false);
  }
  Future<void> refresh() => _loadProfile(_client.auth.currentUser);
}
final authProvider = StateNotifierProvider<AuthNotifier,MemberAuthState>((ref) => AuthNotifier());
