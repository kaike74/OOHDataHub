# Sistema OOH - Gestão de Pontos Out-of-Home

Sistema web completo para gerenciamento de pontos OOH (Out-of-Home) com mapa interativo, cadastro de pontos e integração com Cloudflare Workers.

## 🚀 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Mapa**: Leaflet + OpenStreetMap
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1
- **Storage**: Cloudflare R2
- **Geocoding**: Nominatim (OpenStreetMap)

## 📋 Funcionalidades

- ✅ Mapa interativo com visualização de todos os pontos OOH
- ✅ Cadastro de novos pontos via modal intuitivo
- ✅ Upload de imagens para R2
- ✅ Extração automática de coordenadas de iframes do Google Street View
- ✅ Geocoding reverso para obter cidade/UF automaticamente
- ✅ Gestão de exibidoras
- ✅ Múltiplos tipos de produtos (Outdoor, LED, Frontlight, etc.)
- ✅ Design moderno e responsivo

## 🛠️ Instalação

### 1. Instalar Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Fazer login no Cloudflare

```bash
wrangler login
```

### 3. Instalar dependências do projeto

```bash
npm install
```

### 4. Configurar o banco de dados D1

O banco de dados já deve estar criado com o ID: `79b92724-c85e-401b-a97e-4a77432b3398`

Se precisar criar as tabelas, execute:

```bash
wrangler d1 execute ooh-db --file=schema.sql
```

### 5. Configurar o bucket R2

Certifique-se de que o bucket `ooh-bucket` existe:

```bash
wrangler r2 bucket create ooh-bucket
```

## 🚀 Desenvolvimento Local

Para testar o Worker localmente:

```bash
npm run dev
```

Isso iniciará o servidor local em `http://localhost:8787`

## 📦 Deploy

### 1. Deploy do Worker

```bash
npm run deploy
```

Após o deploy, você receberá uma URL como:
```
https://ooh-system.YOUR_SUBDOMAIN.workers.dev
```

### 2. Atualizar a URL da API no Frontend

Edite o arquivo `script.js` e atualize a constante `API_BASE_URL`:

```javascript
const API_BASE_URL = 'https://ooh-system.YOUR_SUBDOMAIN.workers.dev';
```

### 3. Deploy do Frontend no Cloudflare Pages

1. Acesse o Cloudflare Dashboard
2. Vá para **Pages** > **Create a project**
3. Conecte seu repositório Git ou faça upload manual dos arquivos:
   - `index.html`
   - `style.css`
   - `script.js`
4. Configure:
   - **Build command**: (deixe vazio)
   - **Build output directory**: `/`
5. Clique em **Save and Deploy**

## 📖 Uso

### Visualizar Pontos

Ao abrir o sistema, o mapa carregará automaticamente todos os pontos OOH cadastrados. Clique em qualquer marcador para ver detalhes do ponto.

### Cadastrar Novo Ponto

1. Clique no botão flutuante **"+"** no canto inferior direito
2. Preencha os dados obrigatórios:
   - Código OOH
   - Endereço
   - Exibidora
3. **Opcional**: Cole o iframe do Google Street View para extrair coordenadas automaticamente
4. Selecione os tipos de produto
5. Faça upload de uma imagem (opcional)
6. Clique em **"Cadastrar Ponto"**

### Adicionar Nova Exibidora

No formulário de cadastro, selecione **"+ Nova Exibidora"** no campo de exibidora e preencha os dados adicionais.

## 🔧 Estrutura do Projeto

```
OOHDataHub/
├── src/
│   └── index.js          # Cloudflare Worker (API)
├── index.html            # Frontend principal
├── style.css             # Estilos
├── script.js             # Lógica do mapa e formulário
├── wrangler.toml         # Configuração do Cloudflare
├── package.json          # Dependências
└── README.md             # Este arquivo
```

## 🗄️ Endpoints da API

### GET /api/ooh
Lista todos os pontos OOH com dados das exibidoras.

### POST /api/ooh
Cria um novo ponto OOH. Aceita FormData com imagem.

### GET /api/exibidoras
Lista todas as exibidoras.

### POST /api/exibidoras
Cria uma nova exibidora. Aceita JSON.

### GET /api/image/:key
Retorna uma imagem do R2 pelo key.

## 🎨 Personalização

### Cores

Edite as variáveis CSS em `style.css`:

```css
:root {
    --primary: #2563eb;
    --secondary: #0ea5e9;
    /* ... */
}
```

### Ícones do Mapa

Edite a função `createCustomIcon()` em `script.js` para personalizar os marcadores.

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.