/**
 * ----- LANA -----
 * Painel administrativo — aba "Newsletter".
 *
 *   GET    /api/admin/newsletter/inscricoes        -> lista as inscrições
 *   DELETE /api/admin/newsletter/inscricoes/{id}   -> remove uma inscrição
 *
 * Decisão do grupo: as inscrições ficam no nosso banco; a administração copia ou exporta
 * a lista de e-mails ativos e envia as novidades com a ferramenta de e-mail que preferir.
 *
 * Depende de js/config.js (API_BASE). A segurança é do back-end (só ADMINISTRADOR).
 */
(() => {
    const secao = document.getElementById('adm-secao-newsletter');
    if (!secao) return;

    const token = localStorage.getItem('gaia_token');
    if (!token) return;

    const ENDPOINT = `${API_BASE}/api/admin/newsletter/inscricoes`;

    const corpo = document.getElementById('ln-adm-news-corpo');
    const vazio = document.getElementById('ln-adm-news-vazio');
    const contador = document.getElementById('ln-adm-news-contador');
    const erro = document.getElementById('ln-adm-news-erro');
    const aviso = document.getElementById('ln-adm-news-aviso');
    const btnCopiar = document.getElementById('ln-adm-news-copiar');
    const btnExportar = document.getElementById('ln-adm-news-exportar');

    const dlg = document.getElementById('ln-adm-news-confirmar');
    const dlgTexto = document.getElementById('ln-adm-news-confirmar-texto');
    const dlgOk = document.getElementById('ln-adm-news-confirmar-ok');
    const dlgCancelar = document.getElementById('ln-adm-news-confirmar-cancelar');

    let inscricoes = [];
    let paraRemover = null;

    const ativos = () => inscricoes.filter((i) => i.ativo);

    function formatarData(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function mostrarErro(texto) {
        erro.textContent = texto;
        erro.hidden = false;
    }

    function mostrarAviso(texto) {
        aviso.textContent = texto;
        aviso.hidden = false;
    }

    async function chamar(url, method = 'GET') {
        let resposta;
        try {
            resposta = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` } });
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

    function criarLinha(i) {
        const tr = document.createElement('tr');

        const tdEmail = document.createElement('td');
        tdEmail.textContent = i.email;
        tr.appendChild(tdEmail);

        const tdSit = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `adm-status ${i.ativo ? 'adm-status--ativo' : 'adm-status--inativo'}`;
        badge.textContent = i.ativo ? 'Ativa' : 'Cancelada';
        tdSit.appendChild(badge);
        tr.appendChild(tdSit);

        const tdData = document.createElement('td');
        tdData.textContent = formatarData(i.dataInscricao);
        tr.appendChild(tdData);

        const tdAcao = document.createElement('td');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ln-adm-btn ln-adm-btn--perigo';
        btn.textContent = 'Remover';
        btn.setAttribute('aria-label', `Remover a inscrição de ${i.email}`);
        btn.addEventListener('click', () => {
            paraRemover = i;
            dlgTexto.textContent = `A inscrição de ${i.email} será apagada definitivamente.`;
            dlg.showModal();
        });
        tdAcao.appendChild(btn);
        tr.appendChild(tdAcao);
        return tr;
    }

    function renderizar() {
        corpo.replaceChildren(...inscricoes.map(criarLinha));
        vazio.hidden = inscricoes.length > 0;
        const n = ativos().length;
        contador.textContent = `${n} ${n === 1 ? 'inscrito ativo' : 'inscritos ativos'}`;
        btnCopiar.disabled = n === 0;
        btnExportar.disabled = n === 0;
    }

    async function carregar() {
        erro.hidden = true;
        try {
            inscricoes = await chamar(ENDPOINT);
            renderizar();
        } catch (e) {
            mostrarErro(e.message);
        }
    }

    // ---------- Copiar / exportar (somente inscrições ativas) ----------
    btnCopiar.addEventListener('click', async () => {
        const lista = ativos().map((i) => i.email).join('; ');
        try {
            await navigator.clipboard.writeText(lista);
            mostrarAviso(`${ativos().length} e-mails copiados. Cole no campo "Cco" (cópia oculta) do seu e-mail.`);
        } catch (e) {
            mostrarAviso('Não foi possível copiar automaticamente. Use "Exportar CSV".');
        }
    });

    btnExportar.addEventListener('click', () => {
        const linhas = ['email,inscrito_em'];
        ativos().forEach((i) => linhas.push(`${i.email},${i.dataInscricao || ''}`));
        // BOM no início para o Excel abrir com acentuação correta.
        const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'newsletter-inscritos.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        mostrarAviso('Arquivo newsletter-inscritos.csv gerado com os inscritos ativos.');
    });

    // ---------- Remover ----------
    dlgCancelar.addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => { paraRemover = null; });

    dlgOk.addEventListener('click', async () => {
        const alvo = paraRemover;
        if (!alvo) return;
        dlgOk.disabled = true;
        try {
            await chamar(`${ENDPOINT}/${alvo.idInscricao}`, 'DELETE');
            await carregar();
        } catch (e) {
            mostrarErro(e.message);
        } finally {
            dlgOk.disabled = false;
            dlg.close();
        }
    });

    carregar();
})();
