import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';

class LoginPinScreen extends StatefulWidget {
  const LoginPinScreen({super.key});

  @override
  State<LoginPinScreen> createState() => _LoginPinScreenState();
}

class _LoginPinScreenState extends State<LoginPinScreen> {
  final _nik = TextEditingController();
  final _pin = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    final res = await ApiClient.post('/api/patient-auth/login', {
      'nik': _nik.text.trim(),
      'pin': _pin.text.trim(),
    });
    setState(() => _loading = false);
    if (!mounted) return;
    if (res.ok) {
      await ApiClient.saveSession(res.data['token'], Map<String, dynamic>.from(res.data['account']));
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false);
    } else {
      setState(() => _error = res.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(20)),
                child: const Icon(Icons.lock_outline, size: 38, color: AppColors.primary),
              ),
              const SizedBox(height: 20),
              Text('Selamat Datang', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 6),
              Text('Masuk dengan NIK & PIN Anda', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 28),
              TextField(
                controller: _nik,
                keyboardType: TextInputType.number,
                maxLength: 16,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'NIK', counterText: ''),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _pin,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 6,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'PIN (6 digit)', counterText: ''),
                onSubmitted: (_) => _login(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: AppColors.statusKritis, fontSize: 13)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _login,
                child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Masuk'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/register'),
                child: const Text('Belum punya akun? Daftar', style: TextStyle(color: AppColors.primary)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
