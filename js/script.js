document.addEventListener('DOMContentLoaded', () => {

    const mobileBtnMenu = document.getElementById('mobile-heder-btn-menu');
    const sidebar = document.getElementById('mobile-header-sidebar');
    const mobileBtnFecharX = document.getElementById('mobile-btnFechar-sidebar');
    const overlay = document.getElementById('mobile-header-overlay');

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

    /* ---------- LARISSA - INDEX ---------- */

    // CARROSSEL DE EVENTOS
    const carrossel = document.getElementById('la-carrossel');
    const dotsContainer = document.getElementById('la-carrossel-dots');
    const btnPrev = document.querySelector('.la-carrossel-btn-prev');
    const btnNext = document.querySelector('.la-carrossel-btn-next');
    const cards = carrossel.querySelectorAll('.la-card');

    let cardAtivo = 0;
    let intervalo;

    dotsContainer.innerHTML = '';
    cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('la-dot');
        dot.setAttribute('aria-label', `Ir para card ${i + 1}`);
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            irParaCard(i);
            clearInterval(intervalo);
            iniciarAutoplay();
        });
        dotsContainer.appendChild(dot);
    });

    function irParaCard(index) {
        if (index >= cards.length) index = 0;
        if (index < 0) index = cards.length - 1;
        cardAtivo = index;
        carrossel.scrollTo({
            left: cards[index].offsetLeft - carrossel.offsetLeft,
            behavior: 'smooth'
        });
        dotsContainer.querySelectorAll('.la-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function iniciarAutoplay() {
        intervalo = setInterval(() => irParaCard(cardAtivo + 1), 2500);
    }

    iniciarAutoplay();

    btnNext.addEventListener('click', () => {
        clearInterval(intervalo);
        irParaCard(cardAtivo + 1);
        iniciarAutoplay();
    });

    btnPrev.addEventListener('click', () => {
        clearInterval(intervalo);
        irParaCard(cardAtivo - 1);
        iniciarAutoplay();
    });

    // CARROSSEL DE ARTESAOS
    const carrosselArtesaos = document.getElementById('la-artesaos-carrossel');
    const btnPrevArtesaos = document.querySelector('.la-artesaos-btn-prev');
    const btnNextArtesaos = document.querySelector('.la-artesaos-btn-next');
    const cardsArtesaos = carrosselArtesaos.querySelectorAll('.la-artesao-card');

    let cardAtivoArtesaos = 0;
    let intervaloArtesaos;

    function irParaArtesao(index) {
        if (index >= cardsArtesaos.length) index = 0;
        if (index < 0) index = cardsArtesaos.length - 1;
        cardAtivoArtesaos = index;
        carrosselArtesaos.scrollTo({
            left: cardsArtesaos[index].offsetLeft - carrosselArtesaos.offsetLeft,
            behavior: 'smooth'
        });
    }

    function iniciarAutoplayArtesaos() {
        intervaloArtesaos = setInterval(() => irParaArtesao(cardAtivoArtesaos + 1), 3000);
    }

    iniciarAutoplayArtesaos();

    btnNextArtesaos.addEventListener('click', () => {
        clearInterval(intervaloArtesaos);
        irParaArtesao(cardAtivoArtesaos + 1);
        iniciarAutoplayArtesaos();
    });

    btnPrevArtesaos.addEventListener('click', () => {
        clearInterval(intervaloArtesaos);
        irParaArtesao(cardAtivoArtesaos - 1);
        iniciarAutoplayArtesaos();
    });

    
});
const mobileBtnMenu = document.getElementById('mobile-heder-btn-menu');
const sidebar = document.getElementById('mobile-header-sidebar');
const mobileBtnFecharX = document.getElementById('mobile-btnFechar-sidebar');
const overlay = document.getElementById('mobile-header-overlay');
const artesoesFilterBtn = document.getElementById('ln-artesoes-filter-btn');
const artesoesFilterMenu = document.getElementById('ln-artesoes-filter-menu');
const artesoesFilterValue = document.getElementById('ln-artesoes-filter-value');
const artesoesFilterWrap = document.querySelector('.ln-artesoes-filter-wrap');

// Função para abrir a sidebar
if (mobileBtnMenu && sidebar && overlay) {
    mobileBtnMenu.addEventListener('click', ()=> {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    // Função para fechar tudo
    const fecharMenu = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    // chama a função fechar menu quando clicar no X
    if (mobileBtnFecharX) mobileBtnFecharX.addEventListener('click', fecharMenu);
    overlay.addEventListener('click', fecharMenu);
}

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
        prevButton.innerHTML = '<i class="bi bi-chevron-left" aria-hidden="true"></i>';

        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'sa-carousel-arrow sa-carousel-arrow--next';
        nextButton.setAttribute('aria-label', 'Deslizar projetos para a direita');
        nextButton.innerHTML = '<i class="bi bi-chevron-right" aria-hidden="true"></i>';

        shell.appendChild(prevButton);
        shell.appendChild(nextButton);

        const getStep = () => Math.max(Math.round(carousel.clientWidth * 0.8), 280);

        const updateArrowState = () => {
            const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
            prevButton.disabled = carousel.scrollLeft <= 0;
            nextButton.disabled = carousel.scrollLeft >= maxScrollLeft - 1;
        };

        prevButton.addEventListener('click', () => {
            carousel.scrollBy({ left: -getStep(), behavior: 'smooth' });
        });

        nextButton.addEventListener('click', () => {
            carousel.scrollBy({ left: getStep(), behavior: 'smooth' });
        });

        carousel.addEventListener('scroll', updateArrowState, { passive: true });
        window.addEventListener('resize', updateArrowState, { passive: true });
        updateArrowState();
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

// --------- GABRIEL EVENTOS --------- //

const gaInputPesquisaEventos =
    document.getElementById('ga-input-pesquisa-eventos');

const gaBtnPesquisaEventos =
    document.getElementById('ga-btn-pesquisa-eventos');

const gaCardsEventos =
    document.querySelectorAll('.ga-card-eventos');

function gaPesquisarEventos(){

    const valorPesquisa =
        gaInputPesquisaEventos.value.toLowerCase();

    gaCardsEventos.forEach((cardEvento) => {

        const tituloEvento =
            cardEvento
            .querySelector('h3')
            .textContent
            .toLowerCase();

        if(tituloEvento.includes(valorPesquisa)){

            cardEvento.style.display = 'flex';

        } else {

            cardEvento.style.display = 'none';

        }

    });

}

/* Clique no botão */

gaBtnPesquisaEventos.addEventListener('click', () => {

    gaPesquisarEventos();

});

/* Apertar ENTER */

gaInputPesquisaEventos.addEventListener('keydown', (evento) => {

    if(evento.key === 'Enter'){

        gaPesquisarEventos();

    }

});