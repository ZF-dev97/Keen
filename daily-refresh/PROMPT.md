# Keen daily refresh — scheduled task prompt

This is the instruction to follow (or to give a scheduled Claude session)
each time to generate that day's literacy, verbal reasoning and critical
thinking questions. Numeracy needs no refresh — it generates 5 harder
equations in the browser from the date (see `numeracy.js`).

Difficulty note: Keen's content runs hard from the start — no easing in,
similar to how NUMBLE was recalibrated after its first playtest. Don't
write a "warm-up" question and then a "hard" one; every question should
be a genuine couple of minutes' thought.

## The task, each time

1. Work out today's date in `YYYY-MM-DD` form.
2. Read `daily-refresh/recent-log.json` — recent days' questions already
   used, so today's set doesn't repeat one of them.
3. Generate exactly **5** questions for each of `literacy`, `verbal`,
   `critical` (15 total), matching the shape in `daily-refresh/schema.json`:
   - `prompt` — the question text.
   - `options` — exactly 4 answer choices, all distinct.
   - `correctIndex` — 0–3, which option is correct.
   - `explanation` — one or two sentences, shown after answering, explaining
     why the correct option is correct.

   Category guidance (aim GCSE-to-adult and above — genuinely tricky, not
   a warm-up):
   - **literacy** — vocabulary, etymology/word roots, grammar, or usage.
     Favour less common words over everyday ones ('ephemeral', not 'happy').
   - **verbal** — analogies (A is to B as C is to ?) and odd-one-out, where
     the shared relationship isn't immediately obvious.
   - **critical** — a short argument or scenario with a reasoning flaw to
     spot (slippery slope, false dilemma, ad hominem, hasty generalisation,
     correlation-vs-causation, appeal to popularity, and similar — vary
     which one shows up rather than reusing the same flaw every day), or a
     short logic puzzle.

   Each should still be solvable in a couple of minutes without external
   references — hard, not obscure trivia.
4. Validate what was generated against `daily-refresh/schema.json` before
   writing anything — each category must be an array of exactly 5
   questions. If one doesn't fit (wrong option count, duplicate options,
   correctIndex out of range), regenerate that one question.
5. Check each new question against `daily-refresh/recent-log.json` for
   near-duplicates (same core question, answer, or fallacy type repeated
   within the last ~2 weeks). Regenerate any that repeat too closely.
6. Write the result to `exercises/<today>.json` (see `fallback.json` for
   the exact shape — same three keys, each an array of 5).
7. Append today's three question sets to `daily-refresh/recent-log.json`
   (a short summary per question is enough — see the existing entries),
   trimmed to roughly the last 14 days.
8. Commit and push:
   ```
   git add exercises/<today>.json daily-refresh/recent-log.json
   git commit -m "Daily refresh: <today>"
   git push
   ```
   If GitHub Pages is set up to serve from this branch, the push alone
   republishes the site — no separate deploy step.

## Setting this up as a real scheduled task

As covered when this was last discussed: the cloud environment this
assistant runs in can't push to the repo directly (GitHub access isn't
authorised for it), so for now this refresh is run on request rather than
on an automatic schedule — ask, and a new `exercises/<date>.json` and
updated `recent-log.json` get generated for you to drop in and push
yourself, the same way as always. Revisit automatic scheduling later if
it's worth the laptop-must-be-on tradeoff (or the small ongoing cost of
running it through GitHub Actions instead).
