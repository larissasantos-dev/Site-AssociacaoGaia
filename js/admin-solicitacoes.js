
/**
 * Painel administrativo — Solicitações de artesãos.
 *
 * Responsabilidades:
 * - Listar solicitações pendentes.
 * - Abrir modal de detalhes.
 * - Confirmar aprovação em modal próprio.
 * - Rejeitar com motivo obrigatório em modal próprio.
 *
 * Não interfere no admin.js nem no eventos-admin.js.
 */
(() => {
    const secao = document.getElementById('adm-secao-alertas');
    if (!secao) return;

    const token = localStorage.getItem('gaia_token');
    if (!token) return;

    const ENDPOINT = `${API_BASE}/api/admin/solicitacoes-artesao`;

    const corpo = document.getElementById('adm-corpo-solicitacoes');
    const vazio = document.getElementById('adm-solicitacoes-vazia');
    const contador = document.getElementById('adm-contador-solicitacoes');
    const erro = document.getElementById('adm-erro-solicitacoes');

    // Modal único
    const dialogo = document.getElementById('adm-dialog-solicitacao');
    const modalTitulo = document.getElementById('adm-modal-titulo');
    const modalDescricao = document.getElementById('adm-modal-descricao');
    const modalDetalhes = document.getElementById('adm-modal-detalhes');
    const modalRejeicao = document.getElementById('adm-modal-rejeicao');
    const btnModalCancelar = document.getElementById('adm-modal-cancelar');
    const btnModalConfirmar = document.getElementById('adm-modal-confirmar');

    // Campos de detalhes
    const detalheNome = document.getElementById('adm-detalhe-nome');
    const detalheTitulo = document.getElementById('adm-detalhe-titulo');
    const detalheCidade = document.getElementById('adm-detalhe-cidade');
    const detalheJustificativa = document.getElementById('adm-detalhe-justificativa');
    const detalheBiografia = document.getElementById('adm-detalhe-biografia');
    const detalheInstagram = document.getElementById('adm-detalhe-instagram');
    const detalheWhatsapp = document.getElementById('adm-detalhe-whatsapp');

    // Rejeição
    const campoMotivo = document.getElementById('adm-rejeicao-motivo');
    const erroMotivo = document.getElementById('adm-rejeicao-erro');

    let solicitacaoAtual = null;
    let acaoAtual = null;
    let processando = false;

    // --------------------------------------------------
    // AUXILIARES
    // --------------------------------------------------

    function cabecalhos(comCorpo) {
        const headers = {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        };

        if (comCorpo) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    function el(tag, texto, classe) {
        const elemento = document.createElement(tag);

        if (texto != null) {
            elemento.textContent = texto;
        }

        if (classe) {
            elemento.className = classe;
        }

        return elemento;
    }

    function texto(valor) {
        return valor == null || valor === '' ? 'Não informado' : String(valor);
    }

    function formatarData(iso) {
        if (!iso) return 'Não informado';

        const data = new Date(iso);

        if (Number.isNaN(data.getTime())) {
            return 'Não informado';
        }

        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function mostrarErro(mensagem) {
        erro.textContent = mensagem;
        erro.hidden = false;
    }

    function esconderErro() {
        erro.textContent = '';
        erro.hidden = true;
    }

    function mostrarErroMotivo(mensagem) {
        erroMotivo.textContent = mensagem;
        erroMotivo.hidden = false;
    }

    function limparErroMotivo() {
        erroMotivo.textContent = '';
        erroMotivo.hidden = true;
    }

    // --------------------------------------------------
    // MODAL
    // --------------------------------------------------

    function abrirModal(titulo, descricao, acao, solicitacao) {
        solicitacaoAtual = solicitacao;
        acaoAtual = acao;
        processando = false;

        modalTitulo.textContent = titulo;
        modalDescricao.textContent = descricao;

        modalDetalhes.hidden = true;
        modalRejeicao.hidden = true;

        btnModalConfirmar.hidden = !acao;
        btnModalConfirmar.disabled = false;

        btnModalCancelar.textContent = 'Cancelar';
        btnModalConfirmar.textContent = 'Confirmar';

        limparErroMotivo();

        dialogo.showModal();
    }

    function fecharModal() {
        if (dialogo.open) {
            dialogo.close();
        }

        solicitacaoAtual = null;
        acaoAtual = null;
        processando = false;
    }

    btnModalCancelar.addEventListener('click', fecharModal);

    // Impede fechamento acidental durante uma requisição.
    dialogo.addEventListener('cancel', (evento) => {
        if (processando) {
            evento.preventDefault();
        }
    });

    // --------------------------------------------------
    // LISTAGEM
    // --------------------------------------------------

    async function carregar() {
        esconderErro();

        try {
            const resposta = await fetch(`${ENDPOINT}?status=PENDENTE`, {
                headers: cabecalhos(false)
            });

            if (resposta.status === 401 || resposta.status === 403) {
                mostrarErro(
                    'Sua sessão não permite ver as solicitações. Entre novamente como administrador.'
                );
                return;
            }

            if (!resposta.ok) {
                mostrarErro('Não foi possível carregar as solicitações.');
                return;
            }

            const lista = await resposta.json();

            if (!Array.isArray(lista)) {
                mostrarErro('O servidor retornou uma lista inválida.');
                return;
            }

            renderizar(lista);

        } catch (erroRede) {
            console.error('[Solicitações] Erro ao carregar:', erroRede);
            mostrarErro('Não foi possível conectar ao servidor.');
        }
    }

    function renderizar(lista) {
        corpo.replaceChildren();

        vazio.hidden = lista.length > 0;

        contador.textContent = lista.length === 1
            ? '1 pendente'
            : `${lista.length} pendentes`;

        lista.forEach((solicitacao) => {
            corpo.appendChild(criarLinha(solicitacao));
        });
    }

    function criarLinha(s) {
        const linha = document.createElement('tr');

        // Solicitante
        const tdSolicitante = document.createElement('td');

        tdSolicitante.append(
            el('strong', texto(s.nomeUsuario)),
            el('div', texto(s.emailUsuario)),
            el('div', texto(s.telefoneUsuario))
        );

        // Perfil solicitado
        const tdPerfil = document.createElement('td');

        tdPerfil.append(
            el('strong', texto(s.nomeExibicao)),
            el('div', `${texto(s.tituloCurto)} · ${texto(s.cidade)}`)
        );

        // Data
        const tdData = el('td', formatarData(s.dataSolicitacao));

        // Detalhes
        const tdDetalhes = document.createElement('td');

        const btnDetalhes = el(
            'button',
            'Ver detalhes',
            'adm-solicitacao-detalhes-btn'
        );

        btnDetalhes.type = 'button';
        btnDetalhes.addEventListener('click', () => abrirDetalhes(s));

        tdDetalhes.appendChild(btnDetalhes);

        // Ações
        const tdAcoes = document.createElement('td');
        const grupo = el('div', null, 'btn-base__grupo');

        const btnAprovar = el(
            'button',
            'Aprovar',
            'adm-btn-status adm-btn-status--ativar'
        );

        btnAprovar.type = 'button';
        btnAprovar.addEventListener('click', () => abrirAprovacao(s));

        const btnRejeitar = el(
            'button',
            'Rejeitar',
            'adm-btn-status adm-btn-status--desativar'
        );

        btnRejeitar.type = 'button';
        btnRejeitar.addEventListener('click', () => abrirRejeicao(s));

        grupo.append(btnAprovar, btnRejeitar);
        tdAcoes.appendChild(grupo);

        linha.append(
            tdSolicitante,
            tdPerfil,
            tdData,
            tdDetalhes,
            tdAcoes
        );

        return linha;
    }

    // --------------------------------------------------
    // DETALHES
    // --------------------------------------------------

    function abrirDetalhes(s) {
        abrirModal(
            'Detalhes da solicitação',
            `Informações enviadas por ${texto(s.nomeUsuario)}.`,
            null,
            s
        );

        detalheNome.textContent = texto(s.nomeExibicao);
        detalheTitulo.textContent = texto(s.tituloCurto);
        detalheCidade.textContent = texto(s.cidade);
        detalheJustificativa.textContent = texto(s.justificativa);
        detalheBiografia.textContent = texto(s.biografia);
        detalheInstagram.textContent = texto(s.instagram);
        detalheWhatsapp.textContent = texto(s.whatsappUrl);

        modalDetalhes.hidden = false;
        btnModalCancelar.textContent = 'Fechar';
    }

    // --------------------------------------------------
    // APROVAÇÃO
    // --------------------------------------------------

    function abrirAprovacao(s) {
        abrirModal(
            'Aprovar solicitação?',
            `Você está prestes a aprovar ${texto(s.nomeExibicao)} como artesão. Essa ação criará o perfil de artesão e alterará o tipo da conta de ${texto(s.nomeUsuario)}.`,
            'aprovar',
            s
        );

        btnModalConfirmar.textContent = 'Sim, aprovar';
    }

    // --------------------------------------------------
    // REJEIÇÃO
    // --------------------------------------------------

    function abrirRejeicao(s) {
        abrirModal(
            'Rejeitar solicitação',
            `Informe o motivo da rejeição para ${texto(s.nomeExibicao)}.`,
            'rejeitar',
            s
        );

        modalRejeicao.hidden = false;
        btnModalConfirmar.textContent = 'Confirmar rejeição';

        campoMotivo.value = '';

        setTimeout(() => campoMotivo.focus(), 0);
    }

    // --------------------------------------------------
    // TRATAMENTO DE FALHAS DA API
    // --------------------------------------------------

    async function tratarFalha(resposta) {
        if (resposta.status === 401 || resposta.status === 403) {
            mostrarErro(
                'Sua sessão não permite esta ação. Entre novamente como administrador.'
            );
            return;
        }

        if (resposta.status === 404 || resposta.status === 409) {
            const mensagem = await resposta.text();

            await carregar();

            mostrarErro(
                mensagem || 'Esta solicitação não está mais disponível.'
            );

            return;
        }

        if (resposta.status === 400) {
            const mensagem = await resposta.text();

            mostrarErro(
                mensagem || 'Os dados enviados são inválidos.'
            );

            return;
        }

        mostrarErro('Ocorreu um erro inesperado. Tente novamente em instantes.');
    }

    // --------------------------------------------------
    // CONFIRMAÇÃO DAS AÇÕES
    // --------------------------------------------------

    btnModalConfirmar.addEventListener('click', async () => {
        if (processando || !solicitacaoAtual || !acaoAtual) {
            return;
        }

        const solicitacao = solicitacaoAtual;
        const acao = acaoAtual;

        let motivo = '';

        if (acao === 'rejeitar') {
            motivo = campoMotivo.value.trim();

            if (!motivo) {
                mostrarErroMotivo('Informe o motivo da rejeição.');
                campoMotivo.focus();
                return;
            }

            limparErroMotivo();
        }

        processando = true;
        btnModalConfirmar.disabled = true;
        btnModalCancelar.disabled = true;

        btnModalConfirmar.textContent = acao === 'aprovar'
            ? 'Aprovando...'
            : 'Rejeitando...';

        esconderErro();

        try {
            const resposta = await fetch(
                `${ENDPOINT}/${solicitacao.idSolicitacao}/${acao}`,
                {
                    method: 'PATCH',
                    headers: cabecalhos(acao === 'rejeitar'),
                    ...(acao === 'rejeitar'
                        ? { body: JSON.stringify({ motivo }) }
                        : {})
                }
            );

            if (resposta.ok) {
                fecharModal();
                await carregar();
                return;
            }

            if (acao === 'rejeitar' && resposta.status === 400) {
                mostrarErroMotivo(
                    'Motivo inválido. Use no máximo 500 caracteres.'
                );
                return;
            }

            fecharModal();
            await tratarFalha(resposta);

        } catch (erroRede) {
            console.error(`[Solicitações] Erro ao ${acao}:`, erroRede);

            if (acao === 'rejeitar') {
                mostrarErroMotivo('Não foi possível conectar ao servidor.');
            } else {
                fecharModal();
                mostrarErro('Não foi possível conectar ao servidor.');
            }

        } finally {
            processando = false;

            btnModalConfirmar.disabled = false;
            btnModalCancelar.disabled = false;

            if (acaoAtual === 'rejeitar') {
                btnModalConfirmar.textContent = 'Confirmar rejeição';
            } else if (acaoAtual === 'aprovar') {
                btnModalConfirmar.textContent = 'Sim, aprovar';
            }
        }
    });

    // --------------------------------------------------
    // INICIALIZAÇÃO
    // --------------------------------------------------

    document
        .querySelector('[data-secao="alertas"]')
        ?.addEventListener('click', carregar);

    carregar();
})();
