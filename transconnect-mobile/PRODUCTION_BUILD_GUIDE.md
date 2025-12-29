# 🚀 Production Build Guide - TransConnect Mobile

## Prerequisites

1. **Install EAS CLI** (if not already installed):
```powershell
npm install -g eas-cli
```

2. **Expo Account**:
   - Create account at https://expo.dev
   - Login: `eas login`

3. **Project Setup**:
```powershell
cd C:\Users\DELL\mobility-app\transconnect-mobile
eas init --id transconnect-mobile
```

## Build Configurations

### Development Build (Testing)
```powershell
# Android APK for internal testing
eas build --profile development --platform android

# iOS Simulator build
eas build --profile development --platform ios
```

### Preview Build (Beta Testing)
```powershell
# Android APK for beta testers
eas build --profile preview --platform android

# iOS TestFlight build
eas build --profile preview --platform ios
```

### Production Build (App Stores)
```powershell
# Android Production APK/AAB
eas build --profile production --platform android

# iOS Production build for App Store
eas build --profile production --platform ios
```

## Environment Variables Setup

Create `.env` file in project root:
```env
API_URL=https://transconnect-app-44ie.onrender.com/api
EXPO_PUBLIC_API_URL=https://transconnect-app-44ie.onrender.com/api
```

## Android App Bundle (AAB) for Play Store

To generate AAB instead of APK, update `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Then build:
```powershell
eas build --profile production --platform android
```

## Code Signing

### Android
EAS handles signing automatically. For manual signing:
1. Generate keystore:
```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore transconnect.keystore -alias transconnect -keyalg RSA -keysize 2048 -validity 10000
```

2. Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "local"
      }
    }
  }
}
```

### iOS
1. Enroll in Apple Developer Program ($99/year)
2. EAS handles provisioning profiles automatically
3. Or configure manually in `eas.json`

## Pre-Build Checklist

- [ ] Update version in `app.json` (version: "1.0.0", versionCode/buildNumber)
- [ ] Test all features thoroughly
- [ ] Update splash screen and app icon
- [ ] Configure permissions in `app.json`
- [ ] Set correct API URL in production
- [ ] Remove debug/console logs
- [ ] Test offline functionality
- [ ] Verify push notifications work
- [ ] Test QR code scanning
- [ ] Verify payment integration

## Build Process

1. **Configure Project**:
```powershell
eas build:configure
```

2. **Start Build**:
```powershell
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Both platforms
eas build --platform all --profile production
```

3. **Monitor Build**:
   - View progress at https://expo.dev/accounts/[your-account]/projects/transconnect-mobile/builds
   - Builds typically take 10-20 minutes

4. **Download Build**:
   - APK/AAB downloaded from EAS dashboard
   - Or use CLI: `eas build:download --platform android`

## App Store Submission

### Google Play Store

1. **Prepare Store Listing**:
   - App name: TransConnect
   - Description: Bus ticketing and ride connector platform
   - Screenshots: 2-8 screenshots (min 320px)
   - Feature graphic: 1024x500px
   - App icon: 512x512px

2. **Upload AAB**:
```powershell
eas submit --platform android --profile production
```

Or manually:
- Go to Google Play Console
- Create new app
- Upload AAB from EAS build
- Complete store listing
- Submit for review

### Apple App Store

1. **Prepare App Store Connect**:
   - Create app in App Store Connect
   - Fill in app information
   - Upload screenshots (required sizes for all devices)
   - Add privacy policy URL

2. **Submit Build**:
```powershell
eas submit --platform ios --profile production
```

Or use Transporter app to upload .ipa file

## Testing the Build

### Android
```powershell
# Install APK on device
adb install path/to/transconnect.apk

# View logs
adb logcat | Select-String "TransConnect"
```

### iOS
- Install via TestFlight
- Or use Xcode to install on device

## Update Strategy (OTA Updates)

For minor updates without rebuilding:
```powershell
# Publish JavaScript/asset updates
eas update --branch production --message "Bug fixes and improvements"
```

## Production Monitoring

- Set up error tracking (Sentry, Bugsnag)
- Monitor API performance
- Track crash reports in Google Play Console / App Store Connect
- Monitor user reviews and ratings

## Common Issues

### Build Fails
- Check `eas build` logs
- Verify dependencies in package.json
- Ensure all required assets exist

### App Crashes on Startup
- Check native module compatibility
- Verify API URL is correct
- Test on physical device, not just emulator

### Permissions Issues
- Verify permissions in app.json match native usage
- Request permissions at appropriate times
- Handle permission denials gracefully

## Version Bump Script

Add to package.json:
```json
{
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major"
  }
}
```

Usage:
```powershell
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0
npm run version:major  # 1.0.0 -> 2.0.0
```

## Resources

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- EAS Submit Docs: https://docs.expo.dev/submit/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Play Store Guidelines: https://support.google.com/googleplay/android-developer/answer/9859455

## Quick Build Commands Reference

```powershell
# Login to Expo
eas login

# Configure EAS
eas build:configure

# Development build (testing)
eas build --profile development --platform android

# Production build
eas build --profile production --platform android

# Submit to stores
eas submit --platform android

# Check build status
eas build:list

# Download latest build
eas build:download --platform android --latest
```

---

**Ready to build?** Start with a development build to test, then move to production when ready! 🚀
