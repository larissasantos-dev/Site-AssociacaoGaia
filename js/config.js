// URL base da API. Este é o ÚNICO lugar onde ela deve aparecer.
// Em desenvolvimento local (localhost / Live Server) usa a API local;
// em qualquer outro lugar (site hospedado) usa a API no Render.
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:8080'
    : 'https://associacao-gaia-api.onrender.com';