# Hydrate

A small React + Vite app that tracks daily water intake: a glass-fill visual, a slider for logging amounts, and a submit button. Built so it can be installed on an iPhone as a home-screen app.

## Run it locally (VS Code)

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL in your browser. Because `server.host: true` is set in `vite.config.js`, you can also open it from your phone if it's on the same WiFi — VS Code will print a second "Network" URL like `http://192.168.x.x:5173`.

## Put it on your iPhone

A dev server URL only works while your computer is on and your phone is on the same network — fine for testing, not for daily use. For a link you can open anytime:

1. Run `npm run build` — this produces a `dist/` folder with the finished app.
2. Deploy `dist/` somewhere with a permanent HTTPS URL. The easiest free options:
   - **Vercel**: `npx vercel deploy --prod` (after `npm i -g vercel` and logging in)
   - **Netlify**: drag the `dist/` folder into [app.netlify.com/drop](https://app.netlify.com/drop)
   - **GitHub Pages**: push this repo to GitHub and enable Pages on the `dist` output
3. Open that HTTPS URL in **Safari** on your iPhone (must be Safari, not Chrome — only Safari exposes "Add to Home Screen" with full-app behavior on iOS).
4. Tap the Share icon → **Add to Home Screen**.
5. The app now opens full-screen, with its own icon, no Safari address bar — same as a regular app.

## What's included

- **Accumulated daily total** — the big number and the glass-fill visual, stored per calendar day so it resets automatically at local midnight.
- **Slider input** (50ml steps, plus 100/250/500ml quick chips) and a submit ("Log") button.
- **Daily goal** setting (default 2000ml) and a streak counter for consecutive days the goal was hit.
- **In-app reminders** — an optional interval reminder using the browser Notification API.

## An important limitation, honestly stated

iOS only allows web apps to send notifications **while the app is open in the foreground**. There is no way for a plain web link (even installed to the home screen) to wake up and notify you in the background, the way a native App Store app can — Apple requires a registered push service and a backend server for that, and even then iOS 16.4+ is required.

If a true "notify me even when I haven't opened the app" reminder matters to you, you have two real options:
1. **Add a backend** for Web Push (I can help you build a small Node/Express service for this — it's a bigger project but doable).
2. **Use iOS Shortcuts/Automations** as a stand-in: set a daily Personal Automation in the Shortcuts app to open this app's URL on a schedule, or just a recurring iOS reminder, alongside this app for logging.

## Ideas you might want to add later

- A weekly/monthly history chart (using something like Recharts) instead of just today's total.
- Different drink "presets" (coffee, tea) with a hydration-equivalent multiplier, if you want to track more than plain water.
- A "Health" app export via Apple HealthKit — only possible from a native Swift wrapper, not a pure web app, but doable if you ever wrap this in something like Capacitor.
- A 60-second exhale/visual cue (the wave animation) — already partially in place, could pulse on each log to feel more rewarding.
