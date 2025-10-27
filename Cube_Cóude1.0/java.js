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

// 🔹 Carregar tarefas do Flask ao iniciar
async function carregarTarefas() {
    const res = await fetch("http://localhost:5000/api/tarefas");
    const tarefas = await res.json();

    caixa.innerHTML = "";
    tarefas
        .filter(t => !t.apagado)
        .reverse()
        .forEach(t => {
            adicionarNaTabela(t.type, t.coude || t.cóude, t.name, t.id);
            if (t.id >= cont) cont = t.id + 1;
        });
}
carregarTarefas();

// 🔹 Salvar tarefa no Flask
async function salvarTarefa(tarefa) {
    await fetch("http://localhost:5000/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tarefa)
    });
}

// 🔹 Editar tarefa no Flask
async function editarTarefaFlask(tarefa) {
    await fetch("http://localhost:5000/api/tarefas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tarefa)
    });
}

// 🔹 Marcar tarefa como apagada (DELETE)
async function apagarTarefa(id) {
    await fetch("http://localhost:5000/api/tarefas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    });
}

// 🔹 Função para adicionar uma linha na tabela
function adicionarNaTabela(type, cóude, name, id, insertBeforeElement = null) {
    const linha = document.createElement("tr");
    linha.dataset.id = id;

    linha.innerHTML = `
        <td>${escapeHTML(type)}</td>
        <td>
            <pre style="white-space: pre-wrap; text-align: left;">${escapeHTML(cóude)}</pre>
            <button class="copiar">📋 Copiar</button>
        </td>
        <td>${escapeHTML(name)}</td>
        <td><button class="editar">✏️</button></td>
        <td><button class="lixo">🗑️</button></td>
    `;

    if (insertBeforeElement) {
        caixa.insertBefore(linha, insertBeforeElement);
    } else {
        caixa.insertBefore(linha, caixa.firstChild);
    }
}

// 🔹 Botão principal (Adicionar / Editar)
botao.addEventListener("click", async function (e) {
    e.preventDefault();

    const type = typeInput.value.trim();
    const cóude = codeInput.value.trim();
    const name = nameInput.value.trim();

    if (!type || !cóude) return;

    if (editandoId !== null) {
        // 🔸 Editar
        const tarefaEditada = { id: editandoId, type, coude: cóude, name };
        await editarTarefaFlask(tarefaEditada);

        const linhas = Array.from(caixa.querySelectorAll("tr"));
        const ref = linhas[posicaoOriginal] || null;
        adicionarNaTabela(type, cóude, name, editandoId, ref);

        resetarFormulario();
        alert("Tarefa editada com sucesso!");
    } else {
        // 🔸 Adicionar nova
        const tarefa = { type, coude: cóude, name };
        await salvarTarefa(tarefa);
        await carregarTarefas();

        typeInput.value = "";
        codeInput.value = "";
        nameInput.value = "";
    }
});

// 🔹 Eventos da tabela (Editar / Excluir / Copiar)
caixa.addEventListener("click", async function (e) {
    const linha = e.target.closest("tr");
    if (!linha) return;
    const idLinha = parseInt(linha.dataset.id);

    // Excluir
    if (e.target.classList.contains("lixo")) {
        await apagarTarefa(idLinha);
        linha.remove();
        return;
    }

    // Editar
    if (e.target.classList.contains("editar")) {
        const res = await fetch("http://localhost:5000/api/tarefas");
        const tarefas = await res.json();
        const tarefa = tarefas.find(t => t.id === idLinha);
        if (!tarefa) return;

        const linhas = Array.from(caixa.querySelectorAll("tr"));
        posicaoOriginal = linhas.indexOf(linha);
        linha.remove();

        typeInput.value = tarefa.type;
        codeInput.value = tarefa.coude || tarefa.cóude;
        nameInput.value = tarefa.name;

        editandoId = idLinha;
        botao.value = "Salvar edição";
    }

    // Copiar código
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
        setTimeout(() => botao.textContent = textoOriginal, 1500);
    }
});

// 🔹 Restaurar tarefas apagadas
restaurar.addEventListener("click", async () => {
    const res = await fetch("http://localhost:5000/api/tarefas");
    const tarefas = await res.json();
    const apagadas = tarefas.filter(t => t.apagado);

    if (apagadas.length === 0) {
        alert("Nenhuma tarefa para restaurar.");
        return;
    }

    for (const t of apagadas) {
        await editarTarefaFlask({ ...t, apagado: 0 });
    }

    await carregarTarefas();
    alert("Tarefas restauradas com sucesso!");
});

// 🔹 Pesquisa
const botaoPesquisar = document.getElementById("pesquisar");
const areaDestacada = document.getElementById("tarefas-destacadas");

botaoPesquisar.addEventListener("click", async () => {
    const termo = campoPesquisa.value.trim().toLowerCase();
    if (!termo) return;

    const res = await fetch("http://localhost:5000/api/tarefas");
    const tarefas = await res.json();
    const linhasEncontradas = tarefas.filter(t => t.name.toLowerCase().includes(termo));

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
    linhasEncontradas.forEach(t => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${escapeHTML(t.type)}</td>
            <td><pre>${escapeHTML(t.coude || t.cóude)}</pre><button class="copiar">📋 Copiar</button></td>
            <td>${escapeHTML(t.name)}</td>
            <td><button class="editar">✏️</button></td>
            <td><button class="lixo">🗑️</button></td>
        `;
        corpoTemp.appendChild(linha);
    });

    areaDestacada.innerHTML = "";
    areaDestacada.appendChild(container);

    setTimeout(() => areaDestacada.innerHTML = "", 10000);
});

// 🔹 Funções auxiliares
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
