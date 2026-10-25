document.addEventListener("DOMContentLoaded", async () => {
    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");
    const titulo = document.getElementById("ga-titulo-evento");
    const local = document.getElementById("ga-local-evento");
    const data = document.getElementById("ga-data-evento");
    const imagem = document.getElementById("ga-img-evento");
    const descricao = document.getElementById("ga-descricao-evento");
    const container = document.querySelector(".ga-evento-hero__card");
    const aviso = document.createElement("p"); aviso.setAttribute("role", "status"); aviso.setAttribute("aria-live", "polite");
    if (container) container.appendChild(aviso);

    if (!id || !/^\d+$/.test(id)) {
        aviso.textContent = "O endereço não identifica um evento válido.";
        return;
    }
    const imagemUrl = valor => {
        if (!valor) return "../assets/evento-principal.jpg";
        const url = String(valor).trim();
        if (/^(https?:|data:|\/)/i.test(url) || url.startsWith("../")) return url;
        if (url.startsWith("assets/")) return `../${url}`;
        return `../assets/${url}`;
    };
    try {
        const resposta = await fetch(`${API_BASE}/eventos/${encodeURIComponent(id)}`, { headers: { "Accept": "application/json" } });
        if (resposta.status === 404) throw new Error("Este evento não foi encontrado.");
        if (!resposta.ok) throw new Error(`Não foi possível consultar o evento (status ${resposta.status}).`);

        const evento = await resposta.json();
        titulo.textContent = evento.titulo || "Evento sem título";

        const localImg = document.createElement("img"); localImg.src = "../assets/ponteiro-mapa.png"; localImg.alt = ""; localImg.width = 18; localImg.height = 18;
        local.replaceChildren(localImg, document.createTextNode(` ${evento.local || "Local a confirmar"}`));

        const dataImg = document.createElement("img"); dataImg.src = "../assets/calendario-eventos.png"; dataImg.alt = ""; dataImg.width = 18; dataImg.height = 18;
        
        let dataTexto = "Data a confirmar";
        if (evento.data) {
            const [ano, mes, dia] = evento.data.split("-").map(Number);
            dataTexto = new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
        }
        if (evento.hora) dataTexto += ` • ${String(evento.hora).slice(0, 5)}`;
        data.replaceChildren(dataImg, document.createTextNode(` ${dataTexto}`));
        imagem.src = imagemUrl(evento.imagemUrl); imagem.alt = `Evento ${evento.titulo || ""}`;
        imagem.onerror = () => { imagem.onerror = null; imagem.src = "../assets/evento-principal.jpg"; };
        descricao.textContent = evento.descricao || "Mais informações sobre este evento serão divulgadas em breve.";
        document.title = `${evento.titulo || "Evento"} | Associação Gaia`;
        aviso.textContent = "";
    } catch (erro) {
        console.error("Erro ao carregar detalhes do evento:", erro);
        aviso.textContent = erro.message || "Não foi possível carregar este evento agora.";
    }
});
