
document.addEventListener("DOMContentLoaded", async () => {
    const destaque = document.getElementById("ga-agenda-proximo");
    const listaProximos = document.getElementById("ga-agenda-lista-proximos");
    const listaAnteriores = document.getElementById("ga-agenda-lista-anteriores");
    const tituloProximos = document.getElementById("ga-agenda-titulo-proximos");
    const tituloAnteriores = document.getElementById("ga-agenda-titulo-anteriores");
    const mensagem = document.getElementById("ga-agenda-mensagem");

    const token = localStorage.getItem("gaia_token");

    if (!token) {
        mensagem.textContent = "Entre na sua conta para consultar seus agendamentos.";
        destaque.replaceChildren();
        return;
    }

    const agora = new Date();

    function dataHoraEvento(evento) {
        const valorData = evento.data ?? evento.dataEvento;

        if (!valorData) return null;

        const [ano, mes, dia] = String(valorData).split("-").map(Number);

        const valorHora = evento.hora ?? evento.horaEvento ?? "00:00:00";
        const [hora, minuto, segundo = 0] = String(valorHora)
            .split(":")
            .map(Number);

        if (!ano || !mes || !dia) return null;

        return new Date(
            ano,
            mes - 1,
            dia,
            hora || 0,
            minuto || 0,
            segundo || 0
        );
    }

    function formatarData(evento) {
        const data = dataHoraEvento(evento);

        if (!data) return "Data a confirmar";

        let texto = data.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        const horaEvento = evento.hora ?? evento.horaEvento;

        if (horaEvento) {
            texto += ` • ${String(horaEvento).slice(0, 5)}`;
        }

        return texto;
    }

    function imagemUrl(valor) {
        if (!valor) return "../assets/evento-principal.jpg";

        const url = String(valor).trim();

        if (/^(https?:|data:|\/)/i.test(url) || url.startsWith("../")) {
            return url;
        }

        if (url.startsWith("assets/")) {
            return `../${url}`;
        }

        return `../assets/${url}`;
    }

    function elemento(tag, classe, texto) {
        const node = document.createElement(tag);

        if (classe) node.className = classe;
        if (texto !== undefined) node.textContent = texto;

        return node;
    }

    function configurarImagem(img, evento) {
        img.src = imagemUrl(evento.imagemUrl);
        img.alt = `Imagem do evento ${evento.titulo || "sem título"}`;
        img.loading = "lazy";

        img.onerror = () => {
            img.onerror = null;
            img.src = "../assets/evento-principal.jpg";
        };
    }

    function criarInformacao(classe, src, texto) {
        const wrapper = elemento("p", `ga-agenda-info ${classe}`);
        const img = elemento("img");

        img.src = src;
        img.alt = "";
        img.setAttribute("aria-hidden", "true");

        const conteudo = elemento("span", "", texto);

        wrapper.append(img, conteudo);

        return wrapper;
    }

    function criarLinkDetalhes(evento) {
        const link = elemento("a", "ga-btn-agenda", "Ver detalhes");

        link.href = `evento.html?id=${encodeURIComponent(evento.idEvento)}`;
        link.setAttribute(
            "aria-label",
            `Ver detalhes do evento ${evento.titulo || ""}`
        );

        return link;
    }

    function criarAvisoCancelado() {
        return elemento(
            "p",
            "ga-agenda-cancelado",
            "Este evento foi cancelado pelo administrador."
        );
    }

    function criarCard(evento) {
        const article = elemento("article", "ga-card-agenda");

        const imagem = elemento("img", "ga-card-agenda__imagem");
        configurarImagem(imagem, evento);

        const info = elemento("div", "ga-card-info");

        const titulo = elemento(
            "h3",
            "ga-card-agenda__titulo",
            evento.titulo || "Evento sem título"
        );

        info.append(
            titulo,
            criarInformacao(
                "ga-local",
                "../assets/ponteiro-mapa.png",
                evento.local || "Local a confirmar"
            ),
            criarInformacao(
                "ga-data",
                "../assets/calendario-eventos.png",
                formatarData(evento)
            )
        );

        if (evento.cancelado) {
            info.appendChild(criarAvisoCancelado());
        }

        info.appendChild(criarLinkDetalhes(evento));
        article.append(imagem, info);

        return article;
    }

    function mostrarDestaque(evento) {
        destaque.replaceChildren();

        const visual = elemento("div", "ga-img-proximo");

        const badge = elemento(
            "span",
            evento.cancelado
                ? "ga-badge-proximo ga-badge-proximo--cancelado"
                : "ga-badge-proximo",
            evento.cancelado ? "Evento cancelado" : "Próximo evento"
        );

        const imagem = elemento("img");
        configurarImagem(imagem, evento);

        visual.append(badge, imagem);

        const info = elemento("div", "ga-info-proximo");

        const titulo = elemento(
            "h2",
            "ga-info-proximo__titulo",
            evento.titulo || "Evento sem título"
        );

        info.append(
            titulo,
            criarInformacao(
                "ga-local",
                "../assets/ponteiro-mapa.png",
                evento.local || "Local a confirmar"
            ),
            criarInformacao(
                "ga-data",
                "../assets/calendario-eventos.png",
                formatarData(evento)
            )
        );

        if (evento.cancelado) {
            info.appendChild(criarAvisoCancelado());
        }

        info.appendChild(criarLinkDetalhes(evento));

        destaque.append(visual, info);
    }

    function mostrarMensagemDestaque(texto) {
        destaque.replaceChildren(
            elemento("div", "ga-info-proximo ga-info-proximo--vazio", texto)
        );
    }

    try {
        const resposta = await fetch(`${API_BASE}/agendamentos/ativos`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        });

        if (resposta.status === 401) {
            localStorage.removeItem("gaia_token");
            localStorage.removeItem("gaia_usuario");

            mensagem.textContent =
                "Sua sessão expirou. Entre novamente na sua conta.";

            mostrarMensagemDestaque("Faça login para visualizar sua agenda.");
            return;
        }

        if (resposta.status === 403) {
            mensagem.textContent =
                "Você não tem permissão para consultar esta agenda.";

            mostrarMensagemDestaque("Não foi possível acessar seus agendamentos.");
            return;
        }

        if (!resposta.ok) {
            throw new Error(`A API respondeu com status ${resposta.status}.`);
        }

        const agendamentos = await resposta.json();

        if (!Array.isArray(agendamentos)) {
            throw new Error("A API não retornou uma lista de agendamentos.");
        }

        const eventos = agendamentos
            .map(agendamento => ({
                idEvento: agendamento.idEvento,
                titulo: agendamento.tituloEvento,
                data: agendamento.dataEvento,
                hora: agendamento.horaEvento,
                local: agendamento.local,
                imagemUrl: agendamento.imagemUrl,
                cancelado: agendamento.cancelado
            }))
            .sort((a, b) => {
                const dataA = dataHoraEvento(a);
                const dataB = dataHoraEvento(b);

                if (!dataA && !dataB) return 0;
                if (!dataA) return 1;
                if (!dataB) return -1;

                return dataA.getTime() - dataB.getTime();
            });

        const proximos = eventos.filter(evento => {
            const data = dataHoraEvento(evento);
            return data && data >= agora;
        });

        const anteriores = eventos.filter(evento => {
            const data = dataHoraEvento(evento);
            return data && data < agora;
        });

        listaProximos.replaceChildren();
        listaAnteriores.replaceChildren();

        if (proximos.length > 0) {
            mostrarDestaque(proximos[0]);

            proximos.slice(1).forEach(evento => {
                listaProximos.appendChild(criarCard(evento));
            });
        } else {
            mostrarMensagemDestaque(
                "Você não possui próximos eventos agendados."
            );
        }

        anteriores.forEach(evento => {
            listaAnteriores.appendChild(criarCard(evento));
        });

        tituloProximos.hidden = proximos.length <= 1;
        tituloAnteriores.hidden = anteriores.length === 0;

        mensagem.textContent = eventos.length
            ? ""
            : "Você ainda não possui agendamentos.";

    } catch (erro) {
        console.error("Não foi possível carregar a agenda:", erro);

        mostrarMensagemDestaque(
            "Não foi possível carregar sua agenda. Tente novamente mais tarde."
        );

        mensagem.textContent = "";
    }
});
