/* SANA VITA — інтерактив сайту */
(function () {
  "use strict";

  /* ---------- Активна плашка в навігації ---------- */
  function initNavPill() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var pill = nav.querySelector(".nav__pill");
    var links = Array.prototype.slice.call(nav.querySelectorAll(".nav__link"));
    var active = nav.querySelector(".nav__link.is-active");

    function moveTo(el) {
      if (!el) { pill.style.width = "0px"; return; }
      pill.style.width = el.offsetWidth + "px";
      pill.style.transform = "translateX(" + (el.offsetLeft - 6) + "px)";
    }
    links.forEach(function (l) {
      l.addEventListener("mouseenter", function () { moveTo(l); });
      l.addEventListener("focus", function () { moveTo(l); });
    });
    nav.addEventListener("mouseleave", function () { moveTo(active); });
    window.addEventListener("resize", function () { moveTo(active); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveTo(active); });
    moveTo(active);
  }

  /* ---------- Оверлеї: меню та модальні вікна ---------- */
  var lastFocus = null;
  function openOverlay(id) {
    var el = document.getElementById(id);
    if (!el) return;
    document.querySelectorAll(".overlay.is-open").forEach(function (o) { o.classList.remove("is-open"); });
    lastFocus = lastFocus || document.activeElement;
    el.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
    var f = el.querySelector("input, [data-close]");
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function closeOverlays() {
    document.querySelectorAll(".overlay.is-open").forEach(function (o) { o.classList.remove("is-open"); });
    document.documentElement.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }
  function initOverlays() {
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-open]");
      if (opener) { e.preventDefault(); openOverlay(opener.getAttribute("data-open")); return; }
      if (e.target.closest("[data-close]")) { e.preventDefault(); closeOverlays(); return; }
      if (e.target.classList.contains("overlay") || e.target.hasAttribute("data-close-outside")) closeOverlays();
      // клік по пункту меню з якорем на поточній сторінці
      if (e.target.closest(".menu__item")) closeOverlays();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeOverlays(); });
  }

  /* ---------- Форма зворотного дзвінка ---------- */
  function formatPhone(v) {
    var d = v.replace(/\D/g, "");
    if (d.indexOf("380") === 0) d = d.slice(3); else if (d.indexOf("80") === 0) d = d.slice(2); else if (d.indexOf("0") === 0) d = d.slice(1);
    d = d.slice(0, 9);
    var out = "+38 (0";
    if (!d.length) return v.trim() ? out : "";
    out += d.slice(0, 2);
    if (d.length >= 2) out += ") " + d.slice(2, 5);
    if (d.length > 5) out += " " + d.slice(5, 7);
    if (d.length > 7) out += " " + d.slice(7, 9);
    return out;
  }
  function initCallForm() {
    document.querySelectorAll("[data-call-form]").forEach(function (form) {
      var input = form.querySelector("input[type=tel]");
      var field = input.closest(".field");
      input.addEventListener("input", function () { input.value = formatPhone(input.value); field.classList.remove("is-invalid"); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (input.value.replace(/\D/g, "").length < 12) { field.classList.add("is-invalid"); input.focus(); return; }
        form.reset();
        openOverlay("done");
      });
    });
  }

  /* ---------- Каруселі на scroll-snap ---------- */
  function initCarousels() {
    document.querySelectorAll("[data-carousel]").forEach(function (root) {
      var track = root.querySelector(".carousel__track");
      var prev = root.querySelector("[data-prev]");
      var next = root.querySelector("[data-next]");
      var dotsBox = root.querySelector(".dots");
      if (!track) return;

      function pages() {
        var n = Math.ceil((track.scrollWidth - 2) / track.clientWidth);
        return Math.max(1, n);
      }
      function page() {
        var max = track.scrollWidth - track.clientWidth;
        if (max <= 0) return 0;
        return Math.round(track.scrollLeft / max * (pages() - 1));
      }
      function go(i) {
        var max = track.scrollWidth - track.clientWidth;
        var n = pages();
        track.scrollTo({ left: n > 1 ? max * i / (n - 1) : 0, behavior: "smooth" });
      }
      function render() {
        var n = pages(), p = page();
        if (dotsBox) {
          if (dotsBox.children.length !== n) {
            dotsBox.innerHTML = "";
            for (var i = 0; i < n; i++) {
              var b = document.createElement("button");
              b.type = "button";
              b.setAttribute("aria-label", "Сторінка " + (i + 1));
              (function (k) { b.addEventListener("click", function () { go(k); }); })(i);
              dotsBox.appendChild(b);
            }
          }
          Array.prototype.forEach.call(dotsBox.children, function (b, i) { b.classList.toggle("is-active", i === p); });
        }
        var nav = root.querySelector(".carousel__nav");
        if (nav) nav.style.visibility = n > 1 ? "" : "hidden";
        if (prev) prev.disabled = p <= 0;
        if (next) next.disabled = p >= n - 1;
      }
      if (prev) prev.addEventListener("click", function () { go(Math.max(0, page() - 1)); });
      if (next) next.addEventListener("click", function () { go(Math.min(pages() - 1, page() + 1)); });
      var t;
      track.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(render, 60); }, { passive: true });
      window.addEventListener("resize", render);
      render();
    });
  }

  /* ---------- Слайдер програм у першому екрані ---------- */
  function initProgram() {
    document.querySelectorAll("[data-program]").forEach(function (root) {
      var slides = root.querySelectorAll(".program__slide");
      var dotsBox = root.querySelector(".dots");
      var i = 0, timer;
      function show(k) {
        i = (k + slides.length) % slides.length;
        slides.forEach(function (s, j) { s.classList.toggle("is-active", j === i); s.setAttribute("aria-hidden", j === i ? "false" : "true"); });
        Array.prototype.forEach.call(dotsBox.children, function (b, j) { b.classList.toggle("is-active", j === i); });
      }
      slides.forEach(function (_, j) {
        var b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-label", "Програма " + (j + 1));
        b.addEventListener("click", function () { show(j); restart(); });
        dotsBox.appendChild(b);
      });
      function restart() { clearInterval(timer); if (slides.length > 1) timer = setInterval(function () { show(i + 1); }, 6000); }
      root.querySelectorAll("[data-prev]").forEach(function (b) { b.addEventListener("click", function () { show(i - 1); restart(); }); });
      root.querySelectorAll("[data-next]").forEach(function (b) { b.addEventListener("click", function () { show(i + 1); restart(); }); });
      root.addEventListener("mouseenter", function () { clearInterval(timer); });
      root.addEventListener("mouseleave", restart);
      // свайп на мобільному
      var x0 = null;
      root.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      root.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); restart(); }
      });
      show(0); restart();
    });
  }

  /* ---------- Коло цінностей: обертання по орбіті ---------- */
  function initValues() {
    document.querySelectorAll("[data-values]").forEach(function (root) {
      var center = root.querySelector(".values__center");
      var title = center.querySelector("h3");
      var text = center.querySelector("p");
      var inner = root.querySelector(".values__orbit-inner");
      var items = Array.prototype.slice.call(root.querySelectorAll(".value"));
      var n = items.length, step = 360 / n;
      // радіуси орбіти (у % від ширини/висоти блоку) задаються в CSS: на мобільному орбіта — еліпс
      function radius(name) { return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 39.71; }
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var offset = 0, active = 0, anim = null, timer = null, hover = false;

      function place(off) {
        items.forEach(function (el, i) {
          var a = (-90 + i * step + off) * Math.PI / 180;
          el.style.left = (50 + radius("--rx") * Math.cos(a)) + "%";
          el.style.top = (50 + radius("--ry") * Math.sin(a)) + "%";
        });
        if (inner) inner.style.transform = "rotate(" + off + "deg)";
      }
      function setActive(k) {
        active = k;
        items.forEach(function (b, i) {
          b.classList.toggle("is-active", i === k); b.setAttribute("aria-pressed", i === k ? "true" : "false");
          var img = b.querySelector("img");
          if (!img.getAttribute("data-src")) img.setAttribute("data-src", img.getAttribute("src"));
          img.src = i === k ? img.getAttribute("data-active-src") || img.getAttribute("data-src") : img.getAttribute("data-src");
        });
        center.classList.add("is-fading");
        setTimeout(function () {
          title.textContent = items[k].getAttribute("data-title");
          text.textContent = items[k].getAttribute("data-text");
          center.classList.remove("is-fading");
        }, reduce ? 0 : 220);
      }
      function go(k) {
        if (k === active) return;
        var target = -k * step;
        var diff = ((target - offset) % 360 + 540) % 360 - 180; // найкоротший шлях
        var from = offset, to = offset + diff, t0 = null, dur = reduce ? 0 : 900;
        setActive(k);
        cancelAnimationFrame(anim);
        function frame(t) {
          if (t0 === null) t0 = t;
          var x = dur ? Math.min(1, (t - t0) / dur) : 1;
          var e = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; // easeInOutCubic
          offset = from + (to - from) * e;
          place(offset);
          if (x < 1) anim = requestAnimationFrame(frame);
        }
        anim = requestAnimationFrame(frame);
      }
      function restart() {
        clearInterval(timer);
        if (reduce) return;
        timer = setInterval(function () { if (!hover && !document.hidden) go((active + 1) % n); }, 5000);
      }
      items.forEach(function (b, i) {
        b.addEventListener("click", function () { go(i); restart(); });
      });
      root.addEventListener("mouseenter", function () { hover = true; });
      root.addEventListener("mouseleave", function () { hover = false; });
      root.addEventListener("focusin", function () { hover = true; });
      root.addEventListener("focusout", function () { hover = false; });
      // автопрокрутка стартує, коли коло зʼявляється на екрані
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) restart(); else clearInterval(timer); }); }, { threshold: .4 }).observe(root);
      } else restart();
      // на мобільному за макетом стартова активна іконка — «Лікарі»
      var start = window.matchMedia("(max-width: 767px)").matches ? parseInt(root.getAttribute("data-mobile-start") || "0", 10) : 0;
      offset = -start * step;
      place(offset);
      active = -1; setActive(start);
      window.addEventListener("resize", function () { place(offset); });
    });
  }

  /* ---------- Акордеони (FAQ, ціни) ---------- */
  function initAccordions() {
    document.querySelectorAll("[data-accordion] [data-acc-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest("[data-acc-item]");
        var open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* ---------- Таби / фільтри ---------- */
  function initFilters() {
    document.querySelectorAll("[data-filter-group]").forEach(function (group) {
      var target = document.querySelector(group.getAttribute("data-filter-group"));
      var chips = group.querySelectorAll("[data-filter]");
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          var v = chip.getAttribute("data-filter");
          chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
          if (!target) return;
          target.querySelectorAll("[data-cat]").forEach(function (el) {
            var cats = el.getAttribute("data-cat").split(" ");
            el.hidden = !(v === "all" || cats.indexOf(v) !== -1);
          });
        });
      });
    });
  }

  /* ---------- Відділення: вибір проблеми та пошук ---------- */
  function initProblems() {
    var root = document.querySelector("[data-problems]");
    var dataEl = document.getElementById("problems-data");
    if (!root || !dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var tabsBox = root.querySelector(".problems__tabs");
    var panel = root.querySelector(".problems__panel");
    var title = panel.querySelector("h3");
    var list = panel.querySelector(".plist");
    var search = document.querySelector("[data-problem-search]");
    var mobile = window.matchMedia("(max-width: 767px)");
    var SHOWN = 8, expanded = false, current = 0;
    var LINKS = { "Геморой": "disease.html" };

    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function item(name, label, q, extra) {
      var cls = "pitem" + (extra ? " " + extra : "");
      var text = esc(label);
      if (q) {
        var i = label.toLowerCase().indexOf(q);
        if (i > -1) text = esc(label.slice(0, i)) + "<mark>" + esc(label.slice(i, i + q.length)) + "</mark>" + esc(label.slice(i + q.length));
      }
      return LINKS[name]
        ? '<a class="' + cls + '" href="' + LINKS[name] + '">' + text + "</a>"
        : '<button class="' + cls + '" type="button" data-open="call">' + text + "</button>";
    }

    var tabs = data.map(function (d, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "ptab"; b.textContent = d[0];
      // на мобільному (за макетом) деякі вкладки мають іншу назву й порядок, а частина прихована
      if (d.length > 2) {
        if (d[2] === "") b.classList.add("ptab--desktop");
        else if (d[2] !== d[0]) b.innerHTML = '<span class="only-desktop">' + esc(d[0]) + '</span><span class="only-mobile">' + esc(d[2]).replace(/\n/g, "<br>") + "</span>";
        if (d[3]) b.style.setProperty("--mo", d[3]);
      }
      b.setAttribute("role", "tab");
      b.addEventListener("click", function () {
        if (mobile.matches && current === i && b.classList.contains("is-active")) { select(-1); return; }
        if (search) search.value = "";
        select(i);
      });
      tabsBox.appendChild(b);
      return b;
    });
    var toggle = document.createElement("button");
    toggle.type = "button"; toggle.className = "ptoggle";
    toggle.innerHTML = "<span>Усі відділення (" + data.length + ")</span><img src='assets/icons/toggle-arrow.svg' alt=''>";
    toggle.addEventListener("click", function () { expanded = !expanded; layout(); });
    tabsBox.appendChild(toggle);

    function layout() {
      tabs.forEach(function (t, i) { t.hidden = !mobile.matches && !expanded && i >= SHOWN && i !== current; });
      toggle.hidden = mobile.matches;
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggle.querySelector("span").textContent = expanded ? "Згорнути" : "Усі відділення (" + data.length + ")";
      // на мобільному панель стоїть одразу під активною вкладкою
      if (mobile.matches) {
        var anchor = tabs[current];
        if (anchor && current >= 0) { anchor.after(panel); panel.style.setProperty("--mo", anchor.style.getPropertyValue("--mo") || 0); panel.hidden = false; }
        else panel.hidden = true;
      } else {
        root.appendChild(panel); panel.hidden = false;
      }
    }
    function select(i) {
      current = i;
      tabs.forEach(function (t, k) { t.classList.toggle("is-active", k === i); t.setAttribute("aria-selected", k === i ? "true" : "false"); });
      if (i >= 0) {
        title.textContent = data[i][0];
        list.innerHTML = data[i][4]
          // окремий перелік проблем для мобільного макета
          ? data[i][1].map(function (n) { return item(n, n, "", "only-desktop"); }).join("") + data[i][4].map(function (n) { return item(n, n, "", "only-mobile"); }).join("")
          : data[i][1].map(function (n) { return item(n, n); }).join("");
      }
      layout();
    }
    if (search) {
      search.addEventListener("input", function () {
        var q = search.value.trim().toLowerCase();
        if (!q) { select(current < 0 ? 0 : current); return; }
        var hits = [];
        data.forEach(function (d) {
          d[1].forEach(function (n) { if (n.toLowerCase().indexOf(q) > -1) hits.push([n, d[0]]); });
        });
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        title.textContent = hits.length ? "Знайдено: " + hits.length : "Нічого не знайдено";
        list.innerHTML = hits.length
          ? hits.map(function (h) { return item(h[0], h[0] + " · " + h[1], q); }).join("")
          : '<p class="problems__empty">Спробуйте іншу назву або залиште номер — адміністратор підкаже, до якого лікаря звернутися.</p>';
        if (mobile.matches) { tabsBox.before(panel); panel.style.removeProperty("--mo"); panel.hidden = false; }
      });
    }
    // картки відділень зверху відкривають потрібну вкладку
    document.querySelectorAll("[data-dept]").forEach(function (card) {
      card.addEventListener("click", function () {
        var name = card.getAttribute("data-dept");
        var i = data.findIndex(function (d) { return d[0] === name; });
        if (i > -1) { if (i >= SHOWN) expanded = true; if (search) search.value = ""; select(i); }
      });
    });
    mobile.addEventListener ? mobile.addEventListener("change", layout) : mobile.addListener(layout);
    select(0);
  }

  /* ---------- Лікарі: фільтр, пошук, «показати більше» ---------- */
  function initDoctors() {
    // на сторінці два списки: десктопний і мобільний (за мобільним макетом); кожен зі своїми фільтрами
    document.querySelectorAll("[data-doc-list]").forEach(function (list) {
      var scope = list.closest("section") || document;
      var cards = Array.prototype.slice.call(list.querySelectorAll(".doc"));
      var chips = scope.querySelectorAll("[data-doc-chips] [data-filter]");
      var search = scope.querySelector("[data-doc-search]");
      var more = scope.querySelector("[data-doc-more]");
      var empty = scope.querySelector(".docs-empty");
      var cat = "all", MOBILE_LIMIT = parseInt(list.getAttribute("data-limit") || "8", 10);
      var always = list.hasAttribute("data-more-always");
      function apply() {
        var q = search ? search.value.trim().toLowerCase() : "";
        var n = 0;
        cards.forEach(function (c) {
          var okCat = cat === "all" || c.getAttribute("data-cat").split(" ").indexOf(cat) > -1;
          var okQ = !q || c.getAttribute("data-search").toLowerCase().indexOf(q) > -1;
          c.hidden = !(okCat && okQ);
          c.classList.remove("is-extra");
          if (!c.hidden) { n++; if (n > MOBILE_LIMIT) c.classList.add("is-extra"); }
        });
        if (empty) empty.hidden = n > 0;
        if (more) more.hidden = list.classList.contains("is-expanded") || (!always && n <= MOBILE_LIMIT) || n === 0;
      }
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          cat = chip.getAttribute("data-filter");
          chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
          apply();
        });
      });
      if (search) search.addEventListener("input", apply);
      if (more) more.addEventListener("click", function () { list.classList.add("is-expanded"); more.hidden = true; });
      apply();
    });
  }

  function initLightbox() {
    var box = document.getElementById("lightbox");
    if (!box) return;
    var img = box.querySelector(".lightbox > img");
    document.querySelectorAll("[data-lightbox]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var src = a.querySelector("img");
        img.src = a.getAttribute("href"); img.alt = src ? src.alt : "";
        openOverlay("lightbox");
      });
    });
  }
  function initTimeline() {
    document.querySelectorAll("[data-timeline-more]").forEach(function (btn) {
      var card = btn.closest("[data-timeline]");
      var hidden = card.querySelectorAll(".tl[hidden]");
      if (!hidden.length) { btn.hidden = true; return; }
      btn.addEventListener("click", function () {
        hidden.forEach(function (t) { t.hidden = false; });
        btn.hidden = true;
      });
    });
  }

  /* ---------- Ціни: відділення, акордеон, пошук ---------- */
  function initPrices() {
    var root = document.querySelector("[data-prices]");
    var dataEl = document.getElementById("prices-data");
    if (!root || !dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var tabsBox = root.querySelector(".problems__tabs");
    var panel = root.querySelector(".price-panel");
    var search = document.querySelector("[data-price-search]");
    var mobile = window.matchMedia("(max-width: 767px)");
    var current = 0;
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function hl(s, q) {
      if (!q) return esc(s);
      var i = s.toLowerCase().indexOf(q);
      return i < 0 ? esc(s) : esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + q.length)) + "</mark>" + esc(s.slice(i + q.length));
    }
    var NOTE = '<div class="price-note"><span>Вартість уточнюйте в адміністратора — залиште номер, і ми передзвонимо.</span><button class="btn btn--purple" type="button" data-open="call">Дізнатися ціну</button></div>';
    function rows(list, q) {
      if (!list.length) return NOTE;
      return '<div class="price-row price-row--head"><span class="price-row__name">Послуга</span><span class="price-row__price">Вартість</span><span class="price-row__act"></span></div>' +
        list.map(function (r) {
          return '<div class="price-row"><span class="price-row__name">' + hl(r[0], q) + '</span><span class="price-row__price">' + esc(r[1]) +
            '</span><span class="price-row__act"><button class="btn btn--purple" type="button" data-open="call"><span class="only-desktop">Записатись</span><span class="only-mobile">Запис</span></button></span></div>';
        }).join("");
    }
    function group(title, list, open, q) {
      return '<div class="pgroup' + (open ? " is-open" : "") + '"><button class="pgroup__head" type="button" aria-expanded="' + open + '"><span>' + esc(title) +
        '</span><span class="pgroup__toggle" aria-hidden="true">' + (open ? "−" : "+") + '</span></button><div class="pgroup__body">' + rows(list, q) + "</div></div>";
    }
    panel.addEventListener("click", function (e) {
      var h = e.target.closest(".pgroup__head");
      if (!h) return;
      var g = h.parentNode, open = g.classList.toggle("is-open");
      h.setAttribute("aria-expanded", open); h.querySelector(".pgroup__toggle").textContent = open ? "−" : "+";
    });
    var tabs = data.map(function (d, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "ptab"; b.textContent = d[0];
      // на мобільному (за макетом) деякі вкладки мають іншу назву й порядок, а частина прихована
      if (d.length > 2) {
        if (d[2] === "") b.classList.add("ptab--desktop");
        else if (d[2] !== d[0]) b.innerHTML = '<span class="only-desktop">' + esc(d[0]) + '</span><span class="only-mobile">' + esc(d[2]).replace(/\n/g, "<br>") + "</span>";
        if (d[3]) b.style.setProperty("--mo", d[3]);
      }
      b.setAttribute("role", "tab");
      b.addEventListener("click", function () {
        if (search) search.value = "";
        if (mobile.matches && current === i) { select(-1); return; }
        select(i);
      });
      tabsBox.appendChild(b);
      return b;
    });
    function place() {
      if (mobile.matches) { if (current >= 0) { tabs[current].after(panel); panel.style.setProperty("--mo", tabs[current].style.getPropertyValue("--mo") || 0); panel.hidden = false; } else panel.hidden = true; }
      else { root.appendChild(panel); panel.hidden = false; }
    }
    function select(i) {
      current = i;
      tabs.forEach(function (t, k) { t.classList.toggle("is-active", k === i); t.setAttribute("aria-selected", k === i); });
      if (i >= 0) {
        var groups = data[i][1];
        panel.innerHTML = groups.length
          ? groups.map(function (g) { return group(g[0], g[1], g[1].length > 0); }).join("")
          : '<div class="pgroup is-open"><div class="pgroup__body" style="padding-top:5px">' + NOTE + "</div></div>";
      }
      place();
    }
    if (search) search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      if (!q) { select(current < 0 ? 0 : current); return; }
      var html = "";
      data.forEach(function (d) {
        d[1].forEach(function (g) {
          var hits = g[1].filter(function (r) { return r[0].toLowerCase().indexOf(q) > -1; });
          if (hits.length || g[0].toLowerCase().indexOf(q) > -1) html += group(d[0] + " · " + g[0], hits.length ? hits : g[1], true, q);
        });
      });
      tabs.forEach(function (t) { t.classList.remove("is-active"); });
      panel.innerHTML = html || '<div class="pgroup is-open"><div class="pgroup__body" style="padding-top:5px"><div class="price-note"><span>Нічого не знайдено за запитом «' + esc(q) + '».</span><button class="btn btn--purple" type="button" data-open="call">Запитати адміністратора</button></div></div></div>';
      if (mobile.matches) { tabsBox.before(panel); panel.style.removeProperty("--mo"); panel.hidden = false; }
    });
    mobile.addEventListener ? mobile.addEventListener("change", place) : mobile.addListener(place);
    select(0);
  }

  /* ---------- Мобільні плейсхолдери полів (за мобільним макетом) ---------- */
  function initPlaceholders() {
    var mq = window.matchMedia("(max-width: 767px)");
    var fields = Array.prototype.slice.call(document.querySelectorAll("[data-placeholder-mobile]"));
    fields.forEach(function (f) { f.setAttribute("data-placeholder-desktop", f.getAttribute("placeholder") || ""); });
    function apply() {
      fields.forEach(function (f) { f.setAttribute("placeholder", f.getAttribute(mq.matches ? "data-placeholder-mobile" : "data-placeholder-desktop")); });
    }
    apply();
    mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener(apply);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPlaceholders();
    initPrices();
    initLightbox();
    initTimeline();
    initDoctors();
    initProblems();
    initNavPill();
    initOverlays();
    initCallForm();
    initCarousels();
    initProgram();
    initValues();
    initAccordions();
    initFilters();
  });
})();
