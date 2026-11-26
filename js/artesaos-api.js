/**
 * ----- LANA -----
 * Artesãos cadastrados pela API (catálogo e perfil público), com os cards (trabalhos) e preços.
 *
 *   GET /api/artesaos/publico                 -> artesãos ativos
 *   GET /api/artesaos/publico/{id}            -> perfil
 *   GET /api/artesaos/publico/{id}/trabalhos  -> cards do artesão (foto, legenda, preço)
 *
 * - pages/artesaos.html: acrescenta ao catálogo estático os artesãos que vêm da API.
 *   Quem já tem card estático (mesmo nome) não é duplicado.
 * - pages/artesao.html?id=<número>: monta o perfil inteiro a partir da API.
 * - pages/artesao.html?id=<slug>: perfil estático (script.js); aqui só acrescentamos os
 *   trabalhos publicados na API por um artesão de mesmo nome, se existir.
 *
 * Se a API estiver fora do ar, o site estático continua funcionando normalmente.
 * Depende de js/config.js (API_BASE).
 */
(() => {
    if (typeof API_BASE === 'undefined') return;

    const ENDPOINT = `${API_BASE}/api/artesaos/publico`;

    const normalizar = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
    const urlSegura = (u) => /^https?:\/\//i.test(u || '');
    const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatarPreco = (v) => (v === null || v === undefined ? 'Sob consulta' : formatadorMoeda.format(v));

    async function buscarJson(url) {
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error(String(resposta.status));
        return resposta.json();
    }

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function iniciais(nome) {
        return (nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
    }

    // Peça do portfólio: foto + legenda + preço
    function criarPeca(t) {
        const peca = el('figure', 'ln-det-peca');
        if (urlSegura(t.imagemUrl)) {
            const img = el('img');
            img.src = t.imagemUrl;
            img.alt = t.legenda;
            img.loading = 'lazy';
            peca.appendChild(img);
        }
        const legenda = el('figcaption', 'ln-det-peca-info');
        legenda.appendChild(el('strong', '', t.legenda));
        if (t.categoria) legenda.appendChild(el('span', 'ln-det-peca-cat', t.categoria));
        legenda.appendChild(el('span', 'ln-det-peca-preco', formatarPreco(t.preco)));
        if (t.descricao) legenda.appendChild(el('p', '', t.descricao));
        peca.appendChild(legenda);
        return peca;
    }

    // ================= CATÁLOGO (artesaos.html) =================
    async function montarCatalogo() {
        const grade = document.getElementById('ln-art-grid');
        if (!grade) return;

        let artesaos;
        try {
            artesaos = await buscarJson(ENDPOINT);
        } catch (e) {
            return; // API fora do ar: fica só o catálogo estático
        }

        const nomesEstaticos = new Set([...grade.querySelectorAll('.ln-art-card')].map((c) => normalizar(c.dataset.name)));
        const novos = artesaos.filter((a) => !nomesEstaticos.has(normalizar(a.nomeExibicao)));

        novos.forEach((a) => {
            const card = el('article', 'ln-art-card card-base');
            card.dataset.api = 'true';
            card.dataset.category = a.tituloCurto || '';
            card.dataset.name = normalizar(a.nomeExibicao);
            card.dataset.city = normalizar(a.cidade);

            const link = el('a', 'ln-art-card-link');
            link.href = `artesao.html?id=${encodeURIComponent(a.idArtesao)}`;
            link.setAttribute('aria-label', `Ver perfil de ${a.nomeExibicao}`);

            const avatar = el('div', 'ln-art-avatar');
            if (urlSegura(a.avatarUrl)) {
                avatar.style.background = `url('${encodeURI(a.avatarUrl)}') center/cover no-repeat`;
            } else {
                avatar.classList.add('ln-art-avatar--inicial');
                avatar.appendChild(el('span', 'ln-art-avatar-inicial', iniciais(a.nomeExibicao)));
            }

            const corpo = el('div', 'ln-art-card-body');
            corpo.appendChild(el('h3', 'ln-art-card-name', a.nomeExibicao));

            if (a.cidade) {
                const cidade = el('p', 'ln-art-card-city');
                const icone = el('i', 'bi bi-geo-alt-fill');
                icone.setAttribute('aria-hidden', 'true');
                cidade.append(icone, ` ${a.cidade}`);
                corpo.appendChild(cidade);
            }

            const tags = el('div', 'ln-art-card-tags');
            if (a.tituloCurto) tags.appendChild(el('span', '', a.tituloCurto));
            if (a.totalTrabalhos > 0) {
                tags.appendChild(el('span', '', `${a.totalTrabalhos} ${a.totalTrabalhos === 1 ? 'peça' : 'peças'}`));
            }
            corpo.appendChild(tags);

            const cta = el('span', 'ln-art-card-cta', 'Ver Perfil ');
            const seta = el('i', 'bi bi-arrow-right');
            seta.setAttribute('aria-hidden', 'true');
            cta.appendChild(seta);
            corpo.appendChild(cta);

            link.append(avatar, corpo);
            card.appendChild(link);
            grade.appendChild(card);
        });

        if (novos.length) ligarFiltros(grade);
    }

    // O filtro do script.js só conhece os cards estáticos; aqui filtramos os cards da API
    // com a mesma regra (aba ativa + busca) e acertamos a mensagem "nenhum artesão".
    function ligarFiltros(grade) {
        const busca = document.getElementById('ln-art-busca');
        const vazio = document.getElementById('ln-art-empty');

        const aplicar = () => {
            const aba = document.querySelector('.ln-art-tab--active');
            const filtro = aba ? aba.dataset.filter : 'todos';
            const termo = normalizar(busca ? busca.value : '');

            grade.querySelectorAll('.ln-art-card[data-api="true"]').forEach((card) => {
                const cat = card.dataset.category || '';
                const okFiltro = filtro === 'todos' || cat === filtro;
                const okBusca = !termo || [card.dataset.name, card.dataset.city, normalizar(cat)].some((c) => c.includes(termo));
                card.classList.toggle('ln-art-card--hidden', !(okFiltro && okBusca));
            });

            if (vazio) {
                const visiveis = grade.querySelectorAll('.ln-art-card:not(.ln-art-card--hidden)').length;
                vazio.hidden = visiveis > 0;
            }
        };

        if (busca) busca.addEventListener('input', aplicar);
        document.querySelectorAll('.ln-art-tab').forEach((tab) => tab.addEventListener('click', aplicar));
        aplicar();
    }

    // ================= PERFIL (artesao.html) =================
    function definir(seletor, texto) {
        const e = document.querySelector(seletor);
        if (e) e.textContent = texto;
        return e;
    }

    function limpar(seletor) {
        const e = document.querySelector(seletor);
        if (e) e.replaceChildren();
        return e;
    }

    function montarPortfolio(trabalhos, substituir) {
        const grade = document.querySelector('.ln-det-portfolio-grid');
        if (!grade) return;
        if (substituir) grade.replaceChildren();

        if (!trabalhos.length && substituir) {
            grade.appendChild(el('p', 'ln-det-peca-vazio', 'Este artesão ainda não publicou peças.'));
            return;
        }
        grade.classList.add('ln-det-portfolio-grid--pecas');
        trabalhos.forEach((t) => grade.appendChild(criarPeca(t)));
    }

    async function montarPerfilDaApi(id) {
        let artesao;
        let trabalhos;
        try {
            [artesao, trabalhos] = await Promise.all([
                buscarJson(`${ENDPOINT}/${id}`),
                buscarJson(`${ENDPOINT}/${id}/trabalhos`)
            ]);
        } catch (e) {
            const main = document.querySelector('.ln-det-page');
            if (main) {
                const aviso = el('p', 'ln-det-peca-vazio', 'Artesão não encontrado. ');
                const voltar = el('a', '', 'Ver todos os artesãos');
                voltar.href = 'artesaos.html';
                aviso.appendChild(voltar);
                main.replaceChildren(aviso);
            }
            return;
        }

        document.title = `${artesao.nomeExibicao} — Artesão | Associação Gaia`;
        definir('.ln-det-label', 'Artesão em Destaque');
        definir('h1', artesao.nomeExibicao);
        definir('.ln-det-lead', artesao.lead || artesao.tituloCurto || '');

        const tagsHero = limpar('.ln-det-tags');
        if (tagsHero) {
            [artesao.tituloCurto, artesao.cidade].filter(Boolean).forEach((t) => tagsHero.appendChild(el('span', '', t)));
        }

        const avatar = document.querySelector('.ln-det-avatar');
        if (avatar && urlSegura(artesao.avatarUrl)) {
            avatar.style.background = `url('${encodeURI(artesao.avatarUrl)}') center/cover no-repeat`;
        }

        const badgeTop = limpar('.ln-det-badge-top');
        if (badgeTop) {
            const i = el('i', 'bi bi-geo-alt-fill');
            const div = el('div');
            div.appendChild(el('strong', '', artesao.cidade || 'Itapetininga, SP'));
            div.appendChild(el('p', '', artesao.locaisAtendimento || ''));
            badgeTop.append(i, div);
        }
        const badgeBottom = limpar('.ln-det-badge-bottom');
        if (badgeBottom) {
            const i = el('i', 'bi bi-patch-check-fill');
            const div = el('div');
            div.appendChild(el('strong', '', 'Perfil Gaia'));
            div.appendChild(el('p', '', artesao.membroDesde ? `Membro desde ${artesao.membroDesde}` : 'Membro da Associação'));
            badgeBottom.append(i, div);
        }

        const header = limpar('.ln-det-profile-header');
        if (header) {
            const div = el('div');
            div.appendChild(el('h2', '', artesao.nomeExibicao));
            div.appendChild(el('p', '', artesao.tituloCurto || ''));
            header.append(el('span', 'ln-det-monogram', iniciais(artesao.nomeExibicao)), div);
        }
        definir('.ln-det-bio', artesao.biografia || '');
        limpar('.ln-det-profile-tags');

        // Contato: só o que foi preenchido
        const redes = limpar('.ln-det-socials');
        if (redes) {
            const botoes = [
                [artesao.instagram && /^https?:\/\//i.test(artesao.instagram) ? artesao.instagram
                    : (artesao.instagram ? `https://instagram.com/${artesao.instagram.replace(/^@/, '')}` : null), 'Instagram', 'bi-instagram'],
                [urlSegura(artesao.facebookUrl) ? artesao.facebookUrl : null, 'Facebook', 'bi-facebook'],
                [urlSegura(artesao.whatsappUrl) ? artesao.whatsappUrl : null, 'WhatsApp', 'bi-whatsapp']
            ];
            botoes.filter(([href]) => href).forEach(([href, nome, icone]) => {
                const a = el('a', 'ln-det-social-btn');
                a.href = href;
                a.target = '_blank';
                a.rel = 'noreferrer noopener';
                a.setAttribute('aria-label', nome);
                a.appendChild(el('i', `bi ${icone}`));
                redes.appendChild(a);
            });
        }
        limpar('.ln-det-contact-list');

        // Sem eventos/trajetória vindos da API: esconde esses blocos
        const evento = document.querySelector('.ln-det-event-card');
        if (evento) evento.hidden = true;
        const traj = document.querySelector('.ln-det-traj-grid');
        if (traj) {
            traj.hidden = true;
            const titulo = traj.previousElementSibling;
            if (titulo) titulo.hidden = true;
        }

        montarPortfolio(trabalhos, true);
    }

    // Perfil estático (slug): acrescenta peças da API se houver um artesão de mesmo nome
    async function complementarPerfilEstatico() {
        const nome = document.querySelector('.ln-det-hero-copy h1');
        if (!nome || !nome.textContent.trim()) return;
        try {
            const lista = await buscarJson(ENDPOINT);
            const alvo = lista.find((a) => normalizar(a.nomeExibicao) === normalizar(nome.textContent));
            if (!alvo || alvo.totalTrabalhos === 0) return;
            const trabalhos = await buscarJson(`${ENDPOINT}/${alvo.idArtesao}/trabalhos`);
            montarPortfolio(trabalhos, false);
        } catch (e) {
            /* API indisponível: mantém o perfil estático */
        }
    }

    // ================= Início =================
    // O script.js monta o perfil estático em DOMContentLoaded; registramos o nosso depois,
    // então ele sempre roda em seguida (os listeners disparam na ordem em que foram criados).
    function iniciar() {
        if (document.getElementById('ln-art-grid')) {
            montarCatalogo();
        } else if (document.querySelector('.ln-det-page')) {
            const id = new URLSearchParams(window.location.search).get('id') || '';
            if (/^\d+$/.test(id)) montarPerfilDaApi(id);
            else complementarPerfilEstatico();
        }
    }

    if (document.readyState === 'complete') {
        iniciar();
    } else {
        document.addEventListener('DOMContentLoaded', iniciar);
    }
})();
