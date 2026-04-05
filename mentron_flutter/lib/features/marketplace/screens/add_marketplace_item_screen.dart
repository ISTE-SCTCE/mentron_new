import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:io';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class AddMarketplaceItemScreen extends StatefulWidget {
  const AddMarketplaceItemScreen({super.key});
  @override
  State<AddMarketplaceItemScreen> createState() => _AddMarketplaceItemScreenState();
}

class _AddMarketplaceItemScreenState extends State<AddMarketplaceItemScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  File? _selectedImage;
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image, allowMultiple: false);
    if (result != null && result.files.single.path != null) {
      setState(() => _selectedImage = File(result.files.single.path!));
    }
  }

  Future<void> _submitListing() async {
    if (_titleController.text.isEmpty || _priceController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title and price are required')));
      return;
    }

    setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    if (userId == null) return;

    try {
      String imageUrl = 'https://source.unsplash.com/random/400x300?book,study'; // default

      // Upload image if selected
      if (_selectedImage != null) {
        final ext = _selectedImage!.path.split('.').last;
        final fileName = 'marketplace_${DateTime.now().millisecondsSinceEpoch}.$ext';
        await supabase.client.storage.from('marketplace_bucket').upload(fileName, _selectedImage!);
        final uploaded = supabase.client.storage.from('marketplace_bucket').getPublicUrl(fileName);
        imageUrl = uploaded;
      }

      await supabase.client.from('marketplace_items').insert({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'price': double.tryParse(_priceController.text.trim()) ?? 0.0,
        'image_url': imageUrl,
        'seller_id': userId,
        'is_sold': false,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(backgroundColor: Colors.green, content: Text('Item listed successfully! 🎉')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))));
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
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
        title: Column(children: [
          const Text('MARKETPLACE', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('List an Item', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 110, 24, 40),
          child: Column(children: [
            // Image Picker
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 180, width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1), style: BorderStyle.solid),
                ),
                child: _selectedImage != null
                    ? ClipRRect(borderRadius: BorderRadius.circular(24), child: Image.file(_selectedImage!, fit: BoxFit.cover))
                    : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.add_photo_alternate_outlined, color: AppTheme.textMuted, size: 40),
                        const SizedBox(height: 12),
                        const Text('Tap to add photo', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('(optional — a default image will be used)', style: TextStyle(color: AppTheme.textMuted.withValues(alpha: 0.5), fontSize: 10)),
                      ]),
              ),
            ).animate().fadeIn(),
            const SizedBox(height: 24),

            GlassContainer(
              padding: const EdgeInsets.all(24),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                _buildLabel('ITEM TITLE'),
                _buildTextField(_titleController, 'e.g. Engineering Maths Textbook', Icons.title_rounded),
                const SizedBox(height: 16),
                _buildLabel('DESCRIPTION'),
                _buildTextField(_descriptionController, 'Condition, edition, any details...', Icons.description_outlined, maxLines: 3),
                const SizedBox(height: 16),
                _buildLabel('PRICE (₹)'),
                _buildTextField(_priceController, 'e.g. 250', Icons.currency_rupee_rounded, keyboardType: TextInputType.number),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _isLoading ? null : _submitListing,
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : const Text('LIST FOR SALE'),
                ),
              ]),
            ).animate().slideY(begin: 0.1, delay: 100.ms).fadeIn(),
          ]),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(text, style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, IconData icon, {bool isPassword = false, TextInputType keyboardType = TextInputType.text, int maxLines = 1}) {
    return Container(
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withValues(alpha: 0.1))),
      child: TextField(
        controller: controller, obscureText: isPassword, keyboardType: keyboardType, maxLines: maxLines,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint, hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.2), fontSize: 13),
          prefixIcon: maxLines == 1 ? Icon(icon, color: Colors.white.withValues(alpha: 0.4), size: 18) : null,
          border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }
}
