import 'package:flutter/material.dart';

// Tema aplikasi — WARNA & GAYA PERSIS web LIMS Labkesda Garut.
// Sumber: src/app/globals.css + komponen web (primary teal #0F6E5A,
// surface putih/#F7F7F6, rounded-xl, border #E5E5E3).
class AppColors {
  AppColors._();

  static const primary = Color(0xFF0F6E5A);
  static const primaryDark = Color(0xFF0B5445);
  static const primarySoft = Color(0xFFE4F2EE);

  static const bg = Color(0xFFF7F7F6);
  static const surface = Color(0xFFFFFFFF);
  static const textMain = Color(0xFF1C1C1C);
  static const textMuted = Color(0xFF6B6B6B);
  static const border = Color(0xFFE5E5E3);

  static const statusNormal = Color(0xFF1B8A5A);
  static const statusPending = Color(0xFFE8A33D);
  static const statusKritis = Color(0xFFD64545);
  static const statusDuplo = Color(0xFF3B7DD8);

  // Warna per kategori tes (sama dengan web daftar-online)
  static const catHematologi = Color(0xFFD64545);
  static const catKimia = Color(0xFF3B7DD8);
  static const catImunoserologi = Color(0xFF1B8A5A);
  static const catMikrobiologi = Color(0xFF8B5CF6);
  static const catUrinalisis = Color(0xFFE8A33D);
  static const catNarkoba = Color(0xFF0F6E5A);
  static const catKesehatan = Color(0xFFEC4899);
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        surface: AppColors.surface,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textMain,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.textMain,
          fontSize: 17,
          fontWeight: FontWeight.w700,
          fontFamily: 'Inter',
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.border),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
        labelStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.4),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          elevation: 0,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, fontFamily: 'Inter'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textMain,
          minimumSize: const Size.fromHeight(48),
          side: const BorderSide(color: AppColors.border),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, fontFamily: 'Inter'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      textTheme: const TextTheme(
        headlineSmall: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textMain),
        titleLarge: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textMain),
        titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textMain),
        bodyLarge: TextStyle(fontSize: 14, color: AppColors.textMain),
        bodyMedium: TextStyle(fontSize: 13, color: AppColors.textMain),
        bodySmall: TextStyle(fontSize: 11.5, color: AppColors.textMuted),
      ).apply(fontFamily: 'Inter'),
    );
  }
}

// Badge status kecil (dipakai di list riwayat, tracking, antrian)
class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  const StatusBadge(this.label, this.color, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}
