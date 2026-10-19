
/* ===== MONITORAMENTO — PETROTECH ===== */

const API = "http://localhost:3000/valvulas";

let valvulas = [];
let ativaId = null;
let timer = null;
let simulada = 0;

const $ = (id) => document.getElementById(id);

// Obtém o limite da faixa de medição, em MPa.
function faixaMax(valor) {
  const numeros = String(valor || "")
    .replace(",", ".")
    .match(/\d+(?:\.\d+)?/g) || [];

  const limite = parseFloat(numeros[numeros.length - 1]);

  return Number.isFinite(limite) && limite > 0
    ? limite
    : 0.5;
}


/* Encerra a sessão de login. */
const botaoSair = $("sair");

if (botaoSair) {
  botaoSair.addEventListener("click", (e) => {
    e.preventDefault();

    localStorage.removeItem("petrotech-logado");
    localStorage.removeItem("usuario");

    window.location.href = "/frontend/pages/login.html";
  });
}


// Busca as válvulas salvas no MySQL.
async function carregarValvulas() {
  try {
    const resposta = await fetch(API);

    if (!resposta.ok) {
      throw new Error("Não foi possível buscar as válvulas.");
    }

    valvulas = await resposta.json();

    renderLista();

    if (valvulas.length > 0) {
      selecionar(valvulas[0].id);
    } else {
      ativaId = null;
      $("painel").hidden = true;
      clearInterval(timer);
    }
  } catch (erro) {
    console.error("Erro ao carregar válvulas:", erro);

    alert(
      "Não foi possível carregar as válvulas. " +
      "Confira se o backend está funcionando."
    );
  }
}

// Cadastra a válvula no backend.
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(novaValvula)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.mensagem || "Erro ao cadastrar a válvula.");
      return;
    }

    e.target.reset();

    // Busca novamente os dados reais do banco.
    await carregarValvulas();

    // Seleciona o registro recém-criado.
    if (dados.id !== undefined && dados.id !== null) {
      selecionar(dados.id);
    }

    alert("Válvula cadastrada com sucesso!");
  } catch (erro) {
    console.error("Erro ao cadastrar válvula:", erro);
    alert(
      "Não foi possível conectar ao backend. " +
      "Confira se o servidor está ligado."
    );
  }
});

// Mostra a lista de válvulas.
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
          $("painel").hidden = true;
          clearInterval(timer);
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

// Seleciona uma válvula para monitorar.
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

  simulada = 0;
  ler(v);

  timer = setInterval(() => {
    ler(v);
  }, 2000);
}

// Consulta a pressão do dispositivo.
// Espera JSON no formato: {"pressao": 0.25}
// O valor de pressão deve estar em MPa.
async function ler(v) {
  let pressao;
  let real = false;

  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 1500);

    try {
      const resposta = await fetch(
        `http://${v.ip_dispositivo}/pressao`,
        { signal: ctrl.signal }
      );

      if (!resposta.ok) {
        throw new Error("Dispositivo não respondeu corretamente.");
      }

      const dados = await resposta.json();
      pressao = Number(dados.pressao);

      real = Number.isFinite(pressao) && pressao >= 0;
    } finally {
      clearTimeout(timeout);
    }
  } catch (erro) {
    // Se o dispositivo não responder, usa simulação.
    real = false;
  }

  if (!real) {
    const max = faixaMax(String(v.faixa_medicao));

    simulada = Math.min(
      max,
      Math.max(
        0,
        simulada + (Math.random() - 0.5) * max * 0.08
      )
    );

    pressao = simulada;
  }

  // Evita atualizar o painel se outra válvula foi selecionada.
  if (Number(ativaId) !== Number(v.id)) return;

  atualizar(v, pressao, real);
}

// Atualiza o indicador de pressão.
function atualizar(v, pressao, real) {
  const max = faixaMax(String(v.faixa_medicao));

  const pct = Math.round(
    Math.min(100, Math.max(0, (pressao / max) * 100))
  );

  const arco = $("arco");

  arco.style.strokeDashoffset = 251.3 * (1 - pct / 100);

  arco.style.stroke =
    pct < 70 ? "#1d8bf1" :
    pct < 90 ? "#f59e0b" :
    "#ef4444";

  $("p-pct").textContent = pct + "%";
  $("p-pressao").textContent = pressao.toFixed(3) + " MPa";
  $("p-hora").textContent = new Date().toLocaleTimeString("pt-BR");

  const status = $("p-status");

  status.textContent = real ? "Conectada" : "Simulação";
  status.classList.toggle("sim", !real);
}

// Inicia carregando os dados do banco.
carregarValvulas();
