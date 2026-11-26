/**
 * ----- LANA -----
 * Meus trabalhos (pages/meus-trabalhos.html) — área EXCLUSIVA do artesão.
 *
 * O artesão cria os cards (trabalhos) do próprio perfil, sempre com FOTO enviada
 * do computador/celular, e atualiza os preços quando quiser:
 *   GET    /api/trabalhos/meus                 -> lista
 *   POST   /api/trabalhos          (multipart) -> cria  (imagem, legenda, categoria, descricao, preco)
 *   PUT    /api/trabalhos/{id}     (multipart) -> edita (imagem é opcional: sem ela mantém a foto)
 *   PATCH  /api/trabalhos/{id}/preco  (JSON)   -> atualiza só o preço
 *   GET    /api/trabalhos/{id}/historico-preco -> histórico de preços
 *   DELETE /api/trabalhos/{id}                 -> exclui (204)
 *
 * Depende de js/config.js (API_BASE) carregado antes.
 * A segurança de verdade é do back-end; aqui o controle é só de experiência.
 */
(() => {
    const pagina = document.getElementById('ln-trab-pagina');
    if (!pagina) return;

    // Deve ser igual ao limite configurado na API (gaia.trabalho.limite-por-artesao).
    // Serve só para exibir o contador e desabilitar o botão; quem garante a regra é a API.
    const LIMITE_TRABALHOS = 8;
    const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB (mesmo limite da API)
    const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];

    const ENDPOINT = `${API_BASE}/api/trabalhos`;

    // ---------- Elementos ----------
    const aviso = document.getElementById('ln-trab-aviso');
    const conteudo = document.getElementById('ln-trab-conteudo');
    const contador = document.getElementById('ln-trab-contador');
    const form = document.getElementById('ln-trab-form');
    const formTitulo = document.getElementById('ln-trab-form-titulo');
    const labelImagem = document.getElementById('ln-trab-label-imagem');
    const inImagem = document.getElementById('ln-trab-imagem');
    const inLegenda = document.getElementById('ln-trab-legenda');
    const inCategoria = document.getElementById('ln-trab-categoria');
    const inPreco = document.getElementById('ln-trab-preco');
    const inDescricao = document.getElementById('ln-trab-descricao');
    const preview = document.getElementById('ln-trab-preview');
    const msg = document.getElementById('ln-trab-msg');
    const btnSalvar = document.getElementById('ln-trab-btn-salvar');
    const btnCancelar = document.getElementById('ln-trab-btn-cancelar');
    const lista = document.getElementById('ln-trab-lista');
    const vazio = document.getElementById('ln-trab-vazio');

    const dlgPreco = document.getElementById('ln-trab-dlg-preco');
    const formPreco = document.getElementById('ln-trab-form-preco');
    const dlgPrecoPeca = document.getElementById('ln-trab-dlg-preco-peca');
    const inNovoPreco = document.getElementById('ln-trab-novo-preco');
    const btnSalvarPreco = document.getElementById('ln-trab-btn-salvar-preco');

    const dlgHistorico = document.getElementById('ln-trab-dlg-historico');
    const dlgHistPeca = document.getElementById('ln-trab-dlg-hist-peca');
    const histLista = document.getElementById('ln-trab-hist-lista');
    const histVazio = document.getElementById('ln-trab-hist-vazio');

    const dlgExcluir = document.getElementById('ln-trab-dlg-excluir');
    const dlgExcluirTexto = document.getElementById('ln-trab-dlg-excluir-texto');
    const btnConfirmarExcluir = document.getElementById('ln-trab-btn-confirmar-excluir');

    // ---------- Estado ----------
    let trabalhos = [];
    let idEmEdicao = null;       // null = criando; número = editando esse id
    let trabalhoDoPreco = null;  // trabalho aberto no diálogo de preço
    let trabalhoParaExcluir = null;
    let urlPreviewLocal = null;  // object URL da pré-visualização (precisa ser liberada)

    // ---------- Sessão (salva pelo login.html) ----------
    const token = localStorage.getItem('gaia_token');
    let usuario = null;
    try {
        usuario = JSON.parse(localStorage.getItem('gaia_usuario') || 'null');
    } catch (erro) {
        usuario = null;
    }

    function mostrarAviso(texto, linkHref, linkTexto) {
        aviso.textContent = texto + ' ';
        if (linkHref) {
            const a = document.createElement('a');
            a.href = linkHref;
            a.textContent = linkTexto;
            aviso.appendChild(a);
        }
        aviso.hidden = false;
        conteudo.hidden = true;
    }

    if (!token || !usuario) {
        mostrarAviso('Você precisa entrar na sua conta para gerenciar seus trabalhos.', 'login.html', 'Entrar');
        return;
    }
    if (usuario.tipoUsuario !== 'ARTESAO') {
        mostrarAviso('Esta área é exclusiva para artesãos da Associação Gaia.', 'solicitar-artesao.html', 'Quero ser artesão');
        return;
    }
    conteudo.hidden = false;

    // ---------- Comunicação com a API ----------
    async function lerErro(resposta) {
        // A API devolve texto puro nos erros de negócio e JSON nos erros de validação (400).
        const texto = await resposta.text();
        try {
            const json = JSON.parse(texto);
            if (json.message) return json.message;
            if (json.errors && json.errors.length) return json.errors[0].defaultMessage || json.errors[0].message;
            if (json.detail) return json.detail;
        } catch (e) { /* não era JSON */ }
        if (texto && texto.length < 200) return texto;
        if (resposta.status === 403) return 'Você não tem permissão para esta ação.';
        if (resposta.status === 404) return 'Trabalho não encontrado.';
        if (resposta.status === 413) return 'A imagem é muito grande. Envie um arquivo de até 5 MB.';
        return 'Não foi possível concluir a ação. Tente novamente.';
    }

    /**
     * Faz a requisição autenticada.
     * - corpo JSON  -> passe `json`
     * - corpo multipart -> passe `formData` (NÃO definir Content-Type: o navegador coloca o boundary)
     */
    async function chamar(url, { method = 'GET', json, formData } = {}) {
        const headers = { 'Authorization': `Bearer ${token}` };
        let body;
        if (formData) {
            body = formData;
        } else if (json !== undefined) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(json);
        }

        let resposta;
        try {
            resposta = await fetch(url, { method, headers, body });
        } catch (erro) {
            throw new Error('Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.');
        }

        if (resposta.status === 401) {
            localStorage.removeItem('gaia_token');
            localStorage.removeItem('gaia_usuario');
            mostrarAviso('Sua sessão expirou. Entre novamente.', 'login.html', 'Entrar');
            throw new Error('sessao-expirada');
        }
        if (!resposta.ok) throw new Error(await lerErro(resposta));
        return resposta.status === 204 ? null : resposta.json();
    }

    // ---------- Formatação ----------
    const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    function formatarPreco(valor) {
        return valor === null || valor === undefined ? 'Sob consulta' : formatadorMoeda.format(valor);
    }

    function formatarData(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    /**
     * Converte o texto digitado em número com até 2 casas.
     * Aceita "120", "120,5", "120.50", "1.234,56" e "R$ 99,90".
     * Retorna: ''  -> vazio (sob consulta) | null -> inválido | string "120.50" -> válido.
     */
    function lerPreco(texto) {
        let t = texto.replace(/R\$/gi, '').replace(/\s/g, '');
        if (t === '') return '';
        if (t.includes(',')) {
            t = t.replace(/\./g, '').replace(',', '.');
        }
        if (!/^\d{1,8}(\.\d{1,2})?$/.test(t)) return null;
        return Number(t).toFixed(2);
    }

    // ---------- Mensagens e validação ----------
    function mostrarMensagem(texto, erro = false) {
        msg.textContent = texto;
        msg.classList.toggle('ln-trab-msg--erro', erro);
        msg.hidden = false;
    }
    function limparMensagem() {
        msg.hidden = true;
        msg.textContent = '';
    }
    function setErroCampo(id, texto) {
        document.getElementById(id).textContent = texto;
    }
    function limparErros() {
        ['imagem', 'legenda', 'categoria', 'preco'].forEach((c) => setErroCampo(`ln-trab-erro-${c}`, ''));
    }

    function validar() {
        let ok = true;
        limparErros();

        const arquivo = inImagem.files[0];
        if (!arquivo && idEmEdicao === null) {
            setErroCampo('ln-trab-erro-imagem', 'Escolha uma foto da peça.');
            ok = false;
        } else if (arquivo) {
            if (!TIPOS_IMAGEM.includes(arquivo.type)) {
                setErroCampo('ln-trab-erro-imagem', 'Formato inválido. Envie uma imagem JPG, PNG ou WEBP.');
                ok = false;
            } else if (arquivo.size > TAMANHO_MAX_BYTES) {
                setErroCampo('ln-trab-erro-imagem', 'A imagem é muito grande. Envie um arquivo de até 5 MB.');
                ok = false;
            }
        }

        const legenda = inLegenda.value.trim();
        if (!legenda) { setErroCampo('ln-trab-erro-legenda', 'Informe o nome da peça.'); ok = false; }
        else if (legenda.length > 150) { setErroCampo('ln-trab-erro-legenda', 'O nome deve ter no máximo 150 caracteres.'); ok = false; }

        if (inCategoria.value.trim().length > 100) { setErroCampo('ln-trab-erro-categoria', 'A categoria deve ter no máximo 100 caracteres.'); ok = false; }

        if (lerPreco(inPreco.value) === null) {
            setErroCampo('ln-trab-erro-preco', 'Preço inválido. Use números, por exemplo 120,00.');
            ok = false;
        }
        return ok;
    }

    // ---------- Pré-visualização da foto ----------
    function limparPreview() {
        if (urlPreviewLocal) URL.revokeObjectURL(urlPreviewLocal);
        urlPreviewLocal = null;
        preview.hidden = true;
        preview.removeAttribute('src');
    }

    inImagem.addEventListener('change', () => {
        limparPreview();
        const arquivo = inImagem.files[0];
        if (arquivo && TIPOS_IMAGEM.includes(arquivo.type)) {
            urlPreviewLocal = URL.createObjectURL(arquivo);
            preview.src = urlPreviewLocal;
            preview.hidden = false;
        }
        setErroCampo('ln-trab-erro-imagem', '');
    });

    // ---------- Contador / limite ----------
    function limiteAtingido() {
        return trabalhos.length >= LIMITE_TRABALHOS;
    }

    function atualizarContador() {
        contador.textContent = `${trabalhos.length} de ${LIMITE_TRABALHOS} trabalhos publicados`;
        // Só bloqueia o botão ao CRIAR; editar continua permitido mesmo no limite.
        btnSalvar.disabled = limiteAtingido() && idEmEdicao === null;
    }

    // ---------- Renderização ----------
    function botao(texto, classe, rotulo, aoClicar) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `ln-trab-btn ${classe}`;
        b.textContent = texto;
        b.setAttribute('aria-label', rotulo);
        b.addEventListener('click', aoClicar);
        return b;
    }

    function criarCard(t) {
        const card = document.createElement('article');
        card.className = 'ln-trab-card';

        const img = document.createElement('img');
        img.className = 'ln-trab-card-img';
        img.alt = t.legenda;
        img.loading = 'lazy';
        if (/^https?:\/\//i.test(t.imagemUrl || '')) img.src = t.imagemUrl;
        card.appendChild(img);

        const corpo = document.createElement('div');
        corpo.className = 'ln-trab-card-corpo';

        const titulo = document.createElement('h3');
        titulo.textContent = t.legenda;
        corpo.appendChild(titulo);

        const preco = document.createElement('p');
        preco.className = 'ln-trab-card-preco';
        preco.textContent = formatarPreco(t.preco);
        corpo.appendChild(preco);

        if (t.precoAtualizadoEm) {
            const atualizado = document.createElement('small');
            atualizado.className = 'ln-trab-dica';
            atualizado.textContent = `Preço atualizado em ${formatarData(t.precoAtualizadoEm)}`;
            corpo.appendChild(atualizado);
        }

        if (t.categoria) {
            const cat = document.createElement('span');
            cat.className = 'ln-trab-card-cat';
            cat.textContent = t.categoria;
            corpo.appendChild(cat);
        }
        if (t.descricao) {
            const p = document.createElement('p');
            p.textContent = t.descricao;
            corpo.appendChild(p);
        }

        const acoes = document.createElement('div');
        acoes.className = 'ln-trab-card-acoes';
        acoes.append(
            botao('Editar', 'ln-trab-btn--secundario', `Editar o trabalho ${t.legenda}`, () => iniciarEdicao(t)),
            botao('Preço', 'ln-trab-btn--secundario', `Atualizar o preço de ${t.legenda}`, () => abrirPreco(t)),
            botao('Histórico', 'ln-trab-btn--secundario', `Ver o histórico de preços de ${t.legenda}`, () => abrirHistorico(t)),
            botao('Excluir', 'ln-trab-btn--perigo', `Excluir o trabalho ${t.legenda}`, () => pedirExclusao(t))
        );
        corpo.appendChild(acoes);
        card.appendChild(corpo);
        return card;
    }

    function renderizar() {
        lista.replaceChildren(...trabalhos.map(criarCard));
        vazio.hidden = trabalhos.length > 0;
        atualizarContador();
    }

    // ---------- Ações ----------
    async function carregar() {
        try {
            trabalhos = await chamar(`${ENDPOINT}/meus`);
            renderizar();
        } catch (erro) {
            if (erro.message !== 'sessao-expirada') {
                mostrarMensagem(erro.message || 'Não foi possível carregar seus trabalhos.', true);
            }
        }
    }

    function resetarFormulario() {
        form.reset();
        idEmEdicao = null;
        limparPreview();
        labelImagem.textContent = 'Foto da peça *';
        formTitulo.textContent = 'Adicionar trabalho';
        btnSalvar.textContent = 'Adicionar trabalho';
        btnCancelar.hidden = true;
        limparErros();
    }

    function iniciarEdicao(t) {
        resetarFormulario();
        idEmEdicao = t.idTrabalho;
        inLegenda.value = t.legenda || '';
        inCategoria.value = t.categoria || '';
        inDescricao.value = t.descricao || '';
        inPreco.value = t.preco === null || t.preco === undefined ? '' : String(Number(t.preco).toFixed(2)).replace('.', ',');
        // Mostra a foto atual; escolher outra é opcional.
        if (/^https?:\/\//i.test(t.imagemUrl || '')) {
            preview.src = t.imagemUrl;
            preview.hidden = false;
        }
        labelImagem.textContent = 'Trocar foto (opcional)';
        formTitulo.textContent = 'Editar trabalho';
        btnSalvar.textContent = 'Salvar alterações';
        btnCancelar.hidden = false;
        btnSalvar.disabled = false;
        limparMensagem();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        inLegenda.focus();
    }

    // --- Excluir (diálogo de confirmação: a exclusão não pode ser desfeita) ---
    function pedirExclusao(t) {
        trabalhoParaExcluir = t;
        dlgExcluirTexto.textContent = `Excluir "${t.legenda}"? A foto e o histórico de preços também serão apagados. Esta ação não pode ser desfeita.`;
        dlgExcluir.showModal();
    }

    btnConfirmarExcluir.addEventListener('click', async () => {
        const t = trabalhoParaExcluir;
        if (!t) return;
        btnConfirmarExcluir.disabled = true;
        try {
            await chamar(`${ENDPOINT}/${t.idTrabalho}`, { method: 'DELETE' });
            dlgExcluir.close();
            if (idEmEdicao === t.idTrabalho) resetarFormulario();
            await carregar();
            mostrarMensagem('Trabalho excluído com sucesso.');
        } catch (erro) {
            dlgExcluir.close();
            if (erro.message !== 'sessao-expirada') mostrarMensagem(erro.message, true);
        } finally {
            btnConfirmarExcluir.disabled = false;
            trabalhoParaExcluir = null;
        }
    });

    // --- Atualizar preço ---
    function abrirPreco(t) {
        trabalhoDoPreco = t;
        dlgPrecoPeca.textContent = `${t.legenda} — preço atual: ${formatarPreco(t.preco)}`;
        inNovoPreco.value = t.preco === null || t.preco === undefined ? '' : String(Number(t.preco).toFixed(2)).replace('.', ',');
        setErroCampo('ln-trab-erro-novo-preco', '');
        dlgPreco.showModal();
        inNovoPreco.focus();
        inNovoPreco.select();
    }

    formPreco.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const valor = lerPreco(inNovoPreco.value);
        if (valor === null) {
            setErroCampo('ln-trab-erro-novo-preco', 'Preço inválido. Use números, por exemplo 135,00.');
            return;
        }
        btnSalvarPreco.disabled = true;
        try {
            await chamar(`${ENDPOINT}/${trabalhoDoPreco.idTrabalho}/preco`, {
                method: 'PATCH',
                json: { preco: valor === '' ? null : Number(valor) }
            });
            dlgPreco.close();
            await carregar();
            mostrarMensagem('Preço atualizado com sucesso.');
        } catch (erro) {
            if (erro.message !== 'sessao-expirada') setErroCampo('ln-trab-erro-novo-preco', erro.message);
        } finally {
            btnSalvarPreco.disabled = false;
        }
    });

    // --- Histórico de preços ---
    async function abrirHistorico(t) {
        dlgHistPeca.textContent = t.legenda;
        histLista.replaceChildren();
        histVazio.hidden = true;
        dlgHistorico.showModal();
        try {
            const itens = await chamar(`${ENDPOINT}/${t.idTrabalho}/historico-preco`);
            histVazio.hidden = itens.length > 0;
            histLista.replaceChildren(...itens.map((h) => {
                const li = document.createElement('li');
                li.textContent = `${formatarData(h.dataAlteracao)} — ${formatarPreco(h.precoAnterior)} → ${formatarPreco(h.precoNovo)}`;
                return li;
            }));
        } catch (erro) {
            if (erro.message !== 'sessao-expirada') {
                histVazio.textContent = erro.message;
                histVazio.hidden = false;
            }
        }
    }

    // Botões "Cancelar/Fechar" dos diálogos
    document.querySelectorAll('.ln-trab-dialog [data-fechar]').forEach((b) => {
        b.addEventListener('click', () => b.closest('dialog').close());
    });

    // --- Salvar (criar/editar com foto) ---
    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        limparMensagem();
        if (!validar()) return;

        const dados = new FormData();
        const arquivo = inImagem.files[0];
        if (arquivo) dados.append('imagem', arquivo);
        dados.append('legenda', inLegenda.value.trim());
        if (inCategoria.value.trim()) dados.append('categoria', inCategoria.value.trim());
        if (inDescricao.value.trim()) dados.append('descricao', inDescricao.value.trim());
        const preco = lerPreco(inPreco.value);
        if (preco) dados.append('preco', preco);

        const editando = idEmEdicao !== null;

        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Enviando...';
        try {
            await chamar(editando ? `${ENDPOINT}/${idEmEdicao}` : ENDPOINT, {
                method: editando ? 'PUT' : 'POST',
                formData: dados
            });
            resetarFormulario();
            await carregar();
            mostrarMensagem(editando ? 'Trabalho atualizado com sucesso.' : 'Trabalho adicionado com sucesso.');
        } catch (erro) {
            if (erro.message !== 'sessao-expirada') mostrarMensagem(erro.message, true);
            btnSalvar.textContent = editando ? 'Salvar alterações' : 'Adicionar trabalho';
        } finally {
            atualizarContador();
        }
    });

    btnCancelar.addEventListener('click', () => {
        resetarFormulario();
        limparMensagem();
        atualizarContador();
    });

    carregar();
})();
