/*
 * Interface inicial de gerenciamento de eventos.
 * Nesta etapa, a imagem é pré-visualizada localmente e o
 * formulário não envia dados para a API nem salva eventos.
 */
document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("adm-form-evento");
    if (!formulario) return;

    const campoImagem = document.getElementById("adm-evento-imagem");
    const previaImagem = document.getElementById("adm-evento-preview");
    const mensagem = document.getElementById("adm-evento-mensagem");
    let urlImagemTemporaria = null;

    function mostrarPreviaImagem(arquivo) {
        if (urlImagemTemporaria) {
            URL.revokeObjectURL(urlImagemTemporaria);
            urlImagemTemporaria = null;
        }

        previaImagem.replaceChildren();

        if (!arquivo) {
            const icone = document.createElement("i");
            icone.className = "bi bi-image";
            icone.setAttribute("aria-hidden", "true");
            const texto = document.createElement("span");
            texto.textContent = "A prévia da imagem aparecerá aqui";
            previaImagem.append(icone, texto);
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            campoImagem.value = "";
            const texto = document.createElement("span");
            texto.textContent = "Selecione um arquivo de imagem válido.";
            previaImagem.appendChild(texto);
            return;
        }

        urlImagemTemporaria = URL.createObjectURL(arquivo);
        const imagem = document.createElement("img");
        imagem.src = urlImagemTemporaria;
        imagem.alt = `Pré-visualização da imagem selecionada: ${arquivo.name}`;
        const nome = document.createElement("span");
        nome.textContent = arquivo.name;
        previaImagem.append(imagem, nome);
    }

    campoImagem.addEventListener("change", () => {
        mostrarPreviaImagem(campoImagem.files[0] || null);
        mensagem.hidden = true;
    });

    formulario.addEventListener("reset", () => {
        mensagem.hidden = true;
        window.setTimeout(() => mostrarPreviaImagem(null), 0);
    });

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        mensagem.textContent =
            "A interface está funcionando. O envio e a gravação dos eventos serão implementados na etapa de integração com a API.";
        mensagem.hidden = false;
    });
});
