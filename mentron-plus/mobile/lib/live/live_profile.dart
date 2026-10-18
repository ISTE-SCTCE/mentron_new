import 'package:flutter/material.dart';
import 'live_repository.dart';
import 'profile_rules.dart';

class LiveProfile extends StatefulWidget {
  const LiveProfile({
    super.key,
    required this.profile,
    required this.refresh,
    required this.navigate,
  });
  final Map<String, dynamic> profile;
  final Future<void> Function() refresh;
  final void Function(String) navigate;
  @override
  State<LiveProfile> createState() => _LiveProfileState();
}

class _LiveProfileState extends State<LiveProfile> {
  static const fields = {
    'name': 'Name',
    'phone': 'Phone',
    'roll_number': 'Roll number',
    'branch': 'Department',
    'year': 'Year',
    'college': 'College',
  };
  final form = GlobalKey<FormState>();
  late final Map<String, TextEditingController> controllers;
  bool editing = false, busy = false;
  String? error;
  @override
  void initState() {
    super.initState();
    controllers = {
      for (final key in fields.keys)
        key: TextEditingController(text: widget.profile[key]?.toString() ?? ''),
    };
  }

  @override
  void dispose() {
    for (final controller in controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> save() async {
    if (!form.currentState!.validate()) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await LiveRepository().updateProfile({
        for (final entry in controllers.entries) entry.key: entry.value.text,
      });
      await widget.refresh();
      if (mounted) setState(() => editing = false);
    } catch (_) {
      if (mounted) {
        setState(
          () => error =
              'Unable to save your details. Check your connection and try again.',
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> logout() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await LiveRepository().signOut();
    } catch (_) {
      if (mounted) {
        setState(() => error = 'Unable to log out. Please try again.');
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(24),
    children: [
      Text(
        widget.profile['name'] ?? '',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const SizedBox(height: 10),
      Text(widget.profile['email'] ?? ''),
      const SizedBox(height: 12),
      Align(
        alignment: Alignment.centerLeft,
        child: Chip(
          label: Text(
            activeMembership(widget.profile)
                ? 'Active ISTE member'
                : 'Student account',
          ),
        ),
      ),
      if (editing) ...[
        const SizedBox(height: 16),
        Form(
          key: form,
          child: Column(
            children: [
              for (final entry in fields.entries)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextFormField(
                    controller: controllers[entry.key],
                    enabled: !busy,
                    maxLength: entry.key == 'name' ? 120 : 200,
                    keyboardType: entry.key == 'phone'
                        ? TextInputType.phone
                        : TextInputType.text,
                    decoration: InputDecoration(
                      labelText: entry.value,
                      border: const OutlineInputBorder(),
                      counterText: '',
                    ),
                    validator: (text) =>
                        entry.key == 'name' && (text?.trim().isEmpty ?? true)
                        ? 'Enter your name'
                        : null,
                  ),
                ),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: busy ? null : save,
                      child: Text(busy ? 'Saving…' : 'Save changes'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  TextButton(
                    onPressed: busy
                        ? null
                        : () {
                            for (final entry in controllers.entries) {
                              entry.value.text =
                                  widget.profile[entry.key]?.toString() ?? '';
                            }
                            setState(() => editing = false);
                          },
                    child: const Text('Cancel'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ] else
        Align(
          alignment: Alignment.centerLeft,
          child: OutlinedButton.icon(
            onPressed: () => setState(() => editing = true),
            icon: const Icon(Icons.edit_outlined),
            label: const Text('Edit profile'),
          ),
        ),
      if (error != null)
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Text(error!, semanticsLabel: error),
        ),
      const SizedBox(height: 20),
      for (final label in [
        'Certificates',
        'Attendance',
        'Applications',
        'Orders',
        'Notifications',
      ])
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(label),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => widget.navigate(label),
        ),
      const SizedBox(height: 22),
      OutlinedButton.icon(
        onPressed: busy ? null : logout,
        icon: const Icon(Icons.logout),
        label: const Text('Log out'),
      ),
    ],
  );
}
