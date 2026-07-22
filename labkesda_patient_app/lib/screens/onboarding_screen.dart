import 'package:flutter/material.dart';
import '../core/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _page = PageController();
  int _index = 0;

  static const _slides = [
    (Icons.app_registration_outlined, 'Daftar dari Rumah',
        'Daftarkan diri atau keluarga untuk pemeriksaan lab tanpa antri di loket pendaftaran.'),
    (Icons.qr_code_2_outlined, 'Kode Booking Digital',
        'Dapatkan kode booking QR yang ditunjukkan ke petugas saat datang ke Labkesda.'),
    (Icons.fact_check_outlined, 'Pantau Status & Hasil',
        'Lacak status pemeriksaan real-time dan lihat hasil lab langsung dari aplikasi.'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/register'),
                child: const Text('Lewati', style: TextStyle(color: AppColors.textMuted)),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _page,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (_, i) {
                  final s = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 140,
                          height: 140,
                          decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
                          child: Icon(s.$1, size: 64, color: AppColors.primary),
                        ),
                        const SizedBox(height: 32),
                        Text(s.$2, style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        Text(s.$3, style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _slides.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: _index == i ? 22 : 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: _index == i ? AppColors.primary : AppColors.border,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  ElevatedButton(
                    onPressed: () {
                      if (_index < _slides.length - 1) {
                        _page.nextPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
                      } else {
                        Navigator.pushReplacementNamed(context, '/register');
                      }
                    },
                    child: Text(_index < _slides.length - 1 ? 'Lanjut' : 'Daftar Sekarang'),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                    child: const Text('Sudah punya akun? Masuk dengan PIN',
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
