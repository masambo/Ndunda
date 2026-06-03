import { useEffect, useMemo, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const INSTALL_DISMISSED_KEY = "ndunda_pwa_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  const ios = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isIos();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isStandalone()) return;
    if (localStorage.getItem(INSTALL_DISMISSED_KEY) === "true") return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      window.setTimeout(() => setVisible(true), 1400);
    };

    const handleInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
      localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    const iosTimer = window.setTimeout(() => {
      if (ios && !installEvent && !isStandalone()) {
        setShowIosHint(true);
        setVisible(true);
      }
    }, 1800);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.clearTimeout(iosTimer);
    };
  }, [installEvent, ios]);

  if (!visible || (!installEvent && !showIosHint)) return null;

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    }
    setInstallEvent(null);
    setVisible(false);
  };

  return (
    <aside className="fixed inset-x-3 bottom-24 z-[70] mx-auto max-w-md rounded-lg border border-border bg-card p-4 shadow-lifted md:bottom-5 md:right-5 md:left-auto md:mx-0">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Install Ndunda</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {showIosHint
                  ? "Tap Share, then Add to Home Screen."
                  : "Add it to your home screen for quick access."}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            {installEvent ? (
              <Button type="button" size="sm" onClick={() => void install()}>
                <Download className="mr-2 h-4 w-4" />
                Install
              </Button>
            ) : (
              <Button type="button" size="sm" variant="outline" disabled>
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              Later
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
