const eventos = {

    1: {
        titulo: "Artesanal Fashion Day",

        local: "Praça Central",

        data: "10 de Maio de 2026",

        imagem: "../assets/fashion-day.jpg",

        descricao:
            "Moda, arte e inovação unidas para celebrar o talento manual. Conheça o evento que marcou o início de uma nova era para a moda artesanal e sustentável."
    },

    2: {
        titulo: "Mega Artesanato",

        local: "Museu Municipal",

        data: "15 de Maio de 2026",

        imagem: "../assets/maos-e-mentes.jpg",

        descricao:
            "Uma celebração da criatividade e do talento manual. Vivenciamos momentos de troca e conexão que provam que o artesanato é pura memória, cultura e emoção."
    },
    
    3: {
        titulo: "Mãos Criativas",
        
        local: "Praça Peixoto Gomide",
        
        data: "21 de Maio de 2026",
        
        imagem: "../assets/maos-criativas.jpg",
        
        descricao:
        "Uma parceria entre Associação Gaia e Melissa Barth para valorizar o bordado de Itapetininga."
    },

    4: {
        titulo: "Edição Natal - 2ª Vitrine Mãos Criativas",
        
        local: "Praça Mal.Deodoro da Fonseca",
        
        data: "8 de Agosto de 2026",
        
        imagem: "../assets/Natal-maos-criativas.jpg",
        
        descricao:
        "A temporada natalina chegou com o lançamento de uma vitrine inédita de bordado livre. Valorize o artesanato de Itapetininga e garanta peças exclusivas feitas por nossas artesãs locais."
    }

};

const parametros =
    new URLSearchParams(window.location.search);

const id =
    parametros.get('id');

const evento =
    eventos[id];

if(evento){

    document.getElementById('ga-titulo-evento').textContent =
        evento.titulo;

    document.getElementById('ga-local-evento').innerHTML =
    `<img src="../assets/ponteiro-mapa.png" alt="" style="width:18px;height:18px;display:inline;vertical-align:middle;"> ${evento.local}`;

    document.getElementById('ga-data-evento').innerHTML =
    `<img src="../assets/calendario-eventos.png" alt="" style="width:18px;height:18px;display:inline;vertical-align:middle;"> ${evento.data}`;

    document.getElementById('ga-img-evento').src =
        evento.imagem;

    document.getElementById('ga-descricao-evento').textContent =
        evento.descricao;
}