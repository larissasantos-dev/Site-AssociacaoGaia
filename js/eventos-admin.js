/*
 * Cadastro, listagem, edição e exclusão de eventos pela API.
 * O back-end deve proteger estas rotas para administradores.
 * A imagem é enviada como URL; o seletor de arquivo serve apenas para prévia.
 */
document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("adm-form-evento");
    if (!formulario) return;

    const token = localStorage.getItem("gaia_token");
    let usuario = null;
    try {
        usuario = JSON.parse(localStorage.getItem("gaia_usuario") || "null");
    } catch (_) {
        usuario = null;
    }
    if (!token || usuario?.tipoUsuario !== "ADMINISTRADOR") return;

    const campoImagem = document.getElementById("adm-evento-imagem");
    const campoImagemUrl = document.getElementById("adm-evento-imagem-url");
    const previaImagem = document.getElementById("adm-evento-preview");
    const campoTitulo = document.getElementById("adm-evento-titulo");
    const campoCategoria = document.getElementById("adm-evento-categoria");
    const campoDescricao = document.getElementById("adm-evento-descricao");
    const campoLocal = document.getElementById("adm-evento-local");
    const campoData = document.getElementById("adm-evento-data");
    const campoHora = document.getElementById("adm-evento-hora");
    const mensagem = document.getElementById("adm-evento-mensagem");
    const mensagemLista = document.getElementById("adm-eventos-lista-mensagem");
    const lista = document.getElementById("adm-eventos-lista");
    const vazio = document.getElementById("adm-eventos-vazio");
    const tituloFormulario = document.getElementById("adm-evento-form-titulo");
    const textoSubmit = document.getElementById("adm-evento-submit-texto");
    const botaoSubmit = formulario.querySelector('button[type="submit"]');

    let urlImagemTemporaria = null;
    let idEmEdicao = null;
    let eventosCarregados = [];

    function limparPrevia() {
        if (urlImagemTemporaria) URL.revokeObjectURL(urlImagemTemporaria);
        urlImagemTemporaria = null;
        previaImagem.replaceChildren();
        const icone = document.createElement("i");
        icone.className = "bi bi-image";
        icone.setAttribute("aria-hidden", "true");
        const texto = document.createElement("span");
        texto.textContent = "A prévia da imagem aparecerá aqui";
        previaImagem.append(icone, texto);
    }

    function mostrarPreviaArquivo(arquivo) {
        if (urlImagemTemporaria) URL.revokeObjectURL(urlImagemTemporaria);
        urlImagemTemporaria = null;
        previaImagem.replaceChildren();
        if (!arquivo) {
            limparPrevia();
            return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
            campoImagem.value = "";
            const texto = document.createElement("span");
            texto.textContent = "Use uma imagem JPG, PNG ou WEBP.";
            previaImagem.appendChild(texto);
            return;
        }
        urlImagemTemporaria = URL.createObjectURL(arquivo);
        const img = document.createElement("img");
        img.src = urlImagemTemporaria;
        img.alt = `Pré-visualização: ${arquivo.name}`;
        const nome = document.createElement("span");
        nome.textContent = arquivo.name;
        previaImagem.append(img, nome);
    }

    function mostrarMensagem(texto, tipo = "") {
        mensagem.textContent = texto;
        mensagem.hidden = !texto;
        mensagem.dataset.tipo = tipo;
    }

    function cabecalhos(json = false) {
        const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
        if (json) headers["Content-Type"] = "application/json";
        return headers;
    }

    async function lerErro(resposta) {
        let detalhe = "";
        try {
            const corpo = await resposta.json();
            detalhe = corpo.message || corpo.mensagem || corpo.detail || "";
        } catch (_) {}
        if (resposta.status === 401) {
            localStorage.removeItem("gaia_token");
            localStorage.removeItem("gaia_usuario");
            window.location.href = "../index.html";
            return "Sua sessão expirou. Entre novamente.";
        }
        if (resposta.status === 403) return "Sua conta não tem permissão para realizar esta operação.";
        return detalhe || `A operação falhou (HTTP ${resposta.status}).`;
    }

    function formatarData(data, hora) {
        if (!data) return "Data a confirmar";
        const [ano, mes, dia] = String(data).split("-").map(Number);
        const texto = new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric"
        });
        return hora ? `${texto} • ${String(hora).slice(0, 5)}` : texto;
    }

    function criarElemento(tag, classe, texto) {
        const elemento = document.createElement(tag);
        if (classe) elemento.className = classe;
        if (texto !== undefined) elemento.textContent = texto;
        return elemento;
    }

    function renderizarEventos(eventos) {
        lista.replaceChildren();
        vazio.hidden = eventos.length > 0;
        eventos.forEach(evento => {
            const item = criarElemento("article", "adm-evento-item");
            const conteudo = criarElemento("div", "adm-evento-item-conteudo");
            conteudo.append(
                criarElemento("h4", "", evento.titulo || "Evento sem título"),
                criarElemento("p", "", `${evento.local || "Local a confirmar"} • ${formatarData(evento.data, evento.hora)}`)
            );
            if (evento.descricao) conteudo.appendChild(criarElemento("p", "", evento.descricao));
            const acoes = criarElemento("div", "adm-evento-item-acoes");
            const editar = criarElemento("button", "adm-evento-btn adm-evento-btn--secundario", "Editar");
            editar.type = "button";
            editar.addEventListener("click", () => prepararEdicao(evento));
            const excluir = criarElemento("button", "adm-evento-btn adm-evento-btn--perigo", "Excluir");
            excluir.type = "button";
            excluir.addEventListener("click", () => excluirEvento(evento));
            acoes.append(editar, excluir);
            item.append(conteudo, acoes);
            lista.appendChild(item);
        });
    }

    async function carregarEventos() {
        mensagemLista.textContent = "Carregando eventos...";
        vazio.hidden = true;
        try {
            const resposta = await fetch(`${API_BASE}/eventos`, { headers: cabecalhos() });
            if (!resposta.ok) throw new Error(await lerErro(resposta));
            const dados = await resposta.json();
            if (!Array.isArray(dados)) throw new Error("A API não retornou uma lista de eventos.");
            eventosCarregados = dados.sort((a, b) => {
                const da = a.data ? new Date(`${a.data}T${a.hora || "00:00"}`).getTime() : Infinity;
                const db = b.data ? new Date(`${b.data}T${b.hora || "00:00"}`).getTime() : Infinity;
                return da - db;
            });
            renderizarEventos(eventosCarregados);
            mensagemLista.textContent = eventosCarregados.length ? "" : "Nenhum evento cadastrado.";
        } catch (erro) {
            console.error("Erro ao carregar eventos administrativos:", erro);
            lista.replaceChildren();
            vazio.hidden = true;
            mensagemLista.textContent = erro.message || "Não foi possível carregar os eventos.";
        }
    }

    function prepararEdicao(evento) {
        idEmEdicao = evento.idEvento;
        campoImagemUrl.value = evento.imagemUrl || "";
        campoTitulo.value = evento.titulo || "";
        campoCategoria.value = evento.categoria || "";
        campoDescricao.value = evento.descricao || "";
        campoLocal.value = evento.local || "";
        campoData.value = evento.data || "";
        campoHora.value = evento.hora ? String(evento.hora).slice(0, 5) : "";
        campoImagem.value = "";
        limparPrevia();
        if (evento.imagemUrl) {
            const img = document.createElement("img");
            img.src = evento.imagemUrl;
            img.alt = `Imagem atual do evento ${evento.titulo || ""}`;
            img.onerror = () => { img.onerror = null; limparPrevia(); };
            previaImagem.replaceChildren(img, criarElemento("span", "", "Imagem atualmente cadastrada"));
        }
        tituloFormulario.textContent = "Editar evento";
        textoSubmit.textContent = "Salvar alterações";
        mostrarMensagem("Editando evento. Altere os campos e salve.");
        formulario.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function limparFormulario() {
        idEmEdicao = null;
        formulario.reset();
        limparPrevia();
        tituloFormulario.textContent = "Cadastrar evento";
        textoSubmit.textContent = "Cadastrar evento";
        mostrarMensagem("");
    }

    async function excluirEvento(evento) {
        if (!window.confirm(`Deseja realmente excluir o evento "${evento.titulo}"?`)) return;
        mensagemLista.textContent = "Excluindo evento...";
        try {
            const resposta = await fetch(`${API_BASE}/eventos/${encodeURIComponent(evento.idEvento)}`, {
                method: "DELETE",
                headers: cabecalhos()
            });
            if (!resposta.ok) throw new Error(await lerErro(resposta));
            if (idEmEdicao === evento.idEvento) limparFormulario();
            mensagemLista.textContent = "Evento excluído.";
            await carregarEventos();
        } catch (erro) {
            console.error("Erro ao excluir evento:", erro);
            mensagemLista.textContent = erro.message || "Não foi possível excluir o evento.";
        }
    }

    campoImagem.addEventListener("change", () => {
        mostrarPreviaArquivo(campoImagem.files[0] || null);
    });
    campoImagemUrl.addEventListener("input", () => {
        if (!campoImagem.files.length && campoImagemUrl.value.trim()) {
            previaImagem.replaceChildren();
            const img = document.createElement("img");
            img.src = campoImagemUrl.value.trim();
            img.alt = "Prévia da imagem pela URL";
            img.onerror = () => { img.onerror = null; limparPrevia(); };
            previaImagem.appendChild(img);
        }
    });
    formulario.addEventListener("reset", () => window.setTimeout(() => {
        idEmEdicao = null;
        limparPrevia();
        tituloFormulario.textContent = "Cadastrar evento";
        textoSubmit.textContent = "Cadastrar evento";
        mostrarMensagem("");
    }, 0));

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        if (!formulario.reportValidity()) return;

        const payload = {
            imagemUrl: campoImagemUrl.value.trim(),
            titulo: campoTitulo.value.trim(),
            categoria: campoCategoria.value,
            descricao: campoDescricao.value.trim(),
            local: campoLocal.value.trim(),
            data: campoData.value,
            hora: campoHora.value
        };
        if (!payload.imagemUrl || !payload.titulo || !payload.categoria || !payload.local || !payload.data || !payload.hora) {
            mostrarMensagem("Preencha a URL da imagem, título, categoria, local, data e horário.", "erro");
            return;
        }

        botaoSubmit.disabled = true;
        mostrarMensagem(idEmEdicao ? "Salvando alterações..." : "Cadastrando evento...");
        try {
            const editando = idEmEdicao !== null;
            const url = editando
                ? `${API_BASE}/eventos/${encodeURIComponent(idEmEdicao)}`
                : `${API_BASE}/eventos`;
            const resposta = await fetch(url, {
                method: editando ? "PATCH" : "POST",
                headers: cabecalhos(true),
                body: JSON.stringify(payload)
            });
            if (!resposta.ok) throw new Error(await lerErro(resposta));
            limparFormulario();
            window.setTimeout(() => {
                mostrarMensagem(editando ? "Evento atualizado com sucesso." : "Evento cadastrado com sucesso.");
            }, 0);
            await carregarEventos();
        } catch (erro) {
            console.error("Erro ao salvar evento:", erro);
            mostrarMensagem(erro.message || "Não foi possível salvar o evento.", "erro");
        } finally {
            botaoSubmit.disabled = false;
        }
    });

    limparPrevia();
    carregarEventos();
});
