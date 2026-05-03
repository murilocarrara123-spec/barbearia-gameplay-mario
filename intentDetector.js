const normalize = (text = "") =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export function detectIntent(message = "") {
  const text = normalize(message);
  const hasAny = (words) => words.some((w) => text.includes(w));

  // HUMANO / RECLAMAÇÃO
  if (hasAny(["humano", "atendente", "pessoa", "alguem", "fala com", "quero falar"])) {
    return { intent: "humano", status: "precisa_humano", needsHuman: true };
  }
  if (hasAny(["reclamar", "reclamacao", "ruim", "pessimo", "problema", "chateado"])) {
    return { intent: "reclamacao", status: "precisa_humano", needsHuman: true };
  }

  // SERVIÇO (sempre antes de preço)
  if (/cabelo\s*(e|\+)\s*barba/.test(text)) {
    return { intent: "agendamento", status: "quer_agendar", needsHuman: false };
  }
  if (text === "cabelo" || text === "barba") {
    return { intent: "agendamento", status: "quer_agendar", needsHuman: false };
  }

  // Barbeiro (pega "murilo", "muriio" etc)
  const citouBarbeiro = /(mur|muri|muril|murilo|muriio|giro|girosan)/.test(text);

  // Horário / pedido de agenda
  const pediuHorario = /(horario|agenda|agendar|marcar|encaixe|hoje|amanha|\b\d{1,2}h\b|\b\d{1,2}:\d{2}\b|as\s*\d{1,2})/.test(text);

  // LEAD QUENTE (barbeiro + horário)
  if (citouBarbeiro && pediuHorario) {
    return { intent: "lead_quente", status: "lead_quente", needsHuman: true };
  }

  // Citou barbeiro sem horário => agendamento
  if (citouBarbeiro) {
    return { intent: "agendamento", status: "quer_agendar", needsHuman: false };
  }

  // PREÇO (só se perguntar)
  if (hasAny(["preco", "valor", "quanto", "custa"])) {
    return { intent: "preco", status: "perguntando_preco", needsHuman: false };
  }

  // ENDEREÇO
  if (hasAny(["endereco", "onde fica", "localizacao", "rua"])) {
    return { intent: "endereco", status: "perguntando_endereco", needsHuman: false };
  }

  // AGENDAMENTO (geral)
  if (hasAny(["horario", "agenda", "agendar", "marcar", "tem vaga", "tem hoje", "amanha", "sabado", "sexta", "quinta", "quarta", "terca"])) {
    return { intent: "agendamento", status: "quer_agendar", needsHuman: false };
  }

  return { intent: "geral", status: "novo", needsHuman: false };
}

export function quickReply(intent, message = "") {
  const text = normalize(message);

  if (intent === "preco") {
    return "Boa! Cabelo fica R$60 e barba R$50. O combo completo fica R$110. Quer que eu veja um horário pra você essa semana?";
  }

  if (intent === "endereco") {
    return "A Gameplay fica na Rua Visconde do Rio Branco, 345, Vila Jardini, Sorocaba. Quer que eu te ajude a garantir um horário?";
  }

  if (intent === "humano") {
    return "Fechou, vou chamar alguém da equipe pra te responder certinho aqui.";
  }

  if (intent === "reclamacao") {
    return "Poxa, entendi. Vou chamar alguém da equipe pra ver isso com atenção e te responder certinho aqui.";
  }

  if (intent === "lead_quente") {
    const isMurilo = /(mur|muri|muril|murilo|muriio)/.test(text);
    const isGiro = /(giro|girosan)/.test(text);
    const barbeiro = isMurilo ? "Murilo" : isGiro ? "Giro" : "a equipe";
    return `Fechou! Com o ${barbeiro}. Vai ser cabelo, barba ou combo (cabelo + barba)?`;
  }

  if (intent === "agendamento") {
    // Se já citou barbeiro, pergunta o serviço
    if (/(mur|muri|muril|murilo|muriio|giro|girosan)/.test(text)) {
      return "Fechou! Vai ser cabelo, barba ou combo (cabelo + barba)?";
    }

    // Se já citou serviço, pergunta barbeiro
    if (text.includes("cabelo") || text.includes("barba")) {
      return "Fechou. Tem preferência com Murilo, Giro/Girosan ou pode ser qualquer um?";
    }

    return "Boa! Pra qual serviço seria: cabelo, barba ou cabelo + barba?";
  }

  return null;
}