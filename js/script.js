document.addEventListener('DOMContentLoaded', () => {

    const mobileBtnMenu = document.getElementById('mobile-header-btn-menu');
    const sidebar = document.getElementById('mobile-header-sidebar');
    const mobileBtnFecharX = document.getElementById('mobile-btnFechar-sidebar');
    const overlay = document.getElementById('mobile-header-overlay');

    if (
    mobileBtnMenu &&
    sidebar &&
    mobileBtnFecharX &&
    overlay
) {

    mobileBtnMenu.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    const fecharMenu = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    mobileBtnFecharX.addEventListener('click', fecharMenu);
    overlay.addEventListener('click', fecharMenu);
}

function criarCarrossel({ idCarrossel, seletorCards, seletorBtnPrev, seletorBtnNext, idDots, intervaloMs }) {
    const carrossel = document.getElementById(idCarrossel);
    if (!carrossel) return;

    const cards = carrossel.querySelectorAll(seletorCards);
    const btnPrev = document.querySelector(seletorBtnPrev);
    const btnNext = document.querySelector(seletorBtnNext);
    const dotsContainer = idDots ? document.getElementById(idDots) : null;

    let cardAtivo = 0;
    let intervalo;

    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        cards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('la-dot');
            dot.setAttribute('aria-label', `Ir para card ${i + 1}`);
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => { irPara(i); reiniciar(); });
            dotsContainer.appendChild(dot);
        });
    }

    function irPara(index) {
        if (index >= cards.length) index = 0;
        if (index < 0) index = cards.length - 1;
        cardAtivo = index;
        carrossel.scrollTo({ left: cards[index].offsetLeft - carrossel.offsetLeft, behavior: 'smooth' });
        if (dotsContainer) {
            dotsContainer.querySelectorAll('.la-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
        }
    }

    function iniciar() { intervalo = setInterval(() => irPara(cardAtivo + 1), intervaloMs || 2500); }
    function reiniciar() { clearInterval(intervalo); iniciar(); }

    iniciar();
    btnNext?.addEventListener('click', () => { clearInterval(intervalo); irPara(cardAtivo + 1); iniciar(); });
    btnPrev?.addEventListener('click', () => { clearInterval(intervalo); irPara(cardAtivo - 1); iniciar(); });
}

// Uso — substitui os dois blocos de carrossel
criarCarrossel({
    idCarrossel: 'la-carrossel',
    seletorCards: '.la-card',
    seletorBtnPrev: '.la-carrossel-btn-prev',
    seletorBtnNext: '.la-carrossel-btn-next',
    idDots: 'la-carrossel-dots',
    intervaloMs: 2500
});

criarCarrossel({
    idCarrossel: 'la-artesaos-carrossel',
    seletorCards: '.la-artesao-card',
    seletorBtnPrev: '.la-artesaos-btn-prev',
    seletorBtnNext: '.la-artesaos-btn-next',
    intervaloMs: 3000
});

const artesoesFilterBtn = document.getElementById('ln-artesoes-filter-btn');
const artesoesFilterMenu = document.getElementById('ln-artesoes-filter-menu');
const artesoesFilterValue = document.getElementById('ln-artesoes-filter-value');
const artesoesFilterWrap = document.querySelector('.ln-artesoes-filter-wrap');

// Formulário de contato: intercepta submit e mostra feedback local
const contactForm = document.getElementById('ln-contact-form');
if (contactForm) {
    const feedback = document.getElementById('ln-contact-feedback');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        // Simular envio — aqui você pode integrar API/serviço real
        if (feedback) {
            feedback.hidden = false;
            feedback.textContent = 'Mensagem enviada — obrigado!';
        }
        contactForm.reset();
        setTimeout(() => {
            if (feedback) feedback.hidden = true;
        }, 4500);
    });
}

if (artesoesFilterBtn && artesoesFilterMenu && artesoesFilterValue) {
    const closeFilterMenu = () => {
        artesoesFilterBtn.classList.remove('is-open');
        artesoesFilterBtn.setAttribute('aria-expanded', 'false');
        artesoesFilterMenu.hidden = true;
    };

    const openFilterMenu = () => {
        artesoesFilterBtn.classList.add('is-open');
        artesoesFilterBtn.setAttribute('aria-expanded', 'true');
        artesoesFilterMenu.hidden = false;
    };

    artesoesFilterBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = artesoesFilterBtn.classList.contains('is-open');
        if (isOpen) {
            closeFilterMenu();
            return;
        }
        openFilterMenu();
    });

    artesoesFilterMenu.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    artesoesFilterMenu.querySelectorAll('.ln-artesoes-filter-option').forEach((option) => {
        option.addEventListener('click', () => {
            const value = option.dataset.filter || option.textContent.trim();
            artesoesFilterValue.textContent = value;
            artesoesFilterMenu.querySelectorAll('.ln-artesoes-filter-option').forEach((item) => {
                item.classList.remove('is-active');
            });
            option.classList.add('is-active');
            closeFilterMenu();
        });
    });

    document.addEventListener('pointerdown', (event) => {
        if (artesoesFilterWrap && !artesoesFilterWrap.contains(event.target)) {
            closeFilterMenu();
        }
    }, true);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeFilterMenu();
        }
    });
}

// ----- LANA — ARTESÕES CATÁLOGO -----
(() => {
    const tabs    = document.querySelectorAll('.ln-art-tab');
    const cards   = document.querySelectorAll('.ln-art-card');
    const search  = document.getElementById('ln-art-busca');
    const empty   = document.getElementById('ln-art-empty');
    if (!tabs.length) return;

    let activeFilter = 'todos';

    const applyFilters = () => {
        const term = search ? search.value.trim().toLowerCase() : '';
        let visible = 0;
        cards.forEach(card => {
            const cat   = card.dataset.category || '';
            const name  = card.dataset.name  || '';
            const city  = card.dataset.city  || '';
            const matchFilter = activeFilter === 'todos' || cat === activeFilter;
            const matchSearch = !term || name.includes(term) || city.includes(term) || cat.includes(term);
            const show = matchFilter && matchSearch;
            card.classList.toggle('ln-art-card--hidden', !show);
            if (show) visible++;
        });
        if (empty) empty.hidden = visible > 0;
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('ln-art-tab--active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('ln-art-tab--active');
            tab.setAttribute('aria-selected', 'true');
            activeFilter = tab.dataset.filter;
            applyFilters();
        });
    });

    if (search) search.addEventListener('input', applyFilters);
})();

    // ─── LANA — ARTESÃO DETALHE (renderização dinâmica) ───
(() => {
  const paginaDetalhe = document.querySelector('.ln-det-page');
  if (!paginaDetalhe) return;

  // ── Banco de dados local (substitua por fetch('/api/artesaos') se tiver backend)
  const artesaos = [
    {
      id: 'christiane-maria',
      nome: 'Christine Maria',
      titulo: 'enxovais de bebê, enxovais de casa, costura criativa e artesanato',
      monograma: 'CM',
      cidade: 'itapetininga, SP',
      membroDesde: 'sempre',
      locaisAtendimento: 'Ateliê e feiras da região',
      bio: 'Meu nome é Christine Maria Tenho meu ateliê há mais de 24 anos! Criart by Christine. Minha arte se destaca com aplicações feitas com patchaplique com bordados à mão! Faço enxovais de bebê, enxovais de casa, costura criativa e artesanato!',
      lead: 'Criart by Christine — Há mais de 24 anos criando peças exclusivas em costura criativa, com patch aplique e bordados feitos à mão.',
      tags: ['Patch Aplique', 'Costura Criativa', 'Artesanato Exclusivo', 'Itapetininga, SP'],
      tagsPerfil: ['Arte em Tecido', 'Presentes Personalizados', 'Peças Exclusivas'],
      avatar: '../assets/Christiane/Cristiane.jpeg',
      contato: {
        email: '',
        telefone: '(15) 99607-9242',
        telHref: '+551599607-9242',
        instagram: '@criartbychristine',
        instagramHref: 'https://www.instagram.com/p/DZnB9EJRO_4/?igsh=MWVjbjQ4a3owbGZyOA==',
        facebookHref: '',
        whatsappHref: '',
      },
      proximoEvento: {
        nome: 'Feira da Serra — 26/03',
        local: 'itapetininga, SP',
        horario: '09h às 17h',
      },
      avatar: '../assets/Christiane/Cristiane.jpeg',

      portfolio: [
        { imagem: '../assets/Christiane/Almofadas térmicas terapêuticas.jpeg', legenda: 'Almofadas térmicas terapêuticas' },
        { imagem: '../assets/Christiane/Panos de prato e toalhas de mão para cozinha.jpeg', legenda: 'Panos de prato e toalhas' },
        { imagem: '../assets/Christiane/Enxovais de bebê .jpeg', legenda: 'Enxovais de bebê' },
        { imagem: '../assets/Christiane/avental junino.jpeg', legenda: 'Avental junino' },
        { imagem: '../assets/Christiane/Toalhas de lavabo.jpeg', legenda: 'Toalhas de lavabo' },
        { imagem: '../assets/Christiane/Enxovais de bebê 2.jpeg', legenda: 'Enxovais de bebê 2' },
        { imagem: '../assets/Christiane/Kits necessaire.jpeg', legenda: 'Kits necessaire' },
],
      trajetoria: [
        { num: '01', titulo: 'Oficinas abertas', descricao: 'Atividades de experimentação para compartilhar técnica e processo criativo com novas gerações.' },
        { num: '02', titulo: 'Encomendas autorais', descricao: 'Peças sob medida com cuidado na forma, no acabamento e no uso cotidiano.' },
        { num: '03', titulo: 'Feiras e mostras', descricao: 'Participação em eventos que conectam o trabalho do ateliê ao público da região.' },
      ],
    },
    // adicione mais artesãos aqui seguindo a mesma estrutura
    {
      id: 'Cris Camargo',
      nome: 'Cris Camargo',
      titulo: 'peças em crochê, com os laços como carro-chefe',
      monograma: 'CC',
      cidade: 'itapetininga, SP',
      membroDesde: 'sempre',
      locaisAtendimento: 'Ateliê Cris Camargo e feiras da região',
      bio: 'Sou Cris Camargo, artesã de Itapetininga. Faço peças em crochê — e meu carro-chefe são os laços, feitos à mão com muito capricho.',
      lead: 'Peças em crochê feitas à mão no Ateliê Cris Camargo — os laços são o carro-chefe.',
      tags: ['Crochê', 'Laços', 'Itapetininga, SP'],
      tagsPerfil: ['Crochê', 'Laços', 'Acessórios'],
      avatar: '../assets/Cris/cris.jpeg',
      contato: {
        email: '',
        telefone: '',
        telHref: '',
        instagram: '@ateliecriscamargo',
        instagramHref: 'https://www.instagram.com/ateliecriscamargo/',
        facebookHref: '',
        whatsappHref: '',
      },
      proximoEvento: {
        nome: 'Feira da Serra — 26/03',
        local: 'itapetininga, SP',
        horario: '09h às 17h',
      },
      portfolio: [
        { imagem: '../assets/Cris/lacinhos.jpeg', legenda: 'Lacinhos' },
        { imagem: '../assets/Cris/lacinhos2.jpeg', legenda: 'Lacinhos' },
        { imagem: '../assets/Cris/lacinhos4.jpeg', legenda: 'Lacinhos' },
        { imagem: '../assets/Cris/lacinho3.jpeg', legenda: 'Lacinho' },
        { imagem: '../assets/Cris/lacinho-copa.jpeg', legenda: 'Lacinho da Copa' },
        { imagem: '../assets/Cris/chaveiros.jpeg', legenda: 'Chaveiros' },
        { imagem: '../assets/Cris/conjunto.jpeg', legenda: 'Conjunto' },
        { imagem: '../assets/Cris/luvas.jpeg', legenda: 'Luvas' },
      ],
      trajetoria: [
        { num: '01', titulo: 'Oficinas abertas', descricao: 'Atividades de experimentação para compartilhar técnica e processo criativo com novas gerações.' },
        { num: '02', titulo: 'Encomendas autorais', descricao: 'Peças sob medida com cuidado na forma, no acabamento e no uso cotidiano.' },
        { num: '03', titulo: 'Feiras e mostras', descricao: 'Participação em eventos que conectam o trabalho ao público da região.' },
      ],
    },
    {
      id: 'Cybele',
      nome: 'Cybele',
      titulo: 'costura criativa, patchwork, quilting e bordado',
      monograma: 'CY',
      cidade: 'itapetininga, SP',
      membroDesde: '2016',
      locaisAtendimento: 'Ateliê e feiras da região',
      bio: 'Sou aposentada e faço artesanato desde 2016. Trabalho com costura criativa, patchwork e quilting, e também faço alguns bordados.',
      lead: 'Costura criativa, patchwork e quilting — peças feitas à mão por quem vive o artesanato com paixão desde 2016.',
      tags: ['Costura Criativa', 'Patchwork', 'Quilting', 'Itapetininga, SP'],
      tagsPerfil: ['Costura Criativa', 'Patchwork', 'Quilting'],
      avatar: '../assets/Cybele/Cybele.jpeg',
      contato: {
        email: '',
        telefone: '(15) 98116-0678',
        telHref: '+5515981160678',
        instagram: '@arte.cybele',
        instagramHref: 'https://www.instagram.com/arte.cybele/',
        facebookHref: '',
        whatsappHref: 'https://wa.me/5515981160678',
      },
      proximoEvento: {
        nome: 'Feira da Serra — 26/03',
        local: 'itapetininga, SP',
        horario: '09h às 17h',
      },
      portfolio: [
        { imagem: '../assets/Cybele/peça1.jpeg', legenda: 'Patchwork 1' },
        { imagem: '../assets/Cybele/peça2.jpeg', legenda: 'Patchwork 2' },
        { imagem: '../assets/Cybele/peça3.jpeg', legenda: 'Patchwork 3' },
        { imagem: '../assets/Cybele/peça4.jpeg', legenda: 'Patchwork 4' },
        { imagem: '../assets/Cybele/peça5.jpeg', legenda: 'Quilting 1' },
        { imagem: '../assets/Cybele/peça6.jpeg', legenda: 'Quilting 2' },
        { imagem: '../assets/Cybele/peça7.jpeg', legenda: 'Quilting 3' },
        { imagem: '../assets/Cybele/p.jpeg', legenda: 'Peça exclusiva' },
      ],
      trajetoria: [
        { num: '01', titulo: 'Oficinas abertas', descricao: 'Atividades de experimentação para compartilhar técnica e processo criativo com novas gerações.' },
        { num: '02', titulo: 'Encomendas autorais', descricao: 'Peças sob medida com cuidado na forma, no acabamento e no uso cotidiano.' },
        { num: '03', titulo: 'Feiras e mostras', descricao: 'Participação em eventos que conectam o trabalho ao público da região.' },
      ],
    },
    {
      id: 'juju-minerva',
      nome: 'Juju Minerva',
      titulo: 'peças artesanais feitas à mão — Minerva Feito à Mão',
      monograma: 'JM',
      cidade: 'itapetininga, SP',
      membroDesde: 'sempre',
      locaisAtendimento: 'Ateliê e feiras da região',
      bio: 'Sou Eridelques Saralegui, conhecida carinhosamente como "Juju". À frente da Minerva Feito à Mão, crio peças artesanais feitas à mão, com carinho e dedicação em cada detalhe.',
      lead: 'Minerva Feito à Mão — peças artesanais feitas à mão pela Juju.',
      tags: ['Artesanato Exclusivo', 'Feito à Mão', 'Itapetininga, SP'],
      tagsPerfil: ['Feito à Mão', 'Mantas', 'Peças Exclusivas'],
      avatar: '../assets/juju-minerva/juju.jpeg',
      contato: {
        email: '',
        telefone: '',
        telHref: '',
        instagram: '@minerva_feitoamao',
        instagramHref: 'https://www.instagram.com/minerva_feitoamao/',
        facebookHref: '',
        whatsappHref: '',
      },
      proximoEvento: {
        nome: 'Feira da Serra — 26/03',
        local: 'itapetininga, SP',
        horario: '09h às 17h',
      },
      portfolio: [
        { imagem: '../assets/juju-minerva/manta1.jpeg', legenda: 'Manta' },
        { imagem: '../assets/juju-minerva/manta2.jpeg', legenda: 'Manta' },
        { imagem: '../assets/juju-minerva/manta3.jpeg', legenda: 'Manta' },
        { imagem: '../assets/juju-minerva/sintetico1.jpeg', legenda: 'Peça em sintético' },
        { imagem: '../assets/juju-minerva/sintetico2.jpeg', legenda: 'Peça em sintético' },
        { imagem: '../assets/juju-minerva/sintetico3.jpeg', legenda: 'Peça em sintético' },
      ],
      trajetoria: [
        { num: '01', titulo: 'Oficinas abertas', descricao: 'Atividades de experimentação para compartilhar técnica e processo criativo com novas gerações.' },
        { num: '02', titulo: 'Encomendas autorais', descricao: 'Peças sob medida com cuidado na forma, no acabamento e no uso cotidiano.' },
        { num: '03', titulo: 'Feiras e mostras', descricao: 'Participação em eventos que conectam o trabalho ao público da região.' },
      ],
    },
    {
      id: 'sandra',
      nome: 'Sandra Almada',
      titulo: 'bonecas artesanais e patchwork',
      monograma: 'SA',
      cidade: 'itapetininga, SP',
      membroDesde: 'sempre',
      locaisAtendimento: 'Ateliê e feiras da região',
      bio: 'Sou a Sandra Almada, artesã em Itapetininga. Sou especialista em bonecas e também professora de patchwork.',
      lead: 'Especialista em bonecas artesanais e professora de patchwork, em Itapetininga.',
      tags: ['Bonecas', 'Patchwork', 'Itapetininga, SP'],
      tagsPerfil: ['Bonecas', 'Patchwork', 'Aulas de Patchwork'],
      avatar: '../assets/Sandra/sandra.jpeg',
      contato: {
        email: '',
        telefone: '',
        telHref: '',
        instagram: '@sandra.almada',
        instagramHref: 'https://www.instagram.com/sandra.almada/',
        facebookHref: '',
        whatsappHref: '',
      },
      proximoEvento: {
        nome: 'Feira da Serra — 26/03',
        local: 'itapetininga, SP',
        horario: '09h às 17h',
      },
      portfolio: [
        { imagem: '../assets/Sandra/boneca1.jpeg', legenda: 'Boneca artesanal' },
        { imagem: '../assets/Sandra/boneca2.jpeg', legenda: 'Boneca artesanal' },
        { imagem: '../assets/Sandra/boneca3.jpeg', legenda: 'Boneca artesanal' },
        { imagem: '../assets/Sandra/boneca4.jpeg', legenda: 'Boneca artesanal' },
        { imagem: '../assets/Sandra/toalha.jpeg', legenda: 'Toalha' },
      ],
      trajetoria: [
        { num: '01', titulo: 'Oficinas abertas', descricao: 'Atividades de experimentação para compartilhar técnica e processo criativo com novas gerações.' },
        { num: '02', titulo: 'Encomendas autorais', descricao: 'Peças sob medida com cuidado na forma, no acabamento e no uso cotidiano.' },
        { num: '03', titulo: 'Feiras e mostras', descricao: 'Participação em eventos que conectam o trabalho ao público da região.' },
      ],
    },
    {
      id: 'sintia',
      nome: 'Sintia Faria',
      titulo: 'peças decorativas e velas artesanais em concreto e pedras resinadas',
      monograma: 'SF',
      cidade: 'itapetininga, SP',
      membroDesde: 'sempre',
      locaisAtendimento: 'Lumiá Decoração Artesanal — Itapetininga, SP',
      bio: 'Sou Sintia Faria, artesã da Lumiá Decoração Artesanal, em Itapetininga/SP. Produzo peças decorativas e velas artesanais religiosas em concreto e pedras resinadas, unindo delicadeza, funcionalidade e design atemporal. Cada peça é feita à mão, com cuidado e atenção aos detalhes, para tornar os ambientes mais acolhedores e especiais.',
      lead: 'Lumiá Decoração Artesanal — peças decorativas e velas religiosas em concreto e pedras resinadas, com delicadeza e design atemporal.',
      tags: ['Decoração', 'Velas Artesanais', 'Itapetininga, SP'],
      tagsPerfil: ['Velas Artesanais', 'Decoração', 'Concreto e Resina'],
      avatar: '../assets/Sintia/sintia.jpeg',
      contato: {
        email: '',
        telefone: '',
        telHref: '',
        instagram: '@lumiadecorart',
        instagramHref: 'https://www.instagram.com/lumiadecorart/',
        facebookHref: '',
        whatsappHref: '',
      },
      proximoEvento: {
        nome: 'Feira da Serra — 26/03',
        local: 'itapetininga, SP',
        horario: '09h às 17h',
      },
      portfolio: [
        { imagem: '../assets/Sintia/velas1.jpeg', legenda: 'Vela artesanal' },
        { imagem: '../assets/Sintia/velas2.jpeg', legenda: 'Vela artesanal' },
        { imagem: '../assets/Sintia/velas3.jpeg', legenda: 'Vela artesanal' },
        { imagem: '../assets/Sintia/velas4.jpeg', legenda: 'Vela artesanal' },
        { imagem: '../assets/Sintia/velas5.jpeg', legenda: 'Vela artesanal' },
        { imagem: '../assets/Sintia/decoração1.jpeg', legenda: 'Decoração' },
        { imagem: '../assets/Sintia/decoração2.jpeg', legenda: 'Decoração' },
        { imagem: '../assets/Sintia/decoração3.jpeg', legenda: 'Decoração' },
        { imagem: '../assets/Sintia/decoração4.jpeg', legenda: 'Decoração' },
      ],
      trajetoria: [
        { num: '01', titulo: 'Oficinas abertas', descricao: 'Atividades de experimentação para compartilhar técnica e processo criativo com novas gerações.' },
        { num: '02', titulo: 'Encomendas autorais', descricao: 'Peças sob medida com cuidado na forma, no acabamento e no uso cotidiano.' },
        { num: '03', titulo: 'Feiras e mostras', descricao: 'Participação em eventos que conectam o trabalho ao público da região.' },
      ],
    },
    {
      id: 'solange',
      nome: 'Solange',
      titulo: 'artesanato exclusivo, peças de decoração e organização',
      monograma: 'SO',
      cidade: 'itapetininga, SP',
      membroDesde: 'sempre',
      locaisAtendimento: 'Ateliê e feiras da região',
      bio: 'Trabalho com peças de decoração e organização, como estantes e itens decorativos. Cada criação une estética e funcionalidade, sempre com acabamento artesanal.',
      lead: 'Decoração, organização e artesanato exclusivo — peças que aliam beleza e funcionalidade para o dia a dia.',
      tags: ['Artesanato Exclusivo', 'Decoração', 'Itapetininga, SP'],
      tagsPerfil: ['Decoração', 'Organização', 'Peças Exclusivas'],
      avatar: '../assets/Solange/solange.jpeg',
      contato: {
        email: 'administrativo@associacaogaia.com',
        telefone: '(11) 9999-9999',
        telHref: '+551199999999',
        instagram: '@associacaogaia',
        instagramHref: 'https://www.instagram.com/associacaogaia/',
        facebookHref: 'https://www.facebook.com/AssociacaoGAIA1',
        whatsappHref: '#',
      },
      proximoEvento: {
        nome: 'Feira da Serra — 26/03',
        local: 'itapetininga, SP',
        horario: '09h às 17h',
      },
      portfolio: [
        { imagem: '../assets/Solange/estante1.jpeg', legenda: 'Estante decorativa' },
        { imagem: '../assets/Solange/estante2.jpeg', legenda: 'Estante decorativa' },
        { imagem: '../assets/Solange/estante3.jpeg', legenda: 'Estante decorativa' },
        { imagem: '../assets/Solange/decoração1.jpeg', legenda: 'Decoração' },
        { imagem: '../assets/Solange/decoração2.jpeg', legenda: 'Decoração' },
        { imagem: '../assets/Solange/decoração3.jpeg', legenda: 'Decoração' },
        { imagem: '../assets/Solange/decoração4.jpeg', legenda: 'Decoração' },
      ],
      trajetoria: [
        { num: '01', titulo: 'Oficinas abertas', descricao: 'Atividades de experimentação para compartilhar técnica e processo criativo com novas gerações.' },
        { num: '02', titulo: 'Encomendas autorais', descricao: 'Peças sob medida com cuidado na forma, no acabamento e no uso cotidiano.' },
        { num: '03', titulo: 'Feiras e mostras', descricao: 'Participação em eventos que conectam o trabalho ao público da região.' },
      ],
    },
  ];

  // ── Pega o ?id= da URL
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  const artesao = artesaos.find(a => a.id === idParam) ?? artesaos[0]; // fallback pro primeiro

  // ── Helpers
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const set = (sel, html, ctx = document) => { const el = qs(sel, ctx); if (el) el.innerHTML = html; };

  // ── Título da aba
  document.title = `${artesao.nome} — Artesã em Destaque | Associação Gaia`;

  // ── Hero
  set('.ln-det-label',  'Artesã em Destaque');
  set('h1',             artesao.nome);
  set('.ln-det-lead',   artesao.lead);

  const tagsHero = qs('.ln-det-tags');
  if (tagsHero) tagsHero.innerHTML = artesao.tags.map(t => `<span>${t}</span>`).join('');

  // Avatar
  const avatar = qs('.ln-det-avatar');
  if (avatar) avatar.style.background = `url('${artesao.avatar}') center/cover no-repeat`;

  // Badges do avatar
  const badgeTop = qs('.ln-det-badge-top');
  if (badgeTop) badgeTop.innerHTML = `
    <i class="bi bi-geo-alt-fill"></i>
    <div><strong>${artesao.cidade}</strong><p>${artesao.locaisAtendimento}</p></div>`;
    
  const badgeBottom = qs('.ln-det-badge-bottom');
  if (badgeBottom) badgeBottom.innerHTML = `
    <i class="bi bi-patch-check-fill"></i>
    <div><strong>Perfil Gaia</strong><p>Membro desde ${artesao.membroDesde}</p></div>`;

  // ── Card de perfil (sidebar)
  const profileHeader = qs('.ln-det-profile-header');
  if (profileHeader) profileHeader.innerHTML = `
    <span class="ln-det-monogram">${artesao.monograma}</span>
    <div><h2>${artesao.nome}</h2><p>${artesao.titulo}</p></div>`;

  set('.ln-det-bio', artesao.bio);

  const tagsPerfil = qs('.ln-det-profile-tags');
  if (tagsPerfil) tagsPerfil.innerHTML = artesao.tagsPerfil.map(t => `<span>${t}</span>`).join('');

  // ── Card de contato (só mostra o que foi preenchido)
  const temValor = v => v && v !== '#';
  const c = artesao.contato;
  const contactList = qs('.ln-det-contact-list');
  if (contactList) {
    const itens = [];
    if (temValor(c.email))     itens.push(`<li><i class="bi bi-envelope-fill"></i><a href="mailto:${c.email}">${c.email}</a></li>`);
    if (temValor(c.telefone))  itens.push(`<li><i class="bi bi-telephone-fill"></i><a href="tel:${c.telHref}">${c.telefone}</a></li>`);
    if (temValor(c.instagram)) itens.push(`<li><i class="bi bi-instagram"></i><a href="${c.instagramHref}" target="_blank" rel="noreferrer">${c.instagram}</a></li>`);
    contactList.innerHTML = itens.join('');
  }

  const socials = qs('.ln-det-socials');
  if (socials) {
    const botoes = [];
    if (temValor(c.instagramHref)) botoes.push(`<a href="${c.instagramHref}" target="_blank" aria-label="Instagram" class="ln-det-social-btn"><i class="bi bi-instagram"></i></a>`);
    if (temValor(c.facebookHref))  botoes.push(`<a href="${c.facebookHref}" target="_blank" aria-label="Facebook" class="ln-det-social-btn"><i class="bi bi-facebook"></i></a>`);
    if (temValor(c.whatsappHref))  botoes.push(`<a href="${c.whatsappHref}" target="_blank" aria-label="WhatsApp" class="ln-det-social-btn"><i class="bi bi-whatsapp"></i></a>`);
    socials.innerHTML = botoes.join('');
  }

  // ── Próximo evento
  const eventList = qs('.ln-det-event-list');
  if (eventList) eventList.innerHTML = `
    <li><i class="bi bi-calendar-event"></i> ${artesao.proximoEvento.nome}</li>
    <li><i class="bi bi-geo-alt-fill"></i> ${artesao.proximoEvento.local}</li>
    <li><i class="bi bi-clock-fill"></i> ${artesao.proximoEvento.horario}</li>`;

  // ── Portfólio
  const portfolioGrid = qs('.ln-det-portfolio-grid');
  if (portfolioGrid) portfolioGrid.innerHTML = artesao.portfolio.map(p => `
    <div class="ln-det-piece" style="background:url('${p.imagem}') center/cover no-repeat">
      <span>${p.legenda}</span>
    </div>`).join('');

  // ── Trajetória
  const trajGrid = qs('.ln-det-traj-grid');
  if (trajGrid) trajGrid.innerHTML = artesao.trajetoria.map(t => `
    <div class="ln-det-traj-card">
      <span class="ln-det-traj-num">${t.num}</span>
      <div><h3>${t.titulo}</h3><p>${t.descricao}</p></div>
    </div>`).join('');
})();

// ----- SARA -----
// FILTRO DE PROJETOS / CURSOS / PALESTRAS (escopo por .sa-section)
document.querySelectorAll('.sa-section').forEach(section => {
    const filterBtns = section.querySelectorAll('.sa-filter-btn');
    const cards      = section.querySelectorAll('.sa-card');
    const emptyMsg   = section.querySelector('.sa-empty');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            filterBtns.forEach(b => {
                b.classList.remove('sa-filter-btn--active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('sa-filter-btn--active');
            btn.setAttribute('aria-selected', 'true');

            let visible = 0;
            cards.forEach(card => {
                const match = filter === 'todos' || card.dataset.category === filter;
                card.classList.toggle('sa-card--hidden', !match);
                if (match) visible++;
            });

            if (emptyMsg) emptyMsg.hidden = visible > 0;

            section.querySelectorAll('.sa-grid').forEach((grid) => {
                grid.dispatchEvent(new Event('scroll'));
            });
        });
    });
});

// Rolagem horizontal dos carrosséis de projetos com arraste por toque/ponteiro
document.querySelectorAll('.sa-page .sa-catalogo .sa-grid').forEach((carousel) => {
    if (!carousel.parentElement || carousel.parentElement.classList.contains('sa-carousel-shell')) {
        // already enhanced
    } else {
        const shell = document.createElement('div');
        shell.className = 'sa-carousel-shell';
        carousel.parentNode.insertBefore(shell, carousel);
        shell.appendChild(carousel);

        const prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.className = 'sa-carousel-arrow sa-carousel-arrow--prev';
        prevButton.setAttribute('aria-label', 'Deslizar projetos para a esquerda');
        prevButton.innerHTML = '<img src="../assets/icone-flecha-esquerda.svg" alt="" width="18" height="18">';

        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'sa-carousel-arrow sa-carousel-arrow--next';
        nextButton.setAttribute('aria-label', 'Deslizar projetos para a direita');
        nextButton.innerHTML = '<img src="../assets/icone-flecha-direita.svg" alt="" width="18" height="18">';

        shell.appendChild(prevButton);
        shell.appendChild(nextButton);

        const getStep = () => {
            const card = carousel.querySelector('.sa-card');
            if (card) {
                const gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
                return card.getBoundingClientRect().width + gap;
            }
            return Math.max(Math.round(carousel.clientWidth * 0.8), 280);
        };

        const updateArrowState = () => {
            const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
            prevButton.disabled = carousel.scrollLeft <= 0;
            nextButton.disabled = carousel.scrollLeft >= maxScrollLeft - 1;
        };

        // Autoplay no mesmo espírito do carrossel da home: avança e volta ao início no fim
        let autoplayTimer = null;
        const pararAutoplay = () => { clearInterval(autoplayTimer); autoplayTimer = null; };
        const iniciarAutoplay = () => {
            pararAutoplay();
            autoplayTimer = setInterval(() => {
                const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
                if (carousel.scrollLeft >= maxScrollLeft - 1) {
                    carousel.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    carousel.scrollBy({ left: getStep(), behavior: 'smooth' });
                }
            }, 3000);
        };

        prevButton.addEventListener('click', () => {
            carousel.scrollBy({ left: -getStep(), behavior: 'smooth' });
            iniciarAutoplay();
        });

        nextButton.addEventListener('click', () => {
            carousel.scrollBy({ left: getStep(), behavior: 'smooth' });
            iniciarAutoplay();
        });

        carousel.addEventListener('scroll', updateArrowState, { passive: true });
        window.addEventListener('resize', updateArrowState, { passive: true });
        carousel.addEventListener('pointerenter', pararAutoplay);
        carousel.addEventListener('pointerleave', iniciarAutoplay);
        updateArrowState();
        iniciarAutoplay();
    }

    let isPointerDown = false;
    let isDragging = false;
    let pointerId = null;
    let startX = 0;
    let startScrollLeft = 0;

    const stopDragging = () => {
        isPointerDown = false;
        pointerId = null;
        carousel.classList.remove('sa-grid--dragging');
        window.requestAnimationFrame(() => {
            isDragging = false;
        });
    };

    carousel.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (carousel.scrollWidth <= carousel.clientWidth) return;

        isPointerDown = true;
        isDragging = false;
        pointerId = event.pointerId;
        startX = event.clientX;
        startScrollLeft = carousel.scrollLeft;
        carousel.classList.add('sa-grid--dragging');

        try {
            carousel.setPointerCapture(pointerId);
        } catch (error) {
            // Ignorado, alguns browsers não suportam captura em todos os contextos.
        }
    });

    carousel.addEventListener('pointermove', (event) => {
        if (!isPointerDown || pointerId !== event.pointerId) return;

        const delta = event.clientX - startX;
        if (Math.abs(delta) > 5) {
            isDragging = true;
        }

        if (!isDragging) return;

        const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
        const nextScrollLeft = Math.min(Math.max(startScrollLeft - delta, 0), maxScrollLeft);
        carousel.scrollLeft = nextScrollLeft;
        event.preventDefault();
    });

    carousel.addEventListener('pointerup', stopDragging);
    carousel.addEventListener('pointercancel', stopDragging);
    carousel.addEventListener('pointerleave', () => {
        if (isPointerDown) stopDragging();
    });

    carousel.addEventListener('click', (event) => {
        if (!isDragging) return;
        event.preventDefault();
        event.stopPropagation();
    }, true);
});

// Toggle para painéis institucionais (abre/fecha detalhe)
document.querySelectorAll('.ln-painel-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        const detail = btn.parentElement.querySelector('.ln-painel-detail');
        btn.setAttribute('aria-expanded', String(!isExpanded));
        if (detail) {
            detail.hidden = isExpanded;
        }
    });
});

// Contadores animados (estatísticas)
(() => {
    const counters = document.querySelectorAll('.ln-stat-number');
    if (!counters.length) return;

    const runCounter = (el) => {
        const target = parseInt(el.dataset.target, 10) || 0;
        const isPercent = String(el.textContent || '').includes('%');
        let start = 0;
        const duration = 1400;
        const stepTime = Math.max(Math.floor(duration / Math.max(target,1)), 10);
        const timer = setInterval(() => {
            start += 1;
            if (start >= target) {
                clearInterval(timer);
                el.textContent = isPercent ? `${target}%` : (target >= 100 ? `${target}+` : `${target}`);
            } else {
                el.textContent = isPercent ? `${start}%` : (target >= 100 ? `${start}+` : `${start}`);
            }
        }, stepTime);
    };

    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                runCounter(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => io.observe(c));
})();

// --------- GABRIEL EVENTOS E AGENDA --------- //

const gaInputPesquisaEventos =
    document.getElementById('ga-input-pesquisa-eventos');

const gaCardsEventos =
    document.querySelectorAll('.ga-card-eventos');

function gaPesquisarEventos(){

    if (!gaInputPesquisaEventos) return;

    const valorPesquisa =
        gaInputPesquisaEventos.value.toLowerCase();

    gaCardsEventos.forEach((cardEvento) => {

    const h3 = cardEvento.querySelector('h3');
    const tituloEvento = h3 ? h3.textContent.toLowerCase() : '';

        if(tituloEvento.includes(valorPesquisa)){

            cardEvento.style.display = '';

        } else {

            cardEvento.style.display = 'none';

        }

    });
}

/* PESQUISA ENQUANTO DIGITA */
if (gaInputPesquisaEventos) {
    gaInputPesquisaEventos.addEventListener(
        'input',
        gaPesquisarEventos
    );
}

// ------- FILTROS -------- //

const gaFiltros =
    document.querySelectorAll('.ga-filtro-evento');

/* procura cards da Agenda OU Eventos */
const gaCards =
    document.querySelectorAll(
        '.ga-card-eventos'
    );

if(gaFiltros.length > 0){

    gaFiltros.forEach((filtro) => {

        filtro.addEventListener('click', () => {

            gaFiltros.forEach((btn) => {
                btn.classList.remove('ga-filtro-evento--ativo');
            });

            filtro.classList.add('ga-filtro-evento--ativo');

            const categoria =
                filtro.dataset.filtro;

            gaCards.forEach((card) => {

                if(
                    categoria === 'todos' ||
                    card.dataset.categoria === categoria
                ){

                    card.style.display = '';

                } else {

                    card.style.display = 'none';

                }

            });

        });

    });

   }
    // ==========================
    // KIT DE ACESSIBILIDADE
    // ==========================

    // USERWAY (suíte completa via IA)
    (function(d){
        var s = d.createElement("script");
        s.setAttribute("data-account", "JQrCkIFmyB");
        s.setAttribute("src", "https://cdn.userway.org/widget.js");
        (d.body || d.head).appendChild(s);
    })(document);

    // SÍNTESE DE VOZ
    function lerDescricao(botao) {
        window.speechSynthesis.cancel();
        const imagem = botao.parentElement.querySelector('img');
        const texto = imagem.alt;
        if (texto) {
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // VLIBRAS
    (function() {
        var s = document.createElement('script');
        s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        s.onload = function() {
            new window.VLibras.Widget('https://vlibras.gov.br/app');
        };
        document.head.appendChild(s);
    })();
});