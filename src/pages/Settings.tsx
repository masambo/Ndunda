import AppLayout from "@/components/layout/AppLayout";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  Globe,
  Moon,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages } from "@/i18n";

const Settings = () => {
  const { t, language } = useLanguage();
  const languageLabel = languages.find((l) => l.code === language)?.nativeLabel ?? "English";

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    Notifications: true,
    "Dark Mode": false,
  });

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", path: "/profile" },
        { icon: Lock, label: "Change Password", path: "/login" },
        { icon: Smartphone, label: "Phone Number", path: "/profile" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", toggle: true },
        { icon: Globe, label: t.settings.language, path: "/select-language", value: languageLabel },
        { icon: Moon, label: "Dark Mode", toggle: true },
      ],
    },
  ];

  const handleToggle = (label: string) => {
    setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6">
        <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t.settings.back}</span>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.settings.title}</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                {group.title}
              </h2>
              <div className="bg-card rounded-2xl overflow-hidden shadow-card">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="flex-1 font-medium text-foreground">{item.label}</span>
                      {item.toggle ? (
                        <button
                          type="button"
                          onClick={() => handleToggle(item.label)}
                          className={`w-12 h-7 rounded-full transition-colors ${
                            toggles[item.label] ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-card rounded-full shadow transition-transform ${
                              toggles[item.label] ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      ) : item.value ? (
                        <>
                          <span className="text-sm text-muted-foreground">{item.value}</span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  );

                  return item.path ? (
                    <Link key={item.label} to={item.path}>
                      {content}
                    </Link>
                  ) : (
                    <div key={item.label}>{content}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">Ndunda v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Made with ❤️ in Namibia</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
