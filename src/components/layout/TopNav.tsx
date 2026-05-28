import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, Heart, Bell, UsersRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import ProfileNavAvatar from "./ProfileNavAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";

const TopNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { profile } = useUserProfile();

  const navItems = [
    { path: "/", label: t.nav.home, icon: Home },
    { path: "/agents", label: t.nav.agents, icon: UsersRound },
    { path: "/add-listing", label: t.nav.listProperty, icon: PlusCircle },
    { path: "/saved-properties", label: t.nav.favorites, icon: Heart },
    ...(profile?.role === "admin"
      ? [{ path: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <img
              src="/Ndunda_logo.png"
              alt="Ndunda"
              className="h-14 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/notifications">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative w-11 h-11",
                  location.pathname === "/notifications" && "bg-primary/10 text-primary"
                )}
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full" />
              </Button>
            </Link>
            <Link to="/profile">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-11 h-11",
                  location.pathname === "/profile" && "bg-primary/10 text-primary"
                )}
                aria-label="Profile"
              >
                <ProfileNavAvatar
                  active={location.pathname === "/profile"}
                  className="h-9 w-9"
                />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
