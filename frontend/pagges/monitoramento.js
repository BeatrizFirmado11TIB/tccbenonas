// ===== MONITORAMENTO — PETROTECH =====
const CHAVE = "petrotech-valvulas";
let valvulas = JSON.parse(localStorage.getItem(CHAVE) || "[]");
let ativaId = null;
let timer = null;

const $ = (id) => document.getElementById(id);
const salvar = () => localStorage.setItem(CHAVE, JSON.stringify(valvulas));

// Sair
$("sair").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("petrotech-logado");
  localStorage.removeItem("usuario");
  window.location.href = "/frontend/pagges/login.html";
});

// Cadastrar
$("form-valvula").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = {
    id: Date.now(),
    nome: $("v-nome").value.trim(),
    ip: $("v-ip").value.trim(),
    serie: $("v-serie").value.trim(),
    tipo: $("v-tipo").value,
    max: parseFloat($("v-max").value),
    local: $("v-local").value.trim(),
  };
  valvulas.push(v);
  salvar();
  e.target.reset();
  $("v-max").value = 10;
  renderLista();
  selecionar(v.id);
});

function renderLista() {
  const ul = $("lista");
  ul.innerHTML = "";
  $("vazio").hidden = valvulas.length > 0;
  valvulas.forEach((v) => {
    const li = document.createElement("li");
    if (v.id === ativaId) li.classList.add("ativa");
    const info = document.createElement("div");
    info.innerHTML = "<b></b><small></small>";
    info.querySelector("b").textContent = v.nome;
    info.querySelector("small").textContent = `${v.ip} • ${v.tipo} • ${v.serie}`;
    const x = document.createElement("button");
    x.className = "remover"; x.title = "Remover"; x.textContent = "×";
    x.onclick = (ev) => {
      ev.stopPropagation();
      valvulas = valvulas.filter((i) => i.id !== v.id);
      salvar();
      if (ativaId === v.id) { ativaId = null; $("painel").hidden = true; clearInterval(timer); }
      renderLista();
    };
    li.append(info, x);
    li.onclick = () => selecionar(v.id);
    ul.appendChild(li);
  });
}

function selecionar(id) {
  const v = valvulas.find((i) => i.id === id);
  if (!v) return;
  ativaId = id;
  renderLista();
  $("painel").hidden = false;
  $("p-nome").innerHTML = "";
  $("p-nome").append(v.nome, Object.assign(document.createElement("span"), { className: "dot", textContent: "." }));
  $("p-max").textContent = v.max + " bar";
  $("p-ip").textContent = v.ip;
  $("p-tipo").textContent = v.tipo;
  $("p-local").textContent = v.local;
  clearInterval(timer);
  ler(v);
  timer = setInterval(() => ler(v), 2000);
}

// Lê a pressão do protótipo: espera JSON {"pressao": 5.3} em http://IP/pressao
// Se não conseguir conectar, mostra uma simulação.
let simulada = 5;
async function ler(v) {
  let pressao, real = false;
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch(`http://${v.ip}/pressao`, { signal: ctrl.signal });
    const d = await r.json();
    pressao = parseFloat(d.pressao);
    real = !isNaN(pressao);
  } catch (_) {}
  if (!real) {
    simulada = Math.min(v.max, Math.max(0, simulada + (Math.random() - 0.5) * v.max * 0.08));
    pressao = simulada;
  }
  atualizar(v, pressao, real);
}

function atualizar(v, pressao, real) {
  const pct = Math.round(Math.min(100, Math.max(0, (pressao / v.max) * 100)));
  const arco = $("arco");
  arco.style.strokeDashoffset = 251.3 * (1 - pct / 100);
  arco.style.stroke = pct < 70 ? "#1d8bf1" : pct < 90 ? "#f59e0b" : "#ef4444";
  $("p-pct").textContent = pct + "%";
  $("p-pressao").textContent = pressao.toFixed(1) + " bar";
  $("p-hora").textContent = new Date().toLocaleTimeString("pt-BR");
  const st = $("p-status");
  st.textContent = real ? "Conectada" : "Simulação";
  st.classList.toggle("sim", !real);
}

renderLista();
if (valvulas.length) selecionar(valvulas[0].id);