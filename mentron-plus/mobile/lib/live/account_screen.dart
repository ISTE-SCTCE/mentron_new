import 'package:flutter/material.dart';
import 'account_repository.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key, this.recovery = false, this.onRecovered});
  final bool recovery;
  final VoidCallback? onRecovered;
  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final form = GlobalKey<FormState>();
  final email = TextEditingController();
  final password = TextEditingController();
  final name = TextEditingController();
  bool signup = false, reset = false, busy = false, show = false;
  String? message, error;
  @override
  void dispose() {
    email.dispose();
    password.dispose();
    name.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    setState(() {
      busy = true;
      error = null;
      message = null;
    });
    try {
      final account = AccountRepository();
      if (widget.recovery) {
        await account.updatePassword(password.text);
        widget.onRecovered?.call();
      } else if (reset) {
        await account.reset(email.text);
        if (mounted) {
          setState(
            () => message =
                'If an account exists, you’ll receive a password reset link.',
          );
        }
      } else if (signup) {
        final signedIn = await account.signUp(
          email.text,
          password.text,
          name.text,
        );
        if (!signedIn && mounted) {
          setState(() => message = 'Check your email to confirm your account.');
        }
      } else {
        await account.signIn(email.text, password.text);
      }
    } on AccountFailure catch (e) {
      if (mounted) setState(() => error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => error = 'Check your connection and try again.');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Form(
              key: form,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Mentron+',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    widget.recovery
                        ? 'Choose a new password'
                        : reset
                        ? 'Reset your password'
                        : signup
                        ? 'Create your account'
                        : 'Log in to your tribe',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  const Text('One account for Mentron and mlynq.'),
                  const SizedBox(height: 30),
                  if (signup && !reset) ...[
                    TextFormField(
                      controller: name,
                      autofillHints: const [AutofillHints.name],
                      decoration: const InputDecoration(labelText: 'Your name'),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Enter your name'
                          : null,
                    ),
                    const SizedBox(height: 20),
                  ],
                  if (!widget.recovery)
                    TextFormField(
                      controller: email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      decoration: const InputDecoration(
                        labelText: 'Email address',
                      ),
                      validator: (v) =>
                          v != null &&
                              RegExp(
                                r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                              ).hasMatch(v.trim())
                          ? null
                          : 'Enter a valid email',
                    ),
                  if (!reset) ...[
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: password,
                      obscureText: !show,
                      autofillHints: [
                        signup
                            ? AutofillHints.newPassword
                            : AutofillHints.password,
                      ],
                      decoration: InputDecoration(
                        labelText: 'Password',
                        suffixIcon: IconButton(
                          tooltip: show ? 'Hide password' : 'Show password',
                          onPressed: () => setState(() => show = !show),
                          icon: Icon(
                            show ? Icons.visibility_off : Icons.visibility,
                          ),
                        ),
                      ),
                      validator: (v) => v == null || v.isEmpty
                          ? 'Enter your password'
                          : (signup || widget.recovery) && v.length < 12
                          ? 'Use at least 12 characters'
                          : null,
                    ),
                  ],
                  const SizedBox(height: 20),
                  if (error != null)
                    Text(
                      error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  if (message != null) Text(message!),
                  const SizedBox(height: 18),
                  FilledButton(
                    onPressed: busy ? null : submit,
                    child: Text(
                      busy
                          ? 'Please wait…'
                          : widget.recovery
                          ? 'Update password'
                          : reset
                          ? 'Send reset link'
                          : signup
                          ? 'Create account'
                          : 'Log in',
                    ),
                  ),
                  if (!reset && !widget.recovery)
                    TextButton(
                      onPressed: () => setState(() {
                        reset = true;
                        error = null;
                        message = null;
                      }),
                      child: const Text('Forgot password?'),
                    ),
                  if (!widget.recovery)
                    TextButton(
                      onPressed: () => setState(() {
                        if (reset) {
                          reset = false;
                        } else {
                          signup = !signup;
                        }
                        error = null;
                        message = null;
                      }),
                      child: Text(
                        reset
                            ? 'Back to login'
                            : signup
                            ? 'Already have an account? Log in'
                            : 'Create an account',
                      ),
                    ),
                  const SizedBox(height: 20),
                  const Text(
                    'Built by ISTE SCTCE',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
