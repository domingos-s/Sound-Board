# Call Soundboard

A mobile-first Android soundboard for playing sound effects during Zoom or Microsoft Teams calls.

## Mobile behavior

- Large two-column sound pads optimized for phones.
- Add local audio files from the device.
- Sounds persist locally using IndexedDB, so they remain after closing/reopening the app.
- Per-sound volume, master volume, Stop All, and remove/clear controls.
- Installable as a PWA or packageable as an Android APK through Capacitor.

## Important: getting sound into Zoom / Teams

Android does not allow an ordinary app to inject arbitrary playback directly into another app's microphone stream. The supported mobile route is screen sharing with device audio.

1. Join your Zoom or Teams call normally.
2. Start **Share screen**.
3. Enable **Share audio** / **Device audio**.
4. Return to Call Soundboard.
5. Tap a sound pad. The soundboard audio is then part of the shared device audio stream.

Android's Audio Playback Capture framework allows system/media-projection components to capture eligible app media audio. The app is designed around that behavior rather than pretending to create a virtual microphone.

## Run as a web app

The root files remain deployable directly with GitHub Pages.

## Build the Android app / APK

Requirements: Node.js, Android Studio, and an Android SDK.

```bash
npm install
npm run android:add
npm run android:open
```

The first command installs dependencies. `android:add` builds the web bundle and creates the native Android project. `android:open` syncs current web code and opens the Android project in Android Studio.

From Android Studio, use **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate an installable APK.

After the Android project has been created once, future web changes only require:

```bash
npm run android:open
```

## Privacy

Imported sound files are stored locally on the device. They are not uploaded by this application.
