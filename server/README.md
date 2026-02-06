# Server do Oráculo (exemplo)

Pré-requisitos:
- Node 18+ (ou instalar `node-fetch`)

Instalação básica:

```bash
mkdir oracle-server && cd oracle-server
npm init -y
npm install express node-fetch dotenv chrono-node date-fns words-to-numbers cors
```

Crie um `.env` com:

```
LLM_ENDPOINT=https://api.seuprovedor.com/v1/generate
LLM_API_KEY=sk_...
```

Exemplo rápido de uso (server index):

```javascript
const express = require('express');
require('dotenv').config();
const oracleRoute = require('./oracleRoute');
const app = express();
app.use(express.json());
app.use('/', oracleRoute);
app.listen(3000, () => console.log('Oracle server running on 3000'));
```

Notas de segurança:
- Nunca coloque `LLM_API_KEY` no frontend.
- Use CORS restritivo e rate limiting em produção.
