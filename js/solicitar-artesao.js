/**
 * Solicitação de novo artesão (pages/solicitar-artesao.html).
 *
 * Fluxo: confere a sessão (gaia_token / gaia_usuario, salvos pelo login.html)
 * e consulta GET /api/solicitacoes-artesao/minha pra decidir o que mostrar:
 * o formulário, ou uma mensagem (não logado, em análise, rejeitada, aprovada...).
 *
 * Depende de js/config.js (API_BASE) carregado antes.
 * A segurança de verdade é do back-end: aqui o controle é só de experiência.
 */
(() => {
    const ENDPOINT = `${API_BASE}/api/solicitacoes-artesao`;

    const form = document.getElementById('sol-form');
    const btnEnviar = document.getElementById('sol-btn-enviar');
    const mensagem = document.getElementById('sol-mensagem');
    const linkWrap = document.getElementById('sol-link-wrap');
    const link = document.getElementById('sol-link');
    const erroGlobal = document.getElementById('sol-erro-global');

    if (!form) return;

    // Texto de introdução (o mesmo que está no HTML), usado quando só o formulário aparece
    const TEXTO_INTRO = mensagem.textContent.trim();

    // Campos obrigatórios 
    const OBRIGATORIOS = {
        justificativa: 'Conte por que você quer ser artesão da Gaia.',
        nomeExibicao: 'Informe o nome que vai aparecer no seu perfil.',
        tituloCurto: 'Informe um título curto (ex.: Ceramista).',
        cidade: 'Informe a sua cidade.'
    };
    const OPCIONAIS = ['biografia', 'instagram', 'whatsappUrl'];

    // Sessão salva pelo login.html
    const token = localStorage.getItem('gaia_token');
    let usuario = null;
    try {
        usuario = JSON.parse(localStorage.getItem('gaia_usuario') || 'null');
    } catch (erro) {
        usuario = null; // valor corrompido, trata como não logado
    }

    
    function mostrarAviso(texto, linkTexto, linkHref) {
        mensagem.textContent = texto; 
        if (linkTexto) {
            link.textContent = linkTexto;
            link.href = linkHref;
            linkWrap.hidden = false;
        } else {
            linkWrap.hidden = true;
        }
    }

    function mostrarFormulario(texto) {
        mostrarAviso(texto || TEXTO_INTRO);
        form.hidden = false;
    }

    function mostrarErro(span, texto) {
        span.textContent = texto;
        span.hidden = false;
    }

    function limparErros() {
        document.querySelectorAll('#sol-form .la-login-erro').forEach((span) => {
            span.textContent = '';
            span.hidden = true;
        });
    }

    function formatarData(iso) {
        return new Date(iso).toLocaleDateString('pt-BR');
    }

    function sessaoExpirada() {
        localStorage.removeItem('gaia_token');
        localStorage.removeItem('gaia_usuario');
        form.hidden = true;
        mostrarAviso('Sua sessão expirou. Entre novamente para continuar.', 'Entrar', 'login.html');
    }

    // Decide o que mostrar a partir da última solicitação do usuário
    function tratarUltimaSolicitacao(s) {
        if (s.status === 'PENDENTE') {
            mostrarAviso(`Sua solicitação enviada em ${formatarData(s.dataSolicitacao)} está em análise. Volte aqui mais tarde para acompanhar.`);
            return;
        }

        if (s.status === 'APROVADA') {
            mostrarAviso('Sua solicitação foi aprovada! Entre novamente na sua conta para atualizar o seu acesso.', 'Entrar novamente', 'login.html');
            return;
        }

        // REJEITADA
        const motivo = s.motivoRejeicao ? ` Motivo: ${s.motivoRejeicao}` : '';
        const liberaEm = s.podeSolicitarNovamenteEm ? new Date(s.podeSolicitarNovamenteEm) : null;

        if (liberaEm && liberaEm > new Date()) {
            mostrarAviso(`Sua última solicitação foi rejeitada.${motivo} Você poderá solicitar novamente a partir de ${formatarData(s.podeSolicitarNovamenteEm)}.`);
        } else {
            mostrarFormulario(`Sua última solicitação foi rejeitada.${motivo} Você já pode enviar uma nova.`);
        }
    }

    // Ao abrir a página
    async function iniciar() {
        if (!token || !usuario) {
            mostrarAviso('Para solicitar, você precisa estar logado.', 'Entrar ou criar conta', 'login.html');
            return;
        }
        if (usuario.tipoUsuario === 'ARTESAO') {
            mostrarAviso('Você já é artesão da Associação Gaia.', 'Ver artesãos', 'artesaos.html');
            return;
        }
        if (usuario.tipoUsuario === 'ADMINISTRADOR') {
            mostrarAviso('Administradores não precisam solicitar para se tornar artesão.', 'Voltar', 'artesaos.html');
            return;
        }

        try {
            const resposta = await fetch(`${ENDPOINT}/minha`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resposta.status === 401) {
                sessaoExpirada();
            } else if (resposta.status === 204) {
                mostrarFormulario(); 
            } else if (resposta.ok) {
                tratarUltimaSolicitacao(await resposta.json());
            } else {
                throw new Error(`HTTP ${resposta.status}`);
            }
        } catch (erro) {
            mostrarAviso('Não foi possível verificar a sua solicitação. Tente novamente em instantes.');
            console.error('[Solicitação] Erro ao consultar /minha:', erro);
        }
    }

    // Coleta e validação (backend faz a validação de fato)
    function coletarDados() {
        const dados = {};
        Object.keys(OBRIGATORIOS).forEach((campo) => {
            dados[campo] = document.getElementById(`sol-input-${campo}`).value.trim();
        });
        OPCIONAIS.forEach((campo) => {
            const valor = document.getElementById(`sol-input-${campo}`).value.trim();
            dados[campo] = valor === '' ? null : valor;
        });
        return dados;
    }

    function validar(dados) {
        let valido = true;
        Object.keys(OBRIGATORIOS).forEach((campo) => {
            if (!dados[campo]) {
                mostrarErro(document.getElementById(`sol-erro-${campo}`), OBRIGATORIOS[campo]);
                valido = false;
            }
        });
        return valido;
    }

    // Envio
    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        limparErros();

        const dados = coletarDados();
        if (!validar(dados)) return;

        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';

        try {
            const resposta = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dados)
            });

            if (resposta.status === 201) {
                form.hidden = true;
                mostrarAviso('Solicitação enviada! Ela está em análise pela equipe da Associação Gaia.');

            } else if (resposta.status === 401) {
                sessaoExpirada();

            } else if (resposta.status === 409 || resposta.status === 403) {
                // O backend devolve a mensagem como texto simples (GlobalExceptionHandler)
                const texto = await resposta.text();
                mostrarErro(erroGlobal, texto || 'Você não pode enviar uma solicitação agora.');

            } else if (resposta.status === 400) {
                mostrarErro(erroGlobal, 'Verifique os dados informados e tente novamente.');

            } else {
                mostrarErro(erroGlobal, 'Ocorreu um erro inesperado. Tente novamente em instantes.');
            }

        } catch (erro) {
            mostrarErro(erroGlobal, 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
            console.error('[Solicitação] Erro de rede:', erro);

        } finally {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar solicitação';
        }
    });

    iniciar();
})();