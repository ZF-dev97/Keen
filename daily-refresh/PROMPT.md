# Keen daily refresh — scheduled task prompt

This is the instruction a scheduled Claude session follows each morning to
generate that day's literacy, verbal reasoning and critical thinking
questions. Numeracy needs no refresh — it's generated in the browser from
the date (see `numeracy.js`).

No API key, no separate billing: this runs as a normal Claude session
inside your repo, using your own git access to commit the result.

## The task, each morning

1. Work out today's date in `YYYY-MM-DD` form.
2. Read `daily-refresh/recent-log.json` — the last ~14 days of questions
   already used, kept so today's set doesn't repeat one of them.
3. Generate exactly one question for each of `literacy`, `verbal`,
   `critical`, matching the shape in `daily-refresh/schema.json`:
   - `prompt` — the question text.
   - `options` — exactly 4 answer choices, all distinct.
   - `correctIndex` — 0–3, which option is correct.
   - `explanation` — one sentence, shown after answering, explaining why
     the correct option is correct.

   Category guidance:
   - **literacy** — vocabulary, word origins, grammar, or reading
     comprehension. Roughly GCSE-to-adult difficulty.
   - **verbal** — analogies, odd-one-out, word relationships.
   - **critical** — a short argument or scenario with a reasoning flaw to
     spot, or a short logic puzzle.

   Keep each solvable in a couple of minutes without external references.
4. Validate what was generated against `daily-refresh/schema.json` before
   writing anything. If a question doesn't fit (wrong option count,
   duplicate options, correctIndex out of range), regenerate that one
   question rather than the whole set.
5. Check each new question against `daily-refresh/recent-log.json` for
   near-duplicates (same core question or answer set). Regenerate any
   that repeat.
6. Write the result to `exercises/<today>.json` (see `fallback.json` for
   the exact shape — same three keys, no wrapping "date" field needed
   since the filename carries the date).
7. Append today's three questions to `daily-refresh/recent-log.json`,
   trimmed to the last 14 days.
8. Commit and push:
   ```
   git add exercises/<today>.json daily-refresh/recent-log.json
   git commit -m "Daily refresh: <today>"
   git push
   ```
   If GitHub Pages is set up to serve from this branch, the push alone
   republishes the site — no separate deploy step.

## Setting this up as a real scheduled task

Once the repo exists on GitHub, create a scheduled task (not a local cron
job — those don't survive between sessions) that fires once a day, early
morning, with this file's contents as its prompt, pointed at the repo's
working copy. Ask Claude to set this up for you when you're ready —
it needs to know the repo's location on disk (or to clone it fresh each
run) and confirm git is authenticated to push.
