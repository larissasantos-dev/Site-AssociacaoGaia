
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
    const previaImagem = document.getElementById("adm-evento-preview");
    const campoTitulo = document.getElementById("adm-evento-titulo");
    const campoDescricao = document.getElementById("adm-evento-descricao");
    const campoLocal = document.getElementById("adm-evento-local");
    const campoCategoria = document.getElementById("adm-evento-categoria");
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
        if (urlImagemTemporaria) {
            URL.revokeObjectURL(urlImagemTemporaria);
        }

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
        limparPrevia();

        if (!arquivo) return;

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

    function cabecalhos() {
        return {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        };
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

        if (resposta.status === 403) {
            return "Sua conta não tem permissão para realizar esta operação.";
        }

        return detalhe || `A operação falhou (HTTP ${resposta.status}).`;
    }

    function formatarData(data, hora) {
        if (!data) return "Data a confirmar";

        const [ano, mes, dia] = String(data).split("-").map(Number);

        const texto = new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
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

            const tituloContainer = criarElemento("div", "adm-evento-titulo-container");

            tituloContainer.style.display = "flex";
            tituloContainer.style.alignItems = "center";
            tituloContainer.style.gap = "0.5rem";

            const h4 = criarElemento("h4", "", evento.titulo || "Evento sem título");

            tituloContainer.appendChild(h4);

            if (evento.cancelado) {
                const seloCancelado = criarElemento(
                    "span",
                    "adm-status adm-status--inativo",
                    "Cancelado"
                );

                tituloContainer.appendChild(seloCancelado);
            }

            conteudo.append(
                tituloContainer,
                criarElemento(
                    "p",
                    "",
                    `${evento.local || "Local a confirmar"} • ${formatarData(evento.data, evento.hora)}`
                )
            );

            if (evento.categoria) {
                conteudo.appendChild(
                    criarElemento("p", "", `Categoria: ${evento.categoria}`)
                );
            }

            if (evento.descricao) {
                conteudo.appendChild(criarElemento("p", "", evento.descricao));
            }

            const acoes = criarElemento("div", "adm-evento-item-acoes");

            const editar = criarElemento(
                "button",
                "adm-evento-btn adm-evento-btn--secundario",
                "Editar"
            );

            editar.type = "button";
            editar.addEventListener("click", () => prepararEdicao(evento));

            const textoBotaoStatus = evento.cancelado ? "Reativar" : "Cancelar";

            const alternarStatus = criarElemento(
                "button",
                "adm-evento-btn adm-evento-btn--secundario",
                textoBotaoStatus
            );

            alternarStatus.type = "button";
            alternarStatus.addEventListener("click", () => alternarStatusEvento(evento));

            const excluir = criarElemento(
                "button",
                "adm-evento-btn adm-evento-btn--perigo",
                "Excluir"
            );

            excluir.type = "button";
            excluir.addEventListener("click", () => excluirEvento(evento));

            acoes.append(editar, alternarStatus, excluir);
            item.append(conteudo, acoes);
            lista.appendChild(item);
        });
    }

    async function alternarStatusEvento(evento) {
        const acao = evento.cancelado ? "reativar" : "cancelar";

        const confirmado = confirm(
            `Tem certeza que deseja ${acao} o evento "${evento.titulo}"?`
        );

        if (!confirmado) return;

        try {
            const dados = new FormData();
            dados.append("cancelado", String(!evento.cancelado));

            const resposta = await fetch(`${API_BASE}/eventos/${evento.idEvento}`, {
                method: "PATCH",
                headers: cabecalhos(),
                body: dados
            });

            if (!resposta.ok) {
                throw new Error(await lerErro(resposta));
            }

            await carregarEventos();

        } catch (erro) {
            console.error(`Erro ao ${acao} evento:`, erro);
            alert(erro.message || `Não foi possível ${acao} o evento.`);
        }
    }

    async function carregarEventos() {
        mensagemLista.textContent = "Carregando eventos...";
        vazio.hidden = true;

        try {
            const resposta = await fetch(`${API_BASE}/eventos`, {
                headers: cabecalhos()
            });

            if (!resposta.ok) {
                throw new Error(await lerErro(resposta));
            }

            const dados = await resposta.json();

            if (!Array.isArray(dados)) {
                throw new Error("A API não retornou uma lista de eventos.");
            }

            eventosCarregados = dados.sort((a, b) => {
                const da = a.data
                    ? new Date(`${a.data}T${a.hora || "00:00"}`).getTime()
                    : Infinity;

                const db = b.data
                    ? new Date(`${b.data}T${b.hora || "00:00"}`).getTime()
                    : Infinity;

                return da - db;
            });

            renderizarEventos(eventosCarregados);

            mensagemLista.textContent = eventosCarregados.length
                ? ""
                : "Nenhum evento cadastrado.";

        } catch (erro) {
            console.error("Erro ao carregar eventos administrativos:", erro);

            lista.replaceChildren();
            vazio.hidden = true;

            mensagemLista.textContent =
                erro.message || "Não foi possível carregar os eventos.";
        }
    }

    function prepararEdicao(evento) {
        idEmEdicao = evento.idEvento;

        campoTitulo.value = evento.titulo || "";
        campoDescricao.value = evento.descricao || "";
        campoLocal.value = evento.local || "";
        campoCategoria.value = evento.categoria || "";
        campoData.value = evento.data || "";
        campoHora.value = evento.hora ? String(evento.hora).slice(0, 5) : "";

        campoImagem.value = "";
        campoImagem.required = false;

        limparPrevia();

        if (evento.imagemUrl) {
            const img = document.createElement("img");

            img.src = evento.imagemUrl;
            img.alt = `Imagem atual do evento ${evento.titulo || ""}`;

            img.onerror = () => {
                img.onerror = null;
                limparPrevia();
            };

            previaImagem.replaceChildren(
                img,
                criarElemento("span", "", "Imagem atualmente cadastrada")
            );
        }

        tituloFormulario.textContent = "Editar evento";
        textoSubmit.textContent = "Salvar alterações";

        mostrarMensagem(
            "Editando evento. Selecione outra imagem somente se desejar substituí-la."
        );

        formulario.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function limparFormulario() {
        formulario.reset();

        idEmEdicao = null;
        campoImagem.required = true;

        limparPrevia();

        tituloFormulario.textContent = "Cadastrar evento";
        textoSubmit.textContent = "Cadastrar evento";

        mostrarMensagem("");
    }

    async function excluirEvento(evento) {
        if (!window.confirm(`Deseja realmente excluir o evento "${evento.titulo}"?`)) {
            return;
        }

        mensagemLista.textContent = "Excluindo evento...";

        try {
            const resposta = await fetch(
                `${API_BASE}/eventos/${encodeURIComponent(evento.idEvento)}`,
                {
                    method: "DELETE",
                    headers: cabecalhos()
                }
            );

            if (!resposta.ok) {
                throw new Error(await lerErro(resposta));
            }

            if (idEmEdicao === evento.idEvento) {
                limparFormulario();
            }

            mensagemLista.textContent = "Evento excluído.";

            await carregarEventos();

        } catch (erro) {
            console.error("Erro ao excluir evento:", erro);

            mensagemLista.textContent =
                erro.message || "Não foi possível excluir o evento.";
        }
    }

    campoImagem.addEventListener("change", () => {
        mostrarPreviaArquivo(campoImagem.files[0] || null);
    });

    formulario.addEventListener("reset", () => {
        window.setTimeout(() => {
            idEmEdicao = null;
            campoImagem.required = true;

            limparPrevia();

            tituloFormulario.textContent = "Cadastrar evento";
            textoSubmit.textContent = "Cadastrar evento";

            mostrarMensagem("");
        }, 0);
    });

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (!formulario.reportValidity()) return;

        const arquivo = campoImagem.files[0];

        if (idEmEdicao === null && !arquivo) {
            mostrarMensagem("Selecione uma imagem para cadastrar o evento.", "erro");
            return;
        }

        const dados = new FormData();

        if (arquivo) {
            dados.append("imagem", arquivo);
        }

        dados.append("titulo", campoTitulo.value.trim());
        dados.append("descricao", campoDescricao.value.trim());
        dados.append("local", campoLocal.value.trim());
        dados.append("categoria", campoCategoria.value);
        dados.append("data", campoData.value);
        dados.append("hora", campoHora.value);

        botaoSubmit.disabled = true;

        const editando = idEmEdicao !== null;

        mostrarMensagem(
            editando ? "Salvando alterações..." : "Cadastrando evento..."
        );

        try {
            const url = editando
                ? `${API_BASE}/eventos/${encodeURIComponent(idEmEdicao)}`
                : `${API_BASE}/eventos`;

            const resposta = await fetch(url, {
                method: editando ? "PATCH" : "POST",
                headers: cabecalhos(),
                body: dados
            });

            if (!resposta.ok) {
                throw new Error(await lerErro(resposta));
            }

            limparFormulario();

            mostrarMensagem(
                editando
                    ? "Evento atualizado com sucesso."
                    : "Evento cadastrado com sucesso."
            );

            await carregarEventos();

        } catch (erro) {
            console.error("Erro ao salvar evento:", erro);

            mostrarMensagem(
                erro.message || "Não foi possível salvar o evento.",
                "erro"
            );

        } finally {
            botaoSubmit.disabled = false;
        }
    });

    limparPrevia();
    carregarEventos();
});
