import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/home/PropertyCard";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Edit,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  MapPin,
  Phone,
  Plus,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useClerk, useUser } from "@clerk/react";
import { useUserProfile, useUserStats } from "@/hooks/useUserProfile";
import { useOwnerProperties } from "@/hooks/useProperties";
import { toast } from "sonner";
import { useState } from "react";
import EditProfileDialog from "@/components/profile/EditProfileDialog";

const Profile = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { profile, convexProfile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const role = convexProfile?.role ?? profile?.role ?? "customer";
  const isAgent = role === "agent";
  const isAdmin = role === "admin";
  const isAgentProfile = isAgent || isAdmin;
  const { stats } = useUserStats(isAgent);
  const { properties: activeProfileListings } = useOwnerProperties(
    isAgent ? profile?._id : undefined,
    { status: "active", limit: 12 },
  );
  const displayName =
    profile?.fullName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Guest User";
  const userEmail = user?.primaryEmailAddress?.emailAddress || profile?.email || "";
  const avatarUrl = profile?.avatarUrl || user?.imageUrl || "";
  const coverPhotoUrl = profile?.coverPhotoUrl || "";
  const roleLabel = role === "admin" ? "Admin" : role === "agent" ? "Verified Agent" : "Customer";

  const menuItems = [
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: HelpCircle, label: "Help & Support", path: "/help" },
    ...(isAdmin
      ? [{ icon: LayoutDashboard, label: "Admin Dashboard", path: "/admin" }]
      : []),
  ];

  if (!isLoaded || (isSignedIn && profileLoading && !convexProfile)) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-5 pb-6 md:px-0 md:pt-8 md:pb-10 md:container md:max-w-6xl md:mx-auto">
        {isSignedIn ? (
          <div className={isAgentProfile ? "grid gap-6" : "grid gap-6 lg:grid-cols-[22rem_1fr]"}>
            {!isAgentProfile && (
            <aside className="bg-card border border-border rounded-lg p-5 shadow-card h-fit">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                  )}
                  {(role === "agent" || role === "admin") && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                      {role === "admin" ? (
                        <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                      ) : (
                        <BadgeCheck className="w-5 h-5 text-primary-foreground" />
                      )}
                    </div>
                  )}
                </div>
                <h1 className="text-xl font-semibold text-foreground mt-4">{displayName}</h1>
                <p className="text-sm text-primary font-semibold">{roleLabel}</p>
                {profile?.agentStatus === "pending" && (
                  <span className="mt-2 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                    Agent application pending
                  </span>
                )}
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                {userEmail && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </aside>
            )}

            <main className="space-y-6">
              {isAgentProfile && (
                <section className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-card">
                  {coverPhotoUrl && (
                    <img
                      src={coverPhotoUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div
                    className={
                      coverPhotoUrl
                        ? "absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/20"
                        : "absolute inset-0 bg-primary"
                    }
                  />
                  <div className="relative p-5 text-white md:p-7">
                    <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                      <div className="relative mx-auto md:mx-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-28 w-28 rounded-full border-2 border-primary-foreground/40 object-cover"
                          />
                        ) : (
                          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-primary-foreground/40 bg-primary-foreground/15">
                            <User className="h-12 w-12 text-primary-foreground" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-card">
                          {role === "admin" ? (
                            <ShieldCheck className="h-5 w-5 text-primary" />
                          ) : (
                            <BadgeCheck className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 text-center md:text-left">
                        <p className="text-sm font-semibold text-white/85">{roleLabel}</p>
                        <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{displayName}</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/90 md:text-base">
                          {profile?.bio || "Add a short bio so clients understand your experience, service area, and property focus."}
                        </p>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <AgentProfileFact label="Agency" value={profile?.agencyName || "Independent"} />
                          <AgentProfileFact label="Specialty" value={profile?.specialty || "Property specialist"} />
                          <AgentProfileFact label="Location" value={profile?.location || "Namibia"} />
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 md:w-48 md:grid-cols-1">
                        <Button
                          variant="secondary"
                          className="w-full bg-card text-primary hover:bg-card/90"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                        <Button asChild variant="outline" className="w-full border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                          <Link to="/add-listing">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Listing
                          </Link>
                        </Button>
                        {role === "agent" && profile?._id && (
                          <Button asChild variant="outline" className="w-full border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                            <Link to={`/agents/${profile._id}`}>Public View</Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 border-t border-white/25 pt-5 text-sm md:grid-cols-3">
                      {userEmail && (
                        <div className="flex items-center gap-2 text-white/90">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{userEmail}</span>
                        </div>
                      )}
                      {(profile?.whatsapp || profile?.phone) && (
                        <div className="flex items-center gap-2 text-white/90">
                          <MessageCircle className="h-4 w-4" />
                          <span>{profile.whatsapp || profile.phone}</span>
                        </div>
                      )}
                      {profile?.phone && (
                        <div className="flex items-center gap-2 text-white/90">
                          <Phone className="h-4 w-4" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {isAgent && (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-xl md:text-2xl font-semibold text-primary">{activeProfileListings.length}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Active</p>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-xl md:text-2xl font-semibold text-primary">{stats.listings}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Listings</p>
                  </div>
                </div>
              )}

              {isAgent && (
                <section className="bg-card border border-border rounded-lg p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">My Agent Listings</h2>
                      <p className="text-sm text-muted-foreground">
                        {activeProfileListings.length} active {activeProfileListings.length === 1 ? "listing" : "listings"} on your profile.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/my-listings">Manage</Link>
                    </Button>
                  </div>

                  {activeProfileListings.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center">
                      <Home className="mx-auto h-10 w-10 text-muted-foreground" />
                      <h3 className="mt-3 font-semibold text-foreground">No active listings yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Publish a listing to make it appear on your agent profile.</p>
                      <Button asChild className="mt-4">
                        <Link to="/add-listing">Add Listing</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {activeProfileListings.slice(0, 6).map((property) => (
                        <PropertyCard
                          key={property.id}
                          id={property.id}
                          title={property.title}
                          location={property.location}
                          price={property.price}
                          image={property.images?.[0] || "/placeholder.svg"}
                          images={property.images}
                          ownerName={property.owner_name || property.owner_email}
                          ownerAvatarUrl={property.owner_avatar_url}
                          ownerRole={property.owner_role}
                          bedrooms={property.bedrooms}
                          bathrooms={property.bathrooms}
                          size={property.size || 0}
                          type={property.type}
                          isNew={property.is_new}
                          listingMode={property.listing_mode}
                          rentalType={property.rental_type}
                          pricingModel={
                            property.rental_type === "short-term"
                              ? {
                                  daily: property.daily_price ?? undefined,
                                  weekly: property.weekly_price ?? undefined,
                                  monthly: property.monthly_price ?? undefined,
                                }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {!isAgentProfile && (
                <Link to="/become-agent" className="block">
                  <div className="bg-secondary rounded-lg p-4 flex items-center gap-4 border border-primary/10">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BadgeCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Become an Agent</h3>
                      <p className="text-sm text-muted-foreground">Apply to become a verified Ndunda agent.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              )}

              <div className="bg-card rounded-lg overflow-hidden shadow-card border border-border">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="flex-1 font-medium text-foreground">{item.label}</span>
                      {typeof item.count === "number" && item.count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-4 px-4 py-4 w-full rounded-lg hover:bg-destructive/5 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <span className="font-medium text-destructive">
                  {isSigningOut ? "Signing out..." : "Sign Out"}
                </span>
              </button>
            </main>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">Guest User</h2>
                <p className="text-sm text-muted-foreground">Sign in to save properties and manage listings.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/login">
                <Button variant="hero" size="lg" className="w-full">Sign In</Button>
              </Link>
              <Link to="/login?mode=signup">
                <Button variant="outline" size="lg" className="w-full">Register</Button>
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ndunda v1.0.0
        </p>

        {isSignedIn && (
          <EditProfileDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            profile={{
              full_name: profile?.fullName ?? user?.fullName ?? null,
              phone: profile?.phone ?? null,
              avatar_url: avatarUrl || null,
              cover_photo_url: coverPhotoUrl || null,
              location: profile?.location ?? null,
              bio: profile?.bio ?? null,
              agency_name: profile?.agencyName ?? null,
              specialty: profile?.specialty ?? null,
              whatsapp: profile?.whatsapp ?? null,
              role,
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

function AgentProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm">
      <p className="text-xs text-white/75">{label}</p>
      <p className="truncate font-semibold text-white">{value}</p>
    </div>
  );
}

export default Profile;
