document.addEventListener("DOMContentLoaded", async () => {
    const destaque = document.getElementById("ga-agenda-proximo");
    const listaProximos = document.getElementById("ga-agenda-lista-proximos");
    const listaAnteriores = document.getElementById("ga-agenda-lista-anteriores");
    const tituloProximos = document.getElementById("ga-agenda-titulo-proximos");
    const mensagem = document.getElementById("ga-agenda-mensagem");
    const tituloAnteriores = document.getElementById("ga-agenda-titulo-anteriores");

    const token = localStorage.getItem("gaia_token");

    if (!token) {
        mensagem.textContent = "Entre na sua conta para consultar seus agendamentos.";
        return;
    }

    const agora = new Date();

    // Converte a data e a hora do evento em um objeto Date.
    
    function dataHoraEvento(evento) {
        const valorData = evento.data ?? evento.dataEvento;

        if (!valorData) {
            return null;
        }

        const [ano, mes, dia] = String(valorData)
            .split("-")
            .map(Number);

        const valorHora = evento.hora ?? evento.horaEvento ?? "00:00:00";
        const [hora, minuto, segundo = 0] = String(valorHora)
            .split(":")
            .map(Number);

        if (!ano || !mes || !dia) {
            return null;
        }

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

        if (!data) {
            return "Data a confirmar";
        }

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
        if (!valor) {
            return "../assets/evento-principal.jpg";
        }

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

        if (classe) {
            node.className = classe;
        }

        if (texto !== undefined) {
            node.textContent = texto;
        }

        return node;
    }

    function criarIconeTexto(classe, src, texto) {
        const wrapper = elemento("div", classe);
        const img = elemento("img");

        img.src = src;
        img.alt = "";

        wrapper.append(
            img,
            elemento("p", "", texto)
        );

        return wrapper;
    }

    function configurarImagem(img, evento) {
        img.src = imagemUrl(evento.imagemUrl);
        img.alt = `Evento ${evento.tituloEvento || ""}`;
        img.loading = "lazy";

        img.onerror = () => {
            img.onerror = null;
            img.src = "../assets/evento-principal.jpg";
        };
    }

    // Adapta os nomes do DTO aos nomes esperados pelos cards.
    function adaptarEvento(agendamento) {
        return {
            idEvento: agendamento.idEvento,
            titulo: agendamento.tituloEvento,
            data: agendamento.dataEvento,
            hora: agendamento.horaEvento,
            local: agendamento.local,
            imagemUrl: agendamento.imagemUrl
        };
    }

    function criarCard(evento) {
        const article = elemento("article", "ga-card-agenda");

        const img = elemento("img");
        configurarImagem(img, evento);

        const info = elemento("div", "ga-card-info");

        info.append(
            elemento("h3", "", evento.titulo || "Evento sem título"),
            criarIconeTexto(
                "ga-local",
                "../assets/ponteiro-mapa.png",
                evento.local || "Local a confirmar"
            ),
            criarIconeTexto(
                "ga-data",
                "../assets/calendario-eventos.png",
                formatarData(evento)
            )
        );

        const link = elemento("a", "ga-btn-agenda", "Ver detalhes");
        link.href = `evento.html?id=${encodeURIComponent(evento.idEvento)}`;

        info.appendChild(link);
        article.append(img, info);

        return article;
    }

    function mostrarDestaque(evento) {
        destaque.replaceChildren();

        const visual = elemento("div", "ga-img-proximo");
        const badge = elemento("span", "ga-badge-proximo", "Próximo Evento");
        const img = elemento("img");

        configurarImagem(img, evento);
        visual.append(badge, img);

        const info = elemento("div", "ga-info-proximo");

        info.append(
            elemento("h2", "", evento.titulo || "Evento sem título"),
            criarIconeTexto(
                "ga-local",
                "../assets/ponteiro-mapa.png",
                evento.local || "Local a confirmar"
            ),
            criarIconeTexto(
                "ga-data",
                "../assets/calendario-eventos.png",
                formatarData(evento)
            )
        );

        const link = elemento("a", "ga-btn-agenda", "Ver detalhes");
        link.href = `evento.html?id=${encodeURIComponent(evento.idEvento)}`;

        info.appendChild(link);
        destaque.append(visual, info);
    }

    try {
        const resposta = await fetch(`${API_BASE}/agendamentos/ativos`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (resposta.status === 401) {
            localStorage.removeItem("gaia_token");
            localStorage.removeItem("gaia_usuario");

            mensagem.textContent =
                "Sua sessão expirou. Entre novamente na sua conta.";

            return;
        }

        if (resposta.status === 403) {
            mensagem.textContent =
                "Somente visitantes podem consultar esta agenda.";

            return;
        }

        if (!resposta.ok) {
            throw new Error(`A API respondeu com status ${resposta.status}.`);
        }

        const agendamentos = await resposta.json();

        if (!Array.isArray(agendamentos)) {
            throw new Error("A API não retornou uma lista de agendamentos.");
        }

        // Adapta e ordena os eventos do visitante.
        const eventos = agendamentos
            .map(adaptarEvento)
            .sort((a, b) => {
                const dataA = dataHoraEvento(a);
                const dataB = dataHoraEvento(b);

                if (!dataA && !dataB) return 0;
                if (!dataA) return 1;
                if (!dataB) return -1;

                return dataA.getTime() - dataB.getTime();
            });

        // Separa eventos futuros e anteriores usando data e hora.
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
            // O evento futuro mais próximo sempre ganha o destaque.
            mostrarDestaque(proximos[0]);

            // Os demais ficam na lista com scroll.
            proximos.slice(1).forEach(evento => {
                listaProximos.appendChild(criarCard(evento));
            });
        } else {
            destaque.replaceChildren(
                elemento(
                    "div",
                    "ga-info-proximo",
                    "Você não possui próximos eventos agendados."
                )
            );
        }

        anteriores.forEach(evento => {
            listaAnteriores.appendChild(criarCard(evento));
        });

        if (tituloAnteriores) {
            tituloAnteriores.hidden = anteriores.length === 0;
        }

        if (tituloProximos) {
            tituloProximos.hidden = proximos.length <= 1;
        }

        mensagem.textContent = eventos.length
            ? ""
            : "Você ainda não possui agendamentos.";

    } catch (erro) {
        console.error("Não foi possível carregar a agenda:", erro);

        destaque.replaceChildren(
            elemento(
                "div",
                "ga-info-proximo",
                "Não foi possível carregar sua agenda. Tente novamente mais tarde."
            )
        );

        mensagem.textContent = "";
    }
});