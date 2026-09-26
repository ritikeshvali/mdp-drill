/* ============================================================================
 *  MDP FRAMING DRILL
 *
 *  Reads window.MDP_PROBLEMS (from data/problems.js) and renders the drill.
 *  Everything is data-driven: the domain and difficulty filter chips are
 *  built from whatever values appear in the data, so adding a problem with a
 *  new domain "Just Works" with no change here.
 *
 *  Progress (which problems you marked got-it / missed-it) is saved in the
 *  browser via localStorage under the key below. It's per-browser only.
 * ========================================================================== */

(function () {
  "use strict";

  var PROBLEMS = window.MDP_PROBLEMS || [];
  var STORAGE_KEY = "mdp_prog";

  // The six answer components, in display order: [dataKey, cssTag, label].
  var COMPONENTS = [
    ["state",  "t-state",  "state"],
    ["action", "t-action", "action"],
    ["reward", "t-reward", "reward"],
    ["trans",  "t-trans",  "transition"],
    ["disc",   "t-disc",   "discount"],
    ["trap",   "t-trap",   "the trap"],
  ];
  var DIFF_LABELS = { 1: "easy", 2: "medium", 3: "hard" };

  // ---- progress persistence (fails safe if storage is unavailable) ----------
  var progress = {};
  try { progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch (e) { progress = {}; }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch (e) { /* private mode / disabled storage: silently continue */ }
  }

  // ---- current filter state --------------------------------------------------
  var activeDiff = "all";   // "all" | "1" | "2" | "3" | "todo"
  var activeDom = "all";    // "all" | a domain string

  var cardsEl = document.getElementById("cards");
  var filtersEl = document.getElementById("filters");

  // ---- small helpers ---------------------------------------------------------
  function uniqueDomains() {
    var seen = {}, out = [];
    PROBLEMS.forEach(function (p) {
      if (p.dom && !seen[p.dom]) { seen[p.dom] = true; out.push(p.dom); }
    });
    return out.sort();
  }

  function matchesFilter(p) {
    if (activeDom !== "all" && p.dom !== activeDom) return false;
    if (activeDiff === "all") return true;
    if (activeDiff === "todo") return !progress[p.id];
    return String(p.diff) === activeDiff;
  }

  // ---- build the filter bar from the data ------------------------------------
  function buildFilters() {
    var diffGroup =
      '<button class="chip" data-kind="diff" data-f="all" aria-pressed="true">all</button>' +
      '<button class="chip" data-kind="diff" data-f="1" aria-pressed="false">easy</button>' +
      '<button class="chip" data-kind="diff" data-f="2" aria-pressed="false">medium</button>' +
      '<button class="chip" data-kind="diff" data-f="3" aria-pressed="false">hard</button>' +
      '<button class="chip" data-kind="diff" data-f="todo" aria-pressed="false">not done</button>';

    var domChips = ['<button class="chip" data-kind="dom" data-f="all" aria-pressed="true">all domains</button>'];
    uniqueDomains().forEach(function (d) {
      domChips.push('<button class="chip" data-kind="dom" data-f="' + d + '" aria-pressed="false">' + d + "</button>");
    });

    filtersEl.innerHTML =
      '<div class="filter-group">' + diffGroup + "</div>" +
      '<div class="filter-sep"></div>' +
      '<div class="filter-group">' + domChips.join("") + "</div>";
  }

  // ---- render one card -------------------------------------------------------
  function cardHTML(p) {
    var done = progress[p.id];
    var dlabel = DIFF_LABELS[p.diff] || "";

    var answerRows = COMPONENTS.map(function (c) {
      var key = c[0], cls = c[1], label = c[2];
      if (!p[key]) return "";
      return '<div class="a-row"><span class="tag ' + cls + '">' + label +
             '</span><span class="body">' + p[key] + "</span></div>";
    }).join("");

    var ctxBtn = p.ctx ? '<button class="ctx-btn">show context</button>' : "";
    var ctxBox = p.ctx
      ? '<div class="context"><p class="clabel">context</p><div class="cbody">' + p.ctx + "</div></div>"
      : "";

    return '' +
      '<div class="card-top">' +
        '<span class="qnum">#' + String(p.id).padStart(2, "0") + "</span>" +
        '<div class="meta"><span class="pill">' + (p.dom || "") + '</span>' +
          '<span class="pill diff-' + p.diff + '">' + dlabel + "</span></div>" +
      "</div>" +
      '<div class="scenario"><span class="q">' + p.title + "</span>" + p.q + "</div>" +
      '<div class="btns">' +
        ctxBtn +
        '<button class="reveal-btn">reveal model answer</button>' +
        '<div class="rate ' + (done ? "show" : "") + '">' +
          "<span>how'd you do?</span>" +
          '<button class="got ' + (done === "got" ? "sel" : "") + '">got it</button>' +
          '<button class="miss ' + (done === "miss" ? "sel" : "") + '">missed it</button>' +
        "</div>" +
      "</div>" +
      ctxBox +
      '<div class="answer ' + (done ? "show" : "") + '">' + answerRows + "</div>";
  }

  function render() {
    cardsEl.innerHTML = "";
    var list = PROBLEMS.filter(matchesFilter);

    if (list.length === 0) {
      cardsEl.innerHTML = '<p class="empty">No problems match this filter.</p>';
      return;
    }

    list.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "card" + (progress[p.id] ? " done" : "");
      card.innerHTML = cardHTML(p);

      var ans = card.querySelector(".answer");
      var rate = card.querySelector(".rate");
      var ctxBtn = card.querySelector(".ctx-btn");
      var ctxBox = card.querySelector(".context");

      if (ctxBtn && ctxBox) {
        ctxBtn.addEventListener("click", function () {
          ctxBox.classList.add("show");
          ctxBtn.classList.add("hide");
        });
      }
      card.querySelector(".reveal-btn").addEventListener("click", function () {
        ans.classList.add("show");
        rate.classList.add("show");
      });
      card.querySelector(".got").addEventListener("click", function () {
        progress[p.id] = "got"; save(); render(); updateBar();
      });
      card.querySelector(".miss").addEventListener("click", function () {
        progress[p.id] = "miss"; save(); render(); updateBar();
      });

      cardsEl.appendChild(card);
    });
  }

  function updateBar() {
    var total = PROBLEMS.length;
    var done = PROBLEMS.filter(function (p) { return progress[p.id]; }).length;
    var got = PROBLEMS.filter(function (p) { return progress[p.id] === "got"; }).length;
    document.getElementById("barFill").style.width = (total ? done / total * 100 : 0) + "%";
    document.getElementById("pcount").textContent =
      done + " / " + total + " attempted · " + got + " solid";
  }

  // ---- wire up filter clicks (one delegated listener) ------------------------
  filtersEl.addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    var kind = b.dataset.kind;
    if (kind === "diff") activeDiff = b.dataset.f;
    else if (kind === "dom") activeDom = b.dataset.f;
    // update pressed-state only within the clicked chip's group
    b.parentElement.querySelectorAll(".chip").forEach(function (c) {
      c.setAttribute("aria-pressed", String(c === b));
    });
    render();
  });

  document.getElementById("resetBtn").addEventListener("click", function () {
    if (!confirm("Reset all progress on this device?")) return;
    progress = {}; save(); render(); updateBar();
  });

  // ---- boot ------------------------------------------------------------------
  buildFilters();
  render();
  updateBar();
})();
