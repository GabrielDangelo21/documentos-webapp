"use strict";

/* =========================
   Documentos • WebApp
   Persistência: LocalStorage
   ========================= */

const STORAGE_KEY = "documentos_v1";

/* ---------- Estado ---------- */
let documentos = [];

/* ---------- Helpers DOM ---------- */
const $ = (sel) => document.querySelector(sel);

const form = $("#form-doc");
const inputNome = $("#nome");
const inputValidade = $("#validade");
const inputAlerta = $("#alerta");

const btnLimpar = $("#btn-limpar");
const btnVerAlertas = $("#btn-ver-alertas");
const btnLimparTudo = $("#btn-limpar-tudo");

const listaContainer = $("#lista-container");
const alertasContainer = $("#alertas-container");
const msgBox = $("#msg");

/* ---------- Utilitários ---------- */
function setMsg(texto, tipo = "info") {
    msgBox.textContent = texto || "";
    msgBox.style.color =
        tipo === "erro" ? "#ff9aa2" :
            tipo === "sucesso" ? "#9ae6b4" :
                "rgba(255,255,255,.7)";
    if (texto) {
        setTimeout(() => (msgBox.textContent = ""), 3000);
    }
}

function hojeISO() {
    return new Date().toISOString().slice(0, 10);
}

function parseISODate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function diffDias(validadeISO) {
    const hoje = parseISODate(hojeISO());
    const validade = parseISODate(validadeISO);
    const MS_DIA = 24 * 60 * 60 * 1000;
    return Math.floor((validade - hoje) / MS_DIA);
}

function calcularStatus(doc) {
    const dias = diffDias(doc.validade);
    let status = "Ok";
    if (dias < 0) status = "Vencido";
    else if (dias <= doc.alerta) status = "Alerta";
    return { dias, status };
}

/* ---------- Persistência ---------- */
function carregar() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function salvar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documentos));
}

/* ---------- Regras ---------- */
function validarDocumento(nome, validadeISO, alerta) {
    if (!nome || !nome.trim()) {
        throw new Error("Nome do documento é obrigatório.");
    }
    if (!validadeISO) {
        throw new Error("Data de validade é obrigatória.");
    }
    if (!Number.isInteger(alerta) || alerta < 0) {
        throw new Error("Alerta deve ser um número inteiro maior ou igual a zero.");
    }
}

function adicionarDocumento(doc) {
    validarDocumento(doc.nome, doc.validade, doc.alerta);
    documentos.push(doc);
    salvar();
}

function removerDocumentoPorIndice(idx) {
    if (idx < 0 || idx >= documentos.length) return;
    documentos.splice(idx, 1);
    salvar();
}

/* ---------- Renderização ---------- */
function criarBadge(status) {
    const span = document.createElement("span");
    span.className =
        "badge " +
        (status === "Ok" ? "ok" : status === "Alerta" ? "warn" : "bad");
    span.textContent = status;
    return span;
}

function renderizarLista() {
    listaContainer.innerHTML = "";

    if (documentos.length === 0) {
        listaContainer.innerHTML = `
      <div class="empty">
        <span class="emoji">📄</span>
        <div>
          <strong>Nenhum documento cadastrado</strong>
          <p>Use o formulário acima para adicionar o primeiro.</p>
        </div>
      </div>`;
        return;
    }

    documentos.forEach((doc, idx) => {
        const { dias, status } = calcularStatus(doc);

        const row = document.createElement("div");
        row.className = "row-item";
        row.innerHTML = `
      <div>${doc.nome}</div>
      <div>${doc.validade}</div>
      <div>${dias}</div>
      <div></div>
      <div class="right">
        <button class="link-btn" data-action="remover" data-index="${idx}">
          Remover
        </button>
      </div>
    `;

        row.children[3].appendChild(criarBadge(status));
        listaContainer.appendChild(row);
    });
}

function renderizarAlertas() {
    alertasContainer.innerHTML = "";

    const emAlerta = documentos
        .map((doc) => ({ doc, ...calcularStatus(doc) }))
        .filter((x) => x.status !== "Ok");

    if (emAlerta.length === 0) {
        alertasContainer.innerHTML = `
      <div class="empty">
        <span class="emoji">✅</span>
        <div>
          <strong>Nenhum alerta por enquanto</strong>
          <p>Todos os documentos estão OK.</p>
        </div>
      </div>`;
        return;
    }

    emAlerta.forEach(({ doc, dias, status }) => {
        const item = document.createElement("div");
        item.className = "row-item";
        item.innerHTML = `
      <div>${doc.nome}</div>
      <div>${doc.validade}</div>
      <div>${dias}</div>
      <div></div>
      <div></div>
    `;
        item.children[3].appendChild(criarBadge(status));
        alertasContainer.appendChild(item);
    });
}

function renderizarTudo() {
    renderizarLista();
    renderizarAlertas();
}

/* ---------- Eventos ---------- */
function onSubmitForm(e) {
    e.preventDefault();

    try {
        adicionarDocumento({
            nome: inputNome.value.trim(),
            validade: inputValidade.value,
            alerta: Number(inputAlerta.value),
        });

        form.reset();
        inputNome.focus();
        renderizarTudo();
        setMsg("Documento adicionado com sucesso.", "sucesso");
    } catch (err) {
        setMsg(err.message, "erro");
    }
}

function limparFormulario() {
    form.reset();
    inputNome.focus();
}

function limparTudo() {
    if (!confirm("Tem certeza que deseja apagar todos os documentos?")) return;
    documentos = [];
    salvar();
    renderizarTudo();
    setMsg("Todos os documentos foram removidos.");
}

function onClickLista(e) {
    const btn = e.target.closest("[data-action='remover']");
    if (!btn) return;
    const idx = Number(btn.dataset.index);
    removerDocumentoPorIndice(idx);
    renderizarTudo();
    setMsg("Documento removido.");
}

/* ---------- Init ---------- */
function init() {
    documentos = carregar();
    renderizarTudo();

    form.addEventListener("submit", onSubmitForm);
    btnLimpar.addEventListener("click", limparFormulario);
    btnVerAlertas.addEventListener("click", renderizarAlertas);
    btnLimparTudo.addEventListener("click", limparTudo);
    listaContainer.addEventListener("click", onClickLista);
}

init();
