import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
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
  String? _selectedYear;
  String? _selectedDept;
  bool _isLoading = false;

  Future<void> _handleSignup() async {
    if (_fullNameController.text.isEmpty ||
        _rollNumberController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _passwordController.text.isEmpty ||
        _selectedYear == null ||
        _selectedDept == null) {
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
          'year': int.tryParse(_selectedYear!) ?? 1,
          'role': 'member',
          'department': _selectedDept,
        },
      );

      if (response.user != null && mounted) {
        // Fetch existing profile to prevent role downgrade
        final existing = await supabase.client
            .from('profiles')
            .select('role')
            .eq('id', response.user!.id)
            .maybeSingle();
        
        String newRole = 'member';
        if (existing != null) {
          final oldRole = existing['role'] as String?;
          if (oldRole == 'panel' || oldRole == 'exec') {
            newRole = oldRole;
          }
        }

        await supabase.client.from('profiles').upsert({
          'id': response.user!.id,
          'full_name': _fullNameController.text.trim(),
          'roll_number': _rollNumberController.text.trim().toUpperCase(),
          'year': int.tryParse(_selectedYear!) ?? 1,
          'role': newRole,
          'department': _selectedDept,
          'xp': 0,
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Colors.green,
              content: Text('Account created! Please check your email to verify.'),
            ),
          );
          Navigator.pop(context);
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
                        ),
                        const SizedBox(height: 16),
                        _buildLabel('EMAIL ADDRESS'),
                        _buildTextField(_emailController, 'your@email.com', Icons.alternate_email_rounded, keyboardType: TextInputType.emailAddress),
                        const SizedBox(height: 16),
                        _buildLabel('PASSWORD'),
                        _buildTextField(_passwordController, 'Create a strong password', Icons.lock_outline_rounded, isPassword: true),
                        const SizedBox(height: 16),
                        // Year + Department row
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('YEAR'),
                                  _buildDropdown(
                                    value: _selectedYear,
                                    hint: 'Year',
                                    icon: Icons.school_outlined,
                                    items: const ['1', '2', '3', '4'],
                                    labels: const ['1st Year', '2nd Year', '3rd Year', '4th Year'],
                                    onChanged: (val) => setState(() => _selectedYear = val),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('DEPARTMENT'),
                                  _buildDropdown(
                                    value: _selectedDept,
                                    hint: 'Dept',
                                    icon: Icons.business_outlined,
                                    items: const ['CSE', 'ECE', 'ME', 'MEA', 'BT'],
                                    labels: const ['CSE', 'ECE', 'Mechanical', 'Automobile', 'Biotech'],
                                    onChanged: (val) => setState(() => _selectedDept = val),
                                  ),
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

  Widget _buildDropdown({
    required String? value,
    required String hint,
    required IconData icon,
    required List<String> items,
    required List<String> labels,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          dropdownColor: AppTheme.surfaceColor,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          hint: Row(children: [
            Icon(icon, color: Colors.white.withOpacity(0.3), size: 16),
            const SizedBox(width: 8),
            Text(hint, style: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 13)),
          ]),
          onChanged: onChanged,
          items: List.generate(items.length, (i) => DropdownMenuItem(
            value: items[i],
            child: Text(labels[i]),
          )),
        ),
      ),
    );
  }
}
