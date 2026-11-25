/**
 * ----- LANA -----
 * Newsletter — seção de inscrição exibida logo acima do rodapé.
 *
 *   POST /api/newsletter/inscricoes            {"email": "..."}  (inscrever, público)
 *   POST /api/newsletter/inscricoes/cancelar   {"email": "..."}  (cancelar, público)
 *
 * A seção é criada aqui, antes de "footer", para não repetir HTML em cada página.
 * Não aparece em páginas de tarefa (login, cadastro, painel etc.).
 * Depende de js/config.js (API_BASE).
 */
(() => {
    const SEM_NEWSLETTER = [
        'login.html', 'cadastro.html', 'solicitar-artesao.html',
        'meus-trabalhos.html', 'painel-administrativo.html'
    ];
    const pagina = location.pathname.split('/').pop();
    const rodape = document.querySelector('footer');
    if (!rodape || typeof API_BASE === 'undefined' || SEM_NEWSLETTER.includes(pagina)) return;

    const secao = document.createElement('section');
    secao.className = 'ln-news-secao';
    secao.setAttribute('aria-labelledby', 'ln-news-titulo');
    secao.innerHTML = `
        <div class="ln-news-topo">
            <span class="ln-news-selo"><span aria-hidden="true">★</span> Newsletter</span>
            <h2 class="ln-news-titulo" id="ln-news-titulo">
                Fique por dentro das
                <span class="ln-news-destaque">nossas novidades</span>
            </h2>
            <p class="ln-news-texto">
                Receba a agenda das feiras, a história dos nossos artesãos e os convites
                das oficinas direto no seu e-mail.
            </p>
        </div>
        <form class="ln-news-form" novalidate>
            <div class="ln-news-painel">
                <label for="ln-news-email" class="ln-news-label" id="ln-news-rotulo">Seu e-mail</label>
                <div class="ln-news-linha">
                    <input type="email" id="ln-news-email" class="ln-news-input" placeholder="@seuemail"
                           autocomplete="email" maxlength="150" aria-describedby="ln-news-msg">
                    <button type="submit" class="ln-news-btn">
                        <span id="ln-news-btn-txt">Inscreva-se</span>
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
                <p class="ln-news-msg" id="ln-news-msg" role="status" aria-live="polite"></p>
                <p class="ln-news-nota" id="ln-news-nota"></p>
            </div>
        </form>
    `;
    rodape.parentNode.insertBefore(secao, rodape);

    const form = secao.querySelector('form');
    const input = secao.querySelector('#ln-news-email');
    const botao = secao.querySelector('.ln-news-btn');
    const textoBotao = secao.querySelector('#ln-news-btn-txt');
    const rotulo = secao.querySelector('#ln-news-rotulo');
    const nota = secao.querySelector('#ln-news-nota');
    const msg = secao.querySelector('#ln-news-msg');

    // "inscrever" (padrão) ou "cancelar": o mesmo formulário atende os dois casos.
    let modo = 'inscrever';

    const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    function mostrar(texto, erro) {
        msg.textContent = texto;
        msg.classList.toggle('ln-news-msg--erro', !!erro);
    }

    function aplicarModo() {
        const cancelar = modo === 'cancelar';
        rotulo.textContent = cancelar ? 'E-mail da inscrição' : 'Seu e-mail';
        textoBotao.textContent = cancelar ? 'Cancelar inscrição' : 'Inscreva-se';
        nota.innerHTML = cancelar
            ? 'Mudou de ideia? <button type="button" class="ln-news-link">Voltar a me inscrever</button>'
            : 'Você pode <button type="button" class="ln-news-link">cancelar a inscrição</button> quando quiser.';
        mostrar('', false);
    }

    nota.addEventListener('click', (evento) => {
        if (!evento.target.closest('.ln-news-link')) return;
        modo = modo === 'inscrever' ? 'cancelar' : 'inscrever';
        aplicarModo();
        input.focus();
    });
    aplicarModo();

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const email = input.value.trim();
        const cancelar = modo === 'cancelar';

        if (!email) { mostrar('Informe seu e-mail.', true); return; }
        if (!emailValido(email) || email.length > 150) { mostrar('Digite um e-mail válido.', true); return; }

        botao.disabled = true;
        mostrar('Enviando...', false);
        try {
            const resposta = await fetch(`${API_BASE}/api/newsletter/inscricoes${cancelar ? '/cancelar' : ''}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (resposta.ok) {
                input.value = '';
                mostrar(cancelar
                    ? 'Inscrição cancelada. Sentiremos sua falta!'
                    : 'Inscrição realizada! Obrigada por acompanhar a Gaia.', false);
            } else if (resposta.status === 400) {
                mostrar('Digite um e-mail válido.', true);
            } else if (resposta.status === 404 && cancelar) {
                mostrar('Não encontramos uma inscrição com esse e-mail.', true);
            } else {
                mostrar('Não foi possível concluir. Tente novamente mais tarde.', true);
            }
        } catch (e) {
            mostrar('Sem conexão com o servidor. Tente novamente mais tarde.', true);
        } finally {
            botao.disabled = false;
        }
    });
})();
