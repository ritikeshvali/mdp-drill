# MDP Framing Drill

An interactive drill for practicing how to frame real-world problems as **Markov Decision Processes**. For each scenario you name the six things an examiner cares about, then reveal a model answer:

**state · action · reward · transition · discount/horizon · the trap**

Built for RL viva / interview prep. 24 scenarios across recsys, robotics, games, control, systems, finance, operations, and medical, sorted easy to hard, each with an optional plain-English context brief for the jargon.

Live: `https://ritikeshvali.github.io/mdp-drill` &nbsp;·&nbsp; [add your link once deployed]

---

## Why it's built this way

It's a static site with **zero build step and zero dependencies** (just Google Fonts over a CDN). Open `index.html` and it runs. That keeps it trivial to host on GitHub Pages and trivial to read.

The one design decision worth knowing: **the problem bank is a separate data file**, and the UI is generated from it. You never touch the HTML, CSS, or JS to add a scenario.

```
mdp-drill/
├── index.html          # page shell — structure only
├── css/
│   └── styles.css       # all styling; theme tokens live at the top
├── js/
│   └── app.js           # renders cards + filters from the data
├── data/
│   └── problems.js      # THE problem bank — this is what you edit
└── README.md
```

## Add a new problem

Open `data/problems.js` and append one object to the array. Every field is documented at the top of that file; the minimum is an `id`, `title`, `dom`, `diff`, and `q`:

```js
{
  id: 25, title: "Warehouse picking route", dom: "operations", diff: 2,
  q:   "An agent chooses the order to pick items on a warehouse floor.",
  ctx: "Background a non-expert needs. <b>Pick face</b> = the shelf slot an item sits in.",
  state:  "Robot position, remaining pick list, aisle congestion.",
  action: "Which item location to head to next.",
  reward: "- travel distance / time; + on completing the batch.",
  trans:  "Congestion from other robots is stochastic -> model-free.",
  disc:   "Episodic (one batch). gamma < 1 to favour short routes.",
  trap:   "The agent orders the picks; item demand arriving is the environment.",
},
```

Reload the page. The card appears, and if `operations` were a new domain, its filter chip would appear automatically. That's the whole workflow.

Notes:
- `diff` is `1` easy, `2` medium, `3` hard.
- `ctx` is optional. Omit it and the "show context" button just won't render for that card.
- Any of the six answer fields can be omitted; missing ones are skipped in the answer panel.
- You can use inline HTML in any string (`<b>...</b>`) and entities (`&minus;` `&rarr;` `&gamma;` `&asymp;`).
- **Don't renumber existing `id`s** — progress is saved against them in the browser.

## Run locally

Because everything loads via `<script src>` (no `fetch`), you can just open the file:

```bash
open index.html          # macOS
```

Or serve it, which is closer to production:

```bash
python3 -m http.server 8000    # then visit http://localhost:8000
```

## Theming

All colors are CSS custom properties at the top of `css/styles.css`. Change them once and they update everywhere. Dark is the default; a light theme kicks in from the OS setting. To force one regardless of OS, set it on the `<html>` tag:

```html
<html lang="en" data-theme="light">   <!-- or "dark" -->
```

## Deploy

### Option A — its own repo on GitHub Pages (recommended)

```bash
cd mdp-drill
git init
git add .
git commit -m "MDP framing drill"
gh repo create mdp-drill --public --source=. --push
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `root`**. Live in a minute at `https://ritikeshvali.github.io/mdp-drill`.

### Option B — a subfolder of your existing portfolio

Copy the whole `mdp-drill/` folder into your `ritikeshvali.github.io` repo and link to it:

```html
<a href="/mdp-drill/">MDP framing drill</a>
```

No build, no config. It serves as-is at `ritikeshvali.github.io/mdp-drill/`.

## How progress works

Your got-it / missed-it marks are saved in the browser via `localStorage`. It's per-browser and per-device (nothing leaves your machine, nothing syncs). "Reset progress" clears it.

## License

MIT. See [LICENSE](LICENSE).
