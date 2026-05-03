export function normalizeIncomingWhatsAppPayload(body = {}) {
  // Modo teste simples:
  // { "from": "5515999999999", "message": "quanto ta cabelo?" }
  if (body.from && body.message) {
    return {
      from: String(body.from),
      message: String(body.message),
      raw: body
    };
  }

  // Formato aproximado da WhatsApp Cloud API.
  const value = body.entry?.[0]?.changes?.[0]?.value;
  const messageObj = value?.messages?.[0];

  if (messageObj) {
    return {
      from: messageObj.from,
      message: messageObj.text?.body || "",
      raw: body
    };
  }

  return null;
}

export async function sendWhatsAppMessage(to, text) {
  const mock = process.env.MOCK_WHATSAPP !== "false";

  if (mock) {
    console.log("\n--- MOCK WHATSAPP ---");
    console.log("Para:", to);
    console.log("Mensagem:", text);
    console.log("---------------------\n");
    return { mocked: true, to, text };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configurado.");
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro WhatsApp API:", data);
    throw new Error("Falha ao enviar mensagem pelo WhatsApp.");
  }

  return data;
}
