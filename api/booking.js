const TELEGRAM_API_BASE = "https://api.telegram.org";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTelegramMessage(payload) {
  const {
    firstName = "",
    lastName = "",
    contact = "",
    request = "",
    sentAt = "",
  } = payload || {};

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const sentDate = sentAt ? new Date(sentAt).toLocaleString("ru-RU") : "";

  const lines = [
    "<b>Новая заявка с сайта pro.yavlenie</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(fullName || "Не указано")}`,
    `<b>Контакт:</b> ${escapeHtml(contact || "Не указан")}`,
  ];

  if (request) {
    lines.push(`<b>Запрос:</b> ${escapeHtml(request)}`);
  }

  if (sentDate) {
    lines.push(`<b>Отправлено:</b> ${escapeHtml(sentDate)}`);
  }

  return lines.join("\n");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return response.status(500).json({
      ok: false,
      error: "Telegram integration is not configured",
    });
  }

  let payload;

  try {
    payload =
      typeof request.body === "string"
        ? JSON.parse(request.body || "{}")
        : request.body || {};
  } catch (error) {
    return response.status(400).json({
      ok: false,
      error: "Invalid JSON payload",
    });
  }

  if (!payload.firstName || !payload.contact) {
    return response.status(400).json({
      ok: false,
      error: "Missing required fields",
    });
  }

  try {
    const telegramResponse = await fetch(
      `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: buildTelegramMessage(payload),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      return response.status(502).json({
        ok: false,
        error: "Telegram API request failed",
        details: telegramResult,
      });
    }
  } catch (error) {
    return response.status(502).json({
      ok: false,
      error: "Telegram API request failed",
    });
  }

  return response.status(200).json({ ok: true });
}
