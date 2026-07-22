import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/api_client.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;
    final token = await ApiClient.token;
    if (!mounted) return;
    if (token != null) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      Navigator.pushReplacementNamed(context, '/onboarding');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 92,
              height: 92,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(Icons.biotech_outlined, size: 52, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            const Text('Labkesda Garut',
                style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text('Pelayanan Lab Kesehatan Daerah',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13)),
            const SizedBox(height: 28),
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
