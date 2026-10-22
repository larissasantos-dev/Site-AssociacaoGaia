document.addEventListener("DOMContentLoaded", async () => {
    const apiUrl = `${API_BASE}/eventos`;
    const listaProximos = document.getElementById("ga-lista-proximos-eventos");
    const listaAnteriores = document.getElementById("ga-lista-eventos-anteriores");
    const mensagem = document.getElementById("ga-eventos-mensagem");
    const busca = document.getElementById("ga-input-pesquisa-eventos");
    const botoesFiltro = [...document.querySelectorAll(".ga-filtro-evento")];
    let eventos = [];
    let filtroAtual = "todos";

    const hoje = () => {
        const agora = new Date();
        return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    };
    const dataEvento = evento => {
        if (!evento.data) return null;
        const [ano, mes, dia] = String(evento.data).split("-").map(Number);
        return ano && mes && dia ? new Date(ano, mes - 1, dia) : null;
    };
    const formatarData = evento => {
        const data = dataEvento(evento);
        const dataTexto = data ? data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Data a confirmar";
        const hora = evento.hora ? String(evento.hora).slice(0, 5) : "";
        return hora ? `${dataTexto} • ${hora}` : dataTexto;
    };
    const imagemUrl = valor => {
        if (!valor) return "../assets/evento-principal.jpg";
        const url = String(valor).trim();
        if (/^(https?:|data:|\/)/i.test(url) || url.startsWith("../")) return url;
        if (url.startsWith("assets/")) return `../${url}`;
        return `../assets/${url}`;
    };
    const categoria = evento => {
        const texto = `${evento.titulo || ""} ${evento.descricao || ""}`.toLowerCase();
        if (/oficina|curso|aula|workshop/.test(texto)) return "oficina";
        if (/exposi|vitrine|mostra/.test(texto)) return "exposicao";
        if (/palestra|debate|conversa/.test(texto)) return "palestras";
        if (/curso|formação/.test(texto)) return "cursos";
        return "feira";
    };
    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    function criarCard(evento) {
        const card = el("article", "ga-card-eventos card-base");
        card.dataset.categoria = categoria(evento);
        card.dataset.busca = `${evento.titulo || ""} ${evento.local || ""} ${evento.descricao || ""}`.toLocaleLowerCase("pt-BR");
        const visual = el("div", "ga-img-eventos");
        const img = el("img"); img.src = imagemUrl(evento.imagemUrl); img.alt = `Evento ${evento.titulo || ""}`; img.loading = "lazy";
        img.onerror = () => { img.onerror = null; img.src = "../assets/evento-principal.jpg"; };
        visual.appendChild(img);
        const interno = el("div", "ga-interno-eventos");
        interno.appendChild(el("h3", "ga-titulo-card-eventos", evento.titulo || "Evento sem título"));
        const local = el("div", "ga-local-eventos");
        const iconLocal = el("img"); iconLocal.src = "../assets/ponteiro-mapa.png"; iconLocal.alt = "";
        local.append(iconLocal, el("p", "", evento.local || "Local a confirmar"));
        const data = el("div", "ga-data-eventos");
        const iconData = el("img"); iconData.src = "../assets/calendario-eventos.png"; iconData.alt = "";
        data.append(iconData, el("p", "", formatarData(evento)));
        const tags = el("div", "ga-tags-eventos"); tags.appendChild(el("span", "", categoria(evento).replace(/^./, c => c.toUpperCase())));
        const botoes = el("div", "ga-btn-eventos");
        const agendar = el("a", "ga-btn-detalhes", "Agenda"); agendar.href = "agenda.html";
        const detalhes = el("a", "ga-btn-detalhes", "Ver detalhes"); detalhes.href = `evento.html?id=${encodeURIComponent(evento.idEvento)}`;
        botoes.append(agendar, detalhes);
        interno.append(local, data, tags, botoes);
        card.append(visual, interno);
        return card;
    }
    function renderizar() {
        listaProximos.replaceChildren(); listaAnteriores.replaceChildren();
        const termo = (busca?.value || "").trim().toLocaleLowerCase("pt-BR");
        const filtrados = eventos.filter(e => {
            const texto = `${e.titulo || ""} ${e.local || ""} ${e.descricao || ""}`.toLocaleLowerCase("pt-BR");
            return (!termo || texto.includes(termo)) && (filtroAtual === "todos" || categoria(e) === filtroAtual);
        });
        const dataHoje = hoje();
        const proximos = filtrados.filter(e => !dataEvento(e) || dataEvento(e) >= dataHoje);
        const anteriores = filtrados.filter(e => dataEvento(e) && dataEvento(e) < dataHoje);
        proximos.forEach(e => listaProximos.appendChild(criarCard(e)));
        anteriores.forEach(e => listaAnteriores.appendChild(criarCard(e)));
        document.getElementById("ga-titulo-proximos").hidden = proximos.length === 0;
        document.getElementById("ga-titulo-anteriores").hidden = anteriores.length === 0;
        if (!filtrados.length) mensagem.textContent = eventos.length ? "Nenhum evento corresponde à busca ou ao filtro selecionado." : "Nenhum evento cadastrado no momento.";
        else mensagem.textContent = "";
    }
    busca?.addEventListener("input", renderizar);
    botoesFiltro.forEach(botao => botao.addEventListener("click", () => {
        filtroAtual = botao.dataset.filtro || "todos";
        botoesFiltro.forEach(b => { b.classList.toggle("ga-filtro-evento--ativo", b === botao); b.setAttribute("aria-pressed", String(b === botao)); });
        renderizar();
    }));
    const filtroTodos = botoesFiltro.find(b => b.dataset.filtro === "todos");
    if (filtroTodos) { filtroTodos.classList.add("ga-filtro-evento--ativo"); filtroTodos.setAttribute("aria-pressed", "true"); }
    try {
        const resposta = await fetch(apiUrl, { headers: { "Accept": "application/json" } });
        if (!resposta.ok) throw new Error(`A API respondeu com status ${resposta.status}.`);
        const dados = await resposta.json();
        if (!Array.isArray(dados)) throw new Error("A resposta da API não contém uma lista de eventos.");
        eventos = dados.sort((a, b) => {
            const da = dataEvento(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const db = dataEvento(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return da - db;
        });
        mensagem.textContent = "";
        renderizar();
    } catch (erro) {
        console.error("Não foi possível carregar os eventos:", erro);
        mensagem.textContent = "Não foi possível carregar os eventos agora. Tente novamente mais tarde.";
        listaProximos.replaceChildren(); listaAnteriores.replaceChildren();
    }
});
