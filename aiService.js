import OpenAI from "openai";
import { MARIO_SYSTEM_PROMPT } from "./marioPrompt.js";

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

const openai = hasOpenAIKey
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function gerarRespostaMario({ conversation, latestMessage, detectedIntent }) {
  // Sem chave da OpenAI, usa resposta local simples.
  if (!openai) {
    return fallbackMarioReply(latestMessage, detectedIntent);
  }

  const recentMessages = conversation.messages.slice(-12).map((msg) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content
  }));

  const messages = [
    { role: "system", content: MARIO_SYSTEM_PROMPT },
    {
      role: "system",
      content: `Intenção detectada: ${detectedIntent.intent}. Status: ${detectedIntent.status}. Precisa humano: ${detectedIntent.needsHuman}.`
    },
    ...recentMessages,
    { role: "user", content: latestMessage }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 180
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return fallbackMarioReply(latestMessage, detectedIntent);
    }

    return reply;
  } catch (error) {
    console.error("Erro na IA:", error.message);
    return "Boa! Tive um probleminha aqui, mas já chamei alguém da equipe pra te responder certinho.";
  }
}

function fallbackMarioReply(message = "", detectedIntent = {}) {
  const intent = detectedIntent.intent;

  if (intent === "preco") {
    return "Boa! Cabelo fica R$60 e barba R$50. O combo completo fica R$110. Quer que eu veja um horário pra você essa semana?";
  }

  if (intent === "endereco") {
    return "A Gameplay fica na Rua Visconde do Rio Branco, 345, Vila Jardini, Sorocaba. Quer que eu te ajude a garantir um horário?";
  }

  if (intent === "agendamento") {
    return "Boa! Pra qual serviço seria: cabelo, barba ou cabelo + barba?";
  }

  if (intent === "humano" || intent === "reclamacao" || intent === "lead_quente") {
    return "Fechou, vou chamar alguém da equipe pra te confirmar certinho aqui.";
  }

  return "Boa! Aqui é a Barbearia Gameplay. Você quer fazer cabelo, barba ou cabelo + barba?";
}
