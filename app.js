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

/* =========================
   Utilitários para ICS
   (Eventos de dia inteiro)
   ========================= */

function pad2(n) {
    return String(n).padStart(2, "0");
}

/**
 * Converte "YYYY-MM-DD" → "YYYYMMDD"
 */
function isoParaYYYYMMDD(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${y}${pad2(m)}${pad2(d)}`;
}

/**
 * Soma ou subtrai dias de uma data ISO
 * Ex: addDiasISO("2026-05-10", -30)
 */
function addDiasISO(iso, deltaDias) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d); // meia-noite local
    dt.setDate(dt.getDate() + deltaDias);

    return (
        dt.getFullYear() +
        "-" +
        pad2(dt.getMonth() + 1) +
        "-" +
        pad2(dt.getDate())
    );
}

/**
 * Timestamp UTC para o DTSTAMP do ICS
 * Formato: YYYYMMDDTHHMMSSZ
 */
function dtstampUTC() {
    const now = new Date();
    return (
        now.getUTCFullYear() +
        pad2(now.getUTCMonth() + 1) +
        pad2(now.getUTCDate()) +
        "T" +
        pad2(now.getUTCHours()) +
        pad2(now.getUTCMinutes()) +
        pad2(now.getUTCSeconds()) +
        "Z"
    );
}

/**
 * UID único para eventos do calendário
 */
function uid(prefix = "evt") {
    const base =
        crypto?.randomUUID?.() ??
        `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${base}@documentos-webapp`;
}

/**
 * Escapa texto para o padrão ICS
 */
function escapeICSText(texto) {
    return String(texto)
        .replace(/\\/g, "\\\\")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;")
        .replace(/\n/g, "\\n");
}

/**
 * Gera um ICS com DOIS EVENTOS:
 * 1) Evento no dia do alerta
 * 2) Evento no dia da validade
 */
function gerarICSComDoisEventos(doc) {
    const validadeISO = doc.validade;        // "YYYY-MM-DD"
    const alertaDias = Number(doc.alerta);

    const alertaISO = addDiasISO(validadeISO, -alertaDias);

    const validadeYYYYMMDD = isoParaYYYYMMDD(validadeISO);
    const alertaYYYYMMDD = isoParaYYYYMMDD(alertaISO);

    // Evento de dia inteiro → DTEND é o dia seguinte
    const validadeEnd = isoParaYYYYMMDD(addDiasISO(validadeISO, 1));
    const alertaEnd = isoParaYYYYMMDD(addDiasISO(alertaISO, 1));

    const stamp = dtstampUTC();

    const eventoAlerta = [
        "BEGIN:VEVENT",
        `UID:${uid("alerta")}`,
        `DTSTAMP:${stamp}`,
        `SUMMARY:${escapeICSText(`ALERTA: ${doc.nome}`)}`,
        `DESCRIPTION:${escapeICSText(
            `Documento "${doc.nome}" vence em ${validadeISO}.`
        )}`,
        "TRANSP:TRANSPARENT",
        `DTSTART;VALUE=DATE:${alertaYYYYMMDD}`,
        `DTEND;VALUE=DATE:${alertaEnd}`,
        "END:VEVENT",
    ].join("\r\n");

    const eventoValidade = [
        "BEGIN:VEVENT",
        `UID:${uid("validade")}`,
        `DTSTAMP:${stamp}`,
        `SUMMARY:${escapeICSText(`VALIDADE: ${doc.nome}`)}`,
        `DESCRIPTION:${escapeICSText(
            `Documento "${doc.nome}" vence hoje (${validadeISO}).`
        )}`,
        "TRANSP:TRANSPARENT",
        `DTSTART;VALUE=DATE:${validadeYYYYMMDD}`,
        `DTEND;VALUE=DATE:${validadeEnd}`,
        "END:VEVENT",
    ].join("\r\n");

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Documentos WebApp//PT-BR//EN",
        "CALSCALE:GREGORIAN",
        eventoAlerta,
        eventoValidade,
        "END:VCALENDAR",
    ].join("\r\n");
}

/**
 * Dispara o download do arquivo .ics
 */
function baixarICSDoisEventos(doc) {
    const ics = gerarICSComDoisEventos(doc);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lembretes-${doc.nome
        .replace(/\s+/g, "-")
        .toLowerCase()}.ics`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
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
            <button class="link-btn" data-action="calendario" data-index="${idx}">
            Calendário
            </button>
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
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const idx = Number(btn.dataset.index);

    if (action === "remover") {
        removerDocumentoPorIndice(idx);
        renderizarTudo();
        setMsg("Documento removido.");
        return;
    }

    if (action === "calendario") {
        baixarICSDoisEventos(documentos[idx]);
        setMsg("Arquivo .ics gerado. Abra para adicionar ao calendário.", "info");
        return;
    }
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
