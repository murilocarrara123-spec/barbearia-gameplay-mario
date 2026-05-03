import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("data");
const DATA_FILE = path.join(DATA_DIR, "conversations.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadFromDisk() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (error) {
    console.error("Erro ao ler conversations.json:", error.message);
    return {};
  }
}

function saveToDisk(store) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar conversations.json:", error.message);
  }
}

const conversations = loadFromDisk();

export function getConversation(phone) {
  if (!conversations[phone]) {
    conversations[phone] = {
      phone,
      status: "novo",
      needsHuman: false,
      resolved: false,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  return conversations[phone];
}

export function addMessage(phone, role, content) {
  const conversation = getConversation(phone);

  conversation.messages.push({
    role,
    content,
    at: new Date().toISOString()
  });

  conversation.updatedAt = new Date().toISOString();

  // Evita histórico infinito no MVP
  if (conversation.messages.length > 30) {
    conversation.messages = conversation.messages.slice(-30);
  }

  saveToDisk(conversations);
  return conversation;
}

export function updateConversationStatus(phone, status, needsHuman = false) {
  const conversation = getConversation(phone);
  conversation.status = status || conversation.status;
  conversation.needsHuman = Boolean(needsHuman);
  conversation.resolved = false;
  conversation.updatedAt = new Date().toISOString();
  saveToDisk(conversations);
  return conversation;
}

export function markResolved(phone) {
  const conversation = getConversation(phone);
  conversation.needsHuman = false;
  conversation.resolved = true;
  conversation.status = "resolvido";
  conversation.updatedAt = new Date().toISOString();
  saveToDisk(conversations);
  return conversation;
}

export function listConversations() {
  return Object.values(conversations).sort((a, b) => {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}
