# XMARTYAPK (Android Wrapper)

This folder is a Capacitor-based Android wrapper for the Xmarty Creator web app.

## Option A (Recommended): Load the live website
1. Open `capacitor.config.ts` and set `server.url` to your live domain.
2. Run:
   - `npx cap sync`
   - `npx cap open android`
3. In Android Studio, build the APK.

## Option B: Package a static export
This only works if your Next.js app can be fully statically exported.
1. Produce a static build in the root project (if supported).
2. Copy the exported files into `XMARTYAPK/www`.
3. Run:
   - `npx cap sync`
   - `npx cap open android`

## Notes
- API routes and server-only features won’t work in a static export unless hosted remotely.
- For emulator testing, you can set `server.url` to `http://10.0.2.2:9002` if your dev server is running.
