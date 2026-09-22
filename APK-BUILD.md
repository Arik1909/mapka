# Сборка APK

Проект уже настроен под Capacitor:
- `next.config.mjs` — добавлен `output: 'export'` (Next.js собирается в статическую папку `out/`, без Node-сервера — это обязательное условие для Capacitor).
- `capacitor.config.ts` — appId `com.applemaps.clone`, webDir `out`.
- `package.json` — добавлены скрипты `cap:sync`, `android:apk` и зависимость `@capacitor/cli`.
- `.github/workflows/build-apk.yml` — готовый облачный сборщик APK.

Собрать `.apk` можно двумя способами. Способ A не требует ничего устанавливать на свой компьютер.

---

## Способ A — через GitHub Actions (рекомендуется)

1. Создайте новый репозиторий на GitHub и загрузите туда содержимое этого архива (можно просто перетащить папку в веб-интерфейс GitHub или через `git push`).
2. Откройте вкладку **Actions** в репозитории — workflow «Build Android APK» запустится автоматически при пуше в `main`/`master` (или запустите вручную кнопкой **Run workflow**).
3. Дождитесь завершения (обычно 3–5 минут).
4. Внизу страницы запуска, в разделе **Artifacts**, скачайте `app-debug-apk` — это готовый `app-debug.apk`.
5. Перенесите файл на Android-телефон и установите (может понадобиться разрешить установку «из неизвестных источников» в настройках).

Это debug-сборка — она подписана отладочным ключом и подходит для установки и тестирования на любом устройстве, но не для публикации в Google Play (для Play нужен релизный ключ — см. ниже).

---

## Способ B — локально, через Android Studio

Понадобится: Node.js 20+, JDK 21, [Android Studio](https://developer.android.com/studio) (даёт Android SDK).

```bash
npm install
npm run build              # next build -> папка out/
npx cap add android        # создаёт нативный проект в папке android/ (один раз)
npx cap sync android
```

Затем откройте `android/app/src/main/AndroidManifest.xml` и добавьте перед тегом `<application>`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

(нужно для кнопки геолокации на карте).

Дальше — любой из вариантов:

```bash
npx cap open android       # откроет Android Studio: Build → Build Bundle(s)/APK(s) → Build APK(s)
# или из терминала:
cd android && ./gradlew assembleDebug
```

Готовый файл появится в `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Публикация в Google Play (release-сборка)

Debug-APK годится только для ручной установки. Для Play Store нужен подписанный release-билд:

```bash
keytool -genkey -v -keystore release.keystore -alias maps -keyalg RSA -keysize 2048 -validity 10000
```

Пропишите ключ в `android/app/build.gradle` (`signingConfigs`), затем:

```bash
cd android && ./gradlew assembleRelease
```

Файл появится в `android/app/build/outputs/apk/release/`.

---

## Иконка и заставка приложения

Сейчас используется стандартная иконка Capacitor. Чтобы поставить свою (например, `public/apple-icon.png`):

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```
