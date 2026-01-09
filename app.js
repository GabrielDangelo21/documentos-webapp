"use strict";

/* =========================
   Documentos • WebApp
   Persistência: LocalStorage
   ========================= */

const STORAGE_KEY = "documentos_v1";

/* ---------- Estado ---------- */
let documentos = [];
let filtroTexto = "";
let ordenacao = "validade_asc";

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

const inputBuscar = $("#buscar");
const selectOrdenar = $("#ordenar");

/* Dialog edição */
const dlgEditar = $("#dlg-editar");
const formEditar = $("#form-editar");
const editNome = $("#edit-nome");
const editValidade = $("#edit-validade");
const editAlerta = $("#edit-alerta");
const btnCancelarEdicao = $("#btn-cancelar-edicao");

let idxEditando = null;

/* ---------- Utilitários ---------- */
function setMsg(texto, tipo = "info") {
    msgBox.textContent = texto || "";
    msgBox.style.color =
        tipo === "erro" ? "#ff9aa2" :
            tipo === "sucesso" ? "#9ae6b4" :
                "rgba(255,255,255,.7)";
    if (texto) setTimeout(() => (msgBox.textContent = ""), 3000);
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
    if (!nome || !nome.trim()) throw new Error("Nome do documento é obrigatório.");
    if (!validadeISO) throw new Error("Data de validade é obrigatória.");
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

function atualizarDocumentoPorIndice(idx, novoDoc) {
    if (idx < 0 || idx >= documentos.length) return;
    validarDocumento(novoDoc.nome, novoDoc.validade, novoDoc.alerta);
    documentos[idx] = novoDoc;
    salvar();
}

/* =========================
   Utilitários para ICS
   (Eventos de dia inteiro)
   ========================= */

function pad2(n) {
    return String(n).padStart(2, "0");
}
function isoParaYYYYMMDD(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${y}${pad2(m)}${pad2(d)}`;
}
function addDiasISO(iso, deltaDias) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDias);
    return (
        dt.getFullYear() +
        "-" +
        pad2(dt.getMonth() + 1) +
        "-" +
        pad2(dt.getDate())
    );
}
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
function uid(prefix = "evt") {
    const base =
        crypto?.randomUUID?.() ??
        `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${base}@documentos-webapp`;
}
function escapeICSText(texto) {
    return String(texto)
        .replace(/\\/g, "\\\\")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;")
        .replace(/\n/g, "\\n");
}
function gerarICSComDoisEventos(doc) {
    const validadeISO = doc.validade;
    const alertaDias = Number(doc.alerta);
    const alertaISO = addDiasISO(validadeISO, -alertaDias);

    const validadeYYYYMMDD = isoParaYYYYMMDD(validadeISO);
    const alertaYYYYMMDD = isoParaYYYYMMDD(alertaISO);

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
function baixarICSDoisEventos(doc) {
    const ics = gerarICSComDoisEventos(doc);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lembretes-${doc.nome.replace(/\s+/g, "-").toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/* ---------- Renderização ---------- */
function criarBadge(status) {
    const span = document.createElement("span");
    span.className =
        "badge " + (status === "Ok" ? "ok" : status === "Alerta" ? "warn" : "bad");
    span.textContent = status;
    return span;
}

function aplicarFiltroOrdenacao(lista) {
    let out = [...lista];

    if (filtroTexto.trim()) {
        const t = filtroTexto.trim().toLowerCase();
        out = out.filter((d) => d.nome.toLowerCase().includes(t));
    }

    const cmpStr = (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

    if (ordenacao === "validade_asc") {
        out.sort((a, b) => cmpStr(a.validade, b.validade) || cmpStr(a.nome, b.nome));
    } else if (ordenacao === "validade_desc") {
        out.sort((a, b) => cmpStr(b.validade, a.validade) || cmpStr(a.nome, b.nome));
    } else if (ordenacao === "nome_asc") {
        out.sort((a, b) => cmpStr(a.nome, b.nome) || cmpStr(a.validade, b.validade));
    } else if (ordenacao === "nome_desc") {
        out.sort((a, b) => cmpStr(b.nome, a.nome) || cmpStr(a.validade, b.validade));
    }

    return out;
}

function renderizarLista() {
    listaContainer.innerHTML = "";

    const listaView = aplicarFiltroOrdenacao(documentos);

    if (listaView.length === 0) {
        listaContainer.innerHTML = `
      <div class="empty">
        <span class="emoji">📄</span>
        <div>
          <strong>Nenhum documento encontrado</strong>
          <p>Altere o filtro ou adicione um novo documento.</p>
        </div>
      </div>`;
        return;
    }

    listaView.forEach((doc) => {
        const idxReal = documentos.indexOf(doc);
        const { dias, status } = calcularStatus(doc);

        const row = document.createElement("div");
        row.className = "row-item";

        const diasTxt = dias < 0 ? `-${Math.abs(dias)}` : String(dias);

        row.innerHTML = `
      <div>${doc.nome}</div>
      <div>${doc.validade}</div>
      <div>${diasTxt}</div>
      <div></div>
      <div class="right">
        <button class="link-btn" data-action="editar" data-index="${idxReal}">Editar</button>
        <button class="link-btn" data-action="calendario" data-index="${idxReal}">Calendário</button>
        <button class="link-btn" data-action="remover" data-index="${idxReal}">Remover</button>
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
        .filter((x) => x.status !== "Ok")
        .sort((a, b) => a.dias - b.dias);

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

/* ---------- Eventos UI ---------- */
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

function abrirEdicao(idx) {
    idxEditando = idx;
    const doc = documentos[idx];

    editNome.value = doc.nome;
    editValidade.value = doc.validade;
    editAlerta.value = String(doc.alerta);

    dlgEditar.showModal();
}

function fecharEdicao() {
    idxEditando = null;
    if (dlgEditar.open) dlgEditar.close();
}

function onSalvarEdicao(e) {
    e.preventDefault();
    if (idxEditando === null) return;

    try {
        atualizarDocumentoPorIndice(idxEditando, {
            nome: editNome.value.trim(),
            validade: editValidade.value,
            alerta: Number(editAlerta.value),
        });

        fecharEdicao();
        renderizarTudo();
        setMsg("Documento atualizado com sucesso.", "sucesso");
    } catch (err) {
        setMsg(err.message, "erro");
    }
}

function onClickLista(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const idx = Number(btn.dataset.index);

    if (action === "remover") {
        if (!confirm("Remover este documento?")) return;
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

    if (action === "editar") {
        abrirEdicao(idx);
        return;
    }
}

function onBuscar(e) {
    filtroTexto = e.target.value;
    renderizarLista();
}

function onOrdenar(e) {
    ordenacao = e.target.value;
    renderizarLista();
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

    inputBuscar.addEventListener("input", onBuscar);
    selectOrdenar.addEventListener("change", onOrdenar);

    formEditar.addEventListener("submit", onSalvarEdicao);
    btnCancelarEdicao.addEventListener("click", fecharEdicao);

    // fechar dialog clicando fora
    dlgEditar.addEventListener("click", (ev) => {
        const rect = dlgEditar.getBoundingClientRect();
        const inside =
            ev.clientX >= rect.left &&
            ev.clientX <= rect.right &&
            ev.clientY >= rect.top &&
            ev.clientY <= rect.bottom;
        if (!inside) fecharEdicao();
    });
}

init();
