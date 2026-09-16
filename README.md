# Keen — daily brain training

A small daily-exercise web app: one quick question each in numeracy,
literacy, verbal reasoning and critical thinking, a few minutes a day.
No build step, no framework, no backend — plain HTML/CSS/JS, same spirit
as NUMBLE.

## Running it locally

You don't need to install anything beyond a browser and Python (already
on most machines) to preview it:

```
cd keen-app
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. (Opening `index.html`
directly by double-clicking won't work — the browser blocks the
`fetch()` call that loads today's exercises when there's no server
behind it.)

## How it's put together

- `index.html`, `styles.css`, `app.js` — the app itself. `app.js` is a
  small hand-rolled view switcher (home ↔ exercise), no React or build
  tooling needed for something this size.
- `numeracy.js` — generates that day's arithmetic question from the
  date, so it's the same question for everyone all day and needs no
  network request.
- `exercises/fallback.json` — the literacy/verbal/critical-thinking
  questions used until the daily refresh has produced a dated file for
  today, and any day the refresh hasn't run yet. The app always has
  something to show.
- `exercises/<YYYY-MM-DD>.json` — one of these appears each day once
  the daily refresh (below) runs. Same shape as `fallback.json`.
- `daily-refresh/` — the spec for the daily content job: `PROMPT.md`
  (what to do each morning), `schema.json` (what a valid day's file
  looks like), `recent-log.json` (a running log so questions don't
  repeat within ~2 weeks).
- Progress and your streak live in the browser's local storage — only
  on the device you use it on, nothing sent anywhere.

## Publishing it to GitHub Pages

This part needs your own GitHub login, so it's a few manual steps
rather than something done for you from here:

1. Create a new repository on GitHub (public — GitHub Pages' free tier
   needs that, unless you're on a paid plan).
2. Push this folder's contents to it:
   ```
   git init
   git add .
   git commit -m "Keen — first version"
   git branch -M main
   git remote add origin <your repo's URL>
   git push -u origin main
   ```
3. In the repo's Settings → Pages, set the source to the `main` branch,
   root folder. GitHub gives you a URL a minute or two later.

Once that's live, come back and I can set up the daily refresh as a
real scheduled task that commits and pushes each morning — it just
needs the repo to exist first.

## Notes on this version

- One question per category per day (not a multi-question set) — matches
  "a few exercises, a few minutes."
- "Redo" on a completed card lets you replay that day's question; it
  doesn't generate a new one.
- The streak counts a day only once all four are completed, and resets
  if a day is missed.
- Fonts (Lexend/Manrope) load from Google Fonts; without that they fall
  back to the system font, so the app still looks fine offline.
