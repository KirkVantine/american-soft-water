(() => {
  "use strict";

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- Water problem finder ---------- */
  const SYMPTOMS = {
    hard:     { cause: "Hard water (calcium and magnesium)", systems: ["softener"] },
    skin:     { cause: "Hard water (calcium and magnesium)", systems: ["softener"] },
    iron:     { cause: "Iron, and sometimes manganese", systems: ["iron", "softener"] },
    sulfur:   { cause: "Hydrogen sulfide gas", systems: ["iron"] },
    chlorine: { cause: "Chlorine from city treatment", systems: ["carbon", "ro"] },
    sediment: { cause: "Sand, silt, or scale particles", systems: ["prefilter"] },
    drinking: { cause: "Dissolved metals or nitrates", systems: ["ro"] }
  };

  const SYSTEMS = {
    softener:  { name: "Water softener", href: "#softeners", img: "assets/img/install-twin-black.jpg",
                 alt: "Twin-tank water softener installation",
                 text: "Removes the minerals that cause scale, spotty dishes, and dry skin. It also handles light iron." },
    iron:      { name: "Air-injection iron & sulfur filter", href: "#iron-filters", img: "assets/img/install-well.jpg",
                 alt: "Filter system installed beside a well pressure tank",
                 text: "Oxidizes iron and hydrogen sulfide so they’re filtered out before they stain or smell." },
    ro:        { name: "Reverse osmosis drinking water", href: "#reverse-osmosis", img: "assets/img/install-ro.jpg",
                 alt: "Reverse osmosis unit under a kitchen sink",
                 text: "A multi-stage system for the kitchen faucet that reduces lead, arsenic, nitrates, and chlorine taste." },
    carbon:    { name: "Whole-house carbon filter", href: "#filtration", img: "assets/img/install-prefilter.jpg",
                 alt: "Whole-house filter plumbed into a basement water line",
                 text: "Takes chlorine taste and smell out of every tap in the house, not just the kitchen." },
    prefilter: { name: "Sediment pre-filter", href: "#filtration", img: "assets/img/install-prefilter.jpg",
                 alt: "Sediment pre-filter ahead of a water softener",
                 text: "Catches sand and grit before they reach your fixtures and softener." }
  };

  const chips = Array.from(document.querySelectorAll(".chips input"));
  const empty = document.getElementById("finder-empty");
  const output = document.getElementById("finder-output");

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function renderFinder() {
    const picked = chips.filter((c) => c.checked).map((c) => c.value);
    if (!picked.length) {
      output.hidden = true;
      empty.hidden = false;
      return;
    }
    const causes = [...new Set(picked.map((k) => SYMPTOMS[k].cause))];
    const systems = [...new Set(picked.flatMap((k) => SYMPTOMS[k].systems))];
    const lead = SYSTEMS[systems[0]];

    output.innerHTML = `
      <img class="result__photo" src="${lead.img}" alt="${esc(lead.alt)}" width="800" height="450">
      <div class="result__body">
        <p class="result__cause">Likely cause: <strong>${causes.map(esc).join("; ")}</strong></p>
        <ul class="result__list">
          ${systems.map((k) => `<li><h3>${esc(SYSTEMS[k].name)}</h3><p>${esc(SYSTEMS[k].text)}</p></li>`).join("")}
        </ul>
        <div class="result__actions">
          <a class="btn btn--red" href="#water-test" data-prefill>Confirm it with a free test</a>
          <a class="text-link" href="${lead.href}">How it works</a>
        </div>
      </div>`;
    empty.hidden = true;
    output.hidden = false;
    output.classList.remove("is-updating");
    void output.offsetWidth; // restart the swap animation on each change
    output.classList.add("is-updating");
  }

  chips.forEach((c) => c.addEventListener("change", renderFinder));

  // Carry the finder picks into the booking form so they aren't entered twice.
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-prefill]")) return;
    const picked = chips.filter((c) => c.checked).map((c) => c.value);
    document.querySelectorAll("#test-form [data-key]").forEach((box) => {
      const keys = box.dataset.key.split(" ");
      if (keys.some((k) => picked.includes(k))) box.checked = true;
    });
  });

  /* ---------- Booking form ---------- */
  const form = document.getElementById("test-form");
  if (form) {
    const summary = document.getElementById("form-errors");
    const status = document.getElementById("form-status");

    const rules = [
      { id: "f-first", test: (v) => v.trim().length > 0, msg: "Enter your first name." },
      { id: "f-phone", test: (v) => v.replace(/\D/g, "").length >= 10, msg: "Enter a 10-digit phone number so Dan can call you back." },
      { id: "f-email", test: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: "Enter an email like name@example.com, or leave it blank." }
    ];

    function setError(input, msg) {
      const err = document.getElementById(input.id + "-err");
      if (msg) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", err.id);
        err.textContent = msg;
        err.hidden = false;
      } else {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
        err.hidden = true;
      }
    }

    rules.forEach((r) => {
      const input = document.getElementById(r.id);
      input.addEventListener("blur", () => {
        if (input.value || input.hasAttribute("aria-invalid")) setError(input, r.test(input.value) ? "" : r.msg);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      status.textContent = "";
      const failed = rules.filter((r) => {
        const input = document.getElementById(r.id);
        const ok = r.test(input.value);
        setError(input, ok ? "" : r.msg);
        return !ok;
      });

      if (failed.length) {
        summary.innerHTML = `Please fix ${failed.length === 1 ? "this" : "these"} before sending:<ul>${failed
          .map((r) => `<li><a href="#${r.id}">${esc(r.msg)}</a></li>`).join("")}</ul>`;
        summary.hidden = false;
        summary.focus({ preventScroll: true });
        summary.scrollIntoView({ block: "center" });
        return;
      }
      summary.hidden = true;

      const data = new FormData(form);
      const val = (k) => (data.get(k) || "").toString().trim();
      const problems = data.getAll("problems").join(", ") || "Not specified";
      const name = [val("first"), val("last")].filter(Boolean).join(" ");
      const lines = [
        `Name: ${name}`,
        `Phone: ${val("phone")}`,
        `Email: ${val("email") || "-"}`,
        `Address: ${[val("address"), val("city")].filter(Boolean).join(", ") || "-"}`,
        `Water source: ${val("source") || "Not sure"}`,
        `Current treatment: ${val("current") || "-"}`,
        `Problems: ${problems}`,
        "",
        val("message")
      ];
      const href = "mailto:americansoftwater@gmail.com"
        + "?subject=" + encodeURIComponent(`Free water test request: ${name}`)
        + "&body=" + encodeURIComponent(lines.join("\n"));
      window.location.href = href;
      status.textContent = "Your email app should open with the request ready to send. If it doesn’t, call 734-878-2572.";
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
