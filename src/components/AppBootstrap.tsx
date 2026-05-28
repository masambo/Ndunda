import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { STORAGE_KEYS } from "@/i18n";

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const SETUP_ROUTES = ["/onboarding", "/select-language", "/choose-city", "/login"];
const FIRST_RUN_ALLOWED_ROUTES = [
  ...SETUP_ROUTES,
  "/",
  "/search",
  "/property",
  "/agents",
  "/help",
];

function isAllowedBeforeSetup(pathname: string) {
  return FIRST_RUN_ALLOWED_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function isMobileViewport() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export function AppBootstrap({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMobileViewport()) return;

    const complete = localStorage.getItem(STORAGE_KEYS.setupComplete) === "true";

    if (!complete && !isAllowedBeforeSetup(location.pathname)) {
      navigate("/onboarding", { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}
