import 'package:flutter/material.dart';
import 'core/theme.dart';
import 'core/api_client.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/login_pin_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/register_wizard/register_wizard_screen.dart';
import 'screens/tracking/status_tracking_screen.dart';
import 'screens/results/results_history_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/lab_info/lab_info_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LabkesdaApp());
}

class LabkesdaApp extends StatelessWidget {
  const LabkesdaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Labkesda Garut',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: '/',
      routes: {
        '/': (_) => const SplashScreen(),
        '/onboarding': (_) => const OnboardingScreen(),
        '/register': (_) => const RegisterScreen(),
        '/login': (_) => const LoginPinScreen(),
        '/home': (_) => const HomeScreen(),
        '/daftar': (_) => const RegisterWizardScreen(),
        '/status': (_) => const StatusTrackingScreen(),
        '/hasil': (_) => const ResultsHistoryScreen(),
        '/profil': (_) => const ProfileScreen(),
        '/info': (_) => const LabInfoScreen(),
      },
    );
  }
}
