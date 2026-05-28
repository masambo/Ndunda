import type { LanguageCode, LanguageOption, Translations } from "./types";
import { en } from "./locales/en";
import { af } from "./locales/af";
import { de } from "./locales/de";
import { ng } from "./locales/ng";
import { ruk } from "./locales/ruk";

export type { LanguageCode, LanguageOption, Translations };

export const STORAGE_KEYS = {
  language: "ndunda_language",
  city: "ndunda_city",
  setupComplete: "ndunda_setup_complete",
  listingMode: "ndunda_listing_mode",
} as const;

export const languages: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "af", label: "Afrikaans", nativeLabel: "Afrikaans" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "ng", label: "Oshiwambo", nativeLabel: "Oshiwambo" },
  { code: "ruk", label: "Rukwangali", nativeLabel: "Rurero rukwangali" },
];

const catalogs: Record<LanguageCode, Translations> = { en, af, de, ng, ruk };

export function getTranslations(code: LanguageCode): Translations {
  return catalogs[code] ?? en;
}

export const namibiaCities = {
  popular: [
    "Windhoek",
    "Walvis Bay",
    "Swakopmund",
    "Oshakati",
    "Rundu",
    "Katima Mulilo",
  ],
  all: [
    "Windhoek",
    "Walvis Bay",
    "Swakopmund",
    "Oshakati",
    "Rundu",
    "Katima Mulilo",
    "Otjiwarongo",
    "Keetmanshoop",
    "Gobabis",
    "Lüderitz",
    "Tsumeb",
    "Okahandja",
    "Ondangwa",
    "Eenhana",
    "Outjo",
    "Mariental",
    "Nkurenkuru",
  ],
} as const;
