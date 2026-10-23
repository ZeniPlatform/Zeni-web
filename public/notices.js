// Avisos del equipo de Zeni en la web (los mismos del botón "!" de la app).
// Fuente única: /status.json. Aquí se muestran solo los avisos generales: los que
// son para ciertas versiones de la app (minVersion/maxVersion) quedan dentro de la app.
(function () {
  var ICON = { critical: "⛔", warning: "⚠️", info: "ℹ️" };
  var KEY = "zp-web-notices-closed";

  function closed() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function close(id) {
    try { localStorage.setItem(KEY, JSON.stringify(closed().concat(id).slice(-20))); } catch (e) { /* sin almacenamiento */ }
  }
  function active(n, now) {
    if (!n || typeof n.id !== "string" || typeof n.title !== "string" || typeof n.message !== "string") return false;
    if (n.minVersion || n.maxVersion) return false;
    if (n.since && Date.parse(n.since) > now) return false;
    if (n.until && Date.parse(n.until) <= now) return false;
    return closed().indexOf(n.id) < 0;
  }

  fetch("/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var list = (data && Array.isArray(data.notices) ? data.notices : []).filter(function (n) { return active(n, Date.now()); });
      if (!list.length) return;
      var order = { critical: 0, warning: 1, info: 2 };
      list.sort(function (a, b) { return (order[a.level] ?? 2) - (order[b.level] ?? 2); });

      var bar = document.createElement("div");
      bar.className = "zn-bar";
      bar.setAttribute("role", "status");
      list.slice(0, 3).forEach(function (n) {
        var level = order[n.level] === undefined ? "info" : n.level;
        var row = document.createElement("div");
        row.className = "zn-notice zn-" + level;
        var icon = document.createElement("span");
        icon.className = "zn-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = ICON[level];
        var text = document.createElement("p");
        var b = document.createElement("b");
        b.textContent = n.title;
        text.appendChild(b);
        text.appendChild(document.createTextNode(" " + n.message));
        if (typeof n.link === "string" && /^https:\/\//.test(n.link)) {
          var a = document.createElement("a");
          a.href = n.link;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = " Más información";
          text.appendChild(a);
        }
        var x = document.createElement("button");
        x.type = "button";
        x.className = "zn-close";
        x.setAttribute("aria-label", "Cerrar aviso");
        x.textContent = "✕";
        x.onclick = function () {
          close(n.id);
          row.remove();
          if (!bar.children.length) bar.remove();
        };
        row.append(icon, text, x);
        bar.appendChild(row);
      });

      var nav = document.querySelector("header.nav");
      if (nav) nav.insertAdjacentElement("afterend", bar);
      else document.body.prepend(bar);
    })
    .catch(function () { /* sin avisos */ });
})();
