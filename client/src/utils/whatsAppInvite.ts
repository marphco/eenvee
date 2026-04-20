/** Solo cifre per costruire il numero wa.me (senza +). */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Converte un numero grezzo in formato internazionale per wa.me (solo cifre).
 * Ottimizzato per l’Italia (39 + cellulare 3xx…); altri formati plausibili passano se già numerici.
 */
export function toWhatsAppPhoneDigits(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  let d = digitsOnly(raw);
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);

  if (d.startsWith("39")) {
    if (d.length >= 11 && d.length <= 13) return d;
  }
  if (d.length === 10 && d[0] === "3") return `39${d}`;
  if (d.length === 11 && d[0] === "0") return `39${d.slice(1)}`;

  if (d.length >= 8 && d.length <= 15) return d;
  return null;
}

const MAX_WA_MESSAGE_CHARS = 2000;

export function trimMessageForWhatsAppUrl(message: string): string {
  if (message.length <= MAX_WA_MESSAGE_CHARS) return message;
  return `${message.slice(0, MAX_WA_MESSAGE_CHARS - 1)}…`;
}

export function interpolateInviteTemplate(
  template: string,
  name: string,
  link: string
): string {
  return template.replaceAll("{name}", name).replaceAll("{link}", link);
}

export function buildWhatsAppSendUrl(phoneDigits: string, message: string): string {
  const text = trimMessageForWhatsAppUrl(message);
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}
