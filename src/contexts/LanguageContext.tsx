import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getTranslations,
  STORAGE_KEYS,
  type LanguageCode,
  type Translations,
} from "@/i18n";

interface LanguageContextValue {
  language: LanguageCode;
  t: Translations;
  setLanguage: (code: LanguageCode) => void;
  city: string;
  setCity: (city: string) => void;
  listingMode: "buy" | "rent";
  setListingMode: (mode: "buy" | "rent") => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function readLanguage(): LanguageCode {
  const stored = localStorage.getItem(STORAGE_KEYS.language);
  if (stored === "en" || stored === "af" || stored === "de" || stored === "ng" || stored === "ruk") {
    return stored;
  }
  return "en";
}

function readCity(): string {
  return localStorage.getItem(STORAGE_KEYS.city) ?? "Windhoek";
}

function readListingMode(): "buy" | "rent" {
  const stored = localStorage.getItem(STORAGE_KEYS.listingMode);
  return stored === "buy" ? "buy" : "rent";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(readLanguage);
  const [city, setCityState] = useState(readCity);
  const [listingMode, setListingModeState] = useState<"buy" | "rent">(readListingMode);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEYS.language, code);
  }, []);

  const setCity = useCallback((value: string) => {
    setCityState(value);
    localStorage.setItem(STORAGE_KEYS.city, value);
  }, []);

  const setListingMode = useCallback((mode: "buy" | "rent") => {
    setListingModeState(mode);
    localStorage.setItem(STORAGE_KEYS.listingMode, mode);
  }, []);

  const t = useMemo(() => getTranslations(language), [language]);

  const value = useMemo(
    () => ({ language, t, setLanguage, city, setCity, listingMode, setListingMode }),
    [language, t, setLanguage, city, setCity, listingMode, setListingMode],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
