import 'package:flutter/material.dart';
import 'product_access.dart';

class ProductSwitcher extends StatelessWidget {
  final PlatformProduct selected;
  final ValueChanged<PlatformProduct> onChanged;
  final bool busy;
  const ProductSwitcher({
    super.key,
    required this.selected,
    required this.onChanged,
    this.busy = false,
  });
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420),
      child: Row(
        children: [
          for (final product in PlatformProduct.values)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Semantics(
                  selected: selected == product,
                  button: true,
                  child: FilledButton.tonal(
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      backgroundColor: selected == product
                          ? (product == PlatformProduct.mentron
                                ? const Color(0xff342748)
                                : const Color(0xff184d46))
                          : const Color(0xffeeedf4),
                      foregroundColor: selected == product
                          ? Colors.white
                          : const Color(0xff625b75),
                    ),
                    onPressed: busy ? null : () => onChanged(product),
                    child: Text(product.label, textAlign: TextAlign.center),
                  ),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}
