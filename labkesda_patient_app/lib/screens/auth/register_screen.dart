import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';

// Register: NIK + No HP → kirim OTP → input OTP + buat PIN → akun aktif (JWT).
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nik = TextEditingController();
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  final _pin = TextEditingController();
  final _pinConfirm = TextEditingController();

  bool _otpSent = false;
  bool _loading = false;
  String? _error;
  String? _devOtp; // ditampilkan saat dev (server mengembalikannya bila non-production)
  String? _testResult; // hasil tes koneksi (diagnostik)
  int _resendIn = 0;
  Timer? _timer;

  Future<void> _testConnection() async {
    setState(() => _testResult = 'Menguji...');
    final res = await ApiClient.get('/api/letterhead');
    if (!mounted) return;
    setState(() {
      _testResult = res.ok
          ? 'OK: server terjangkau (HTTP ${res.statusCode})'
          : 'Gagal: HTTP ${res.statusCode} — ${res.error}';
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    final res = await ApiClient.post('/api/patient-auth/register', {
      'nik': _nik.text.trim(),
      'phone': _phone.text.trim(),
    });
    setState(() => _loading = false);
    if (!mounted) return;
    if (res.ok) {
      setState(() {
        _otpSent = true;
        _devOtp = res.data['devOtp']?.toString();
        _resendIn = 60;
      });
      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (_resendIn <= 1) {
          t.cancel();
          setState(() => _resendIn = 0);
        } else {
          setState(() => _resendIn--);
        }
      });
    } else {
      setState(() => _error = res.error);
    }
  }

  Future<void> _verify() async {
    if (_pin.text != _pinConfirm.text) {
      setState(() => _error = 'PIN dan konfirmasi PIN tidak sama.');
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
    });
    final res = await ApiClient.post('/api/patient-auth/verify-otp', {
      'nik': _nik.text.trim(),
      'phone': _phone.text.trim(),
      'otp': _otp.text.trim(),
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
      appBar: AppBar(title: const Text('Buat Akun')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _otpSent ? 'Masukkan kode OTP & buat PIN' : 'Daftar dengan NIK & nomor WhatsApp Anda',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 18),

              TextField(
                controller: _nik,
                enabled: !_otpSent,
                keyboardType: TextInputType.number,
                maxLength: 16,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'NIK (16 digit)', counterText: ''),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phone,
                enabled: !_otpSent,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Nomor WhatsApp / HP', hintText: '08xxxxxxxxxx'),
              ),

              if (!_otpSent) ...[
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _loading ? null : _sendOtp,
                  child: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Kirim Kode OTP'),
                ),
              ] else ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _devOtp != null
                        ? 'Kode OTP (dev): $_devOtp\nDikirim ke WhatsApp/SMS ${_phone.text}'
                        : 'Kode OTP telah dikirim ke ${_phone.text} via WhatsApp/SMS.',
                    style: const TextStyle(fontSize: 12.5, color: AppColors.primaryDark, fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _otp,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 8),
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(labelText: 'Kode OTP', counterText: ''),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pin,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(labelText: 'Buat PIN (6 digit)', counterText: ''),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pinConfirm,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(labelText: 'Ulangi PIN', counterText: ''),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _loading ? null : _verify,
                  child: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Verifikasi & Buat Akun'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _resendIn > 0
                      ? null
                      : () {
                          setState(() {
                            _otpSent = false;
                            _otp.clear();
                          });
                        },
                  child: Text(_resendIn > 0 ? 'Kirim ulang OTP (${_resendIn}s)' : 'Ubah NIK / kirim ulang OTP'),
                ),
              ],

              if (_error != null) ...[
                const SizedBox(height: 14),
                Text(_error!, style: const TextStyle(color: AppColors.statusKritis, fontSize: 13), textAlign: TextAlign.center),
              ],
              const SizedBox(height: 10),
              TextButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                child: const Text('Sudah punya akun? Masuk dengan PIN', style: TextStyle(color: AppColors.primary)),
              ),

              // Diagnostik koneksi (sementara untuk troubleshooting)
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.bg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Server: ${ApiClient.baseUrl}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: _testConnection,
                      child: Text(
                        _testResult ?? 'Tes koneksi ke server →',
                        style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
