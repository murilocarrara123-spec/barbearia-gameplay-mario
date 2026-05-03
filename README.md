# Mario — Assistente Virtual da Barbearia Gameplay

Este é um MVP do robô **Mario**, atendente virtual da **Barbearia Gameplay**.

Ele foi feito para:

- receber mensagens simuladas ou reais do WhatsApp;
- entender intenção básica do cliente;
- responder com tom natural;
- puxar para agendamento;
- priorizar cabelo + barba;
- sinalizar quando precisa de atendimento humano;
- ter um painel simples de conversas.

## Importante

Este projeto já tem a estrutura para usar a API oficial do WhatsApp, mas por padrão vem em **modo teste**.

No modo teste, você consegue rodar no seu computador e testar mensagens sem conectar WhatsApp real.

---

## Como instalar

### 1. Instale o Node.js

Baixe o Node.js LTS em:

https://nodejs.org/

Depois de instalar, abra o terminal e teste:

```bash
node -v
npm -v
```

Se aparecerem versões, deu certo.

---

## Como rodar no VS Code

### 1. Abra a pasta do projeto no VS Code

Pasta:

```bash
barbearia-gameplay-mario
```

### 2. Instale as dependências

No terminal do VS Code:

```bash
npm install
```

### 3. Crie o arquivo `.env`

Copie o arquivo:

```bash
.env.example
```

E renomeie a cópia para:

```bash
.env
```

No começo, pode deixar assim:

```env
MOCK_WHATSAPP=true
```

### 4. Inicie o servidor

```bash
npm start
```

Se der certo, vai aparecer:

```text
Mario online na porta 3000
Painel: http://localhost:3000
Health: http://localhost:3000/health
```

---

## Como testar sem WhatsApp real

Com o servidor rodando, abra no navegador:

```text
http://localhost:3000
```

Você verá o painel simples.

Para testar uma mensagem fake, use Postman, Insomnia ou terminal.

### Teste pelo terminal com curl

```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
-H "Content-Type: application/json" \
-d "{\"from\":\"5515999999999\",\"message\":\"quanto ta cabelo e barba?\"}"
```

Resposta esperada:

```json
{
  "ok": true,
  "from": "5515999999999",
  "reply": "Boa! Cabelo fica R$60 e barba R$50. O combo completo fica R$110. Quer que eu veja um horário pra você essa semana?",
  "status": "perguntando_preco",
  "needsHuman": false
}
```

---

## Rotas principais

### `GET /health`

Testa se o servidor está ligado.

### `POST /webhook/whatsapp`

Recebe mensagem simulada ou real.

Formato simples de teste:

```json
{
  "from": "5515999999999",
  "message": "quero marcar cabelo"
}
```

### `GET /api/conversations`

Lista conversas para o painel.

### `POST /api/conversations/:phone/resolve`

Marca uma conversa como resolvida.

---

## Para conectar WhatsApp real depois

Você vai precisar configurar:

- Meta Business;
- WhatsApp Business Platform;
- número conectado;
- webhook apontando para seu servidor público;
- token da API;
- phone number ID;
- verify token.

Depois altere no `.env`:

```env
MOCK_WHATSAPP=false
WHATSAPP_TOKEN=seu_token_real
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
VERIFY_TOKEN=um_token_que_voce_definir
```

E publique em um servidor com HTTPS, como Render, Railway, Fly.io, VPS, etc.

---

## Observação importante

Não use automação perigosa de WhatsApp Web para o número principal da barbearia.  
O caminho mais seguro é WhatsApp Business Platform/API oficial ou provedor confiável.
