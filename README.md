# MDP Framing Drill

An interactive drill for practicing how to frame real-world problems as **Markov Decision Processes**. For each scenario you name the six things an examiner cares about, then reveal a model answer:

**state · action · reward · transition · discount / horizon · the trap**

You can record your answer by voice (browser speech recognition, where supported) or type it, track which scenarios you keep missing so they resurface for review, and export all your answers alongside the model answers as a single text block to paste into any AI for feedback.

**Live:** https://ritikeshvali.github.io/mdp-drill/

## Stack

Plain HTML, CSS, and vanilla JavaScript. No framework, no build step. The problem bank lives in `data/problems.js`; adding a scenario is appending one object (schema documented at the top of that file). Deploys to GitHub Pages as-is.

Voice input uses the browser's built-in speech recognition and works in Chrome, Edge, and Safari. Firefox has no built-in speech recognition, so there the answer box is type-only. Progress, answers, and notes save in the browser (localStorage) only.

## License

[MIT](LICENSE).