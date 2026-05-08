# Watiqa Mobile

Flutter mobile client for the existing Laravel API in `watiqa-backend`.

## Setup

1. Install Flutter and Android Studio.
2. From this folder, generate the missing platform folders:

```powershell
flutter create .
```

3. Install packages:

```powershell
flutter pub get
```

4. Run the Laravel backend with XAMPP/Apache, then run the app:

```powershell
flutter run
```

## API URL

The app reads the API base URL from `API_BASE_URL`.

Default:

```text
http://10.0.2.2/watiqa_project/watiqa-backend/public/api
```

Use `10.0.2.2` for the Android emulator. For a real phone, replace it with your computer LAN IP:

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.20/watiqa_project/watiqa-backend/public/api
```

## Included MVP

- Login
- Register + email verification code
- Session token storage
- Create document demandes
- List and search demandes for suivi
- Book rendez-vous after a matching demande exists
