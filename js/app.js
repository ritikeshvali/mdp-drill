/* ============================================================================
 *  MDP FRAMING DRILL
 *
 *  Reads window.MDP_PROBLEMS (data/problems.js) and renders the drill.
 *  Filter chips are built from the values present in the data.
 *
 *  Per-problem state is saved in the browser under STORAGE_KEY:
 *    { v: 2, p: { <id>: { last, got, miss, transcript, notes } } }
 *  It's per-browser only.
 *
 *  Voice input uses the browser's built-in SpeechRecognition where available
 *  (Chrome, Edge, Safari). Firefox has no built-in speech recognition, so
 *  there the answer box is type-only. Either way, "export answers" bundles
 *  every question + your answer + the model answer into text you can paste
 *  into any AI for feedback.
 * ========================================================================== */

(function () {
  "use strict";

  var PROBLEMS = window.MDP_PROBLEMS || [];
  var STORAGE_KEY = "mdp_state_v2";
  var LEGACY_KEY = "mdp_prog"; // v1: { <id>: "got" | "miss" }

  var COMPONENTS = [
    ["state",  "t-state",  "state"],
    ["action", "t-action", "action"],
    ["reward", "t-reward", "reward"],
    ["trans",  "t-trans",  "transition"],
    ["disc",   "t-disc",   "discount"],
    ["trap",   "t-trap",   "the trap"],
  ];
  var DIFF_LABELS = { 1: "easy", 2: "medium", 3: "hard" };

  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var micActive = null;

  // ---- state load + migration ------------------------------------------------
  var state = loadState();
  function loadState() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (e) {}
    if (s && s.v === 2 && s.p) return s;

    var out = { v: 2, p: {} };
    try {
      var legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
      if (legacy) {
        Object.keys(legacy).forEach(function (id) {
          var v = legacy[id];
          out.p[id] = rec(out.p[id]);
          out.p[id].last = v;
          if (v === "got") out.p[id].got = 1;
          if (v === "miss") out.p[id].miss = 1;
        });
      }
    } catch (e) {}
    return out;
  }
  function rec(r) { return r || { last: null, got: 0, miss: 0, transcript: "", notes: "" }; }
  function get(id) { return state.p[id] || rec(); }
  function set(id, patch) { state.p[id] = Object.assign(rec(state.p[id]), patch); save(); return state.p[id]; }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }

  function needsReview(id) { var r = get(id); return r.miss > 0 && r.last !== "got"; }
  function attempted(id) { return get(id).last != null; }

  // ---- filter state ----------------------------------------------------------
  var activeDiff = "all";
  var activeDom = "all";
  var reviewOnly = false;

  var cardsEl = document.getElementById("cards");
  var filtersEl = document.getElementById("filters");

  function uniqueDomains() {
    var seen = {}, out = [];
    PROBLEMS.forEach(function (p) { if (p.dom && !seen[p.dom]) { seen[p.dom] = true; out.push(p.dom); } });
    return out.sort();
  }
  function matches(p) {
    if (reviewOnly && !needsReview(p.id)) return false;
    if (activeDom !== "all" && p.dom !== activeDom) return false;
    if (activeDiff === "all") return true;
    return String(p.diff) === activeDiff;
  }
  function orderedList() {
    var list = PROBLEMS.filter(matches);
    if (reviewOnly) list.sort(function (a, b) { return get(b.id).miss - get(a.id).miss; });
    return list;
  }

  // ---- filter bar ------------------------------------------------------------
  function reviewCount() { return PROBLEMS.filter(function (p) { return needsReview(p.id); }).length; }
  function chip(kind, f, label, pressed) {
    return '<button class="chip" data-kind="' + kind + '" data-f="' + f + '" aria-pressed="' + !!pressed + '">' + label + "</button>";
  }
  function buildFilters() {
    var diff =
      chip("diff", "all", "all", activeDiff === "all") +
      chip("diff", "1", "easy", activeDiff === "1") +
      chip("diff", "2", "medium", activeDiff === "2") +
      chip("diff", "3", "hard", activeDiff === "3");
    var doms = [chip("dom", "all", "all domains", activeDom === "all")];
    uniqueDomains().forEach(function (d) { doms.push(chip("dom", d, d, activeDom === d)); });
    var n = reviewCount();
    var review = '<button class="chip review-chip" data-kind="review" aria-pressed="' + reviewOnly + '">' +
                 "needs review" + (n ? " (" + n + ")" : "") + "</button>";
    filtersEl.innerHTML =
      '<div class="filter-group">' + diff + review + "</div>" +
      '<div class="filter-sep"></div>' +
      '<div class="filter-group">' + doms.join("") + "</div>";
  }

  // ---- html helpers ----------------------------------------------------------
  function escapeHTML(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // Turn the model-answer strings (which contain inline HTML + entities) into
  // clean plain text for export.
  function htmlToText(s) {
    return String(s || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&minus;/g, "-").replace(/&rarr;/g, "->").replace(/&asymp;/g, "~=")
      .replace(/&gamma;/g, "gamma").replace(/&times;/g, "x")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .trim();
  }

  // ---- render one card -------------------------------------------------------
  function cardHTML(p) {
    var r = get(p.id);
    var dlabel = DIFF_LABELS[p.diff] || "";

    var answerRows = COMPONENTS.map(function (c) {
      if (!p[c[0]]) return "";
      return '<div class="a-row"><span class="tag ' + c[1] + '">' + c[2] +
             '</span><span class="body">' + p[c[0]] + "</span></div>";
    }).join("");

    var missBadge = r.miss >= 2 ? '<span class="pill miss-badge">missed &times;' + r.miss + "</span>" : "";
    var ctxBtn = p.ctx ? '<button class="btn ctx-btn" aria-expanded="false">show context</button>' : "";
    var ctxBox = p.ctx
      ? '<div class="context"><p class="clabel">context</p><div class="cbody">' + p.ctx + "</div></div>"
      : "";

    var voiceRow = SpeechRec
      ? '<div class="voice-row">' +
          '<button class="mic-btn"><span class="dot"></span><span class="mic-label">record answer</span></button>' +
          '<span class="mic-hint">speak or type your framing, then reveal to compare</span>' +
        "</div>"
      : '<div class="voice-row"><span class="mic-hint">voice input needs Chrome, Edge or Safari; type your answer below</span></div>';

    var voice =
      '<div class="voice">' + voiceRow +
        '<div class="transcript show">' +
          "<label>your answer</label>" +
          '<textarea class="transcript-text" placeholder="speak or type your framing here">' + escapeHTML(r.transcript) + "</textarea>" +
        "</div>" +
      "</div>";

    var notes =
      '<div class="notes' + (r.notes ? " show" : "") + '">' +
        '<div class="nhead"><label>your notes</label><span class="saved">saved</span></div>' +
        '<textarea class="notes-text" placeholder="jot what tripped you up">' + escapeHTML(r.notes) + "</textarea>" +
      "</div>";

    return '' +
      '<div class="card-top">' +
        '<span class="qnum">#' + String(p.id).padStart(2, "0") + "</span>" +
        '<div class="meta">' + missBadge +
          '<span class="pill">' + (p.dom || "") + "</span>" +
          '<span class="pill diff-' + p.diff + '">' + dlabel + "</span></div>" +
      "</div>" +
      '<div class="scenario"><span class="q">' + p.title + "</span>" + p.q + "</div>" +
      '<div class="btns">' +
        ctxBtn +
        '<button class="btn btn-primary reveal-btn" aria-expanded="false">reveal model answer</button>' +
        '<button class="btn notes-btn" aria-expanded="' + (r.notes ? "true" : "false") + '">notes</button>' +
      "</div>" +
      ctxBox +
      voice +
      '<div class="rate' + (attempted(p.id) ? " show" : "") + '">' +
        "<span>how'd you do?</span>" +
        '<button class="got' + (r.last === "got" ? " sel" : "") + '">got it</button>' +
        '<button class="miss' + (r.last === "miss" ? " sel" : "") + '">missed it</button>' +
      "</div>" +
      '<div class="answer">' + answerRows + "</div>" +
      notes;
  }

  function render() {
    stopMic();
    cardsEl.innerHTML = "";
    var list = orderedList();
    if (list.length === 0) {
      cardsEl.innerHTML = '<p class="empty">' +
        (reviewOnly ? "Nothing to review. Missed questions show up here." : "No problems match this filter.") + "</p>";
      return;
    }
    list.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "card" + (attempted(p.id) ? " done" : "") + (needsReview(p.id) ? " needs-review" : "");
      card.innerHTML = cardHTML(p);
      wireCard(card, p);
      cardsEl.appendChild(card);
    });
  }

  // ---- per-card interactions -------------------------------------------------
  function wireCard(card, p) {
    var ctxBtn = card.querySelector(".ctx-btn");
    var ctxBox = card.querySelector(".context");
    var revealBtn = card.querySelector(".reveal-btn");
    var answer = card.querySelector(".answer");
    var rate = card.querySelector(".rate");

    if (ctxBtn && ctxBox) {
      ctxBtn.addEventListener("click", function () {
        var open = ctxBox.classList.toggle("show");
        ctxBtn.setAttribute("aria-expanded", String(open));
        ctxBtn.textContent = open ? "hide context" : "show context";
      });
    }

    revealBtn.addEventListener("click", function () {
      var open = answer.classList.toggle("show");
      revealBtn.setAttribute("aria-expanded", String(open));
      revealBtn.textContent = open ? "hide model answer" : "reveal model answer";
      if (open) rate.classList.add("show");
    });

    card.querySelector(".got").addEventListener("click", function () {
      var r = get(p.id); set(p.id, { last: "got", got: r.got + 1 }); buildFilters(); render(); updateBar();
    });
    card.querySelector(".miss").addEventListener("click", function () {
      var r = get(p.id); set(p.id, { last: "miss", miss: r.miss + 1 }); buildFilters(); render(); updateBar();
    });

    var tText = card.querySelector(".transcript-text");
    if (tText) tText.addEventListener("input", function () { set(p.id, { transcript: tText.value }); });

    var micBtn = card.querySelector(".mic-btn");
    if (micBtn && SpeechRec) wireMic(micBtn, card, p);

    var notesBtn = card.querySelector(".notes-btn");
    var notesBox = card.querySelector(".notes");
    var notesText = card.querySelector(".notes-text");
    var savedTag = card.querySelector(".notes .saved");
    if (notesBtn && notesBox) {
      notesBtn.addEventListener("click", function () {
        var open = notesBox.classList.toggle("show");
        notesBtn.setAttribute("aria-expanded", String(open));
        if (open && notesText) notesText.focus();
      });
    }
    if (notesText) {
      var t;
      notesText.addEventListener("input", function () {
        set(p.id, { notes: notesText.value });
        if (savedTag) { savedTag.classList.add("show"); clearTimeout(t); t = setTimeout(function () { savedTag.classList.remove("show"); }, 900); }
      });
    }
  }

  // ---- microphone ------------------------------------------------------------
  function stopMic() { if (micActive) { try { micActive.stop(); } catch (e) {} micActive = null; } }

  function wireMic(micBtn, card, p) {
    var label = micBtn.querySelector(".mic-label");
    var tBox = card.querySelector(".transcript");
    var tText = card.querySelector(".transcript-text");

    micBtn.addEventListener("click", function () {
      if (micBtn.classList.contains("recording")) { stopMic(); return; }
      stopMic();

      var recog = new SpeechRec();
      recog.lang = "en-US";
      recog.interimResults = true;
      recog.continuous = true;
      var base = tText.value ? tText.value.trim() + " " : "";
      var finalText = "";

      recog.onresult = function (e) {
        var interim = "";
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t + " "; else interim += t;
        }
        tBox.classList.add("show");
        tText.value = (base + finalText + interim).replace(/\s+/g, " ").trimStart();
        set(p.id, { transcript: tText.value });
      };
      recog.onerror = reset;
      recog.onend = reset;
      function reset() { micActive = null; micBtn.classList.remove("recording"); if (label) label.textContent = "record answer"; }

      micActive = recog;
      micBtn.classList.add("recording");
      if (label) label.textContent = "stop";
      try { recog.start(); } catch (e) { reset(); }
    });
  }

  // ---- export ----------------------------------------------------------------
  function buildExport() {
    var answered = PROBLEMS.filter(function (p) { return (get(p.id).transcript || "").trim(); });
    if (answered.length === 0) return null;

    var lines = [];
    lines.push("# MDP Framing Drill — my answers (" + answered.length + ")");
    lines.push("");
    lines.push("For each scenario below, compare my answer to the model answer. Tell me what I got");
    lines.push("right, what I missed, and explain the trap simply. Then rate each out of 5.");
    lines.push("");
    answered.forEach(function (p) {
      var r = get(p.id);
      lines.push("---");
      lines.push("");
      lines.push("## " + p.id + ". " + p.title + "  [" + p.dom + " / " + (DIFF_LABELS[p.diff] || "") + "]");
      lines.push("**Scenario:** " + htmlToText(p.q));
      lines.push("");
      lines.push("**My answer:** " + r.transcript.trim());
      lines.push("");
      lines.push("**Model answer:**");
      COMPONENTS.forEach(function (c) { if (p[c[0]]) lines.push("- " + c[2] + ": " + htmlToText(p[c[0]])); });
      if (r.notes && r.notes.trim()) { lines.push(""); lines.push("**My notes:** " + r.notes.trim()); }
      lines.push("");
    });
    return lines.join("\n");
  }

  function flash(btn, msg) {
    var orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = orig; }, 1400);
  }

  function doExport(btn) {
    var text = buildExport();
    if (!text) { flash(btn, "no answers yet"); return; }

    // download a .md copy as a backup
    try {
      var blob = new Blob([text], { type: "text/markdown" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "mdp-answers.md";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {}

    // and copy to clipboard so it can be pasted straight into an AI
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(btn, "copied + downloaded"); },
        function () { flash(btn, "downloaded"); });
    } else {
      flash(btn, "downloaded");
    }
  }

  // ---- progress bar ----------------------------------------------------------
  function updateBar() {
    var total = PROBLEMS.length;
    var done = PROBLEMS.filter(function (p) { return attempted(p.id); }).length;
    var got = PROBLEMS.filter(function (p) { return get(p.id).last === "got"; }).length;
    document.getElementById("barFill").style.width = (total ? done / total * 100 : 0) + "%";
    document.getElementById("pcount").textContent = done + " / " + total + " attempted · " + got + " solid";
  }

  // ---- filter + global clicks ------------------------------------------------
  filtersEl.addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    var kind = b.dataset.kind;
    if (kind === "review") { reviewOnly = !reviewOnly; buildFilters(); render(); return; }
    if (kind === "diff") activeDiff = b.dataset.f;
    else if (kind === "dom") activeDom = b.dataset.f;
    b.parentElement.querySelectorAll('.chip[data-kind="' + kind + '"]').forEach(function (c) {
      c.setAttribute("aria-pressed", String(c === b));
    });
    render();
  });

  document.getElementById("exportBtn").addEventListener("click", function () { doExport(this); });

  document.getElementById("resetBtn").addEventListener("click", function () {
    if (!confirm("Reset all progress, answers and notes on this device?")) return;
    state = { v: 2, p: {} }; save(); buildFilters(); render(); updateBar();
  });

  // ---- boot ------------------------------------------------------------------
  buildFilters();
  render();
  updateBar();
})();