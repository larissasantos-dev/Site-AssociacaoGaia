const eventos = {

    1: {
        titulo: "Evento de Dia das Mães",

        local: "Praça Central",

        data: "10 de Maio de 2026",

        imagem: "../assets/imagem-ia-dia-das-maes.png",

        descricao:
            "Um evento para escolher um presentinho para aquela pessoa que te ama muito! Sejá algo bonitinho com bordado, algo simbólico com cerâmica ou algo para fofo de tricô!"
    },

    2: {
        titulo: "Exposição Regional",

        local: "Museu Municipal",

        data: "15 de Maio de 2026",

        imagem: "../assets/imagem-ia-eventos-fundo.png",

        descricao:
            "Exposição reunindo trabalhos de artesãos da região de Itapetininga."
    },
    
    3: {
        titulo: "Oficina de Bordado",
        
        local: "Praça Peixoto Gomide",
        
        data: "21 de Maio de 2026",
        
        imagem: "../assets/oficina_de_bordado_ia.png",
        
        descricao:
        "Uma oficina de Bordado para ensinar, mostrar e criar objetos de bordado."
    },

    4: {
        titulo: "Feira da Lua",
        
        local: "Praça Mal.Deodoro da Fonseca",
        
        data: "8 de Agosto de 2026",
        
        imagem: "../assets/feira_da_lua_ia.png",
        
        descricao:
        "A Feira da Lua em Itapetininga é um evento tradicional que celebra a economia criativa local e ocorre em agosto. Iniciada em 2018, a feira se expandiu para o Largo dos Amores, onde oferece barracas de artesanato, alimentos orgânicos, brinquedos infláveis e música ao vivo."
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

    document.getElementById('ga-local-evento').textContent =
        evento.local;

    document.getElementById('ga-data-evento').textContent =
        evento.data;

    document.getElementById('ga-img-evento').src =
        evento.imagem;

    document.getElementById('ga-descricao-evento').textContent =
        evento.descricao;
}