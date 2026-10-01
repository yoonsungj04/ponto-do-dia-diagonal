/* MODO GRAVAÇÃO — só roda dentro do gravar.html, nunca no site público.
   Roda depois do themes.js e antes do app.js:
     1. tira da roleta os temas que você já gravou
     2. no fim do ponto, mostra o botão "Gravei ✓"
     3. guarda o histórico neste navegador, com backup em arquivo        */
(function () {
  "use strict";

  var KEY = "ponto-do-dia:gravados";          // onde o histórico fica salvo
  var ALL = (window.SHOT_THEMES || []).slice(); // a lista completa, intacta
  var POOL = window.SHOT_THEMES || [];          // a mesma lista que o app.js usa

  /* ---------------- histórico ---------------- */
  function load() {
    try { var h = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(h) ? h : []; }
    catch (e) { return []; }
  }
  function save(h) {
    try { localStorage.setItem(KEY, JSON.stringify(h)); return true; }
    catch (e) { alert("Não consegui salvar o histórico neste navegador."); return false; }
  }
  function has(h, id) { return h.some(function (x) { return x.id === id; }); }
  function today() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  /* tira os gravados da roleta (mexendo na mesma lista que o app.js lê) */
  function prune() {
    var h = load();
    for (var i = POOL.length - 1; i >= 0; i--) if (has(h, POOL[i].id)) POOL.splice(i, 1);
  }
  prune();

  function mark(t) {
    var h = load();
    if (has(h, t.id)) return;
    h.push({ id: t.id, title: t.title, date: today() });
    if (save(h)) { prune(); refresh(); }
  }
  function unmark(id) {
    var h = load().filter(function (x) { return x.id !== id; });
    if (!save(h)) return;
    var t = ALL.filter(function (x) { return x.id === id; })[0];
    if (t && POOL.indexOf(t) < 0) POOL.push(t);
    refresh(); panel();
  }

  /* ---------------- estilo (reaproveita as cores do site) ---------------- */
  var css = document.createElement("style");
  css.textContent =
    ".suggest-link{display:none!important}" +
    ".gv-open{position:absolute;right:clamp(20px,4vw,56px);top:clamp(20px,4.4vh,44px);z-index:7}" +
    ".pill.gv-open{background:var(--yellow);border-color:var(--yellow);color:var(--navy)}" +
    ".pill.gv-open:hover{background:var(--cream);border-color:var(--cream)}" +
    ".pill.gv-done,.pill.gv-done:hover{background:var(--yellow);border-color:var(--yellow);color:var(--navy);cursor:default}" +
    ".gv-tag{color:var(--yellow)!important;opacity:1!important}" +
    ".gv-veil{position:fixed;inset:0;z-index:20;background:rgba(0,39,118,.55);display:grid;place-items:center;padding:16px}" +
    ".gv-box{background:var(--cream);color:var(--navy);border-radius:28px;width:min(560px,100%);max-height:86vh;" +
      "display:flex;flex-direction:column;padding:clamp(22px,4vh,34px) clamp(20px,3vw,34px);gap:16px}" +
    ".gv-box h2{font-family:var(--display);font-weight:400;font-size:clamp(26px,3vw,36px);line-height:1;letter-spacing:-.02em}" +
    ".gv-list{list-style:none;overflow:auto;flex:1;min-height:60px;border-top:2px solid rgba(0,39,118,.15)}" +
    ".gv-list li{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:2px solid rgba(0,39,118,.15)}" +
    ".gv-list .t{flex:1;font-size:15px;line-height:1.3}" +
    ".gv-list .d{font-size:11px;letter-spacing:.12em;opacity:.6;white-space:nowrap}" +
    ".gv-list button{border:0;background:none;color:var(--navy);font:600 12px var(--sans);text-decoration:underline;cursor:pointer;opacity:.7}" +
    ".gv-empty{padding:18px 0;opacity:.7}" +
    ".gv-row{display:flex;flex-wrap:wrap;gap:10px}" +
    ".gv-box .pill{border-color:var(--navy);color:var(--navy);font-size:14px;padding:10px 18px}" +
    ".gv-box .pill.primary{background:var(--navy);color:var(--cream)}" +
    ".gv-box .pill:hover{background:var(--yellow);border-color:var(--yellow);color:var(--navy)}";
  document.head.appendChild(css);

  /* ---------------- tela ---------------- */
  var openBtn, acts;

  function refresh() {
    if (openBtn) openBtn.textContent = "Gravados " + load().length + "/" + ALL.length;
  }

  function current() {
    var el = document.getElementById("theme");
    var txt = el ? el.textContent : "";
    return ALL.filter(function (t) { return t.title === txt; })[0];
  }

  /* quando o ponto acaba, junta o botão "Gravei ✓" aos botões do app */
  function addMarkButton() {
    if (document.body.dataset.phase !== "done" || !acts || acts.querySelector(".gv-mark")) return;
    var t = current(); if (!t) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pill gv-mark";
    var done = function () { b.textContent = "Gravado ✓"; b.classList.add("gv-done"); b.disabled = true; };
    b.textContent = "Gravei ✓";
    if (has(load(), t.id)) done();
    b.addEventListener("click", function () { mark(t); done(); });
    acts.appendChild(b);
  }

  /* ---------------- janela do histórico ---------------- */
  var veil = null;
  function close() { if (veil) { veil.remove(); veil = null; } }

  function panel() {
    close();
    var h = load();
    veil = document.createElement("div");
    veil.className = "gv-veil";
    veil.addEventListener("click", function (e) { if (e.target === veil) close(); });

    var box = document.createElement("div");
    box.className = "gv-box";
    var title = document.createElement("h2");
    title.textContent = h.length >= ALL.length && ALL.length
      ? "Você gravou todos!"
      : "Já gravados · " + h.length + "/" + ALL.length;
    box.appendChild(title);

    var list = document.createElement("ul");
    list.className = "gv-list";
    if (!h.length) {
      var e = document.createElement("li");
      e.className = "gv-empty";
      e.textContent = "Nenhum tema gravado ainda.";
      list.appendChild(e);
    }
    h.slice().reverse().forEach(function (x) {
      var li = document.createElement("li");
      var t = document.createElement("span"); t.className = "t"; t.textContent = x.title;
      var d = document.createElement("span"); d.className = "d";
      d.textContent = x.date.split("-").reverse().join("/");
      var u = document.createElement("button"); u.type = "button"; u.textContent = "desfazer";
      u.addEventListener("click", function () { unmark(x.id); });
      li.appendChild(t); li.appendChild(d); li.appendChild(u);
      list.appendChild(li);
    });
    box.appendChild(list);

    var row = document.createElement("div");
    row.className = "gv-row";
    [
      ["Baixar backup", backup, true],
      ["Restaurar backup", restore],
      ["Recomeçar tudo", reset],
      ["Fechar", close]
    ].forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pill" + (a[2] ? " primary" : "");
      b.textContent = a[0];
      b.addEventListener("click", a[1]);
      row.appendChild(b);
    });
    box.appendChild(row);
    veil.appendChild(box);
    document.body.appendChild(veil);
  }

  /* ---------------- backup ---------------- */
  function backup() {
    var blob = new Blob([JSON.stringify({ app: "ponto-do-dia", gravados: load() }, null, 2)],
                        { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ponto-do-dia-gravados-" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function restore() {
    var input = document.createElement("input");
    input.type = "file"; input.accept = ".json,application/json";
    input.addEventListener("change", function () {
      var f = input.files && input.files[0]; if (!f) return;
      f.text().then(function (txt) {
        var data = JSON.parse(txt);
        var got = Array.isArray(data) ? data : data.gravados;
        if (!Array.isArray(got)) throw new Error();
        var h = load();                       // junta com o que já existe, sem repetir
        got.forEach(function (x) { if (x && x.id && !has(h, x.id)) h.push(x); });
        if (save(h)) location.reload();
      }).catch(function () { alert("Esse arquivo não parece um backup do Ponto do Dia."); });
    });
    input.click();
  }

  function reset() {
    if (!confirm("Apagar o histórico e deixar todos os temas voltarem pra roleta?\n\nDica: baixe um backup antes.")) return;
    if (save([])) location.reload();
  }

  /* ---------------- início ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.title = "Ponto do Dia — gravação";
    acts = document.getElementById("acts");

    var dim = document.querySelector(".tl .dim");
    if (dim) { dim.textContent = "Modo gravação"; dim.classList.add("gv-tag"); }

    openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "pill gv-open";
    openBtn.addEventListener("click", panel);
    var stage = document.querySelector(".stage") || document.body;
    stage.appendChild(openBtn);
    refresh();

    if (acts) new MutationObserver(addMarkButton).observe(acts, { childList: true });
    if (!POOL.length && ALL.length) panel();
  });
})();
