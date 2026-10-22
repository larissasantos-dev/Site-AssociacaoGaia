document.addEventListener("DOMContentLoaded", async () => {
    const destaque = document.getElementById("ga-agenda-proximo");
    const listaProximos = document.getElementById("ga-agenda-lista-proximos");
    const listaAnteriores = document.getElementById("ga-agenda-lista-anteriores");
    const tituloProximos = document.getElementById("ga-agenda-titulo-proximos");
    const mensagem = document.getElementById("ga-agenda-mensagem");
    const hojeAgora = new Date(); const hoje = new Date(hojeAgora.getFullYear(), hojeAgora.getMonth(), hojeAgora.getDate());
    const dataEvento = e => { if (!e.data) return null; const [a,m,d] = String(e.data).split("-").map(Number); return a && m && d ? new Date(a,m-1,d) : null; };
    const formatarData = e => { const d=dataEvento(e); let t=d?d.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}):"Data a confirmar"; if(e.hora)t+=` • ${String(e.hora).slice(0,5)}`; return t; };
    const imagemUrl = valor => { if(!valor)return "../assets/evento-principal.jpg"; const u=String(valor).trim(); if(/^(https?:|data:|\/)/i.test(u)||u.startsWith("../"))return u; if(u.startsWith("assets/"))return `../${u}`; return `../assets/${u}`; };
    const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
    const iconText=(cls,src,txt)=>{const wrap=el("div",cls);const img=el("img");img.src=src;img.alt="";wrap.append(img,el("p","",txt));return wrap;};
    const setImage=(img,e)=>{img.src=imagemUrl(e.imagemUrl);img.alt=`Evento ${e.titulo||""}`;img.loading="lazy";img.onerror=()=>{img.onerror=null;img.src="../assets/evento-principal.jpg";};};
    function card(e){const article=el("article","ga-card-agenda");const img=el("img");setImage(img,e);const info=el("div","ga-card-info");info.append(el("h3","",e.titulo||"Evento sem título"),iconText("ga-local","../assets/ponteiro-mapa.png",e.local||"Local a confirmar"),iconText("ga-data","../assets/calendario-eventos.png",formatarData(e)));const link=el("a","ga-btn-agenda","Ver detalhes");link.href=`evento.html?id=${encodeURIComponent(e.idEvento)}`;info.appendChild(link);article.append(img,info);return article;}
    function destaqueEvento(e){destaque.replaceChildren();const visual=el("div","ga-img-proximo");const badge=el("span","ga-badge-proximo","Próximo Evento");const img=el("img");setImage(img,e);visual.append(badge,img);const info=el("div","ga-info-proximo");info.append(el("h2","",e.titulo||"Evento sem título"),iconText("ga-local","../assets/ponteiro-mapa.png",e.local||"Local a confirmar"),iconText("ga-data","../assets/calendario-eventos.png",formatarData(e)));const link=el("a","ga-btn-agenda","Ver detalhes");link.href=`evento.html?id=${encodeURIComponent(e.idEvento)}`;info.appendChild(link);destaque.append(visual,info);}
    try {
        const resposta=await fetch(`${API_BASE}/eventos`,{headers:{"Accept":"application/json"}});
        if(!resposta.ok)throw new Error(`A API respondeu com status ${resposta.status}.`);
        const dados=await resposta.json();if(!Array.isArray(dados))throw new Error("A API não retornou uma lista de eventos.");
        dados.sort((a,b)=>(dataEvento(a)?.getTime()??Number.MAX_SAFE_INTEGER)-(dataEvento(b)?.getTime()??Number.MAX_SAFE_INTEGER));
        const proximos=dados.filter(e=>!dataEvento(e)||dataEvento(e)>=hoje);const anteriores=dados.filter(e=>dataEvento(e)&&dataEvento(e)<hoje);
        if(proximos.length){destaqueEvento(proximos[0]);proximos.slice(1).forEach(e=>listaProximos.appendChild(card(e)));}
        else {destaque.replaceChildren(el("div","ga-info-proximo","Não há próximos eventos cadastrados."));}
        anteriores.forEach(e=>listaAnteriores.appendChild(card(e)));
        document.getElementById("ga-agenda-titulo-anteriores").hidden=!anteriores.length;
        if (tituloProximos) tituloProximos.hidden = proximos.length <= 1;
        mensagem.textContent=dados.length?"": "Nenhum evento cadastrado no momento.";
    } catch(erro){console.error("Não foi possível carregar a agenda:",erro);destaque.replaceChildren(el("div","ga-info-proximo","Não foi possível carregar a agenda agora. Tente novamente mais tarde."));mensagem.textContent="";}
});
