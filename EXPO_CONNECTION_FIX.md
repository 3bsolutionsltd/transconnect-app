# Quick Fix Commands - App Stuck at Splash

## The Issue
App bundled at 100% but stuck at splash screen, Expo Go not connected to Metro.

## Fix 1: Reconnect Expo Go (Try First)

1. In Expo Go app, press **back** to return to home
2. Scan the QR code again from terminal
3. Wait for app to reload

## Fix 2: Use Tunnel Mode

```powershell
# Stop Expo (Ctrl+C in terminal)
cd C:\Users\DELL\mobility-app\transconnect-mobile
npx expo start --tunnel
```

Then scan the new QR code in Expo Go.

## Fix 3: Clear Everything and Restart

```powershell
# Stop Expo (Ctrl+C)
cd C:\Users\DELL\mobility-app\transconnect-mobile

# Clear Metro cache
npx expo start --clear

# Wait for bundle, then scan QR code
```

## Fix 4: Test in Web Browser

```powershell
# In Expo terminal, press: w
# This opens the app in browser to test if code works
```

## Fix 5: Check for Errors

Press **`j`** in Expo terminal, then check Chrome console for errors.

## Fix 6: Use Development Build (If Expo Go Keeps Failing)

```powershell
# Build a standalone APK
npx expo prebuild
npx expo run:android
```

## Quick Checklist

- [ ] Phone and computer on same WiFi?
- [ ] Expo Go app still open?
- [ ] Scanned the QR code after reload?
- [ ] Any red error screen in Expo Go?
- [ ] Tried pressing 'j' to check debugger?
- [ ] Tried pressing 'w' to test in web?

## Most Likely Solution

**Just scan the QR code again!** The connection was lost during reload.
