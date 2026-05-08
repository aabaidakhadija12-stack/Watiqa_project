import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2/watiqa_project/watiqa-backend/public/api',
);

const tokenKey = 'watiqa_token';
const userKey = 'watiqa_user';
const statusOptions = ['en_attente', 'en_traitement', 'approuve', 'rejete'];
const rdvStatusOptions = ['en_attente', 'confirme', 'annule', 'passe'];
const ink = Color(0xFF17211B);
const primaryGreen = Color(0xFF2D6A4F);
const deepGreen = Color(0xFF1B4332);
const gold = Color(0xFFC9A84C);
const canvas = Color(0xFFF3F6F1);
const line = Color(0xFFE0E7DE);

void main() {
  runApp(const WatiqaApp());
}

class WatiqaApp extends StatelessWidget {
  const WatiqaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Watiqa',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: primaryGreen,
          primary: primaryGreen,
          secondary: gold,
          surface: const Color(0xFFFAFBF8),
        ),
        scaffoldBackgroundColor: canvas,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFFAFBF8),
          foregroundColor: ink,
          elevation: 0,
          centerTitle: false,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          labelStyle: const TextStyle(color: Color(0xFF5F6D64)),
          hintStyle: const TextStyle(color: Color(0xFF99A59D)),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: line),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: primaryGreen, width: 1.4),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryGreen,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(50),
            textStyle: const TextStyle(fontWeight: FontWeight.w800),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: primaryGreen,
            side: const BorderSide(color: line),
            minimumSize: const Size.fromHeight(48),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: line),
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: Colors.white,
          indicatorColor: const Color(0xFFE5F2EA),
          labelTextStyle: WidgetStateProperty.resolveWith(
            (states) => TextStyle(
              color: states.contains(WidgetState.selected)
                  ? deepGreen
                  : const Color(0xFF66736B),
              fontWeight: states.contains(WidgetState.selected)
                  ? FontWeight.w800
                  : FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
        textTheme: const TextTheme(
          headlineSmall: TextStyle(
            color: ink,
            fontWeight: FontWeight.w900,
            letterSpacing: 0,
          ),
          titleLarge: TextStyle(
            color: ink,
            fontWeight: FontWeight.w900,
            letterSpacing: 0,
          ),
          titleMedium: TextStyle(
            color: ink,
            fontWeight: FontWeight.w800,
            letterSpacing: 0,
          ),
          bodyMedium: TextStyle(color: Color(0xFF526057), height: 1.35),
        ),
        useMaterial3: true,
      ),
      home: const BootstrapScreen(),
    );
  }
}

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.data});

  final String message;
  final int? statusCode;
  final Map<String, dynamic>? data;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient(this._prefs);

  final SharedPreferences _prefs;

  String? get token => _prefs.getString(tokenKey);

  Future<void> saveSession(Map<String, dynamic> user, String token) async {
    await _prefs.setString(tokenKey, token);
    await _prefs.setString(userKey, jsonEncode(user));
  }

  Future<void> clearSession() async {
    await _prefs.remove(tokenKey);
    await _prefs.remove(userKey);
  }

  Map<String, dynamic>? cachedUser() {
    final raw = _prefs.getString(userKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) {
    final uri = Uri.parse('$apiBaseUrl$path').replace(queryParameters: query);
    return _send(() => http.get(uri, headers: _headers()));
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) {
    final uri = Uri.parse('$apiBaseUrl$path');
    return _send(
        () => http.post(uri, headers: _headers(), body: jsonEncode(body)));
  }

  Future<dynamic> patch(String path, Map<String, dynamic> body) {
    final uri = Uri.parse('$apiBaseUrl$path');
    return _send(
        () => http.patch(uri, headers: _headers(), body: jsonEncode(body)));
  }

  Future<dynamic> delete(String path) {
    final uri = Uri.parse('$apiBaseUrl$path');
    return _send(() => http.delete(uri, headers: _headers()));
  }

  Map<String, String> _headers() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    try {
      final response = await request();
      final decoded = response.body.isEmpty ? null : jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return decoded;
      }

      if (response.statusCode == 401) {
        await clearSession();
      }

      final data =
          decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
      throw ApiException(
        _extractMessage(data) ?? 'Erreur API ${response.statusCode}',
        statusCode: response.statusCode,
        data: data,
      );
    } on ApiException {
      rethrow;
    } catch (error) {
      throw ApiException(
          'Impossible de contacter le serveur. Verifiez API_BASE_URL.');
    }
  }

  String? _extractMessage(Map<String, dynamic> data) {
    final errors = data['errors'];
    if (errors is Map && errors.isNotEmpty) {
      final first = errors.values.first;
      if (first is List && first.isNotEmpty) return first.first.toString();
    }
    return data['message']?.toString();
  }
}

class BootstrapScreen extends StatefulWidget {
  const BootstrapScreen({super.key});

  @override
  State<BootstrapScreen> createState() => _BootstrapScreenState();
}

class _BootstrapScreenState extends State<BootstrapScreen> {
  ApiClient? _api;
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final api = ApiClient(prefs);
    Map<String, dynamic>? user = api.cachedUser();

    if (api.token != null) {
      try {
        final fresh = await api.get('/auth/me') as Map<String, dynamic>;
        await prefs.setString(userKey, jsonEncode(fresh));
        user = fresh;
      } catch (_) {
        await api.clearSession();
        user = null;
      }
    }

    if (!mounted) return;
    setState(() {
      _api = api;
      _user = user;
    });
  }

  @override
  Widget build(BuildContext context) {
    final api = _api;
    if (api == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_user == null) {
      return LoginScreen(
        api: api,
        onLoggedIn: (user) => setState(() => _user = user),
      );
    }

    if (_user?['role'] == 'admin') {
      return AdminShell(api: api, user: _user!, onLogout: _logout);
    }

    return HomeShell(api: api, user: _user!, onLogout: _logout);
  }

  Future<void> _logout() async {
    final api = _api;
    if (api == null) return;
    try {
      await api.post('/auth/logout', {});
    } catch (_) {}
    await api.clearSession();
    if (mounted) setState(() => _user = null);
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.api, required this.onLoggedIn});

  final ApiClient api;
  final ValueChanged<Map<String, dynamic>> onLoggedIn;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _cin = TextEditingController();
  final _confirm = TextEditingController();
  final _code = TextEditingController();
  bool _register = false;
  bool _verify = false;
  bool _busy = false;
  String? _error;
  String? _info;

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
      _info = null;
    });

    try {
      if (_verify) {
        final res = await widget.api.post('/auth/verify-email', {
          'email': _email.text.trim(),
          'password': _password.text,
          'code': _code.text.trim(),
        }) as Map<String, dynamic>;
        await widget.api.saveSession(res['user'], res['token']);
        widget.onLoggedIn(Map<String, dynamic>.from(res['user']));
        return;
      }

      if (_register) {
        await widget.api.post('/auth/register', {
          'name': _name.text.trim(),
          'email': _email.text.trim(),
          'phone': _phone.text.trim(),
          'cin': _cin.text.trim().toUpperCase(),
          'password': _password.text,
          'password_confirmation': _confirm.text,
        });
        setState(() {
          _verify = true;
          _info = 'Compte cree. Entrez le code recu par email.';
        });
        return;
      }

      final res = await widget.api.post('/auth/login', {
        'email': _email.text.trim(),
        'password': _password.text,
      }) as Map<String, dynamic>;
      await widget.api.saveSession(res['user'], res['token']);
      widget.onLoggedIn(Map<String, dynamic>.from(res['user']));
    } on ApiException catch (error) {
      if (error.statusCode == 403 &&
          error.data?['requires_email_verification'] == true) {
        setState(() {
          _verify = true;
          _info = 'Entrez le code de verification envoye par email.';
        });
      } else {
        setState(() => _error = error.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resendCode() async {
    setState(() {
      _busy = true;
      _error = null;
      _info = null;
    });

    try {
      await widget.api.post('/auth/resend-verification', {
        'email': _email.text.trim(),
        'password': _password.text,
      });
      setState(() => _info = 'Code renvoye.');
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = _verify
        ? 'Verification email'
        : (_register ? 'Inscription' : 'Connexion');
    final subtitle = _verify
        ? 'Saisissez le code recu par email pour activer votre espace.'
        : (_register
            ? 'Creez votre compte pour suivre vos documents.'
            : 'Accedez a vos demandes, suivis et rendez-vous.');

    return Scaffold(
      body: AppBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: PrimaryCard(
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Center(child: WatiqaMark(size: 62)),
                      const SizedBox(height: 18),
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        subtitle,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 22),
                      if (_register && !_verify) ...[
                        TextField(
                          controller: _name,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Nom complet',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _phone,
                          keyboardType: TextInputType.phone,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Telephone',
                            hintText: '+212612345678',
                            prefixIcon: Icon(Icons.phone_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _cin,
                          textCapitalization: TextCapitalization.characters,
                          textInputAction: TextInputAction.next,
                          onChanged: (value) {
                            final upper = value.toUpperCase();
                            if (value != upper) {
                              _cin.value = _cin.value.copyWith(
                                text: upper,
                                selection:
                                    TextSelection.collapsed(offset: upper.length),
                              );
                            }
                          },
                          decoration: const InputDecoration(
                            labelText: 'CIN',
                            hintText: 'AB123456',
                            prefixIcon: Icon(Icons.credit_card),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (!_verify) ...[
                        TextField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.alternate_email),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _password,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Mot de passe',
                            prefixIcon: Icon(Icons.lock_outline),
                          ),
                        ),
                        if (_register) ...[
                          const SizedBox(height: 12),
                          TextField(
                            controller: _confirm,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Confirmer le mot de passe',
                              prefixIcon: Icon(Icons.verified_user_outlined),
                            ),
                          ),
                        ],
                      ] else ...[
                        TextField(
                          controller: _code,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          decoration: const InputDecoration(
                            labelText: 'Code de verification',
                            prefixIcon: Icon(Icons.pin_outlined),
                            counterText: '',
                          ),
                        ),
                      ],
                      if (_info != null)
                        MessageBox(text: _info!, positive: true),
                      if (_error != null)
                        MessageBox(text: _error!, positive: false),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _busy ? null : _submit,
                        child: Text(_busy
                            ? 'Patientez...'
                            : (_verify
                                ? 'Confirmer'
                                : (_register
                                    ? 'Creer compte'
                                    : 'Se connecter'))),
                      ),
                      if (_verify)
                        TextButton.icon(
                          onPressed: _busy ? null : _resendCode,
                          icon: const Icon(Icons.refresh, size: 18),
                          label: const Text('Renvoyer le code'),
                        ),
                      TextButton(
                        onPressed: _busy
                            ? null
                            : () => setState(() {
                                  _register = !_register;
                                  _verify = false;
                                  _error = null;
                                  _info = null;
                                }),
                        child: Text(_register
                            ? 'J ai deja un compte'
                            : 'Creer un compte'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell(
      {super.key,
      required this.api,
      required this.user,
      required this.onLogout});

  final ApiClient api;
  final Map<String, dynamic> user;
  final VoidCallback onLogout;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class AdminShell extends StatefulWidget {
  const AdminShell({
    super.key,
    required this.api,
    required this.user,
    required this.onLogout,
  });

  final ApiClient api;
  final Map<String, dynamic> user;
  final VoidCallback onLogout;

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      AdminDashboardScreen(api: widget.api),
      AdminDemandesScreen(api: widget.api),
      AdminRendezVousScreen(api: widget.api),
      AdminUsersScreen(api: widget.api, currentUserId: widget.user['id']),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            const WatiqaMark(size: 38),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Watiqa Admin',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                  ),
                  Text(
                    widget.user['email']?.toString() ?? 'Administrateur',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF6D7A71),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Deconnexion',
            onPressed: widget.onLogout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: screens[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Admin',
          ),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description),
            label: 'Demandes',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event),
            label: 'RDV',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Users',
          ),
        ],
      ),
    );
  }
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final name = widget.user['name']?.toString() ?? 'Citoyen';
    final screens = [
      DemandesScreen(api: widget.api),
      SuiviScreen(api: widget.api),
      RendezVousScreen(api: widget.api),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            const WatiqaMark(size: 38),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Watiqa',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                  ),
                  Text(
                    name,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF6D7A71),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Deconnexion',
            onPressed: widget.onLogout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: screens[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.description_outlined),
              selectedIcon: Icon(Icons.description),
              label: 'Demandes'),
          NavigationDestination(
              icon: Icon(Icons.search_outlined),
              selectedIcon: Icon(Icons.search),
              label: 'Suivi'),
          NavigationDestination(
              icon: Icon(Icons.event_available_outlined),
              selectedIcon: Icon(Icons.event_available),
              label: 'RDV'),
        ],
      ),
    );
  }
}

class DemandesScreen extends StatefulWidget {
  const DemandesScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<DemandesScreen> createState() => _DemandesScreenState();
}

class _DemandesScreenState extends State<DemandesScreen> {
  final _fields = <String, TextEditingController>{};
  String _type = documentTypes.first.key;
  List<dynamic> _demandes = [];
  bool _loading = true;
  bool _busy = false;
  String? _message;
  bool _positive = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await widget.api.get('/demandes') as List<dynamic>;
      setState(() => _demandes = res);
    } on ApiException catch (error) {
      _show(error.message, false);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _create() async {
    final doc = documentTypes.firstWhere((d) => d.key == _type);
    final data = {
      for (final field in doc.fields)
        field.key: _controller(field.key).text.trim(),
    };
    final missing = doc.fields
        .where((field) => data[field.key]?.isEmpty ?? true)
        .map((field) => field.label)
        .toList();

    if (missing.isNotEmpty) {
      _show('Champs obligatoires: ${missing.join(', ')}', false);
      return;
    }

    setState(() => _busy = true);
    try {
      final res =
          await widget.api.post('/demandes', {'type': _type, 'data': data})
              as Map<String, dynamic>;
      for (final controller in _fields.values) {
        controller.clear();
      }
      _show('Demande creee. Numero: ${res['numero_suivi']}', true);
      await _load();
    } on ApiException catch (error) {
      _show(error.message, false);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  TextEditingController _controller(String key) {
    return _fields.putIfAbsent(key, TextEditingController.new);
  }

  void _show(String message, bool positive) {
    setState(() {
      _message = message;
      _positive = positive;
    });
  }

  @override
  Widget build(BuildContext context) {
    final doc = documentTypes.firstWhere((d) => d.key == _type);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        children: [
          const ScreenHeader(
            icon: Icons.description_outlined,
            title: 'Demandes',
            subtitle:
                'Deposez une demande de watiqa et gardez le numero de suivi.',
          ),
          const SizedBox(height: 16),
          const SectionTitle(
            title: 'Nouvelle demande',
            actionLabel: 'Formulaire',
            icon: Icons.edit_document,
          ),
          const SizedBox(height: 10),
          PrimaryCard(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: _type,
                    decoration: const InputDecoration(
                      labelText: 'Type de watiqa',
                      prefixIcon: Icon(Icons.folder_copy_outlined),
                    ),
                    items: documentTypes
                        .map((doc) => DropdownMenuItem(
                            value: doc.key, child: Text(doc.label)))
                        .toList(),
                    onChanged: (value) =>
                        setState(() => _type = value ?? _type),
                  ),
                  const SizedBox(height: 12),
                  DocumentInfoBox(document: doc),
                  const SizedBox(height: 12),
                  for (final field in doc.fields) ...[
                    TextField(
                      controller: _controller(field.key),
                      keyboardType: field.keyboardType,
                      textInputAction: TextInputAction.next,
                      decoration: InputDecoration(
                        labelText: field.label,
                        hintText: field.hint,
                        prefixIcon: Icon(field.icon),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_message != null)
                    MessageBox(text: _message!, positive: _positive),
                  const SizedBox(height: 8),
                  ElevatedButton(
                      onPressed: _busy ? null : _create,
                      child: Text(_busy ? 'Envoi...' : 'Envoyer la demande')),
                ],
              ),
            ),
          ),
          const SizedBox(height: 22),
          SectionTitle(
            title: 'Mes demandes',
            actionLabel: '${_demandes.length}',
            icon: Icons.inventory_2_outlined,
            trailing: IconButton(
              onPressed: _load,
              icon: const Icon(Icons.refresh),
              tooltip: 'Actualiser',
            ),
          ),
          const SizedBox(height: 10),
          if (_loading)
            const Center(
                child: Padding(
                    padding: EdgeInsets.all(24),
                    child: CircularProgressIndicator())),
          if (!_loading && _demandes.isEmpty)
            const EmptyState(text: 'Aucune demande pour le moment.'),
          for (final demande in _demandes)
            DemandeCard(demande: Map<String, dynamic>.from(demande)),
        ],
      ),
    );
  }
}

class SuiviScreen extends StatefulWidget {
  const SuiviScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<SuiviScreen> createState() => _SuiviScreenState();
}

class _SuiviScreenState extends State<SuiviScreen> {
  final _search = TextEditingController();
  List<dynamic> _demandes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    _search.addListener(() => setState(() {}));
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await widget.api.get('/demandes') as List<dynamic>;
      setState(() => _demandes = res);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final query = _search.text.toLowerCase();
    final filtered = _demandes.where((item) {
      final demande = Map<String, dynamic>.from(item);
      return '${demande['numero_suivi']} ${demande['type']}'
          .toLowerCase()
          .contains(query);
    }).toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        children: [
          const ScreenHeader(
            icon: Icons.search,
            title: 'Suivi',
            subtitle: 'Consultez l etat de vos dossiers par numero ou type.',
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _search,
            decoration: const InputDecoration(
              labelText: 'Numero ou type',
              prefixIcon: Icon(Icons.manage_search),
            ),
          ),
          const SizedBox(height: 16),
          SectionTitle(
            title: 'Resultats',
            actionLabel: '${filtered.length}',
            icon: Icons.fact_check_outlined,
          ),
          const SizedBox(height: 10),
          if (_loading)
            const Center(
                child: Padding(
                    padding: EdgeInsets.all(24),
                    child: CircularProgressIndicator())),
          if (!_loading && filtered.isEmpty)
            const EmptyState(text: 'Aucun dossier trouve.'),
          for (final demande in filtered)
            DemandeCard(demande: Map<String, dynamic>.from(demande)),
        ],
      ),
    );
  }
}

class RendezVousScreen extends StatefulWidget {
  const RendezVousScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<RendezVousScreen> createState() => _RendezVousScreenState();
}

class _RendezVousScreenState extends State<RendezVousScreen> {
  static const communes = [
    'Agadir Ida Outanane',
    'Inzegane',
    'Ait Melloul',
    'Dcheira El Jihadia',
    'Biougra',
    'Taroudant',
  ];

  String? _commune;
  String? _demandeType;
  DateTime? _date;
  String? _time;
  List<dynamic> _demandes = [];
  List<String> _slots = const [];
  bool _loading = true;
  bool _busy = false;
  String? _message;
  bool _positive = true;

  @override
  void initState() {
    super.initState();
    _loadDemandes();
  }

  Future<void> _loadDemandes() async {
    setState(() => _loading = true);
    try {
      final res = await widget.api.get('/demandes') as List<dynamic>;
      setState(() => _demandes = res);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 90)),
      initialDate: _date ?? now,
    );
    if (picked == null) return;
    setState(() {
      _date = picked;
      _time = null;
      _slots = const [];
    });
    await _loadSlots(picked);
  }

  Future<void> _loadSlots(DateTime date) async {
    final value = _formatDate(date);
    try {
      final res =
          await widget.api.get('/rendezvous/slots', query: {'date': value})
              as Map<String, dynamic>;
      setState(() => _slots = List<String>.from(res['slots'] ?? []));
    } on ApiException catch (error) {
      _show(error.message, false);
    }
  }

  Future<void> _book() async {
    if (_commune == null ||
        _demandeType == null ||
        _date == null ||
        _time == null) {
      return;
    }

    setState(() => _busy = true);
    try {
      final label =
          documentTypes.firstWhere((d) => d.key == _demandeType).label;
      await widget.api.post('/rendezvous', {
        'date_rdv': _formatDate(_date!),
        'heure_rdv': _time,
        'service': label,
        'motif': _commune,
        'demande_type': _demandeType,
      });
      _show(
        'Rendez-vous envoye pour validation: ${_formatDate(_date!)} a $_time.',
        true,
      );
    } on ApiException catch (error) {
      _show(error.message, false);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _show(String message, bool positive) {
    setState(() {
      _message = message;
      _positive = positive;
    });
  }

  String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  @override
  Widget build(BuildContext context) {
    final availableTypes = _demandes
        .map((d) => Map<String, dynamic>.from(d)['type']?.toString())
        .whereType<String>()
        .toSet()
        .toList();

    return RefreshIndicator(
      onRefresh: _loadDemandes,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        children: [
          const ScreenHeader(
            icon: Icons.event_available,
            title: 'Rendez-vous',
            subtitle:
                'Choisissez la commune, le service et un creneau disponible.',
          ),
          const SizedBox(height: 16),
          if (_loading) const LinearProgressIndicator(),
          if (!_loading && availableTypes.isEmpty)
            const MessageBox(
                text:
                    'Vous devez creer une demande avant de prendre un rendez-vous.',
                positive: false),
          const SizedBox(height: 10),
          PrimaryCard(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: _commune,
                    decoration: const InputDecoration(
                      labelText: 'Commune',
                      prefixIcon: Icon(Icons.location_city_outlined),
                    ),
                    items: communes
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (value) => setState(() => _commune = value),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _demandeType,
                    decoration: const InputDecoration(
                      labelText: 'Service',
                      prefixIcon: Icon(Icons.assignment_outlined),
                    ),
                    items: availableTypes
                        .map((type) => DropdownMenuItem(
                              value: type,
                              child: Text(documentLabel(type)),
                            ))
                        .toList(),
                    onChanged: availableTypes.isEmpty
                        ? null
                        : (value) => setState(() => _demandeType = value),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _pickDate,
                    icon: const Icon(Icons.calendar_month),
                    label: Text(_date == null
                        ? 'Choisir la date'
                        : _formatDate(_date!)),
                  ),
                  if (_slots.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final slot in _slots)
                          ChoiceChip(
                            label: Text(slot),
                            selected: _time == slot,
                            onSelected: (_) => setState(() => _time = slot),
                            showCheckmark: false,
                          ),
                      ],
                    ),
                  ],
                  if (_date != null && _slots.isEmpty)
                    const Padding(
                      padding: EdgeInsets.only(top: 12),
                      child: Text('Aucun creneau disponible pour cette date.'),
                    ),
                  if (_message != null)
                    MessageBox(text: _message!, positive: _positive),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _busy || availableTypes.isEmpty ? null : _book,
                    child: Text(
                        _busy ? 'Reservation...' : 'Confirmer le rendez-vous'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic> _stats = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await widget.api.get('/admin/stats') as Map<String, dynamic>;
      setState(() => _stats = res);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        children: [
          const ScreenHeader(
            icon: Icons.admin_panel_settings,
            title: 'Administration',
            subtitle: 'Suivez les demandes, les rendez-vous et les comptes.',
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: MediaQuery.sizeOf(context).width > 520 ? 4 : 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.2,
            children: [
              AdminStatTile(
                icon: Icons.people_outline,
                label: 'Utilisateurs',
                value: _loading ? '...' : '${_stats['users'] ?? 0}',
              ),
              AdminStatTile(
                icon: Icons.description_outlined,
                label: 'Demandes',
                value: _loading ? '...' : '${_stats['demandes'] ?? 0}',
              ),
              AdminStatTile(
                icon: Icons.pending_actions,
                label: 'En cours',
                value: _loading ? '...' : '${_stats['demandes_en_cours'] ?? 0}',
              ),
              AdminStatTile(
                icon: Icons.event_available_outlined,
                label: 'Rendez-vous',
                value: _loading ? '...' : '${_stats['rendezvous'] ?? 0}',
              ),
            ],
          ),
          const SizedBox(height: 18),
          const MessageBox(
            text:
                'Espace admin mobile: consultez les listes et changez les statuts rapidement.',
            positive: true,
          ),
        ],
      ),
    );
  }
}

class AdminDemandesScreen extends StatefulWidget {
  const AdminDemandesScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<AdminDemandesScreen> createState() => _AdminDemandesScreenState();
}

class _AdminDemandesScreenState extends State<AdminDemandesScreen> {
  List<dynamic> _demandes = [];
  bool _loading = true;
  String? _message;
  bool _positive = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await widget.api.get('/admin/demandes') as List<dynamic>;
      setState(() => _demandes = res);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(int id, String statut) async {
    try {
      await widget.api.patch('/admin/demandes/$id/statut', {'statut': statut});
      setState(() {
        _message = 'Statut mis a jour.';
        _positive = true;
      });
      await _load();
    } on ApiException catch (error) {
      setState(() {
        _message = error.message;
        _positive = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        children: [
          const ScreenHeader(
            icon: Icons.description_outlined,
            title: 'Demandes admin',
            subtitle: 'Consultez les demandes et mettez a jour leur statut.',
          ),
          if (_message != null)
            MessageBox(text: _message!, positive: _positive),
          const SizedBox(height: 16),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            ),
          if (!_loading && _demandes.isEmpty)
            const EmptyState(text: 'Aucune demande pour le moment.'),
          for (final item in _demandes)
            AdminDemandeCard(
              demande: Map<String, dynamic>.from(item),
              onStatusChanged: _updateStatus,
            ),
        ],
      ),
    );
  }
}

class AdminRendezVousScreen extends StatefulWidget {
  const AdminRendezVousScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<AdminRendezVousScreen> createState() => _AdminRendezVousScreenState();
}

class _AdminRendezVousScreenState extends State<AdminRendezVousScreen> {
  List<dynamic> _rdvs = [];
  bool _loading = true;
  String? _message;
  bool _positive = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await widget.api.get('/admin/rendezvous') as List<dynamic>;
      setState(() => _rdvs = res);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(int id, String status) async {
    setState(() {
      _message = null;
      _positive = true;
    });

    try {
      await widget.api.patch('/admin/rendezvous/$id/statut', {
        'statut': status,
      });
      await _load();
      setState(() {
        _message = 'Statut du rendez-vous mis a jour.';
        _positive = true;
      });
    } on ApiException catch (error) {
      setState(() {
        _message = error.message;
        _positive = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        children: [
          const ScreenHeader(
            icon: Icons.event_available,
            title: 'Rendez-vous admin',
            subtitle: 'Validez, annulez ou marquez les rendez-vous passes.',
          ),
          if (_message != null)
            MessageBox(text: _message!, positive: _positive),
          const SizedBox(height: 16),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            ),
          if (!_loading && _rdvs.isEmpty)
            const EmptyState(text: 'Aucun rendez-vous pour le moment.'),
          for (final item in _rdvs)
            AdminRdvCard(
              rdv: Map<String, dynamic>.from(item),
              onStatusChanged: _updateStatus,
            ),
        ],
      ),
    );
  }
}

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({
    super.key,
    required this.api,
    required this.currentUserId,
  });

  final ApiClient api;
  final Object? currentUserId;

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<dynamic> _users = [];
  bool _loading = true;
  String? _message;
  bool _positive = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await widget.api.get('/admin/users') as List<dynamic>;
      setState(() => _users = res);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateRole(int id, String role) async {
    try {
      await widget.api.patch('/admin/users/$id/role', {'role': role});
      setState(() {
        _message = 'Role mis a jour.';
        _positive = true;
      });
      await _load();
    } on ApiException catch (error) {
      setState(() {
        _message = error.message;
        _positive = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        children: [
          const ScreenHeader(
            icon: Icons.people_outline,
            title: 'Utilisateurs',
            subtitle: 'Consultez les comptes et gerez les roles.',
          ),
          if (_message != null)
            MessageBox(text: _message!, positive: _positive),
          const SizedBox(height: 16),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            ),
          if (!_loading && _users.isEmpty)
            const EmptyState(text: 'Aucun utilisateur pour le moment.'),
          for (final item in _users)
            AdminUserCard(
              user: Map<String, dynamic>.from(item),
              currentUserId: widget.currentUserId,
              onRoleChanged: _updateRole,
            ),
        ],
      ),
    );
  }
}

class DemandeCard extends StatelessWidget {
  const DemandeCard({super.key, required this.demande});

  final Map<String, dynamic> demande;

  @override
  Widget build(BuildContext context) {
    final type = demande['type']?.toString() ?? '';
    final status = demande['statut']?.toString() ?? '';
    final createdAt = demande['created_at']?.toString();

    return PrimaryCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F3EC),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.description_outlined,
                  color: primaryGreen, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    documentLabel(type),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 5),
                  SelectableText(
                    demande['numero_suivi']?.toString() ?? '-',
                    style: const TextStyle(
                      color: deepGreen,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (createdAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      createdAt,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF738077),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 10),
            StatusPill(status: status),
          ],
        ),
      ),
    );
  }
}

class AdminStatTile extends StatelessWidget {
  const AdminStatTile({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return PrimaryCard(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: primaryGreen),
            Text(
              value,
              style: const TextStyle(
                color: ink,
                fontWeight: FontWeight.w900,
                fontSize: 26,
              ),
            ),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF6D7A71),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AdminDemandeCard extends StatelessWidget {
  const AdminDemandeCard({
    super.key,
    required this.demande,
    required this.onStatusChanged,
  });

  final Map<String, dynamic> demande;
  final Future<void> Function(int id, String statut) onStatusChanged;

  @override
  Widget build(BuildContext context) {
    final user = demande['user'] is Map
        ? Map<String, dynamic>.from(demande['user'])
        : <String, dynamic>{};
    final id = demande['id'] is int
        ? demande['id'] as int
        : int.tryParse('${demande['id']}') ?? 0;
    final status = demande['statut']?.toString() ?? 'en_attente';

    return PrimaryCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    documentLabel(demande['type']?.toString() ?? ''),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                StatusPill(status: status),
              ],
            ),
            const SizedBox(height: 8),
            SelectableText(
              demande['numero_suivi']?.toString() ?? '-',
              style: const TextStyle(
                color: deepGreen,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${user['name'] ?? 'N/A'} - ${user['email'] ?? '-'}',
              style: const TextStyle(color: Color(0xFF66736B)),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: status,
              decoration: const InputDecoration(
                labelText: 'Changer le statut',
                prefixIcon: Icon(Icons.tune),
              ),
              items: statusOptions
                  .map((status) => DropdownMenuItem(
                        value: status,
                        child: Text(statusLabel(status)),
                      ))
                  .toList(),
              onChanged: id == 0
                  ? null
                  : (value) {
                      if (value != null) onStatusChanged(id, value);
                    },
            ),
          ],
        ),
      ),
    );
  }
}

class AdminRdvCard extends StatelessWidget {
  const AdminRdvCard({
    super.key,
    required this.rdv,
    required this.onStatusChanged,
  });

  final Map<String, dynamic> rdv;
  final Future<void> Function(int id, String status) onStatusChanged;

  @override
  Widget build(BuildContext context) {
    final user = rdv['user'] is Map
        ? Map<String, dynamic>.from(rdv['user'])
        : <String, dynamic>{};
    final status = rdv['statut']?.toString() ?? 'confirme';
    final id = rdv['id'] is int
        ? rdv['id'] as int
        : int.tryParse('${rdv['id']}') ?? 0;

    return PrimaryCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    rdv['service']?.toString() ?? 'Service',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                StatusPill(status: status),
              ],
            ),
            const SizedBox(height: 8),
            Text('${rdv['date_rdv'] ?? '-'} a ${rdv['heure_rdv'] ?? '-'}'),
            const SizedBox(height: 6),
            Text(
              '${user['name'] ?? 'N/A'} - ${user['email'] ?? '-'}',
              style: const TextStyle(color: Color(0xFF66736B)),
            ),
            if (rdv['motif'] != null) ...[
              const SizedBox(height: 6),
              Text('Commune: ${rdv['motif']}'),
            ],
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: status,
              decoration: const InputDecoration(
                labelText: 'Decision admin',
                prefixIcon: Icon(Icons.fact_check_outlined),
              ),
              items: rdvStatusOptions
                  .map((status) => DropdownMenuItem(
                        value: status,
                        child: Text(statusLabel(status)),
                      ))
                  .toList(),
              onChanged: id == 0 || status == 'passe'
                  ? null
                  : (value) {
                      if (value != null) onStatusChanged(id, value);
                    },
            ),
          ],
        ),
      ),
    );
  }
}

class AdminUserCard extends StatelessWidget {
  const AdminUserCard({
    super.key,
    required this.user,
    required this.currentUserId,
    required this.onRoleChanged,
  });

  final Map<String, dynamic> user;
  final Object? currentUserId;
  final Future<void> Function(int id, String role) onRoleChanged;

  @override
  Widget build(BuildContext context) {
    final id = user['id'] is int
        ? user['id'] as int
        : int.tryParse('${user['id']}') ?? 0;
    final role = user['role']?.toString() == 'admin' ? 'admin' : 'user';
    final isSelf = '${user['id']}' == '$currentUserId';

    return PrimaryCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    user['name']?.toString() ?? 'Utilisateur',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                RolePill(role: role),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              user['email']?.toString() ?? '-',
              style: const TextStyle(color: Color(0xFF66736B)),
            ),
            const SizedBox(height: 6),
            Text(
              'Tel: ${user['phone'] ?? '-'}  |  CIN: ${user['cin'] ?? '-'}',
              style: const TextStyle(
                color: Color(0xFF66736B),
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: role,
              decoration: const InputDecoration(
                labelText: 'Role',
                prefixIcon: Icon(Icons.admin_panel_settings_outlined),
              ),
              items: const [
                DropdownMenuItem(value: 'user', child: Text('Utilisateur')),
                DropdownMenuItem(value: 'admin', child: Text('Administrateur')),
              ],
              onChanged: isSelf || id == 0
                  ? null
                  : (value) {
                      if (value != null) onRoleChanged(id, value);
                    },
            ),
            if (isSelf)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Compte actuel',
                  style: TextStyle(
                    color: Color(0xFF8A6A12),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'approuve' => const Color(0xFF2D6A4F),
      'rejete' => const Color(0xFFC53030),
      'en_traitement' => const Color(0xFF2B6CB0),
      'confirme' => const Color(0xFF2D6A4F),
      'annule' => const Color(0xFFC53030),
      'passe' => const Color(0xFF64748B),
      _ => const Color(0xFFB7791F),
    };
    final label = statusLabel(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999)),
      child: Text(label,
          style: TextStyle(
              color: color, fontWeight: FontWeight.w800, fontSize: 12)),
    );
  }
}

class RolePill extends StatelessWidget {
  const RolePill({super.key, required this.role});

  final String role;

  @override
  Widget build(BuildContext context) {
    final isAdmin = role == 'admin';
    final color = isAdmin ? deepGreen : const Color(0xFF2B6CB0);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        isAdmin ? 'Admin' : 'User',
        style:
            TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 12),
      ),
    );
  }
}

class MessageBox extends StatelessWidget {
  const MessageBox({super.key, required this.text, required this.positive});

  final String text;
  final bool positive;

  @override
  Widget build(BuildContext context) {
    final color = positive ? primaryGreen : const Color(0xFFC53030);
    final bg = positive ? const Color(0xFFE6F4EA) : const Color(0xFFFFE4E6);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            positive ? Icons.check_circle_outline : Icons.error_outline,
            color: color,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: color, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 12),
      child: Center(
        child: Column(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: line),
              ),
              child: const Icon(Icons.inbox_outlined, color: Color(0xFF7A887F)),
            ),
            const SizedBox(height: 12),
            Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF66736B),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DocumentInfoBox extends StatelessWidget {
  const DocumentInfoBox({super.key, required this.document});

  final DocumentType document;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAF6),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: line),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: primaryGreen, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.label,
                  style: const TextStyle(
                    color: ink,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  document.description,
                  style: const TextStyle(color: Color(0xFF65736A), height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AppBackground extends StatelessWidget {
  const AppBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFEEF6EF), Color(0xFFF7F7F1)],
        ),
      ),
      child: child,
    );
  }
}

class PrimaryCard extends StatelessWidget {
  const PrimaryCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: line),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: padding == null ? child : Padding(padding: padding!, child: child),
    );
  }
}

class WatiqaMark extends StatelessWidget {
  const WatiqaMark({super.key, this.size = 48});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size * 0.24),
        border: Border.all(color: line),
        boxShadow: [
          BoxShadow(
            color: primaryGreen.withValues(alpha: 0.2),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(size * 0.22),
        child: Image.asset('assets/logo.png', fit: BoxFit.cover),
      ),
    );
  }
}

class ScreenHeader extends StatelessWidget {
  const ScreenHeader({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: deepGreen,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style:
                      const TextStyle(color: Color(0xFFDDE9E1), height: 1.25),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({
    super.key,
    required this.title,
    required this.icon,
    this.actionLabel,
    this.trailing,
  });

  final String title;
  final IconData icon;
  final String? actionLabel;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: primaryGreen, size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
        if (actionLabel != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F3EC),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              actionLabel!,
              style: const TextStyle(
                color: deepGreen,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

String documentLabel(String type) {
  return documentTypes
          .where((document) => document.key == type)
          .firstOrNull
          ?.label ??
      type;
}

String statusLabel(String status) {
  return switch (status) {
    'approuve' => 'Approuve',
    'rejete' => 'Rejete',
    'en_traitement' => 'En traitement',
    'annule' => 'Annule',
    'confirme' => 'Confirme',
    'passe' => 'Passe',
    _ => 'En attente',
  };
}

class DocumentType {
  const DocumentType(this.key, this.label, this.description, this.fields);

  final String key;
  final String label;
  final String description;
  final List<DocumentField> fields;
}

class DocumentField {
  const DocumentField(
    this.key,
    this.label, {
    this.hint,
    this.icon = Icons.text_fields,
    this.keyboardType = TextInputType.text,
  });

  final String key;
  final String label;
  final String? hint;
  final IconData icon;
  final TextInputType keyboardType;
}

const documentTypes = [
  DocumentType(
    'naissance',
    'Acte de naissance',
    'Renseignez les informations de la personne concernee par l acte.',
    [
      DocumentField('firstname', 'Prenom', icon: Icons.person_outline),
      DocumentField('lastname', 'Nom', icon: Icons.badge_outlined),
      DocumentField(
        'birthdate',
        'Date de naissance',
        hint: 'YYYY-MM-DD',
        icon: Icons.calendar_today_outlined,
        keyboardType: TextInputType.datetime,
      ),
      DocumentField(
        'birthplace',
        'Lieu de naissance',
        hint: 'Ville ou commune',
        icon: Icons.location_on_outlined,
      ),
    ],
  ),
  DocumentType(
    'deces',
    'Acte de deces',
    'Ajoutez les informations du defunt et celles du demandeur.',
    [
      DocumentField('decLastname', 'Nom du defunt', icon: Icons.badge_outlined),
      DocumentField(
        'decFirstname',
        'Prenom du defunt',
        icon: Icons.person_outline,
      ),
      DocumentField(
        'deathDate',
        'Date de deces',
        hint: 'YYYY-MM-DD',
        icon: Icons.calendar_today_outlined,
        keyboardType: TextInputType.datetime,
      ),
      DocumentField(
        'deathPlace',
        'Lieu de deces',
        hint: 'Ville ou commune',
        icon: Icons.location_on_outlined,
      ),
      DocumentField(
        'reqLastname',
        'Nom du demandeur',
        icon: Icons.badge_outlined,
      ),
      DocumentField(
        'reqFirstname',
        'Prenom du demandeur',
        icon: Icons.person_outline,
      ),
      DocumentField(
        'cin',
        'CIN du demandeur',
        hint: 'Ex: AB123456',
        icon: Icons.credit_card,
      ),
    ],
  ),
  DocumentType(
    'celibat',
    'Certificat de celibat',
    'Informations personnelles necessaires pour verifier la situation familiale.',
    [
      DocumentField('firstname', 'Prenom', icon: Icons.person_outline),
      DocumentField('lastname', 'Nom', icon: Icons.badge_outlined),
      DocumentField(
        'birthdate',
        'Date de naissance',
        hint: 'YYYY-MM-DD',
        icon: Icons.calendar_today_outlined,
        keyboardType: TextInputType.datetime,
      ),
      DocumentField(
        'cin',
        'CIN',
        hint: 'Ex: AB123456',
        icon: Icons.credit_card,
      ),
    ],
  ),
  DocumentType(
    'residence',
    'Certificat de residence',
    'Indiquez votre identite et l adresse de residence actuelle.',
    [
      DocumentField('firstname', 'Prenom', icon: Icons.person_outline),
      DocumentField('lastname', 'Nom', icon: Icons.badge_outlined),
      DocumentField(
        'address',
        'Adresse complete',
        hint: 'Quartier, rue, numero...',
        icon: Icons.home_outlined,
      ),
      DocumentField(
        'cin',
        'CIN',
        hint: 'Ex: AB123456',
        icon: Icons.credit_card,
      ),
    ],
  ),
  DocumentType(
    'vie',
    'Certificat de vie',
    'Informations d identification de la personne concernee.',
    [
      DocumentField('firstname', 'Prenom', icon: Icons.person_outline),
      DocumentField('lastname', 'Nom', icon: Icons.badge_outlined),
      DocumentField(
        'cin',
        'CIN',
        hint: 'Ex: AB123456',
        icon: Icons.credit_card,
      ),
    ],
  ),
  DocumentType(
    'casier_judiciaire',
    'Casier judiciaire',
    'Precisez votre identite et le motif de la demande.',
    [
      DocumentField('firstname', 'Prenom', icon: Icons.person_outline),
      DocumentField('lastname', 'Nom', icon: Icons.badge_outlined),
      DocumentField(
        'cin',
        'CIN',
        hint: 'Ex: AB123456',
        icon: Icons.credit_card,
      ),
      DocumentField(
        'purpose',
        'Motif',
        hint: 'Travail, concours, dossier administratif...',
        icon: Icons.assignment_outlined,
      ),
    ],
  ),
];
