import { Home, Heart, PlusCircle, User, UsersRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import ProfileNavAvatar from "./ProfileNavAvatar";

const navItems = [
  { icon: Home, labelKey: "home" as const, path: "/" },
  { icon: Heart, labelKey: "favorites" as const, path: "/saved-properties" },
  { icon: PlusCircle, labelKey: "listProperty" as const, path: "/add-listing" },
  { icon: UsersRound, labelKey: "agents" as const, path: "/agents" },
  { icon: User, labelKey: "profile" as const, path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_20px_-4px_hsl(0_0%_0%/0.08)]">
      <div className="max-w-md mx-auto px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            const label = t.nav[item.labelKey];

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 min-w-[4rem] py-1.5 rounded-xl transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.labelKey === "profile" ? (
                  <ProfileNavAvatar
                    active={active}
                    className="h-6 w-6 text-[10px]"
                    iconClassName="w-6 h-6"
                  />
                ) : (
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      active && item.labelKey === "favorites" && "fill-primary",
                    )}
                  />
                )}
                <span className={cn("text-xs font-medium", active && "text-primary")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
