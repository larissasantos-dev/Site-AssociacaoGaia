# Projeto Web - Associacao Gaia

## ❗REGRA OBRIGATÓRIA
- **Sempre** avisar no grupo quando for mexer em algum arquivo quando for subir para o repositório. **Não** faça o "Upload" de arquivos sem confirmar se ninguém está mexendo neles no momento e **NÃO** suba os arquivos até todos estarem de acordo. 

## 🚀 Guia Rápido: Como usar o GitHub (Para o Grupo)
Se você nunca usou o GitHub, siga este passo a passo para enviar sua parte:
1. Acessar: Abra o link do nosso repositório.
2. Entrar na pasta: Se for subir uma imagem, clique na pasta `assets`. Se for o HTML, fique na página inicial.
3. Fazer o Upload: Clique no botão "Add file" -> "Upload files".
4. Selecionar: Arraste seu arquivo (ex: `login.html`) para a área cinza.
5. Salvar (Commit): No campo "Commit changes", escreva o que você fez (ex: "Criei o layout do login"). Clique no botão verde "Commit changes".
6. Editar CSS/JS: Para mexer no arquivo compartilhado (`style.css`), clique no arquivo, clique no ícone do Lápis (`Edit`), cole seu código no seu bloco e salve no botão verde ao final.
## 💻 Como baixar o projeto para trabalhar
Para utilizar o código base na sua máquina, siga este passo a passo:
1. No topo da página do repositório, clique no botão verde Code.
2. Selecione a opção Download ZIP.
3. Após o download, extraia o arquivo .zip na sua máquina.
4. Abra a pasta extraída no seu editor de código (como o VS Code). 

## 📄 Páginas
- Home → `index.html`  - Larissa
- Eventos → `eventos.html`  - Gabriel
- Artesões → `artesoes.html`  - Lana
- Projetos → `projetos.html`  - Sara
- Agenda → `agenda.html`  - Gabriel
- Sobre nós → `sobrenos.html` - Lana
- Login → `login.html`  - Larissa 
- Cadastro → `cadastro.html`  - Lana

## 📂 Estrutura de Pastas e Caminhos

Para manter o projeto organizado, estamos seguindo esta estrutura:

```text
Site-AssociacaoGaia/
├── assets/          # Imagens e ícones (.svg, .png, .jpg)
├── css/             # Arquivos de estilo (style.css)
├── js/              # Arquivos de script (script.js)
├── pages/           # Páginas secundárias (eventos.html, sobre-nos.html)
└── index.html       # Página principal
```

### ⚠️ Atenção aos Links (Caminhos)

Como os arquivos estão em pastas diferentes, os links mudam dependendo de onde você está:

#### 1. Se você estiver mexendo no `index.html`:
Você está na raiz, então acessa as pastas direto:
*   **CSS:** `css/style.css`
*   **Imagens:** `assets/nome-da-imagem.svg`
*   **Páginas:** `pages/nome-da-pagina.html`

#### 2. Se você estiver mexendo em arquivos dentro da pasta `pages/`:
Você precisa "sair" da pasta atual antes de entrar na pasta do CSS ou Imagens. Para isso, use `../` no início do caminho:
*   **CSS:** `../css/style.css`
*   **JS:** `../js/script.js`
*   **Imagens:** `../assets/nome-da-imagem.svg`
*   **Voltar para a Home:** `../index.html`

## ✍️ Organização dos arquivos
Para evitar conflitos, use o sistema de blocos com comentários:
- `style.css` (fazer seu css aqui) ❗Se atentar para **não sobrescrever/alterar** o css do outro
- `script.js` (fazer seu javascript aqui) ❗Se atentar para **não sobrescrever/alterar** o javascript do outro
- Seguir o seguinte padrão: 
Separar o seu css e js em um "bloco" e indentificar seu nome em um comentário, exemplo:
```css
/* ----- LARISSA ----- */

/* HOME */
body{
    display: flex;
    flex-direction: column;
    font-family: 'Ubuntu', sans-serif;
}
```
- seguir o padrão ao nomear o arquivo demostrado na seção **(Páginas)**
- ❗Padrão com imagems:
  Nomeie imagens em minúsculo: `foto-perfil.svg`.
  Todas as imagems devem estar dentro da pasta `assets/`
  Preferência: Use formato `.svg` sempre que possível.

## 🏷️ Padronização de Classes (CSS) e IDs (JavaScript)
Para evitar conflitos onde o código de um integrante apaga ou trava o do outro, utilizaremos **prefixos obrigatórios** em todos os nomes de classes e IDs:

| Integrante | Prefixo | Exemplo de Classe (CSS) | Exemplo de ID (JS) |
| :--- | :--- | :--- | :--- |
| **Larissa** | `la-` | `.la-card-home` | `#la-btn-login` |
| **Lana** | `ln-` | `.ln-input-cadastro` | `#ln-form-cadastro` |
| **Gabriel** | `ga-` | `.ga-item-agenda` | `#ga-btn-salvar` |
| **Sara** | `sa-` | `.sa-box-projeto` | `#sa-link-saiba-mais` |

### ❗Regras:
1. **Nunca** use nomes genéricos sozinhos (ex: `.container`, `.btn`, `#menu`). Adicione sempre o seu prefixo.
2. **Classes (.):** Use para estilização no CSS.
3. **IDs (#):** Use exclusivamente para elementos que terão interação via JavaScript.
4. **JS Unificado:** Coloque suas funções dentro do seu bloco de comentário no `script.js` para não misturar com as funções dos colegas.
   
## 🚀 Objetivo atual
Protótipo funcional com HTML, CSS e JavaScript (Mobile First)

## 📱 Requisitos
- Mobile First: Comece projetando para celular.
- Responsivo: Deve funcionar em qualquer tela.
- Funcional: Botões devem levar às páginas corretas.
- Interface baseada no Canva
- Acessibilidade: Se atentem ao site estar acessivel, adicione contraste nas letras e não deixem as letras pequenas
