import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'live_repository.dart';

class LiveCollection extends StatefulWidget {
  const LiveCollection({super.key, required this.title, required this.profile});
  final String title;
  final Map<String, dynamic> profile;
  @override
  State<LiveCollection> createState() => _LiveCollectionState();
}

class _LiveCollectionState extends State<LiveCollection> {
  final repository = LiveRepository();
  late Future<List<Map<String, dynamic>>> future;
  int page = 0;
  String search = '';
  Timer? debounce;
  @override
  void initState() {
    super.initState();
    load();
  }

  void load() {
    future = repository.list(widget.title, page: page, search: search);
  }

  @override
  void dispose() {
    debounce?.cancel();
    super.dispose();
  }

  Future<void> open(Map<String, dynamic> row) async {
    if (widget.title == 'Notifications' && row['is_read'] != true) {
      try {
        await repository.readNotification(row['id'].toString());
        if (mounted) setState(load);
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Unable to mark this notification as read. Please try again.',
              ),
            ),
          );
        }
      }
    }
    if (widget.title == 'Notes' || widget.title == 'Certificates') {
      try {
        final uri = widget.title == 'Notes'
            ? await repository.noteUrl(row, widget.profile)
            : await repository.certificateUrl(row);
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(e.toString())));
        }
      }
      return;
    }
    if (!mounted) return;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (context) => SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              row['title'] ??
                  row['projects']?['title'] ??
                  row['marketplace_listings']?['title'] ??
                  'Details',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            Text(row['description'] ?? row['content'] ?? row['message'] ?? ''),
            if (widget.title == 'Orders')
              Text(
                '₹${row['amount']} · ${(row['order_status'] ?? '').toString().replaceAll('_', ' ')}',
              ),
            if (widget.title == 'Applications')
              Text('Status: ${row['status']}'),
            const SizedBox(height: 20),
            if (widget.title == 'Events')
              FilledButton(
                onPressed: () => launchUrl(
                  Uri.parse('https://istesctce.in/HTML/events.html'),
                  mode: LaunchMode.externalApplication,
                ),
                child: const Text('Registration details'),
              ),
            if (widget.title == 'Market')
              Text('₹${row['price']} · ${row['condition']}'),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.title,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 15),
            if ([
              'Notes',
              'Projects',
              'Market',
              'Events',
              'Community',
            ].contains(widget.title))
              TextField(
                decoration: InputDecoration(
                  labelText: 'Search ${widget.title.toLowerCase()}',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onChanged: (value) {
                  debounce?.cancel();
                  debounce = Timer(const Duration(milliseconds: 300), () {
                    if (mounted) {
                      setState(() {
                        search = value;
                        page = 0;
                        load();
                      });
                    }
                  });
                },
              ),
          ],
        ),
      ),
      Expanded(
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(25),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Unable to load. Check your connection and try again.',
                      ),
                      TextButton(
                        onPressed: () => setState(load),
                        child: const Text('Try again'),
                      ),
                    ],
                  ),
                ),
              );
            }
            final rows = snapshot.data ?? [];
            if (rows.isEmpty) {
              return const Center(child: Text('Nothing here yet.'));
            }
            return ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 22),
              itemCount: rows.length + 1,
              itemBuilder: (context, index) {
                if (index == rows.length) {
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: page == 0
                            ? null
                            : () => setState(() {
                                page--;
                                load();
                              }),
                        child: const Text('Previous'),
                      ),
                      Text('Page ${page + 1}'),
                      TextButton(
                        onPressed: rows.length < 24
                            ? null
                            : () => setState(() {
                                page++;
                                load();
                              }),
                        child: const Text('Next'),
                      ),
                    ],
                  );
                }
                final row = rows[index];
                final eventSession =
                    row['event_sessions'] as Map<String, dynamic>?;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Card(
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(18),
                      title: Text(
                        row['title'] ??
                            row['projects']?['title'] ??
                            row['marketplace_listings']?['title'] ??
                            eventSession?['events']?['title'] ??
                            'Event session',
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Text(
                          row['subject'] ??
                              row['category'] ??
                              row['date'] ??
                              row['status'] ??
                              row['order_status']?.toString().replaceAll(
                                '_',
                                ' ',
                              ) ??
                              row['message'] ??
                              row['description'] ??
                              '',
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      trailing: const Icon(Icons.north_east, size: 18),
                      onTap: () => open(row),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    ],
  );
}
