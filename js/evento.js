
document.addEventListener("DOMContentLoaded", async () => {
    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    const titulo = document.getElementById("ga-titulo-evento");
    const local = document.getElementById("ga-local-evento");
    const data = document.getElementById("ga-data-evento");
    const imagem = document.getElementById("ga-img-evento");
    const descricao = document.getElementById("ga-descricao-evento");
    const container = document.querySelector(".ga-evento-hero__card");

    const botaoAgendar = document.getElementById("ga-btn-agendar");
    const avisoAgendamento = document.getElementById("ga-aviso-agendamento");

    const aviso = document.createElement("p");
    aviso.setAttribute("role", "status");
    aviso.setAttribute("aria-live", "polite");

    if (container) {
        container.appendChild(aviso);
    }

    // Controla o texto e a classe visual dos avisos de agendamento.
    const mostrarAvisoAgendamento = (mensagem, classe = "") => {
        if (!avisoAgendamento) return;

        avisoAgendamento.textContent = mensagem;
        avisoAgendamento.className = classe;
    };

    if (!id || !/^\d+$/.test(id)) {
        aviso.textContent = "O endereço não identifica um evento válido.";
        return;
    }

    // Ajusta o caminho das imagens.
    const imagemUrl = valor => {
        if (!valor) return "../assets/evento-principal.jpg";

        const url = String(valor).trim();

        if (/^(https?:|data:|\/)/i.test(url) || url.startsWith("../")) {
            return url;
        }

        if (url.startsWith("assets/")) {
            return `../${url}`;
        }

        return `../assets/${url}`;
    };

    // Cria ícones SVG personalizados.
    const criarIconeInformacao = (tipo) => {
        const svgNS = "http://www.w3.org/2000/svg";

        const svg = document.createElementNS(svgNS, "svg");

        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "1.8");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.setAttribute("aria-hidden", "true");
        svg.classList.add("ga-evento-info__icone");

        if (tipo === "localizacao") {
            svg.innerHTML = `
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>
                <circle cx="12" cy="10" r="2.5"/>
            `;
        }

        if (tipo === "calendario") {
            svg.innerHTML = `
                <rect x="3.5" y="5" width="17" height="16" rx="2"/>
                <path d="M7.5 3v4M16.5 3v4M3.5 10h17"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>
            `;
        }

        return svg;
    };

    // Cria a estrutura visual de cada informação.
    const criarInformacao = (icone, rotulo, valor, horario = null) => {
        const conteudo = document.createElement("span");
        conteudo.className = "ga-evento-meta__conteudo";

        const tituloInfo = document.createElement("span");
        tituloInfo.className = "ga-evento-meta__rotulo";
        tituloInfo.textContent = rotulo;

        const valorInfo = document.createElement("span");
        valorInfo.className = "ga-evento-meta__valor";
        valorInfo.textContent = valor;

        conteudo.append(tituloInfo, valorInfo);

        if (horario) {
            const horarioInfo = document.createElement("span");
            horarioInfo.className = "ga-evento-meta__horario";
            horarioInfo.textContent = horario;

            conteudo.appendChild(horarioInfo);
        }

        const linha = document.createElement("span");
        linha.className = "ga-evento-info__linha";

        linha.append(icone, conteudo);

        return linha;
    };

    const eventoJaPassou = (dataEvento, horaEvento) => {
        if (!dataEvento || !horaEvento) {
            return false;
        }

        const [ano, mes, dia] = dataEvento.split("-").map(Number);
        const [hora, minuto, segundo = 0] = horaEvento.split(":").map(Number);

        const dataHoraEvento = new Date(
            ano,
            mes - 1,
            dia,
            hora,
            minuto,
            segundo
        );

        // Evita considerar dados inválidos como eventos encerrados.
        if (Number.isNaN(dataHoraEvento.getTime())) {
            return false;
        }

        return dataHoraEvento.getTime() < Date.now();
    };

    try {
        const resposta = await fetch(
            `${API_BASE}/eventos/${encodeURIComponent(id)}`,
            {
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (resposta.status === 404) {
            throw new Error("Este evento não foi encontrado.");
        }

        if (!resposta.ok) {
            throw new Error(
                `Não foi possível consultar o evento (status ${resposta.status}).`
            );
        }

        const evento = await resposta.json();

        titulo.textContent = evento.titulo || "Evento sem título";

        // LOCALIZAÇÃO
        const iconeLocal = criarIconeInformacao("localizacao");

        local.replaceChildren(
            criarInformacao(
                iconeLocal,
                "LOCAL",
                evento.local || "Local a confirmar"
            )
        );

        // DATA E HORÁRIO
        const iconeData = criarIconeInformacao("calendario");

        let dataTexto = "Data a confirmar";

        if (evento.data) {
            const [ano, mes, dia] = evento.data.split("-").map(Number);

            dataTexto = new Date(ano, mes - 1, dia).toLocaleDateString(
                "pt-BR",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );
        }

        const horarioTexto = evento.hora
            ? `${String(evento.hora).slice(0, 5)}`
            : null;

        data.replaceChildren(
            criarInformacao(
                iconeData,
                "DATA",
                dataTexto,
                horarioTexto
            )
        );

        // IMAGEM DO EVENTO
        imagem.src = imagemUrl(evento.imagemUrl);
        imagem.alt = `Evento ${evento.titulo || ""}`;

        imagem.onerror = () => {
            imagem.onerror = null;
            imagem.src = "../assets/evento-principal.jpg";
        };

        // DESCRIÇÃO
        descricao.textContent =
            evento.descricao ||
            "Mais informações sobre este evento serão divulgadas em breve.";

        document.title = `${evento.titulo || "Evento"} | Associação Gaia`;
        aviso.textContent = "";

        // VERIFICAÇÃO DE CANCELAMENTO
        if (evento.cancelado) {
            mostrarAvisoAgendamento("Este evento foi cancelado.");
            avisoAgendamento?.classList.add("adm-erro");

            if (botaoAgendar) {
                botaoAgendar.disabled = true;
                botaoAgendar.textContent = "Cancelado";
                botaoAgendar.className =
                    "btn-base__principal adm-status--inativo";
            }

        } else if (eventoJaPassou(evento.data, evento.hora)) {
            mostrarAvisoAgendamento("Este evento já foi encerrado.");
            avisoAgendamento?.classList.add("adm-erro");

            if (botaoAgendar) {
                botaoAgendar.disabled = true;
                botaoAgendar.textContent = "Encerrado";
                botaoAgendar.className =
                    "btn-base__principal adm-status--inativo";
            }

        } else {
            mostrarAvisoAgendamento("");

            if (botaoAgendar) {
                botaoAgendar.disabled = false;
                botaoAgendar.textContent = "Agendar";
                botaoAgendar.className = "btn-base__principal";
            }
        }

    } catch (erro) {
        console.error("Erro ao carregar detalhes do evento:", erro);

        aviso.textContent =
            erro.message || "Não foi possível carregar este evento agora.";

        return;
    }

    // REALIZA O AGENDAMENTO
    if (botaoAgendar) {
        botaoAgendar.addEventListener("click", async () => {
            mostrarAvisoAgendamento("");

            const token = localStorage.getItem("gaia_token");

            let usuarioLogado = null;

            try {
                usuarioLogado = JSON.parse(
                    localStorage.getItem("gaia_usuario") || "null"
                );
            } catch (erro) {
                usuarioLogado = null;
            }

            if (!token || !usuarioLogado) {
                mostrarAvisoAgendamento(
                    "Entre na sua conta para agendar sua participação."
                );
                return;
            }

            const textoOriginal = botaoAgendar.textContent;

            botaoAgendar.disabled = true;
            botaoAgendar.textContent = "Agendando...";

            try {
                const resposta = await fetch(`${API_BASE}/agendamentos`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        idEvento: Number(id)
                    })
                });

                if (resposta.ok) {
                    mostrarAvisoAgendamento(
                        "Sua participação foi agendada com sucesso!",
                        "ga-aviso--sucesso"
                    );

                    botaoAgendar.textContent = "Participação agendada";
                    return;
                }

                let mensagemServidor = "";

                try {
                    const corpo = await resposta.json();

                    mensagemServidor =
                        corpo.detail ||
                        corpo.message ||
                        corpo.mensagem ||
                        "";
                } catch (erro) {
                    // A resposta pode não conter JSON.
                }

                if (resposta.status === 401) {
                    mostrarAvisoAgendamento(
                        "Sua sessão expirou ou é inválida. Entre novamente na sua conta."
                    );

                } else if (resposta.status === 403) {
                    mostrarAvisoAgendamento(
                        "Você não tem permissão para realizar este agendamento."
                    );

                } else if (resposta.status === 409) {
                    mostrarAvisoAgendamento(
                        mensagemServidor ||
                        "Você já possui um agendamento ativo para este evento.",
                        "ga-aviso--existente"
                    );

                } else {
                    mostrarAvisoAgendamento(
                        mensagemServidor ||
                        "Não foi possível realizar o agendamento. Verifique se o evento ainda pode ser agendado."
                    );
                }

                botaoAgendar.disabled = false;
                botaoAgendar.textContent = textoOriginal;

            } catch (erro) {
                console.error("Erro ao realizar agendamento:", erro);

                mostrarAvisoAgendamento(
                    "Não foi possível conectar ao servidor. Tente novamente."
                );

                botaoAgendar.disabled = false;
                botaoAgendar.textContent = textoOriginal;
            }
        });
    }
});
