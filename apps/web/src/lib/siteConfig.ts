function optionalValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalWebUrl(value: string | undefined): string | undefined {
  const trimmed = optionalValue(value);
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("URL must use http or https");
    }
    return url.toString();
  } catch (error) {
    throw new Error("VITE_STUDIO_INSTAGRAM_URL must be a valid HTTP(S) URL", {
      cause: error,
    });
  }
}

const rawWhatsappPhone =
  optionalValue(import.meta.env.VITE_STUDIO_WHATSAPP_PHONE) ?? "919500263774";
const whatsappPhone = rawWhatsappPhone?.replace(/\D/g, "");
const whatsappDisplayNumber =
  whatsappPhone?.startsWith("91") && whatsappPhone.length === 12
    ? `+91 ${whatsappPhone.slice(2, 7)} ${whatsappPhone.slice(7)}`
    : whatsappPhone
      ? `+${whatsappPhone}`
      : undefined;

if (
  rawWhatsappPhone &&
  (!whatsappPhone || whatsappPhone.length < 8 || whatsappPhone.length > 15)
) {
  throw new Error(
    "VITE_STUDIO_WHATSAPP_PHONE must contain 8 to 15 international digits",
  );
}

export const siteConfig = {
  name: optionalValue(import.meta.env.VITE_STUDIO_NAME) ?? "AK Photography Studio",
  tagline: optionalValue(import.meta.env.VITE_STUDIO_TAGLINE),
  establishedYear: optionalValue(import.meta.env.VITE_STUDIO_ESTABLISHED_YEAR),
  email: optionalValue(import.meta.env.VITE_STUDIO_EMAIL),
  phone: optionalValue(import.meta.env.VITE_STUDIO_PHONE),
  whatsappUrl: whatsappPhone ? `https://wa.me/${whatsappPhone}` : undefined,
  whatsappDisplayNumber,
  instagramUrl:
    optionalWebUrl(import.meta.env.VITE_STUDIO_INSTAGRAM_URL) ??
    "https://www.instagram.com/ak_studio_officials/",
  instagramHandle: "@ak_studio_officials",
};
