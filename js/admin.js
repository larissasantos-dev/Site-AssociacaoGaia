const ADM_API_URL = `${API_BASE}/api/usuarios`;

document.addEventListener("DOMContentLoaded", () => {

    const shell = document.getElementById("adm-shell");

    // Esta página só deve executar o código administrativo
    // quando a estrutura do painel realmente existir.
    if (!shell) {
        return;
    }

    const navItens = document.querySelectorAll(".adm-nav-item");
    const secoes = document.querySelectorAll(".adm-secao");

    const filtroTipo = document.getElementById("adm-filtro-tipo");
    const corpoTabela = document.getElementById("adm-corpo-tabela");
    const tabelaVazia = document.getElementById("adm-tabela-vazia");
    const erroPainel = document.getElementById("adm-erro-painel");
    const contadorUsuarios = document.getElementById("adm-contador-usuarios");

    // Mesma sessão usada em todo o site (salva pelo login.html em
    // "gaia_token" / "gaia_usuario" — ver POST /api/usuarios/login).
    const token = localStorage.getItem("gaia_token");

    let usuarioLogado = null;
    try {
        usuarioLogado = JSON.parse(localStorage.getItem("gaia_usuario") || "null");
    } catch (erro) {
        usuarioLogado = null;
    }

    /*
     * =====================================================
     * VERIFICAÇÃO DA SESSÃO
     * =====================================================
     *
     * Ter qualquer token no localStorage NÃO significa
     * que o usuário é administrador.
     *
     * O tipoUsuario já vem pronto em "gaia_usuario"
     * (UsuarioResponseDTO), então não é preciso decodificar
     * o JWT manualmente para checar isso.
     */
    if (!token || !usuarioLogado) {
        redirecionarParaFora();
        return;
    }

    if (usuarioLogado.tipoUsuario !== "ADMINISTRADOR") {
        redirecionarParaFora();
        return;
    }

    /*
     * O token passou pela verificação inicial no frontend.
     *
     * A proteção REAL continua no backend.
     */
    shell.hidden = false;

    /*
     * =====================================================
     * MENU ADMINISTRATIVO
     * =====================================================
     */

    navItens.forEach((botao) => {

        botao.addEventListener("click", () => {

            navItens.forEach((item) => {
                item.classList.remove("adm-nav-item--ativo");
            });

            botao.classList.add("adm-nav-item--ativo");

            secoes.forEach((secao) => {
                secao.hidden = true;
            });

            const secaoSelecionada = document.getElementById(
                `adm-secao-${botao.dataset.secao}`
            );

            if (secaoSelecionada) {
                secaoSelecionada.hidden = false;
            }
        });

    });

    /*
     * =====================================================
     * FILTRO
     * =====================================================
     */

    if (filtroTipo) {
        filtroTipo.addEventListener("change", carregarUsuarios);
    }

    /*
     * =====================================================
     * CARREGAMENTO INICIAL
     * =====================================================
     *
     * O menu mobile (hambúrguer) do header NÃO é controlado
     * aqui. Ele já é tratado globalmente pelo js/script.js,
     * que é carregado em todas as páginas do site.
     */

    carregarUsuarios();

    /*
     * =====================================================
     * BUSCAR USUÁRIOS
     * =====================================================
     */

    async function carregarUsuarios() {

        esconderErro();

        if (tabelaVazia) {
            tabelaVazia.hidden = true;
        }

        try {

            const resposta = await fetch(ADM_API_URL, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });

            /*
             * 401 = token ausente/inválido/expirado.
             * 403 = usuário autenticado, mas sem permissão.
             */
            if (resposta.status === 401) {

                localStorage.removeItem("gaia_token");
                localStorage.removeItem("gaia_usuario");

                redirecionarParaFora();

                return;
            }

            if (resposta.status === 403) {

                redirecionarParaFora();

                return;
            }

            if (!resposta.ok) {

                mostrarErro(
                    "Não foi possível carregar os usuários."
                );

                return;
            }

            const usuarios = await resposta.json();

            /*
             * O backend entrega os usuários.
             *
             * O filtro abaixo é somente de apresentação:
             * ele não substitui a autorização do backend.
             */
            const tipoSelecionado = filtroTipo
                ? filtroTipo.value
                : "";

            const usuariosFiltrados = tipoSelecionado
                ? usuarios.filter(
                    (usuario) =>
                        usuario.tipoUsuario === tipoSelecionado
                )
                : usuarios;

            renderizarTabela(usuariosFiltrados);

        } catch (erro) {

            console.error(
                "Erro ao carregar usuários:",
                erro
            );

            mostrarErro(
                "Não foi possível conectar ao servidor."
            );
        }
    }

    /*
     * =====================================================
     * RENDERIZAR TABELA
     * =====================================================
     */

    function renderizarTabela(usuarios) {

        if (!corpoTabela) {
            return;
        }

        corpoTabela.innerHTML = "";

        if (contadorUsuarios) {

            contadorUsuarios.textContent =
                `${usuarios.length} ${
                    usuarios.length === 1
                        ? "usuário"
                        : "usuários"
                }`;
        }

        if (usuarios.length === 0) {

            if (tabelaVazia) {
                tabelaVazia.hidden = false;
            }

            return;
        }

        usuarios.forEach((usuario) => {

            const linha = document.createElement("tr");

            /*
             * NOME
             */
            const nome = document.createElement("td");
            nome.textContent = usuario.nome || "Não informado";

            /*
             * E-MAIL
             */
            const email = document.createElement("td");
            email.textContent = usuario.email || "Não informado";

            /*
             * TIPO
             */
            const tipo = document.createElement("td");

            const tipoBadge = document.createElement("span");

            tipoBadge.classList.add("adm-tipo");

            if (usuario.tipoUsuario === "ARTESAO") {
                tipoBadge.classList.add("adm-tipo--artesao");
            }

            if (usuario.tipoUsuario === "ADMINISTRADOR") {
                tipoBadge.classList.add("adm-tipo--admin");
            }

            tipoBadge.textContent =
                formatarTipoUsuario(usuario.tipoUsuario);

            tipo.appendChild(tipoBadge);

            /*
             * DATA
             */
            const data = document.createElement("td");

            data.textContent =
                formatarData(usuario.dataCadastro);

            /*
             * STATUS
             */
            const status = document.createElement("td");

            const statusBadge = document.createElement("span");

            statusBadge.classList.add("adm-status");

            if (usuario.ativo === true) {

                statusBadge.classList.add(
                    "adm-status--ativo"
                );

                statusBadge.textContent = "Ativo";

            } else {

                statusBadge.classList.add(
                    "adm-status--inativo"
                );

                statusBadge.textContent = "Inativo";
            }

            status.appendChild(statusBadge);

            /*
             * AÇÃO
             */
            const acao = document.createElement("td");

            const botaoStatus =
                document.createElement("button");

            botaoStatus.type = "button";

            botaoStatus.classList.add(
                "adm-btn-status"
            );

            if (usuario.ativo === true) {

                botaoStatus.classList.add(
                    "adm-btn-status--desativar"
                );

                botaoStatus.textContent = "Desativar";

                botaoStatus.setAttribute(
                    "aria-label",
                    `Desativar usuário ${usuario.nome}`
                );

            } else {

                botaoStatus.classList.add(
                    "adm-btn-status--ativar"
                );

                botaoStatus.textContent = "Ativar";

                botaoStatus.setAttribute(
                    "aria-label",
                    `Ativar usuário ${usuario.nome}`
                );
            }

            botaoStatus.addEventListener(
                "click",
                () => alterarStatusUsuario(
                    usuario,
                    botaoStatus
                )
            );

            acao.appendChild(botaoStatus);

            /*
             * MONTAR LINHA
             */
            linha.appendChild(nome);
            linha.appendChild(email);
            linha.appendChild(tipo);
            linha.appendChild(data);
            linha.appendChild(status);
            linha.appendChild(acao);

            corpoTabela.appendChild(linha);
        });
    }

    /*
     * =====================================================
     * ATIVAR / DESATIVAR USUÁRIO
     * =====================================================
     */

    async function alterarStatusUsuario(
        usuario,
        botao
    ) {

        if (!usuario.idUsuario) {
            mostrarErro(
                "Não foi possível identificar o usuário."
            );
            return;
        }

        const novoStatus = usuario.ativo !== true;

        const textoOriginal = botao.textContent;

        botao.disabled = true;
        botao.textContent = "Alterando...";

        esconderErro();

        try {

            const resposta = await fetch(
                `${ADM_API_URL}/${usuario.idUsuario}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        ativo: novoStatus
                    })
                }
            );

            if (resposta.status === 401) {

                localStorage.removeItem("gaia_token");
                localStorage.removeItem("gaia_usuario");

                redirecionarParaFora();

                return;
            }

            if (resposta.status === 403) {

                mostrarErro(
                    "Você não possui permissão para alterar o status deste usuário."
                );

                return;
            }

            if (!resposta.ok) {

                mostrarErro(
                    "Não foi possível alterar o status do usuário."
                );

                return;
            }

            /*
             * Atualiza o valor local para que o próximo
             * botão seja renderizado corretamente.
             */
            usuario.ativo = novoStatus;

            await carregarUsuarios();

        } catch (erro) {

            console.error(
                "Erro ao alterar status do usuário:",
                erro
            );

            mostrarErro(
                "Não foi possível conectar ao servidor."
            );

            botao.disabled = false;
            botao.textContent = textoOriginal;
        }
    }

    /*
     * =====================================================
     * FORMATAR TIPO
     * =====================================================
     */

    function formatarTipoUsuario(tipo) {

        const tipos = {
            VISITANTE: "Visitante",
            ARTESAO: "Artesão",
            ADMINISTRADOR: "Administrador"
        };

        return tipos[tipo] || tipo || "Não informado";
    }

    /*
     * =====================================================
     * FORMATAR DATA
     * =====================================================
     */

    function formatarData(data) {

        if (!data) {
            return "Não informado";
        }

        const dataConvertida = new Date(data);

        if (Number.isNaN(dataConvertida.getTime())) {
            return "Não informado";
        }

        return dataConvertida.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );
    }

    /*
     * =====================================================
     * REDIRECIONAR PARA FORA DO PAINEL
     * =====================================================
     *
     * Usado sempre que o usuário não é administrador ou a
     * sessão deixou de ser válida. Em vez de mostrar um
     * aviso de "acesso restrito", a pessoa é simplesmente
     * levada de volta para a página inicial — o painel não
     * deve nem dar pistas de que existe para quem não pode
     * usá-lo.
     */

    function redirecionarParaFora() {
        window.location.href = "../index.html";
    }

    /*
     * =====================================================
     * ERROS
     * =====================================================
     */

    function mostrarErro(mensagem) {

        if (!erroPainel) {
            return;
        }

        erroPainel.textContent = mensagem;
        erroPainel.hidden = false;
    }

    function esconderErro() {

        if (!erroPainel) {
            return;
        }

        erroPainel.textContent = "";
        erroPainel.hidden = true;
    }

});