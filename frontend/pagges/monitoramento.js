
/* ===== MONITORAMENTO — PETROTECH ===== */

const API = "http://localhost:3000/valvulas";
const IP_ESP32 = "10.59.84.238";

let valvulas = [];
let ativaId = null;
let timer = null;

const $ = (id) => document.getElementById(id);

/* Obtém o limite da faixa de medição cadastrada. */
function faixaMax(valor) {
  const numeros = String(valor || "")
    .replace(",", ".")
    .match(/\d+(?:\.\d+)?/g) || [];

  const limite = parseFloat(numeros[numeros.length - 1]);

  return Number.isFinite(limite) && limite > 0
    ? limite
    : 0.5;
}

/* ===== ENCERRAR SESSÃO ===== */

const botaoSair = $("sair");

if (botaoSair) {
  botaoSair.addEventListener("click", (e) => {
    e.preventDefault();

    localStorage.removeItem("petrotech-logado");
    localStorage.removeItem("usuario");

    window.location.href = "/frontend/pages/login.html";
  });
}

/* ===== CARREGAR VÁLVULAS DO MYSQL ===== */

async function carregarValvulas() {
  try {
    const resposta = await fetch(API);

    if (!resposta.ok) {
      throw new Error("Não foi possível buscar as válvulas.");
    }

    valvulas = await resposta.json();

    renderLista();

    if (valvulas.length > 0) {
      const existe = valvulas.some(
        (v) => Number(v.id) === Number(ativaId)
      );

      selecionar(existe ? ativaId : valvulas[0].id);
    } else {
      ativaId = null;
      clearInterval(timer);
      $("painel").hidden = true;
    }
  } catch (erro) {
    console.error("Erro ao carregar válvulas:", erro);
    alert("Não foi possível carregar as válvulas. Confira o backend.");
  }
}

/* ===== CADASTRAR VÁLVULA ===== */

$("form-valvula").addEventListener("submit", async (e) => {
  e.preventDefault();

  const faixa = $("v-faixa").value.trim().replace(",", ".");
  const max = Number(faixa);

  if (!Number.isFinite(max) || max <= 0) {
    alert("Informe uma faixa de medição válida em MPa.");
    return;
  }

  const novaValvula = {
    nome: $("v-nome").value.trim(),
    ip_dispositivo: $("v-ip").value.trim(),
    faixa_medicao: max,
    tipo: $("v-tipo").value,
    material: $("v-material").value,
    localizacao: $("v-local").value.trim()
  };

  try {
    const resposta = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaValvula)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.mensagem || "Erro ao cadastrar a válvula.");
      return;
    }

    e.target.reset();

    await carregarValvulas();

    if (dados.id !== undefined && dados.id !== null) {
      selecionar(dados.id);
    }

    alert("Válvula cadastrada com sucesso!");
  } catch (erro) {
    console.error("Erro ao cadastrar válvula:", erro);
    alert("Não foi possível conectar ao backend.");
  }
});

/* ===== MOSTRAR LISTA DE VÁLVULAS ===== */

function renderLista() {
  const ul = $("lista");
  ul.innerHTML = "";

  $("vazio").hidden = valvulas.length > 0;

  valvulas.forEach((v) => {
    const li = document.createElement("li");

    if (Number(v.id) === Number(ativaId)) {
      li.classList.add("ativa");
    }

    const info = document.createElement("div");
    const nome = document.createElement("b");
    const detalhes = document.createElement("small");

    nome.textContent = v.nome;
    detalhes.textContent = [
      v.ip_dispositivo,
      v.tipo,
      v.material
    ].filter(Boolean).join(" • ");

    info.append(nome, detalhes);

    const remover = document.createElement("button");
    remover.className = "remover";
    remover.title = "Remover";
    remover.textContent = "×";

    remover.addEventListener("click", async (ev) => {
      ev.stopPropagation();

      if (!confirm(`Deseja remover a válvula "${v.nome}"?`)) {
        return;
      }

      try {
        const resposta = await fetch(`${API}/${v.id}`, {
          method: "DELETE"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          alert(dados.mensagem || "Não foi possível remover.");
          return;
        }

        if (Number(ativaId) === Number(v.id)) {
          ativaId = null;
          clearInterval(timer);
          $("painel").hidden = true;
        }

        await carregarValvulas();
      } catch (erro) {
        console.error("Erro ao remover válvula:", erro);
        alert("Não foi possível conectar ao backend.");
      }
    });

    li.append(info, remover);
    li.addEventListener("click", () => selecionar(v.id));

    ul.appendChild(li);
  });
}

/* ===== SELECIONAR VÁLVULA ===== */

function selecionar(id) {
  const v = valvulas.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!v) return;

  ativaId = v.id;
  renderLista();

  $("painel").hidden = false;

  $("p-nome").textContent = v.nome;
  $("p-material").textContent = v.material || "—";
  $("p-ip").textContent = v.ip_dispositivo;
  $("p-tipo").textContent = v.tipo;
  $("p-local").textContent = v.localizacao;

  clearInterval(timer);

  ler(v);
  timer = setInterval(() => ler(v), 1000);
}

/* ===== LER DADOS DO ESP32 ===== */

async function ler(v) {
  if (Number(ativaId) !== Number(v.id)) return;

  try {
    const ipCadastrado = (v.ip_dispositivo || "").trim();
    const ip = ipCadastrado || IP_ESP32;

    const base = /^https?:\/\//i.test(ip)
      ? ip.replace(/\/+$/, "")
      : `http://${ip}`;

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);

    let resposta;

    try {
      resposta = await fetch(`${base}/dados`, {
        signal: ctrl.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();
    const tensao = Number(dados.tensao);

    if (!Number.isFinite(tensao)) {
      throw new Error("Tensão inválida recebida do ESP32.");
    }

    if (Number(ativaId) !== Number(v.id)) return;

    atualizar(v, tensao, dados.status);

    console.log("Dados recebidos do ESP32:", dados);

  } catch (erro) {
    if (Number(ativaId) !== Number(v.id)) return;

    console.error("Erro ao ler o ESP32:", erro);

    $("p-status").textContent = "ESP32 desconectado";
    $("p-status").classList.add("sim");

    $("p-pressao").textContent = "Sem leitura";
    $("p-pct").textContent = "—";
    $("p-hora").textContent = "—";

    $("arco").style.strokeDashoffset = 251.3;
    $("arco").style.stroke = "#64748b";
  }
}

/* ===== VELOCÍMETRO E ESTADOS ===== */

function atualizar(v, tensao, statusESP32) {
  let estado;
  let cor;
  let pct;

  /*
    Limites definidos para o comportamento visual:
    abaixo de 0,50 V: Normal
    de 0,50 V até abaixo de 0,52 V: Médio
    a partir de 0,52 V: Crítico
  */

  if (tensao < 0.50) {
    estado = "Normal";
    cor = "#00d6c9";
    pct = (tensao / 0.52) * 100;
  } else if (tensao < 0.52) {
    estado = "Médio";
    cor = "#f59e0b";
    pct = (tensao / 0.52) * 100;
  } else {
    estado = "Crítico";
    cor = "#ef4444";
    pct = 100;
  }

  pct = Math.max(0, Math.min(100, Math.round(pct)));

  const arco = $("arco");

  arco.style.strokeDasharray = "251.3";
  arco.style.strokeDashoffset = 251.3 * (1 - pct / 100);
  arco.style.stroke = cor;

  $("p-pct").textContent = pct + "%";

  // A API atual fornece tensão, não pressão em MPa.
  $("p-pressao").textContent = tensao.toFixed(2) + " V";

  $("p-hora").textContent =
    new Date().toLocaleTimeString("pt-BR");

  const status = $("p-status");

  status.textContent = estado;
  status.classList.toggle("sim", estado !== "Normal");

  console.log(
    `Tensão: ${tensao.toFixed(2)} V | Estado: ${estado} | Velocímetro: ${pct}%`
  );
}

/* ===== INICIAR A APLICAÇÃO ===== */

carregarValvulas();
