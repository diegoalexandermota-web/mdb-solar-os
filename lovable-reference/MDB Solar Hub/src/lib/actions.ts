import { toast } from "sonner";

/** Strip non-digits; preserve leading + for international. */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/[^\d]/g, "");
}

export function telHref(phone?: string | null) {
  const p = normalizePhone(phone);
  return p ? `tel:${p}` : "";
}
export function smsHref(phone?: string | null, body?: string) {
  const p = normalizePhone(phone);
  if (!p) return "";
  return body ? `sms:${p}?&body=${encodeURIComponent(body)}` : `sms:${p}`;
}
export function waHref(phone?: string | null, text?: string) {
  const p = normalizePhone(phone).replace(/^\+/, "");
  if (!p) return "";
  return text ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : `https://wa.me/${p}`;
}
export function mailHref(email?: string | null, subject?: string, body?: string) {
  if (!email) return "";
  const q = new URLSearchParams();
  if (subject) q.set("subject", subject);
  if (body) q.set("body", body);
  const qs = q.toString();
  return qs ? `mailto:${email}?${qs}` : `mailto:${email}`;
}

/** Open a URL in a new tab, with a clear toast if no URL is available. */
export function openExternal(href: string, missingMsg = "No contact info available.") {
  if (!href) {
    toast.error(missingMsg);
    return;
  }
  // tel:, sms:, mailto: schemes are commonly blocked by window.open popup
  // blockers (silent no-op). Use location navigation for those, which the
  // browser then hands off to the OS handler.
  if (/^(tel:|sms:|mailto:)/i.test(href)) {
    window.location.href = href;
    return;
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

export async function copyToClipboard(text: string, successMsg = "Message copied.") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMsg);
  } catch {
    toast.error("Could not copy to clipboard.");
  }
}

export function comingSoon(label = "This feature") {
  toast(`${label} is coming soon.`);
}