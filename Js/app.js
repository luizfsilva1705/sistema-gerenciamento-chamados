
const STORAGE_KEY = "chamados_sistema_v1";

// Recupera os chamados salvos no navegador.
function carregarChamados() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error("Erro ao carregar chamados:", erro);
    return [];
  }
}

let chamados = carregarChamados();

let chamadoEmEdicao = null;


// Elementos da interface
const botaoNovo = document.getElementById("novo-chamado");
const botaoCancelar = document.getElementById("cancelar-chamado");
const formulario = document.getElementById("form-chamado");
const tabela = document.getElementById("lista-chamados");

// Salva os dados no navegador
function salvarChamados() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chamados)
  );
}


botaoNovo.addEventListener("click", () => {
  chamadoEmEdicao = null;

  formulario.reset();
  formulario.hidden = false;

  formulario.querySelector(
    'button[type="submit"]'
  ).textContent = "Salvar chamado";

  document.getElementById("titulo").focus();
});

botaoCancelar.addEventListener("click", () => {
  chamadoEmEdicao = null;

  formulario.reset();
  formulario.hidden = true;

  formulario.querySelector(
    'button[type="submit"]'
  ).textContent = "Salvar chamado";
});


// Cadastra um chamado

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const titulo = document.getElementById("titulo")
    .value.trim();

  const descricao = document.getElementById("descricao")
    .value.trim();

  const prioridade = document.getElementById("prioridade")
    .value;

  const prioridadesValidas = ["Baixa", "Média", "Alta"];

  if (
    !titulo ||
    !descricao ||
    !prioridadesValidas.includes(prioridade)
  ) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  // Guarda uma cópia para restaurar se o salvamento falhar
  const chamadosAnteriores = chamados.map(
    (item) => ({ ...item })
  );

  if (chamadoEmEdicao !== null) {
    // MODO EDIÇÃO
    const chamado = chamados.find(
      (item) => item.id === chamadoEmEdicao
    );

    if (!chamado) {
      alert("Chamado não encontrado.");
      return;
    }

    chamado.titulo = titulo;
    chamado.descricao = descricao;
    chamado.prioridade = prioridade;

  } else {
    // MODO CADASTRO
    const novoChamado = {
      id: crypto.randomUUID(),
      titulo: titulo,
      descricao: descricao,
      prioridade: prioridade,
      status: "Aberto",
      dataCriacao: new Date().toISOString()
    };

    chamados.push(novoChamado);
  }

  const estavaEditando = chamadoEmEdicao !== null;

  try {
    salvarChamados();
  } catch (erro) {
    chamados = chamadosAnteriores;
    console.error("Erro ao salvar:", erro);
    alert("Não foi possível salvar o chamado.");
    return;
  }

  chamadoEmEdicao = null;

  formulario.reset();
  formulario.hidden = true;

  formulario.querySelector(
    'button[type="submit"]'
  ).textContent = "Salvar chamado";

  atualizarTela();

  alert(
    estavaEditando
      ? "Chamado atualizado com sucesso!"
      : "Chamado cadastrado com sucesso!"
  );
});



function alterarStatus(id, novoStatus) {
  const statusValidos = [
    "Aberto",
    "Em andamento",
    "Resolvido"
  ];

  if (!statusValidos.includes(novoStatus)) {
    alert("Status inválido.");
    return;
  }

  const chamado = chamados.find(
    (item) => item.id === id
  );

  if (!chamado) {
    alert("Chamado não encontrado.");
    return;
  }

  const statusAnterior = chamado.status;

  chamado.status = novoStatus;

  try {
    salvarChamados();
  } catch (erro) {
    chamado.status = statusAnterior;
    console.error(erro);
    alert("Não foi possível salvar a alteração.");
    atualizarTela();
    return;
  }

  atualizarTela();
}


function editarChamado(id) {
  const chamado = chamados.find(
    (item) => item.id === id
  );

  if (!chamado) {
    alert("Chamado não encontrado.");
    return;
  }

  chamadoEmEdicao = id;

  document.getElementById("titulo").value =
    chamado.titulo;

  document.getElementById("descricao").value =
    chamado.descricao;

  document.getElementById("prioridade").value =
    chamado.prioridade;

  formulario.hidden = false;

  const botaoSalvar = formulario.querySelector(
    'button[type="submit"]'
  );

  botaoSalvar.textContent = "Salvar alterações";

  formulario.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  document.getElementById("titulo").focus();
}


function excluirChamado(id) {
  const chamado = chamados.find(
    (item) => item.id === id
  );

  if (!chamado) {
    alert("Chamado não encontrado.");
    return;
  }

  const confirmou = confirm(
    `Deseja realmente excluir o chamado "${chamado.titulo}"?`
  );

  if (!confirmou) {
    return;
  }

  // Guarda a lista anterior para evitar perda de dados
  const chamadosAnteriores = chamados;

  // Cria uma nova lista sem o chamado excluído
  chamados = chamados.filter(
    (item) => item.id !== id
  );

  try {
    salvarChamados();
  } catch (erro) {
    chamados = chamadosAnteriores;
    console.error("Erro ao excluir chamado:", erro);
    alert("Não foi possível excluir o chamado.");
    return;
  }

  // Cancela a edição caso o chamado excluído
  // esteja aberto no formulário
  if (chamadoEmEdicao === id) {
    chamadoEmEdicao = null;
    formulario.reset();
    formulario.hidden = true;

    formulario.querySelector(
      'button[type="submit"]'
    ).textContent = "Salvar chamado";
  }

  atualizarTela();

  alert("Chamado excluído com sucesso!");
}


// Atualiza a tabela

function atualizarTabela() {
  tabela.replaceChildren();

  if (chamados.length === 0) {
    const linha = tabela.insertRow();
    const celula = linha.insertCell();

    celula.colSpan = 5;
    celula.textContent = "Nenhum chamado cadastrado.";
    return;
  }

  chamados.forEach((chamado) => {
    const linha = tabela.insertRow();

    // Coluna ID
    const celulaId = linha.insertCell();
    celulaId.textContent = chamado.id.slice(0, 8);

    // Coluna título
    const celulaTitulo = linha.insertCell();
    celulaTitulo.textContent = chamado.titulo;

    // Coluna prioridade
    const celulaPrioridade = linha.insertCell();
    celulaPrioridade.textContent = chamado.prioridade;

    // Coluna status
    const celulaStatus = linha.insertCell();

    const selectStatus = document.createElement("select");

    const statusDisponiveis = [
      "Aberto",
      "Em andamento",
      "Resolvido"
    ];

    statusDisponiveis.forEach((status) => {
      const opcao = document.createElement("option");

      opcao.value = status;
      opcao.textContent = status;

      selectStatus.appendChild(opcao);
    });

    selectStatus.value = chamado.status;

    selectStatus.addEventListener("change", (evento) => {
      alterarStatus(chamado.id, evento.target.value);
    });

    celulaStatus.appendChild(selectStatus);

    // Coluna ações
    
// Coluna ações
const celulaAcoes = linha.insertCell();

const botaoEditar = document.createElement("button");

botaoEditar.type = "button";
botaoEditar.textContent = "Editar";
botaoEditar.className = "botao-editar";

botaoEditar.addEventListener("click", () => {
  editarChamado(chamado.id);
});

celulaAcoes.appendChild(botaoEditar);


const botaoExcluir = document.createElement("button");

botaoExcluir.type = "button";
botaoExcluir.textContent = "Excluir";
botaoExcluir.className = "botao-excluir";

botaoExcluir.addEventListener("click", () => {
  excluirChamado(chamado.id);
});

celulaAcoes.appendChild(botaoExcluir);


  });
}


// Atualiza os indicadores
function atualizarIndicadores() {
  const total = chamados.length;

  const abertos = chamados.filter(
    (chamado) => chamado.status === "Aberto"
  ).length;

  const andamento = chamados.filter(
    (chamado) => chamado.status === "Em andamento"
  ).length;

  const resolvidos = chamados.filter(
    (chamado) => chamado.status === "Resolvido"
  ).length;

  document.getElementById("total-chamados")
    .textContent = total;

  document.getElementById("chamados-abertos")
    .textContent = abertos;

  document.getElementById("chamados-andamento")
    .textContent = andamento;

  document.getElementById("chamados-resolvidos")
    .textContent = resolvidos;
}

// Atualiza todos os componentes
function atualizarTela() {
  atualizarTabela();
  atualizarIndicadores();
}

// Inicializa a interface
atualizarTela();
