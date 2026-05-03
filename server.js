import "dotenv/config";
import express from "express";
import cors from "cors";

import { detectIntent, quickReply } from "./intentDetector.js";
import {
  addMessage,
  getConversation,
  updateConversationStatus,
  listConversations,
  markResolved
} from "./conversationStore.js";
import { gerarRespostaMario } from "./aiService.js";
import { normalizeIncomingWhatsAppPayload, sendWhatsAppMessage } from "./whatsappService.js";

console.log("SERVER V7 ✅ (etapas robustas por histórico)");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

function norm(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getAgent(req) {
  if (req.body?.agent) return String(req.body.agent).toLowerCase().trim();
  return "mario";
}

function key(agent, from) {
  return `${agent}__${from}`;
}

const RX_BARBER = /(mur|muri|muril|muriil|murilo|muriio|giro|girosan)/;
const RX_SERVICE = /(^cabelo$|^barba$|cabelo\s*(e|\+)\s*barba)/;
const RX_PRICEQ = /(quanto|preco|valor|custa)/;
const RX_DAYTIME = /(hoje|amanha|\b\d{1,2}h\b|\b\d{1,2}:\d{2}\b|as\s*\d{1,2})/;

app.post("/webhook/whatsapp", async (req, res) => {
  try {
    const incoming = normalizeIncomingWhatsAppPayload(req.body);
    if (!incoming || !incoming.from || !incoming.message) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const { from, message } = incoming;
    const agent = getAgent(req);
    const convoKey = key(agent, from);
    const msg = norm(message);

    addMessage(convoKey, "user", message);

    const convo = getConversation(convoKey);
    const historyUser = norm(
      convo.messages
        .filter(m => m.role === "user")
        .map(m => m.content)
        .join(" | ")
    );

    const ctxHasBarber = RX_BARBER.test(historyUser);
    const ctxHasService = RX_SERVICE.test(historyUser);

    let detected = detectIntent(message);

    // ✅ regra mestra: serviço antes de preço
    if (!RX_PRICEQ.test(msg) && RX_SERVICE.test(msg)) {
      detected = { intent: "agendamento", status: "quer_agendar", needsHuman: false };
    }

    // ✅ se mandou dia/horário e já tem barbeiro + serviço -> lead quente
    if (RX_DAYTIME.test(msg) && ctxHasBarber && ctxHasService) {
      detected = { intent: "lead_quente", status: "lead_quente", needsHuman: true };
    }

    updateConversationStatus(convoKey, detected.status, detected.needsHuman);

    let reply = null;

    // 1) Lead quente
    if (detected.intent === "lead_quente") {
      reply = "Fechou! Vou chamar alguém da equipe pra confirmar esse horário certinho com você agora. ✅";
    }

    // 2) Se o cliente mandou horário (fora de ordem), pergunta o que está faltando
    if (!reply && RX_DAYTIME.test(msg)) {
      if (ctxHasService && !ctxHasBarber) {
        reply = "Fechou! Com qual barbeiro você prefere: Murilo, Giro/Girosan ou pode ser qualquer um?";
      } else if (ctxHasBarber && !ctxHasService) {
        reply = "Fechou! Vai ser cabelo, barba ou combo (cabelo + barba)?";
      } else if (!ctxHasBarber && !ctxHasService) {
        reply = "Boa! Pra qual serviço seria: cabelo, barba ou cabelo + barba?";
      }
    }

    // 3) Se escolheu serviço e já tem barbeiro no histórico -> pedir dia/horário
    if (!reply && detected.intent === "agendamento" && ctxHasBarber && RX_SERVICE.test(msg) && !RX_PRICEQ.test(msg)) {
      reply = "Fechou! Prefere hoje ou amanhã? E qual horário fica melhor pra você?";
    }

    // 4) Se escolheu serviço e ainda não tem barbeiro -> pedir barbeiro
    if (!reply && detected.intent === "agendamento" && RX_SERVICE.test(msg) && !ctxHasBarber && !RX_PRICEQ.test(msg)) {
      reply = "Fechou. Tem preferência com Murilo, Giro/Girosan ou pode ser qualquer um?";
    }

    // fallback quickReply / IA
    if (!reply) reply = quickReply(detected.intent, message);

    if (!reply) {
      reply = await gerarRespostaMario({
        conversation: getConversation(convoKey),
        latestMessage: message,
        detectedIntent: detected
      });
    }

    addMessage(convoKey, "assistant", reply);
    await sendWhatsAppMessage(from, reply);

    return res.json({
      ok: true,
      agent,
      from,
      reply,
      status: getConversation(convoKey).status,
      needsHuman: getConversation(convoKey).needsHuman
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false });
  }
});

app.get("/api/conversations", (req, res) => {
  res.json({ ok: true, conversations: listConversations() });
});

app.post("/api/conversations/:phone/resolve", (req, res) => {
  const phone = req.params.phone;
  const conversation = markResolved(phone);
  res.json({ ok: true, conversation });
});

app.listen(PORT, () => {
  console.log(`Agent Manager online na porta ${PORT}`);
});