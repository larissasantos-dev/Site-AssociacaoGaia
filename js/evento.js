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

    // Verifica se o endereço identifica um evento válido.
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

    // Carrega os detalhes do evento.
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

        const localImg = document.createElement("img");
        localImg.src = "../assets/ponteiro-mapa.png";
        localImg.alt = "";
        localImg.width = 18;
        localImg.height = 18;

        local.replaceChildren(
            localImg,
            document.createTextNode(` ${evento.local || "Local a confirmar"}`)
        );

        const dataImg = document.createElement("img");
        dataImg.src = "../assets/calendario-eventos.png";
        dataImg.alt = "";
        dataImg.width = 18;
        dataImg.height = 18;

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

        if (evento.hora) {
            dataTexto += ` • ${String(evento.hora).slice(0, 5)}`;
        }

        data.replaceChildren(
            dataImg,
            document.createTextNode(` ${dataTexto}`)
        );

        imagem.src = imagemUrl(evento.imagemUrl);
        imagem.alt = `Evento ${evento.titulo || ""}`;

        imagem.onerror = () => {
            imagem.onerror = null;
            imagem.src = "../assets/evento-principal.jpg";
        };

        descricao.textContent =
            evento.descricao ||
            "Mais informações sobre este evento serão divulgadas em breve.";

        document.title = `${evento.titulo || "Evento"} | Associação Gaia`;
        aviso.textContent = "";

        // Só habilita o botão depois de carregar o evento.
        if (botaoAgendar) {
            botaoAgendar.disabled = false;
        }

    } catch (erro) {
        console.error("Erro ao carregar detalhes do evento:", erro);
        aviso.textContent =
            erro.message || "Não foi possível carregar este evento agora.";

        return;
    }

    // Realiza o agendamento do visitante.
    if (botaoAgendar) {
        botaoAgendar.addEventListener("click", async () => {
            if (avisoAgendamento) {
                avisoAgendamento.textContent = "";
            }

            const token = localStorage.getItem("gaia_token");

            let usuarioLogado = null;

            try {
                usuarioLogado = JSON.parse(
                    localStorage.getItem("gaia_usuario") || "null"
                );
            } catch (erro) {
                usuarioLogado = null;
            }

            // Exige uma sessão válida no frontend.
            if (!token || !usuarioLogado) {
                if (avisoAgendamento) {
                    avisoAgendamento.textContent =
                        "Entre na sua conta para agendar sua participação.";
                }
                return;
            }

            // Somente visitantes podem realizar agendamentos.
            if (usuarioLogado.tipoUsuario !== "VISITANTE") {
                if (avisoAgendamento) {
                    avisoAgendamento.textContent =
                        "Somente usuários visitantes podem agendar participação.";
                }
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
                    if (avisoAgendamento) {
                        avisoAgendamento.textContent =
                            "Sua participação foi agendada com sucesso!";
                    }

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
                    if (avisoAgendamento) {
                        avisoAgendamento.textContent =
                            "Sua sessão expirou ou é inválida. Entre novamente na sua conta.";
                    }
                } else if (resposta.status === 403) {
                    if (avisoAgendamento) {
                        avisoAgendamento.textContent =
                            "Você não tem permissão para realizar este agendamento.";
                    }
                } else if (resposta.status === 409) {
                    if (avisoAgendamento) {
                        avisoAgendamento.textContent =
                            mensagemServidor ||
                            "Você já possui um agendamento ativo para este evento.";
                    }
                } else {
                    if (avisoAgendamento) {
                        avisoAgendamento.textContent =
                            mensagemServidor ||
                            "Não foi possível realizar o agendamento. Verifique se o evento ainda pode ser agendado.";
                    }
                }

                botaoAgendar.disabled = false;
                botaoAgendar.textContent = textoOriginal;

            } catch (erro) {
                console.error("Erro ao realizar agendamento:", erro);

                if (avisoAgendamento) {
                    avisoAgendamento.textContent =
                        "Não foi possível conectar ao servidor. Tente novamente.";
                }

                botaoAgendar.disabled = false;
                botaoAgendar.textContent = textoOriginal;
            }
        });
    }
});
