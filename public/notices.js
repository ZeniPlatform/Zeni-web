// Avisos del equipo de Zeni en la web (los mismos del botón "!" de la app).
// Fuente única: /status.json. Se muestra como botón en el menú con un panel desplegable.
// Solo los avisos generales: los de ciertas versiones de la app (minVersion/maxVersion) quedan en la app.
(function () {
  var ICON = { critical: "⛔", warning: "⚠️", info: "ℹ️" };
  var ORDER = { critical: 0, warning: 1, info: 2 };
  var SEEN = "zp-web-notices-seen";

  function seen() {
    try { return JSON.parse(localStorage.getItem(SEEN) || "[]"); } catch (e) { return []; }
  }
  function active(n, now) {
    if (!n || typeof n.id !== "string" || typeof n.title !== "string" || typeof n.message !== "string") return false;
    if (n.minVersion || n.maxVersion) return false;
    if (n.since && Date.parse(n.since) > now) return false;
    if (n.until && Date.parse(n.until) <= now) return false;
    return true;
  }
  function ago(iso) {
    if (!iso) return "";
    var min = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
    if (min < 60) return "hace " + min + " min";
    var h = Math.floor(min / 60);
    if (h < 24) return "hace " + h + " h";
    var d = new Date(iso);
    return "desde el " + d.getDate() + " de " + d.toLocaleDateString("es-CL", { month: "short" }).replace(".", "");
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  fetch("/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var list = (data && Array.isArray(data.notices) ? data.notices : []).filter(function (n) { return active(n, Date.now()); });
      if (!list.length) return;
      list.forEach(function (n) { if (ORDER[n.level] === undefined) n.level = "info"; });
      list.sort(function (a, b) { return ORDER[a.level] - ORDER[b.level]; });
      var level = list[0].level;
      var unseen = list.some(function (n) { return seen().indexOf(n.id) < 0; });

      var wrap = el("div", "zn-wrap");
      var btn = el("button", "zn-pill zn-" + level + (unseen ? " zn-new" : ""));
      btn.type = "button";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Avisos del equipo de Zeni (" + list.length + ")");
      btn.append(el("span", "zn-mark", "!"));
      var label = el("span", "zn-label", list[0].title);
      if (list.length > 1) label.append(el("small", "", " +" + (list.length - 1)));
      btn.append(label);

      var pop = el("div", "zn-pop");
      pop.hidden = true;
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", "Avisos del equipo de Zeni");
      pop.append(el("h3", "", "Avisos de Zeni"));
      list.slice(0, 10).forEach(function (n) {
        var item = el("div", "zn-item zn-" + n.level);
        item.append(el("span", "zn-icon", ICON[n.level]));
        var body = el("div");
        body.append(el("b", "", n.title), el("p", "", n.message));
        var meta = el("small", "", ago(n.since));
        if (typeof n.link === "string" && /^https:\/\//.test(n.link)) {
          var a = el("a", "", (n.since ? " · " : "") + "Más información");
          a.href = n.link;
          a.target = "_blank";
          a.rel = "noopener";
          meta.append(a);
        }
        body.append(meta);
        item.append(body);
        pop.append(item);
      });

      function toggle(open) {
        pop.hidden = !open;
        btn.setAttribute("aria-expanded", String(open));
        if (open) {
          btn.classList.remove("zn-new");
          try { localStorage.setItem(SEEN, JSON.stringify(list.map(function (n) { return n.id; }))); } catch (e) { /* sin almacenamiento */ }
        }
      }
      btn.onclick = function () { toggle(pop.hidden); };
      document.addEventListener("click", function (e) { if (!wrap.contains(e.target)) toggle(false); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggle(false); });

      wrap.append(btn, pop);
      var bar = document.querySelector("header.nav .wrap");
      if (!bar) return;
      // Antes del último elemento del menú ("Descargar gratis" o "Volver al inicio").
      bar.insertBefore(wrap, bar.lastElementChild);
    })
    .catch(function () { /* sin avisos */ });
})();
