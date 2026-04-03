# 🐛 Troubleshooting: App Stuck at Splash Screen

## Quick Debug Steps

### 1. Check Console Logs
After the app bundles, you should see these logs in your terminal:
- `🚀 App starting up...`
- `📱 Rendering splash screen...`
- `💫 Splash screen showing...`
- `✅ Splash screen finished`
- `🎬 Splash finish called...`
- `📱 Rendering main app...`
- `🔐 Checking auth state...`
- `✅ Auth check complete`
- `🧭 AppNavigator - isLoading: false`

**If you DON'T see these logs**, the issue is with the JavaScript not executing.

### 2. Enable Remote Debugging
In Expo Go app on your phone:
1. **Shake your phone** (or Cmd+D on iOS, Ctrl+M on Android emulator)
2. Select **"Toggle Element Inspector"** or **"Debug Remote JS"**
3. Open **http://localhost:19000/debugger-ui/** in Chrome
4. Check browser console for errors

### 3. Check for Errors
Look for red error screens or warnings in:
- Terminal output
- Expo Go app screen
- Chrome DevTools console (if remote debugging enabled)

### 4. Common Issues & Fixes

#### Issue: App stuck at logo, no logs
**Cause**: JavaScript not executing or fatal error
**Fix**:
```powershell
# Stop Expo (Ctrl+C)
# Clear everything
cd C:\Users\DELL\mobility-app\transconnect-mobile
rm -rf node_modules
npm install
npx expo start --clear
```

#### Issue: "undefined is not an object" error
**Cause**: Missing dependency or import error
**Fix**: Check the error message for which component/module is failing

#### Issue: Stuck at "Loading TransConnect..."
**Cause**: AuthContext hanging on storage check
**Fix**: Already implemented timeout in AuthContext (3 seconds max)

#### Issue: Expo Go shows "Unable to connect"
**Cause**: Network issue or wrong IP address
**Fix**:
```powershell
# Restart Expo with tunnel
npx expo start --tunnel
```

### 5. Force Skip Splash (Emergency Fix)
If stuck, temporarily disable splash screen:

Edit `src/App.tsx`, change:
```typescript
const [showSplash, setShowSplash] = useState(true);
```
to:
```typescript
const [showSplash, setShowSplash] = useState(false);  // Disable splash
```

Then reload the app (press `r` in terminal).

### 6. View Live Logs
In terminal where Expo is running, press:
- **`j`** - Open debugger
- **`r`** - Reload app
- **`Ctrl+C`** - Stop server

### 7. Test in Browser (Quick Check)
Press **`w`** in Expo terminal to open in web browser. If it works in browser but not mobile, the issue is mobile-specific (likely SecureStore or native module).

## What to Share for Help

If still stuck, share:
1. **Full terminal output** after bundle completes
2. **Any red error screens** in Expo Go
3. **Console logs** if visible
4. **Which step you're at** (splash showing? loading screen? blank?)

## Next Steps

Try these in order:
1. ✅ Check terminal for console logs (do you see the emoji logs?)
2. ✅ Shake phone → Toggle Element Inspector → Look for errors
3. ✅ Press `j` in Expo terminal to open debugger
4. ✅ Press `w` to test in web browser
5. ✅ If nothing works, apply emergency splash skip above

**Most likely**: The app IS running but you're just not seeing the logs. Try shaking the phone to see if the debug menu appears - that confirms JavaScript is executing.
