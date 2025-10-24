// Import Firebase modular
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

// Config do seu Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA5nF0X5C7l0eS7oKiBuwSmqErzlGN0xyk",
  authDomain: "prototypecube-8e7fd.firebaseapp.com",
  projectId: "prototypecube-8e7fd",
  storageBucket: "prototypecube-8e7fd.firebasestorage.app",
  messagingSenderId: "909997560983",
  appId: "1:909997560983:web:f1997a40155e56f4c845d2",
  measurementId: "G-NJ0PNCGWQC"
};

// Inicializa Firebase e Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const botao = document.getElementById("botao");
const caixa = document.getElementById("tabela-tarefas");
const restaurar = document.getElementById("restaurar");
const campoPesquisa = document.getElementById("campoPesquisa");
const typeInput = document.getElementById("type");
const codeInput = document.getElementById("cóude");
const nameInput = document.getElementById("name");

let cont = 0;
let editandoId = null;
let posicaoOriginal = null;

const tarefasCollection = collection(db, "tarefas");

// Função para adicionar linha na tabela
function adicionarNaTabela(type, code, name, id, referencia = null) {
  const linha = document.createElement("tr");
  linha.dataset.id = id;
  linha.innerHTML = `
    <td>${escapeHTML(type)}</td>
    <td><pre>${escapeHTML(code)}</pre><button class="copiar">Copiar</button></td>
    <td>${escapeHTML(name)}</td>
    <td><button class="editar">Editar</button></td>
    <td><button class="lixo">Excluir</button></td>
  `;

  if (referencia) {
    caixa.insertBefore(linha, referencia);
  } else {
    caixa.appendChild(linha);
  }
}

// Carrega tarefas do Firestore
async function carregarTarefas() {
  const snapshot = await getDocs(tarefasCollection);
  const tarefas = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    tarefas.push({
      id: data.id,
      type: data.type,
      cóude: data.cóude,
      name: data.name,
      apagado: data.apagado || false,
      docId: docSnap.id
    });
  });

  tarefas.sort((a, b) => a.id - b.id);

  tarefas.forEach(t => {
    if (!t.apagado) {
      adicionarNaTabela(t.type, t.cóude, t.name, t.id);
    }
    if (t.id >= cont) cont = t.id + 1;
  });
}

carregarTarefas();

// Salva tarefas no Firestore usando batch
async function salvarTarefasFirestore(tarefas) {
  const snapshot = await getDocs(tarefasCollection);
  const batch = writeBatch(db);

  // Remove docs que não estão mais nas tarefas
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!tarefas.some(t => t.id === data.id)) {
      batch.delete(doc(db, "tarefas", docSnap.id));
    }
  });

  // Atualiza ou cria docs
  tarefas.forEach(tarefa => {
    const docExistente = snapshot.docs.find(docSnap => docSnap.data().id === tarefa.id);
    if (docExistente) {
      batch.set(doc(db, "tarefas", docExistente.id), tarefa);
    } else {
      const novoDocRef = doc(tarefasCollection);
      batch.set(novoDocRef, tarefa);
    }
  });

  await batch.commit();
}

// Funções auxiliares para buscar e salvar tarefas
async function getTarefas() {
  const snapshot = await getDocs(tarefasCollection);
  const tarefas = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    tarefas.push({
      id: data.id,
      type: data.type,
      cóude: data.cóude,
      name: data.name,
      apagado: data.apagado || false,
      docId: docSnap.id
    });
  });
  return tarefas;
}

async function salvarTarefas(tarefas) {
  await salvarTarefasFirestore(tarefas);
}

// Event listener do botão adicionar/editar
botao.addEventListener("click", async (e) => {
  e.preventDefault();

  const type = typeInput.value.trim();
  const cóude = codeInput.value.trim();
  const name = nameInput.value.trim();

  if (!type || !cóude) return;

  const tarefas = await getTarefas();

  if (editandoId !== null) {
    const index = tarefas.findIndex(t => t.id === editandoId);
    if (index !== -1) {
      tarefas[index] = { type, cóude, name, id: editandoId, apagado: false };
      await salvarTarefas(tarefas);

      const linhas = Array.from(caixa.querySelectorAll("tr"));
      const ref = linhas[posicaoOriginal] || null;
      adicionarNaTabela(type, cóude, name, editandoId, ref);

      resetarFormulario();
      alert("Tarefa editada com sucesso!");
    }
  } else {
    const id = cont++;
    tarefas.push({ type, cóude, name, id, apagado: false });
    await salvarTarefas(tarefas);

    adicionarNaTabela(type, cóude, name, id);

    typeInput.value = "";
    codeInput.value = "";
    nameInput.value = "";
  }
});

// Listener para clique em editar e excluir na tabela
caixa.addEventListener("click", async (e) => {
  const linha = e.target.closest("tr");
  if (!linha) return;
  const idLinha = parseInt(linha.dataset.id);

  if (e.target.classList.contains("lixo")) {
    const tarefas = await getTarefas();
    const index = tarefas.findIndex(t => t.id === idLinha);
    if (index !== -1) {
      tarefas[index].apagado = true;
      await salvarTarefas(tarefas);
    }

    linha.remove();
  }

  if (e.target.classList.contains("editar")) {
    const tarefas = await getTarefas();
    const tarefa = tarefas.find(t => t.id === idLinha);
    if (!tarefa) return;

    const linhas = Array.from(caixa.querySelectorAll("tr"));
    posicaoOriginal = linhas.indexOf(linha);

    linha.remove();

    typeInput.value = tarefa.type;
    codeInput.value = tarefa.cóude;
    nameInput.value = tarefa.name;

    editandoId = idLinha;
    botao.value = "Salvar edição";
  }
});

// Restaurar tarefas apagadas
restaurar.addEventListener("click", async (e) => {
  e.preventDefault();

  const tarefas = await getTarefas();

  const apagadas = tarefas.filter(t => t.apagado);

  if (apagadas.length === 0) {
    alert("Nenhuma tarefa para restaurar.");
    return;
  }

  tarefas.forEach(t => {
    if (t.apagado) t.apagado = false;
  });

  await salvarTarefas(tarefas);

  caixa.innerHTML = "";

  tarefas.slice().reverse().forEach(tarefa => {
    if (!tarefa.apagado) {
      adicionarNaTabela(tarefa.type, tarefa.cóude, tarefa.name, tarefa.id);
    }
  });

  alert("Tarefas restauradas com sucesso!");
});

// Pesquisa
const botaoPesquisar = document.getElementById("pesquisar");
const areaDestacada = document.getElementById("tarefas-destacadas");

botaoPesquisar.addEventListener("click", () => {
  const termo = campoPesquisa.value.trim().toLowerCase();
  if (!termo) return;

  const linhas = Array.from(caixa.querySelectorAll("tr"));
  const linhasEncontradas = [];

  linhas.forEach((linha, index) => {
    const textoName = linha.cells[2].textContent.trim().toLowerCase();
    if (textoName.includes(termo)) {
      linhasEncontradas.push({ elemento: linha, posicaoOriginal: index });
    }
  });

  if (linhasEncontradas.length === 0) return;

  const container = document.createElement("table");
  container.style.border = "2px solid gold";
  container.style.marginBottom = "10px";
  container.innerHTML = `
    <thead>
      <tr style="background-color: #f10000ff;">
        <th>Type</th>
        <th>Cóude</th>
        <th>Name</th>
        <th>Editar</th>
        <th>Excluir</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const corpoTemp = container.querySelector("tbody");

  linhasEncontradas.forEach(item => {
    caixa.removeChild(item.elemento);
    corpoTemp.appendChild(item.elemento);
  });

  areaDestacada.innerHTML = "";
  areaDestacada.appendChild(container);

  setTimeout(() => {
    const todasLinhas = Array.from(caixa.querySelectorAll("tr")).filter(
      l => !linhasEncontradas.some(e => e.elemento === l)
    );

    linhasEncontradas.sort((a, b) => a.posicaoOriginal - b.posicaoOriginal);

    linhasEncontradas.forEach(item => {
      const { elemento, posicaoOriginal } = item;
      const ref = todasLinhas[posicaoOriginal] || null;
      caixa.insertBefore(elemento, ref);
    });

    areaDestacada.innerHTML = "";
  }, 10000);
});

function resetarFormulario() {
  editandoId = null;
  posicaoOriginal = null;
  botao.value = "Adicionar";
  typeInput.value = "";
  codeInput.value = "";
  nameInput.value = "";
}

function escapeHTML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("copiar")) {
    const pre = e.target.closest("td").querySelector("pre");
    const texto = pre.textContent;

    const tempArea = document.createElement("textarea");
    tempArea.value = texto;
    document.body.appendChild(tempArea);
    tempArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempArea);

    const botao = e.target;
    const textoOriginal = botao.textContent;
    botao.textContent = "✅ Copiado!";
    setTimeout(() => {
      botao.textContent = textoOriginal;
    }, 1500);
  }
});
