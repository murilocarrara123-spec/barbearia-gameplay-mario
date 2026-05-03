const conversationList = document.getElementById("conversationList");
const refreshBtn = document.getElementById("refreshBtn");
const sendTestBtn = document.getElementById("sendTestBtn");

const agentSelect = document.getElementById("agentSelect");
const phoneInput = document.getElementById("phoneInput");
const messageInput = document.getElementById("messageInput");
const testResult = document.getElementById("testResult");

async function loadConversations() {
  const response = await fetch("/api/conversations");
  const data = await response.json();

  const conversations = data.conversations || [];

  if (!conversations.length) {
    conversationList.innerHTML = `<p class="empty">Nenhuma conversa ainda. Faça um teste acima.</p>`;
    return;
  }

  conversationList.innerHTML = conversations.map(renderConversation).join("");

  // ✅ Resolve
  document.querySelectorAll("[data-resolve]").forEach((btn) => {
    btn.onclick = async () => {
      const key = btn.getAttribute("data-resolve");
      btn.textContent = "Resolvendo...";
      await fetch(`/api/conversations/${encodeURIComponent(key)}/resolve`, { method: "POST" });
      await loadConversations();
    };
  });

  // ✅ Copiar
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.onclick = async () => {
      const payload = btn.getAttribute("data-copy");
      const text = decodeURIComponent(payload);
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copiado ✅";
      setTimeout(() => (btn.textContent = "Copiar pro agendador"), 1200);
    };
  });
}

function renderConversation(conversation) {
  const lastSix = (conversation.messages || []).slice(-6);
  return `
    <article class="conversation ${conversation.needsHuman ? "hot" : ""}">
      <div class="conversation-header">
        <div>
          <div class="phone">${escapeHtml(conversation.phone || "")}</div>
          <div>
            <span class="badge">${escapeHtml(conversation.status || "")}</span>
            ${conversation.needsHuman ? `<span class="badge alert">Precisa humano</span>` : ""}
            ${conversation.resolved ? `<span class="badge">Resolvido</span>` : ""}
          </div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button data-copy="${encodeURIComponent(buildCopy(conversation))}">Copiar pro agendador</button>
          <button data-resolve="${escapeAttr(conversation.phone || "")}">Marcar resolvido</button>
        </div>
      </div>

      <div class="messages">
        ${lastSix.map((msg) => `
          <div class="msg">
            <strong>${msg.role === "user" ? "Cliente" : "Agente"}:</strong>
            ${escapeHtml(msg.content || "")}
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function buildCopy(conversation) {
  const key = conversation.phone || "";
  const rawPhone = key.includes("__") ? key.split("__")[1] : key;
  return `AGENDAR (Gameplay)
Telefone: ${rawPhone}
Status: ${conversation.status || ""}
Precisa humano: ${conversation.needsHuman ? "SIM" : "NÃO"}`;
}

function escapeHtml(text = "") {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function escapeAttr(text = "") {
  return escapeHtml(text).replaceAll('"', "&quot;");
}

sendTestBtn?.addEventListener("click", async () => {
  testResult.textContent = "Enviando...";
  const response = await fetch("/webhook/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent: agentSelect.value,
      from: phoneInput.value,
      message: messageInput.value
    })
  });
  const data = await response.json();
  testResult.textContent = JSON.stringify(data, null, 2);
  await loadConversations();
});

refreshBtn?.addEventListener("click", loadConversations);

loadConversations();
setInterval(loadConversations, 5000);