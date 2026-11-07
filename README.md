# Salita Quest

A map-based game for learning Philippine languages. Players pick a region on the map, browse its words, and play two games, Word Pond (matching) and Jeepney stop (listening), to earn the region's stamp in their Passport.

## Stack

- React 19, Vite and react-router-dom
- Leaflet for the map
- Deployed on Vercel (`vercel.json`)
- Talks to a separate LavaLust backend (not verified: that code is not in this repo)

## Local setup

1. Run `npm install`.
2. Create `.env.local` in the project root with these three names. Never commit it or put values in this README.
   - `VITE_API_BASE_URL`
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_FEEDBACK_FORM_URL`
3. Start the backend on `127.0.0.1:3000` (not verified: the backend's setup is not in this repo).
4. Run `npm run dev`. Vite must run on port 5173 because of CORS (not verified: the CORS rule is on the backend). `vite.config.js` does not set a port, so 5173 is only Vite's default. If that port is busy, free it first.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server |
| `npm run build` | Builds the site into `dist/` |
| `npm run lint` | Runs oxlint |
| `npm test` | Runs the tests with `node --test` |

## Folder layout

| Folder | What it holds |
|---|---|
| `src/pages` | Screens such as the map, word list, profile and admin pages |
| `src/components` | Shared layout and system pieces: top bar, tab bar, route guard, error boundary |
| `src/games` | Word Pond, Jeepney stop, the results card and their logic and tests |
| `src/passport` | The Passport screen, its logic and tests |
| `src/api` | `client.js`, the one place that calls the backend |
| `src/auth` | Sign-in state, roles and the stars and streak summary |

## Routes

From `src/App.jsx`. The API still checks every request; these guards only decide what the screen shows.

| Route | Screen | Who |
|---|---|---|
| `/` | Map | Everyone |
| `/regions/:code` | Word list of one region | Everyone |
| `/signin` | Sign in | Everyone |
| `/profile` | Profile (checks sign-in itself) | Signed-in users |
| `/passport` | Passport | Signed-in users |
| `/play/matching/:region` | Word Pond | Signed-in users |
| `/play/listening/:region` | Jeepney stop | Signed-in users |
| `/submit` | Suggest a word | Contributors and Admins |
| `/admin` | Goes to `/admin/approvals` | Admins |
| `/admin/approvals` | Pending suggestions | Admins |
| `/admin/audio` | Audio | Admins |
| `/admin/words`, `/admin/regions` | Placeholder screens | Admins |
| Anything else | Not found | Everyone |
