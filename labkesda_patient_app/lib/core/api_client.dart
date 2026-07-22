import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// HTTP client ke Next.js API web LIMS (server yang sama dengan web staff).
// Menyimpan JWT pasien di SharedPreferences dan menyertakannya sebagai
// header "Authorization: Bearer <token>" untuk endpoint /api/patient/*.
class ApiClient {
  ApiClient._();

  // GANTI sesuai alamat server Next.js saat deploy.
  // Android emulator -> http://10.0.2.2:3000 ; device fisik -> IP LAN / domain.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const _kToken = 'patient_token';
  static const _kAccount = 'patient_account';

  static Future<String?> get token async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kToken);
  }

  static Future<void> saveSession(String token, Map<String, dynamic> account) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kToken, token);
    await prefs.setString(_kAccount, jsonEncode(account));
  }

  static Future<Map<String, dynamic>?> get account async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kAccount);
    return raw == null ? null : jsonDecode(raw) as Map<String, dynamic>;
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kToken);
    await prefs.remove(_kAccount);
  }

  static Future<Map<String, String>> _headers({bool auth = false}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final t = await token;
      if (t != null) headers['Authorization'] = 'Bearer $t';
    }
    return headers;
  }

  static Future<ApiResult> post(String path, Map<String, dynamic> body, {bool auth = false}) async {
    try {
      final res = await http
          .post(Uri.parse('$baseUrl$path'), headers: await _headers(auth: auth), body: jsonEncode(body))
          .timeout(const Duration(seconds: 20));
      return ApiResult.fromResponse(res);
    } catch (e) {
      return ApiResult.networkError(e);
    }
  }

  static Future<ApiResult> get(String path, {bool auth = false}) async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl$path'), headers: await _headers(auth: auth))
          .timeout(const Duration(seconds: 20));
      return ApiResult.fromResponse(res);
    } catch (e) {
      return ApiResult.networkError(e);
    }
  }

  static Future<ApiResult> put(String path, Map<String, dynamic> body, {bool auth = false}) async {
    try {
      final res = await http
          .put(Uri.parse('$baseUrl$path'), headers: await _headers(auth: auth), body: jsonEncode(body))
          .timeout(const Duration(seconds: 20));
      return ApiResult.fromResponse(res);
    } catch (e) {
      return ApiResult.networkError(e);
    }
  }
}

class ApiResult {
  final bool ok;
  final int statusCode;
  final Map<String, dynamic> data;
  final String? error;

  ApiResult._({required this.ok, required this.statusCode, required this.data, this.error});

  factory ApiResult.fromResponse(http.Response res) {
    Map<String, dynamic> json;
    try {
      json = jsonDecode(res.body) as Map<String, dynamic>;
    } catch {
      json = {};
    }
    final success = res.statusCode >= 200 && res.statusCode < 300 && (json['success'] ?? false);
    return ApiResult._(
      ok: success,
      statusCode: res.statusCode,
      data: json,
      error: success ? null : (json['error']?.toString() ?? 'Terjadi kesalahan (${res.statusCode})'),
    );
  }

  factory ApiResult.networkError(Object e) => ApiResult._(
        ok: false,
        statusCode: 0,
        data: {},
        error: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      );
}
