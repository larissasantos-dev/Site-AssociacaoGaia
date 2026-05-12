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
        irParaCard(cardAtivo + 1);
        clearInterval(intervalo);
        iniciarAutoplay();
    });

    btnPrev.addEventListener('click', () => {
        irParaCard(cardAtivo - 1);
        clearInterval(intervalo);
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
        irParaArtesao(cardAtivoArtesaos + 1);
        clearInterval(intervaloArtesaos);
        iniciarAutoplayArtesaos();
    });

    btnPrevArtesaos.addEventListener('click', () => {
        irParaArtesao(cardAtivoArtesaos - 1);
        clearInterval(intervaloArtesaos);
        iniciarAutoplayArtesaos();
    });

});