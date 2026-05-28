import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages, type LanguageCode } from "@/i18n";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const SelectLanguage = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode>(language);

  const handleNext = () => {
    setLanguage(selected);
    navigate("/choose-city");
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="bg-secondary/80 px-4 py-6 text-center">
        <h1 className="text-lg font-bold text-foreground">{t.language.title}</h1>
      </header>

      <div className="flex-1 px-4 pb-6">
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelected(lang.code)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-4 text-left transition-colors",
                index > 0 && "border-t border-border",
                selected === lang.code && "bg-primary/5",
              )}
            >
              <div>
                <p className="font-medium text-foreground">{lang.nativeLabel}</p>
                <p className="text-xs text-muted-foreground">{lang.label}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selected === lang.code
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40",
                )}
              >
                {selected === lang.code && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-8">
        <Button
          className="w-full h-12 rounded-2xl text-base font-semibold"
          onClick={handleNext}
        >
          {t.language.next}
        </Button>
      </div>
    </div>
  );
};

export default SelectLanguage;
