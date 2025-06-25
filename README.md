# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Kurulum ve Ortam Değişkenleri

1. Depoyu klonlayın:

   ```bash
   git clone https://github.com/mustafa-alp/donemProjesi.git
   cd donemProjesi
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

3. Ortam değişkenlerini ayarlayın:

   - Kök dizinde `.env` dosyası oluşturun veya `.env.example` dosyasını kopyalayın:

     ```bash
     cp .env.example .env
     ```
   - `.env` dosyasındaki anahtarları kendi Firebase ve Google API anahtarlarınızla doldurun.

   Örnek `.env` içeriği:

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
   ```

4. Uygulamayı başlatın:

   ```bash
   npx expo start
   ```

## Notlar
- `.env` dosyanız gizli kalmalı, asla git'e yüklemeyin.
- Anahtarlarınızı kimseyle paylaşmayın.
- Firebase ve Google API anahtarlarınızı [Firebase Console](https://console.firebase.google.com/) ve [Google Cloud Console](https://console.cloud.google.com/) üzerinden alabilirsiniz.
