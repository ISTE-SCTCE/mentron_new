import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/department_mapper.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _fullNameController = TextEditingController();
  final _rollNumberController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _yearController = TextEditingController();
  String _selectedRole = 'member';
  bool _isLoading = false;
  String? _detectedDept;

  void _onRollChanged(String roll) {
    final dept = DepartmentMapper.getDepartmentFromRoll(roll);
    setState(() => _detectedDept = dept != 'Other' ? dept : null);
  }

  Future<void> _handleSignup() async {
    if (_fullNameController.text.isEmpty ||
        _rollNumberController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _passwordController.text.isEmpty ||
        _yearController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);

    try {
      final response = await supabase.client.auth.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        data: {
          'full_name': _fullNameController.text.trim(),
          'roll_number': _rollNumberController.text.trim().toUpperCase(),
          'year': int.tryParse(_yearController.text.trim()) ?? 1,
          'role': _selectedRole,
          'department': DepartmentMapper.getDepartmentFromRoll(_rollNumberController.text.trim()),
        },
      );

      if (response.user != null && mounted) {
        // Auto-insert into profiles table
        await supabase.client.from('profiles').upsert({
          'id': response.user!.id,
          'full_name': _fullNameController.text.trim(),
          'roll_number': _rollNumberController.text.trim().toUpperCase(),
          'year': int.tryParse(_yearController.text.trim()) ?? 1,
          'role': _selectedRole,
          'department': DepartmentMapper.getDepartmentFromRoll(_rollNumberController.text.trim()),
          'xp': 0,
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Colors.green,
              content: Text('Account created! Please check your email to verify.'),
            ),
          );
          Navigator.pop(context); // Go back to login
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.withOpacity(0.9),
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
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          LiquidBackground(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
              child: Column(
                children: [
                  // Header
                  const Text(
                    'STEP INTO INNOVATION',
                    style: TextStyle(color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 3),
                  ).animate().fadeIn(),
                  const SizedBox(height: 8),
                  const Text(
                    'Join Mentron',
                    style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                  ).animate().fadeIn(delay: 100.ms),
                  const SizedBox(height: 40),

                  GlassContainer(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildLabel('FULL NAME'),
                        _buildTextField(_fullNameController, 'e.g. Rahul Sharma', Icons.person_outline_rounded),
                        const SizedBox(height: 16),
                        _buildLabel('ROLL NUMBER'),
                        _buildTextField(
                          _rollNumberController,
                          'e.g. 22CS001',
                          Icons.badge_outlined,
                          onChanged: _onRollChanged,
                        ),
                        if (_detectedDept != null) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.check_circle_rounded, color: Colors.greenAccent, size: 12),
                              const SizedBox(width: 6),
                              Text(
                                'Auto-detected: $_detectedDept',
                                style: const TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 16),
                        _buildLabel('EMAIL ADDRESS'),
                        _buildTextField(_emailController, 'your@email.com', Icons.alternate_email_rounded, keyboardType: TextInputType.emailAddress),
                        const SizedBox(height: 16),
                        _buildLabel('PASSWORD'),
                        _buildTextField(_passwordController, 'Create a strong password', Icons.lock_outline_rounded, isPassword: true),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('YEAR'),
                                  _buildTextField(_yearController, '1 - 4', Icons.school_outlined, keyboardType: TextInputType.number),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('ROLE'),
                                  _buildRoleDropdown(),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleSignup,
                          child: _isLoading
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                              : const Text('CREATE ACCOUNT'),
                        ),
                        const SizedBox(height: 20),
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text(
                            'Already in the tribe? Login Now',
                            style: TextStyle(color: AppTheme.accentSecondary, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ).animate().slideY(begin: 0.1, delay: 200.ms).fadeIn(),
                ],
              ),
            ),
          ),
          // Top-right ISTE logo
          Positioned(
            top: 48,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.15),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/images/iste_logo.png',
                  width: 65,
                  height: 65,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ).animate().fadeIn(delay: 1.seconds).slideY(begin: -0.2),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        text,
        style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String hint,
    IconData icon, {
    bool isPassword = false,
    TextInputType keyboardType = TextInputType.text,
    void Function(String)? onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        keyboardType: keyboardType,
        onChanged: onChanged,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 13),
          prefixIcon: Icon(icon, color: Colors.white.withOpacity(0.4), size: 18),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildRoleDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedRole,
          isExpanded: true,
          dropdownColor: AppTheme.surfaceColor,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          onChanged: (val) => setState(() => _selectedRole = val!),
          items: const [
            DropdownMenuItem(value: 'member', child: Text('Normal Member')),
            DropdownMenuItem(value: 'exec', child: Text('Executive Member')),
          ],
        ),
      ),
    );
  }
}
