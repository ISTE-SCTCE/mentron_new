import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/main_scaffold.dart';

class ExecomLoginScreen extends StatefulWidget {
  const ExecomLoginScreen({super.key});

  @override
  State<ExecomLoginScreen> createState() => _ExecomLoginScreenState();
}

class _ExecomLoginScreenState extends State<ExecomLoginScreen> {
  final _operatorIdController = TextEditingController();
  final _accessKeyController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  Future<void> _handleLogin() async {
    final operatorId = _operatorIdController.text.trim().toLowerCase();
    final accessKey = _accessKeyController.text.trim();

    if (operatorId.isEmpty || accessKey.isEmpty) {
      _showAccessDenied('MISSING CREDENTIALS');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false);
      
      // 1. Authenticate with Supabase
      final response = await supabase.signIn(email: operatorId, password: accessKey);

      if (response.user != null && mounted) {
        // 2. Check role from profiles
        final profile = await supabase.client
            .from('profiles')
            .select('role')
            .eq('id', response.user!.id)
            .single();

        final role = profile['role'] as String?;
        if (role == 'execom' || role == 'core') {
          // Log success to audit_log
          await supabase.client.from('audit_log').insert({
            'user_id': response.user!.id,
            'action': 'execom_login',
            'entity': 'auth',
            'details': 'Successful execom login',
          });

          await supabase.sessionGuard.claimSession();
          if (mounted) {
            Navigator.pushAndRemoveUntil(
              context,
              AppTransitions.fade(const MainScaffold()),
              (route) => false, // Remove all previous routes to start fresh
            );
          }
        } else {
          // Unauthorized role
          // Log failed attempt to audit_log
          await supabase.client.from('audit_log').insert({
            'user_id': response.user!.id,
            'action': 'execom_login_denied',
            'entity': 'auth',
            'details': 'Unauthorized role attempt: $role',
          });
          
          // Sign out immediately
          await supabase.signOut();
          _showAccessDenied('ACCESS DENIED. UNAUTHORIZED ROLE.');
        }
      }
    } catch (e) {
      debugPrint('Execom Login error details: $e');
      _showAccessDenied('ACCESS DENIED. INVALID CREDENTIALS.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showAccessDenied(String message) {
    if (!mounted) return;
    HapticFeedback.heavyImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: Colors.red, width: 2),
        ),
        content: Text(
          message,
          style: GoogleFonts.shareTechMono(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Dark theme
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                Icons.admin_panel_settings,
                color: Colors.redAccent,
                size: 80,
              ).animate().scale(
                duration: 500.ms,
                curve: Curves.easeOutBack,
              ),
              const SizedBox(height: 24),
              Text(
                'RESTRICTED ACCESS',
                style: GoogleFonts.shareTechMono(
                  color: Colors.redAccent,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 300.ms),
              const SizedBox(height: 8),
              Text(
                'EXECOM TERMINAL',
                style: GoogleFonts.shareTechMono(
                  color: Colors.grey[500],
                  fontSize: 14,
                  letterSpacing: 4,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 500.ms),
              const SizedBox(height: 48),
              _buildTerminalTextField(
                controller: _operatorIdController,
                hint: 'OPERATOR ID (EMAIL)',
                icon: Icons.badge_outlined,
              ).animate().slideX(begin: 0.1).fadeIn(delay: 700.ms),
              const SizedBox(height: 24),
              _buildTerminalTextField(
                controller: _accessKeyController,
                hint: 'ACCESS KEY',
                icon: Icons.key_outlined,
                isPassword: true,
              ).animate().slideX(begin: 0.1).fadeIn(delay: 800.ms),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: Colors.redAccent,
                  side: const BorderSide(color: Colors.redAccent, width: 2),
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.redAccent,
                        ),
                      )
                    : Text(
                        'INITIALIZE OVERRIDE',
                        style: GoogleFonts.shareTechMono(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
              ).animate().fadeIn(delay: 1000.ms),
              const SizedBox(height: 24),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  'ABORT',
                  style: GoogleFonts.shareTechMono(
                    color: Colors.grey[600],
                    fontSize: 14,
                    letterSpacing: 2,
                  ),
                ),
              ).animate().fadeIn(delay: 1100.ms),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTerminalTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        border: Border.all(color: Colors.redAccent.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword ? _obscurePassword : false,
        cursorColor: Colors.redAccent,
        style: GoogleFonts.shareTechMono(
          color: Colors.white,
          fontSize: 16,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.shareTechMono(
            color: Colors.grey[800],
          ),
          prefixIcon: Icon(icon, color: Colors.redAccent, size: 20),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off
                        : Icons.visibility,
                    color: Colors.redAccent,
                    size: 20,
                  ),
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
        ),
      ),
    );
  }
}
