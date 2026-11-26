# Aizu Fleet: web dashboard

Aizu Fleet is the web dashboard for fleet managers in the Aizu driver-drowsiness system. It shows drowsiness alerts from every vehicle and walks a manager through handling a critical incident. Managers can also review clips, spot patterns by driver and shift, and export reports.

This is a coded version of the fleet screens from the Aizu Figma prototype. It is the next step after the clickable prototype that users tested. It is not the version they tested.

> **Demo only.** All data is simulated. There is no back end, no real sign-in, no real calls and no real email. Reloading the page resets everything except sign-in.

## Features

| Area | What you can do |
| --- | --- |
| **Sign in / Create account** | Split-screen sign-in with empty fields, show/hide password and "Keep me signed in". Also: create an account (with password strength and terms), reset a password, and a simulated company SSO sign-in (work email, then a generic company sign-in screen). |
| **Overview** | Critical alert pop-up (Call driver, Open incident, Acknowledge), attention strip, On trip / All vehicles table, shift stats, latest alerts and most offenses. |
| **Incident** | Five timed steps, minutes rested and a short note. Trip decision, where Replace and Stop ask for confirmation. Review result, driver's explanation, supervisor notes, and Close incident or Cancel. |
| **Vehicles** | On trip / Parked / Offline or late cards (click one to filter), vehicle table, and Add vehicle with validation. |
| **Drivers** | Sort and filter by shift and vehicle type, with an insight note. Each driver has a detail page with stats, charts, Call driver and Adjust schedule. |
| **Events** | Filter by date, level, driver, vehicle, shift, not reviewed and has clip. Event detail has a clip player and Confirmed / False alarm review with a reason. |
| **Reports** | This week, This month or a custom date range. Driver and shift filters, level stats, charts, a Level 3 incidents table, Export PDF (print) and Export CSV (download). |
| **Settings** | Users and roles (Add user), Clip access log, Data retention, Notifications, Devices, Privacy notice. |
| **Phone notification** | `/notification` shows the M02 lock-screen alert. Tapping it opens the overview. |

Every action button gives feedback with a toast. Longer actions show a short "working" toast, then a result toast. Pages animate in when you switch tabs, and the animations turn off when the device is set to reduce motion.

The layout adapts to the screen:
- **Desktop:** a sidebar.
- **Tablet:** an icon rail.
- **Phone:** a bottom tab bar, with cards instead of tables.

## Try it

- Any valid-looking email and password signs you in. You can also use **Create account**.
- Wait about 2 seconds on the overview for the critical alert pop-up.
- "Call driver" opens the phone dialer on a phone. On a computer it shows a message.

## Run locally

Requires Node.js 20 or later.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check and build into dist/
npm run preview    # serve the built site
```

## Deploy

The site is hosted on Vercel. `vercel.json` sends every path to `index.html`, so links such as `/drivers/juan` work on reload.

**From GitHub (recommended):** in Vercel, choose **Add New → Project** and import this repository. Vercel detects Vite, so the defaults work as they are: build command `npm run build`, output folder `dist`. Every push to `main` then redeploys the site.

**From the command line:**

```bash
npx vercel login
npm run build
npx vercel deploy dist --prod
```

Copy `vercel.json` into `dist/` first so deep links work. Deploying the built `dist` folder avoids a Windows error (`EPERM ... symlink`) that the Vercel CLI hits when it tries to build on your computer.

The deployed link is public.

## Pages

| Path | Screen |
| --- | --- |
| `/` | W01 Sign in, Create account, Reset password |
| `/overview` | W02 Fleet overview and W03 Critical alert pop-up (M01 on phones) |
| `/incident` | W04 Incident record |
| `/vehicles` | Vehicles |
| `/drivers`, `/drivers/:id` | W05 Drivers, W06 Driver detail and schedule |
| `/events`, `/events/:id` | W07 Events, W08 Event detail and clip review |
| `/reports` | W09 Reports |
| `/settings?s=…` | W10 Settings sections: `users`, `clips`, `retention`, `notifications`, `devices`, `privacy` |
| `/notification` | M02 Push notification |

## Tech

- React 19, TypeScript and Vite
- react-router-dom for pages
- lucide-react for icons; Inter and Poppins fonts
- Plain CSS with design tokens from the Figma file (`src/index.css`), on a 4/8 px spacing grid

```
src/
  App.tsx        routes
  data.ts        simulated drivers, vehicles, events, roles and report numbers
  state.tsx      in-memory app state, sign-in (session storage) and toasts
  ui.tsx         shell (sidebar, top bar, tab bar) and shared components
  pages/         one file per screen
  assets/        logo and placeholder clip
```

## Credits

The design comes from the Aizu Figma prototype (`03 Clickable prototype`) and its published version. The placeholder video is used only to show the clip player.
