import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Home, KeyRound, Search } from "lucide-react";

const slides = [
  { icon: Search, key: "slide1" as const },
  { icon: Home, key: "slide2" as const },
  { icon: KeyRound, key: "slide3" as const },
];

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const titles = [
    t.onboarding.slide1Title,
    t.onboarding.slide2Title,
    t.onboarding.slide3Title,
  ];
  const descriptions = [
    t.onboarding.slide1Desc,
    t.onboarding.slide2Desc,
    t.onboarding.slide3Desc,
  ];

  const finish = () => navigate("/select-language");
  const isLast = step === slides.length - 1;
  const Icon = slides[step].icon;

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={finish}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t.onboarding.skip}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-4">
        <div className="w-full max-w-xs aspect-square rounded-full bg-primary/10 flex items-center justify-center mb-8">
          <Icon className="w-24 h-24 text-primary" strokeWidth={1.25} />
        </div>
      </div>

      <div className="bg-card rounded-t-3xl px-6 pt-8 pb-8 shadow-lifted">
        <h1 className="text-2xl font-bold text-center text-foreground mb-3">
          {titles[step]}
        </h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8 px-2">
          {descriptions[step]}
        </p>

        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "w-8 bg-primary" : "w-2 bg-primary/25",
              )}
            />
          ))}
        </div>

        <Button
          className="w-full h-12 rounded-2xl text-base font-semibold"
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
        >
          {isLast ? t.onboarding.getStarted : t.onboarding.next}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
