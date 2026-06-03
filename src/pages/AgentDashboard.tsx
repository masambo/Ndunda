import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/home/PropertyCard";
import { useUserProfile } from "@/hooks/useUserProfile";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  Clock,
  Eye,
  Home,
  MessageCircle,
  Phone,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useMemo } from "react";

const AgentDashboard = () => {
  const { profile, loading } = useUserProfile();
  const convexAuth = useConvexAuth();
  const convexListings = useQuery(
    api.properties.mine,
    convexAuth.isAuthenticated ? {} : "skip",
  );
  const leadStats = useQuery(
    api.bookings.leadStats,
    convexAuth.isAuthenticated ? {} : "skip",
  );

  const listings = useMemo(
    () =>
      (convexListings ?? []).map((property: Doc<"properties">) => ({
        id: property._id,
        title: property.title,
        location: property.location,
        price: property.price,
        image: property.images[0] || "/placeholder.svg",
        images: property.images,
        ownerName: property.owner?.fullName || property.owner?.email || null,
        ownerAvatarUrl: property.owner?.avatarUrl || null,
        ownerRole: property.owner?.role || null,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size: property.size || 0,
        type: property.type,
        status: property.status,
        views: property.views ?? 0,
        rentalType: property.rentalType,
        listingMode: property.listingMode,
      })),
    [convexListings],
  );

  const activeListings = listings.filter((listing) => listing.status === "active").length;
  const pendingListings = listings.filter((listing) => listing.status !== "active").length;
  const totalViews = listings.reduce((sum, listing) => sum + listing.views, 0);
  const hasAgentAccess = profile?.role === "agent" || profile?.role === "admin";
  const profileStrength = [
    profile?.avatarUrl,
    profile?.phone,
    profile?.whatsapp,
    profile?.location,
    profile?.bio,
    profile?.specialty,
  ].filter(Boolean).length;
  const profileScore = Math.round((profileStrength / 6) * 100);

  if (loading || convexAuth.isLoading || (convexAuth.isAuthenticated && convexListings === undefined)) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!convexAuth.isAuthenticated) {
    return (
      <AppLayout>
        <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-4 text-center">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <BriefcaseBusiness className="mx-auto mb-3 h-10 w-10" />
            <h1 className="text-lg font-semibold">Agent dashboard needs Convex auth</h1>
            <p className="mt-2 text-sm">
              Clerk is signed in, but Convex has not received a valid Clerk Convex token yet.
              Create the Clerk JWT template named "convex", sign out, and sign back in.
            </p>
            <Button asChild variant="outline" className="mt-4 bg-white">
              <Link to="/profile">Back to Profile</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!hasAgentAccess) {
    return <Navigate to={profile?.agentStatus === "pending" ? "/profile" : "/become-agent"} replace />;
  }

  return (
    <AppLayout>
      <div className="px-4 pt-5 pb-8 md:px-0 md:pt-8 md:pb-10 md:container md:max-w-7xl md:mx-auto">
        <section className="bg-primary text-primary-foreground rounded-2xl p-5 md:p-7 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
                <BriefcaseBusiness className="h-7 w-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Approved Agent
                </div>
                <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Agent Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
                  Manage your listings, profile readiness, and client contact channels from one place.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Button asChild className="bg-card text-primary hover:bg-card/90">
                <Link to="/add-listing">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Listing
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/my-listings">
                  <Home className="h-4 w-4 mr-2" />
                  My Listings
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Home} label="Active Listings" value={activeListings} />
          <StatCard icon={Clock} label="Pending Listings" value={pendingListings} />
          <StatCard icon={Eye} label="Total Views" value={totalViews} />
          <StatCard icon={MessageCircle} label="New Leads" value={leadStats?.newLeads ?? 0} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <main className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground md:text-xl">Listing Performance</h2>
                  <p className="text-sm text-muted-foreground">A quick view of your newest properties.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/my-listings">
                    View all
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {listings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Home className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-3 font-semibold text-foreground">No listings yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Create your first property listing to start receiving client interest.</p>
                  <Button asChild className="mt-4">
                    <Link to="/add-listing">Add Listing</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {listings.slice(0, 3).map((listing) => (
                    <div key={listing.id} className="relative">
                      <PropertyCard {...listing} />
                      <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold capitalize text-foreground shadow-sm">
                        {listing.status}
                      </span>
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
                        <Eye className="h-3 w-3" />
                        {listing.views}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <ActionCard
                icon={MessageCircle}
                title="WhatsApp Leads"
                description={`${leadStats?.viewings ?? 0} viewing requests are stored from property pages.`}
              />
              <ActionCard
                icon={Phone}
                title="Phone Calls"
                description="Keep your phone number updated so clients can contact you directly."
              />
              <ActionCard
                icon={BarChart3}
                title="Performance"
                description={`${leadStats?.bookings ?? 0} booking requests are stored for short-term listings.`}
              />
            </section>
          </main>

          <aside className="space-y-4">
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName || "Agent"} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-foreground">{profile?.fullName || "Agent Profile"}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.specialty || "Property specialist"}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Profile readiness</span>
                  <span className="font-semibold text-primary">{profileScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${profileScore}%` }} />
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <ProfileField label="Agency" value={profile?.agencyName || "Independent"} />
                <ProfileField label="Location" value={profile?.location || "Not set"} />
                <ProfileField label="WhatsApp" value={profile?.whatsapp || profile?.phone || "Not set"} />
              </div>

              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </section>

            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-bold text-foreground">Next Steps</h2>
              <div className="mt-4 space-y-3">
                <ChecklistItem complete={Boolean(profile?.avatarUrl)} label="Upload profile image" />
                <ChecklistItem complete={Boolean(profile?.whatsapp || profile?.phone)} label="Add contact number" />
                <ChecklistItem complete={Boolean(profile?.bio)} label="Write agent bio" />
                <ChecklistItem complete={listings.length > 0} label="Publish first listing" />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: number }) => (
  <div className="rounded-lg border border-border bg-card p-4 shadow-card">
    <div className="flex items-center justify-between">
      <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-xl font-semibold text-foreground">{value.toLocaleString()}</p>
    </div>
    <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>
  </div>
);

const ActionCard = ({ icon: Icon, title, description }: { icon: typeof Home; title: string; description: string }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);

const ProfileField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="truncate font-medium text-foreground">{value}</span>
  </div>
);

const ChecklistItem = ({ complete, label }: { complete: boolean; label: string }) => (
  <div className="flex items-center gap-3">
    <div className={complete ? "h-5 w-5 rounded-full bg-primary" : "h-5 w-5 rounded-full border border-border"} />
    <span className={complete ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"}>{label}</span>
  </div>
);

export default AgentDashboard;
