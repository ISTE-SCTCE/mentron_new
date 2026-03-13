import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/department_mapper.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../auth/screens/login_screen.dart';
import '../../../core/utils/app_transitions.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    if (userId == null) {
      setState(() => _isLoading = false);
      return;
    }
    try {
      final response = await supabase.client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      if (mounted)
        setState(() {
          _profile = response;
          _isLoading = false;
        });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleLogout() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    await supabase.signOut();
    if (mounted) {
      // Remove all routes and go to login — clears the whole back stack
      Navigator.of(context).pushAndRemoveUntil(
        AppTransitions.fade(const LoginScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _showChangePasswordDialog() async {
    final oldPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool isChanging = false;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: AppTheme.surfaceColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: const Text(
              'Change Password',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Enter your current and new password below.',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  _buildDialogTextField(
                    controller: oldPasswordController,
                    hint: 'Current Password',
                    obscure: true,
                  ),
                  const SizedBox(height: 12),
                  _buildDialogTextField(
                    controller: newPasswordController,
                    hint: 'New Password',
                    obscure: true,
                  ),
                  const SizedBox(height: 12),
                  _buildDialogTextField(
                    controller: confirmPasswordController,
                    hint: 'Confirm New Password',
                    obscure: true,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: isChanging ? null : () => Navigator.pop(context),
                child: const Text(
                  'Cancel',
                  style: TextStyle(color: AppTheme.textMuted),
                ),
              ),
              ElevatedButton(
                onPressed: isChanging
                    ? null
                    : () async {
                        final oldPass = oldPasswordController.text.trim();
                        final newPass = newPasswordController.text.trim();
                        final confPass = confirmPasswordController.text.trim();

                        if (oldPass.isEmpty ||
                            newPass.isEmpty ||
                            confPass.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Please fill all fields'),
                            ),
                          );
                          return;
                        }
                        if (newPass.length < 6) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'New password must be at least 6 characters',
                              ),
                            ),
                          );
                          return;
                        }
                        if (newPass != confPass) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('New passwords do not match'),
                            ),
                          );
                          return;
                        }

                        setDialogState(() => isChanging = true);
                        try {
                          final supabaseService = Provider.of<SupabaseService>(
                            context,
                            listen: false,
                          );
                          final client = supabaseService.client;
                          final email = client.auth.currentUser?.email;

                          if (email == null)
                            throw Exception('No logged in user found');

                          // 1. Verify old password by attempting a quick re-login
                          try {
                            await client.auth.signInWithPassword(
                              email: email,
                              password: oldPass,
                            );
                          } catch (e) {
                            throw Exception('Incorrect current password.');
                          }

                          // 2. Update to new password
                          await client.auth.updateUser(
                            UserAttributes(password: newPass),
                          );

                          if (mounted) {
                            Navigator.pop(context); // Close dialog
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                backgroundColor: Colors.green,
                                content: Text('Password updated successfully!'),
                              ),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: Colors.redAccent,
                                content: Text(
                                  e.toString().replaceAll('Exception: ', ''),
                                ),
                              ),
                            );
                          }
                        } finally {
                          if (mounted) setDialogState(() => isChanging = false);
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accentSecondary,
                  foregroundColor: Colors.black,
                ),
                child: isChanging
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.black,
                        ),
                      )
                    : const Text(
                        'Update_Password',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDialogTextField({
    required TextEditingController controller,
    required String hint,
    bool obscure = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        style: const TextStyle(color: Colors.white, fontSize: 13),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
            size: 18,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton.icon(
            onPressed: _handleLogout,
            icon: const Icon(
              Icons.logout_rounded,
              color: Colors.redAccent,
              size: 16,
            ),
            label: const Text(
              'Logout',
              style: TextStyle(
                color: Colors.redAccent,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  color: AppTheme.accentSecondary,
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                child: Column(
                  children: [
                    // Avatar
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.accentPrimary,
                            AppTheme.accentSecondary,
                          ],
                        ),
                      ),
                      child: Center(
                        child: Text(
                          (_profile?['full_name'] ?? 'U')
                              .substring(0, 1)
                              .toUpperCase(),
                          style: const TextStyle(
                            fontSize: 40,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ).animate().scale(
                      duration: 500.ms,
                      curve: Curves.elasticOut,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _profile?['full_name'] ?? 'Student',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ).animate().fadeIn(delay: 150.ms),
                    const SizedBox(height: 4),
                    Text(
                      _profile?['role']?.toString().toUpperCase() ?? 'MEMBER',
                      style: const TextStyle(
                        color: AppTheme.accentSecondary,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 3,
                      ),
                    ).animate().fadeIn(delay: 200.ms),
                    const SizedBox(height: 40),

                    // XP Card
                    GlassContainer(
                      padding: const EdgeInsets.all(28),
                      border: Border.all(
                        color: AppTheme.accentPrimary.withOpacity(0.3),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Column(
                            children: [
                              const Text('⚡', style: TextStyle(fontSize: 32)),
                              const SizedBox(height: 8),
                              Text(
                                '${_profile?['xp'] ?? 0}',
                                style: const TextStyle(
                                  fontSize: 40,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                              const Text(
                                'EXPERIENCE POINTS',
                                style: TextStyle(
                                  color: AppTheme.textMuted,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 250.ms),
                    const SizedBox(height: 16),

                    // Info Cards
                    GlassContainer(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          _buildInfoRow(
                            'Roll Number',
                            _profile?['roll_number'] ?? 'N/A',
                            Icons.badge_outlined,
                          ),
                          _buildInfoRow('Department', () {
                            final roll = _profile?['roll_number'] as String?;
                            // Always auto-detect from roll number first (most reliable)
                            final detected =
                                DepartmentMapper.getDepartmentFromRoll(roll);
                            if (detected != 'Other')
                              return DepartmentMapper.getName(detected);

                            // Fallback: use stored department code if meaningful
                            final stored =
                                (_profile?['department'] as String? ?? '')
                                    .trim();
                            final storedLower = stored.toLowerCase();
                            if (stored.isNotEmpty &&
                                storedLower != 'other' &&
                                storedLower != 'null') {
                              return DepartmentMapper.getName(stored);
                            }
                            return 'Update your roll number';
                          }(), Icons.school_outlined),
                          _buildInfoRow(
                            'Year',
                            'Year ${_profile?['year'] ?? 'N/A'}',
                            Icons.calendar_today_rounded,
                          ),
                          _buildInfoRow(
                            'Email',
                            Provider.of<SupabaseService>(
                                  context,
                                  listen: false,
                                ).currentUser?.email ??
                                'N/A',
                            Icons.alternate_email_rounded,
                            isLast: true,
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 350.ms),

                    // Exec Settings
                    if (_profile?['role'] == 'exec' ||
                        _profile?['role'] == 'admin') ...[
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _showChangePasswordDialog,
                          icon: const Icon(Icons.lock_reset_rounded, size: 20),
                          label: const Text(
                            'Change Password',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white.withOpacity(0.05),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(
                                color: Colors.white.withOpacity(0.1),
                              ),
                            ),
                            elevation: 0,
                          ),
                        ),
                      ).animate().fadeIn(delay: 450.ms),
                    ],
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value,
    IconData icon, {
    bool isLast = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.accentSecondary, size: 18),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
