import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import 'signup_screen.dart';
import 'forgot_password_screen.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/main_scaffold.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim().toLowerCase();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email and password')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false);
      final response = await supabase.signIn(
        email: email,
        password: password,
      );

      if (response.user != null && mounted) {
        // Claim this device as the active session — kicks out any other device.
        await supabase.sessionGuard.claimSession();
        if (mounted) {
          Navigator.pushReplacement(
            context,
            AppTransitions.fade(const MainScaffold()),
          );
        }
      }
    } catch (e) {
      debugPrint('Login error details: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.withValues(alpha: 0.9),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            content: Text(ErrorHandler.friendly(e)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Main content
          LiquidBackground(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Mentron logo
                    Image.asset(
                      'assets/images/mentron_logo.png',
                      width: 200,
                      filterQuality: FilterQuality.high,
                      isAntiAlias: true,
                    ).animate().scale(delay: 200.ms, duration: 600.ms, curve: Curves.elasticOut),
                    const SizedBox(height: 8),
                    Text(
                      'Your Academic Companion',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ).animate().fadeIn(delay: 600.ms),
                    const SizedBox(height: 48),
                    GlassContainer(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'SIGN IN',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              letterSpacing: 4,
                              fontSize: 14,
                              color: AppTheme.accentSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 32),
                          _buildTextField(
                            controller: _emailController,
                            hint: 'Email Address',
                            icon: Icons.alternate_email_rounded,
                          ),
                          const SizedBox(height: 20),
                          _buildTextField(
                            controller: _passwordController,
                            hint: 'Password',
                            icon: Icons.lock_outline_rounded,
                            isPassword: true,
                          ),
                          const SizedBox(height: 12),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () => Navigator.push(
                                context,
                                AppTransitions.slideUp(const ForgotPasswordScreen()),
                              ),
                              child: Text(
                                'Forgot Password?',
                                style: TextStyle(
                                  color: AppTheme.accentSecondary.withValues(alpha: 0.7),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            child: _isLoading
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                              : const Text('ENTER SYSTEM'),
                          ).animate().shimmer(delay: 1.seconds, duration: 2.seconds),
                        ],
                      ),
                    ).animate().slideY(begin: 0.1, delay: 300.ms).fadeIn(),
                    const SizedBox(height: 32),
                    TextButton(
                      onPressed: () => Navigator.push(
                        context,
                        AppTransitions.slideLeft(const SignupScreen()),
                      ),
                      child: const Text(
                        'New here? Create Account →',
                        style: TextStyle(color: AppTheme.accentSecondary, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Top-right ISTE logo
          Positioned(
            top: 48,
            right: 20,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/images/iste_logo.png',
                  width: 60,
                  height: 60,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ).animate().fadeIn(delay: 1.seconds).slideY(begin: -0.2),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword ? _obscurePassword : false,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
          prefixIcon: Icon(icon, color: Colors.white.withValues(alpha: 0.5), size: 20),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                    color: Colors.white.withValues(alpha: 0.4),
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }
}
