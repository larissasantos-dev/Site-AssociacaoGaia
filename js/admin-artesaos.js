/**
 * ----- LANA -----
 * Painel administrativo — aba "Artesãos".
 *
 *   GET    /api/admin/artesaos                 -> lista todos os artesãos (ativos e inativos)
 *   GET    /api/admin/artesaos/{id}/trabalhos  -> trabalhos de um artesão
 *   DELETE /api/admin/trabalhos/{id}           -> remove um trabalho (moderação)
 *   PATCH  /api/usuarios/{idUsuario}/status    -> ativa/inativa a conta ({"ativo": true|false})
 *
 * Não interfere no admin.js, eventos-admin.js nem admin-solicitacoes.js.
 * Depende de js/config.js (API_BASE). A segurança é do back-end (só ADMINISTRADOR).
 */
(() => {
    const secao = document.getElementById('adm-secao-artesaos');
    if (!secao) return;

    const token = localStorage.getItem('gaia_token');
    if (!token) return;

    const corpo = document.getElementById('ln-adm-art-corpo');
    const vazio = document.getElementById('ln-adm-art-vazio');
    const contador = document.getElementById('ln-adm-art-contador');
    const erro = document.getElementById('ln-adm-art-erro');
    const busca = document.getElementById('ln-adm-art-busca');

    const dlgTrabalhos = document.getElementById('ln-adm-art-dialog');
    const dlgTitulo = document.getElementById('ln-adm-art-dialog-titulo');
    const dlgVazio = document.getElementById('ln-adm-art-dialog-vazio');
    const dlgLista = document.getElementById('ln-adm-art-trabalhos');
    const dlgErro = document.getElementById('ln-adm-art-dialog-erro');
    const dlgFechar = document.getElementById('ln-adm-art-dialog-fechar');

    const dlgConfirmar = document.getElementById('ln-adm-art-confirmar');
    const confirmarTitulo = document.getElementById('ln-adm-art-confirmar-titulo');
    const confirmarTexto = document.getElementById('ln-adm-art-confirmar-texto');
    const confirmarOk = document.getElementById('ln-adm-art-confirmar-ok');
    const confirmarCancelar = document.getElementById('ln-adm-art-confirmar-cancelar');

    let artesaos = [];
    let artesaoAberto = null;      // artesão cujo diálogo de trabalhos está aberto
    let acaoConfirmada = null;     // função executada ao confirmar

    const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatarPreco = (v) => (v === null || v === undefined ? 'Sob consulta' : formatadorMoeda.format(v));

    function mostrarErro(el, texto) {
        el.textContent = texto;
        el.hidden = false;
    }
    function esconderErro(el) {
        el.textContent = '';
        el.hidden = true;
    }

    async function chamar(url, { method = 'GET', json } = {}) {
        const headers = { 'Authorization': `Bearer ${token}` };
        if (json !== undefined) headers['Content-Type'] = 'application/json';

        let resposta;
        try {
            resposta = await fetch(url, { method, headers, body: json !== undefined ? JSON.stringify(json) : undefined });
        } catch (e) {
            throw new Error('Não foi possível falar com o servidor.');
        }
        if (resposta.status === 401) {
            localStorage.removeItem('gaia_token');
            localStorage.removeItem('gaia_usuario');
            window.location.href = 'login.html';
            throw new Error('Sessão expirada.');
        }
        if (resposta.status === 403) throw new Error('Você não tem permissão para esta ação.');
        if (!resposta.ok) {
            const texto = await resposta.text();
            throw new Error(texto && texto.length < 200 ? texto : 'Não foi possível concluir a ação.');
        }
        return resposta.status === 204 ? null : resposta.json();
    }

    // ---------- Lista de artesãos ----------
    function celula(texto) {
        const td = document.createElement('td');
        td.textContent = texto;
        return td;
    }

    function criarLinha(a) {
        const tr = document.createElement('tr');

        const tdNome = document.createElement('td');
        const forte = document.createElement('strong');
        forte.textContent = a.nomeExibicao;
        tdNome.appendChild(forte);
        if (a.tituloCurto) {
            const sub = document.createElement('div');
            sub.className = 'ln-adm-dica';
            sub.textContent = a.tituloCurto;
            tdNome.appendChild(sub);
        }
        tr.appendChild(tdNome);

        tr.appendChild(celula(a.cidade || '—'));
        tr.appendChild(celula(a.email || '—'));
        tr.appendChild(celula(String(a.totalTrabalhos)));

        const tdStatus = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `adm-status ${a.ativo ? 'adm-status--ativo' : 'adm-status--inativo'}`;
        badge.textContent = a.ativo ? 'Ativo' : 'Inativo';
        tdStatus.appendChild(badge);
        tr.appendChild(tdStatus);

        const tdAcoes = document.createElement('td');
        tdAcoes.className = 'ln-adm-acoes-linha';

        const btnTrabalhos = document.createElement('button');
        btnTrabalhos.type = 'button';
        btnTrabalhos.className = 'ln-adm-btn';
        btnTrabalhos.textContent = 'Ver trabalhos';
        btnTrabalhos.setAttribute('aria-label', `Ver os trabalhos de ${a.nomeExibicao}`);
        btnTrabalhos.addEventListener('click', () => abrirTrabalhos(a));

        const btnStatus = document.createElement('button');
        btnStatus.type = 'button';
        btnStatus.className = `adm-btn-status ${a.ativo ? 'adm-btn-status--desativar' : 'adm-btn-status--ativar'}`;
        btnStatus.textContent = a.ativo ? 'Inativar' : 'Ativar';
        btnStatus.setAttribute('aria-label', `${a.ativo ? 'Inativar' : 'Ativar'} a conta de ${a.nomeExibicao}`);
        btnStatus.addEventListener('click', () => pedirAlterarStatus(a));

        tdAcoes.append(btnTrabalhos, btnStatus);
        tr.appendChild(tdAcoes);
        return tr;
    }

    function normalizar(texto) {
        return (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function renderizar() {
        const termo = normalizar(busca.value.trim());
        const filtrados = artesaos.filter((a) =>
            !termo || [a.nomeExibicao, a.cidade, a.email].some((c) => normalizar(c).includes(termo)));

        corpo.replaceChildren(...filtrados.map(criarLinha));
        vazio.hidden = filtrados.length > 0;
        contador.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'artesão' : 'artesãos'}`;
    }

    async function carregar() {
        esconderErro(erro);
        try {
            artesaos = await chamar(`${API_BASE}/api/admin/artesaos`);
            renderizar();
        } catch (e) {
            mostrarErro(erro, e.message);
        }
    }

    busca.addEventListener('input', renderizar);

    // ---------- Confirmação genérica ----------
    function pedirConfirmacao({ titulo, texto, botao, aoConfirmar }) {
        confirmarTitulo.textContent = titulo;
        confirmarTexto.textContent = texto;
        confirmarOk.textContent = botao;
        acaoConfirmada = aoConfirmar;
        dlgConfirmar.showModal();
    }

    confirmarCancelar.addEventListener('click', () => { acaoConfirmada = null; dlgConfirmar.close(); });
    dlgConfirmar.addEventListener('close', () => { acaoConfirmada = null; });

    confirmarOk.addEventListener('click', async () => {
        const acao = acaoConfirmada;
        if (!acao) return;
        confirmarOk.disabled = true;
        try {
            await acao();
        } finally {
            confirmarOk.disabled = false;
            dlgConfirmar.close();
        }
    });

    // ---------- Ativar / inativar conta ----------
    function pedirAlterarStatus(a) {
        const inativando = a.ativo;
        pedirConfirmacao({
            titulo: inativando ? 'Inativar artesão?' : 'Ativar artesão?',
            texto: inativando
                ? `${a.nomeExibicao} não conseguirá entrar no site e o perfil sairá do catálogo público.`
                : `${a.nomeExibicao} poderá entrar no site e o perfil voltará ao catálogo público.`,
            botao: inativando ? 'Inativar' : 'Ativar',
            aoConfirmar: async () => {
                esconderErro(erro);
                try {
                    await chamar(`${API_BASE}/api/usuarios/${a.idUsuario}/status`, {
                        method: 'PATCH',
                        json: { ativo: !a.ativo }
                    });
                    await carregar();
                } catch (e) {
                    mostrarErro(erro, e.message);
                }
            }
        });
    }

    // ---------- Trabalhos do artesão (moderação) ----------
    async function carregarTrabalhos() {
        esconderErro(dlgErro);
        try {
            const trabalhos = await chamar(`${API_BASE}/api/admin/artesaos/${artesaoAberto.idArtesao}/trabalhos`);
            dlgVazio.hidden = trabalhos.length > 0;
            dlgLista.replaceChildren(...trabalhos.map(criarItemTrabalho));
        } catch (e) {
            mostrarErro(dlgErro, e.message);
        }
    }

    function criarItemTrabalho(t) {
        const li = document.createElement('li');
        li.className = 'ln-adm-trabalho';

        const img = document.createElement('img');
        img.alt = '';
        if (/^https?:\/\//i.test(t.imagemUrl || '')) img.src = t.imagemUrl;
        img.loading = 'lazy';

        const info = document.createElement('div');
        const titulo = document.createElement('strong');
        titulo.textContent = t.legenda;
        const preco = document.createElement('div');
        preco.className = 'ln-adm-dica';
        preco.textContent = `${t.categoria ? t.categoria + ' · ' : ''}${formatarPreco(t.preco)}`;
        info.append(titulo, preco);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ln-adm-btn ln-adm-btn--perigo';
        btn.textContent = 'Excluir';
        btn.setAttribute('aria-label', `Excluir o trabalho ${t.legenda}`);
        btn.addEventListener('click', () => {
            pedirConfirmacao({
                titulo: 'Excluir trabalho?',
                texto: `"${t.legenda}" será removido do perfil de ${artesaoAberto.nomeExibicao}. Esta ação não pode ser desfeita.`,
                botao: 'Excluir',
                aoConfirmar: async () => {
                    try {
                        await chamar(`${API_BASE}/api/admin/trabalhos/${t.idTrabalho}`, { method: 'DELETE' });
                        await carregarTrabalhos();
                        await carregar();
                    } catch (e) {
                        mostrarErro(dlgErro, e.message);
                    }
                }
            });
        });

        li.append(img, info, btn);
        return li;
    }

    async function abrirTrabalhos(a) {
        artesaoAberto = a;
        dlgTitulo.textContent = `Trabalhos de ${a.nomeExibicao}`;
        dlgLista.replaceChildren();
        dlgVazio.hidden = true;
        dlgTrabalhos.showModal();
        await carregarTrabalhos();
    }

    dlgFechar.addEventListener('click', () => dlgTrabalhos.close());

    carregar();
})();
