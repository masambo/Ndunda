import { User } from "lucide-react";
import { useAuth, useUser } from "@clerk/react";
import { cn } from "@/lib/utils";

interface ProfileNavAvatarProps {
  active?: boolean;
  className?: string;
  iconClassName?: string;
}

const getInitials = (name?: string | null, email?: string | null) => {
  const fallback = email?.split("@")[0] ?? "";
  const source = name?.trim() || fallback.trim();
  if (!source) return "U";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const ProfileNavAvatar = ({ active, className, iconClassName }: ProfileNavAvatarProps) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded || !isSignedIn || !user) {
    return <User className={cn("w-6 h-6", iconClassName)} />;
  }

  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const initials = getInitials(user.fullName, email);

  if (user.imageUrl) {
    return (
      <img
        src={user.imageUrl}
        alt={user.fullName || email || "Profile"}
        className={cn(
          "h-8 w-8 rounded-full border object-cover",
          active ? "border-primary" : "border-border",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full border bg-primary/10 text-xs font-bold text-primary",
        active ? "border-primary" : "border-primary/20",
        className,
      )}
    >
      {initials}
    </span>
  );
};

export default ProfileNavAvatar;
