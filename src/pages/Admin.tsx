import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link, Navigate } from "react-router-dom";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  BadgeCheck,
  CheckCircle,
  Clock,
  Eye,
  Home,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type UserRole = "customer" | "agent" | "admin";
type PropertyStatus = "active" | "pending" | "sold" | "rented" | "inactive";

const propertyStatuses: PropertyStatus[] = ["active", "pending", "sold", "rented", "inactive"];

const money = new Intl.NumberFormat("en-NA", {
  style: "currency",
  currency: "NAD",
  maximumFractionDigits: 0,
});

const Admin = () => {
  const { profile, loading } = useUserProfile();
  const { isSignedIn, getToken } = useAuth();
  const authStatus = useConvexAuth();
  const overview = useQuery(api.users.adminOverview);
  const diagnostics = useQuery(api.users.authDiagnostics);
  const syncCurrentUser = useMutation(api.users.store);
  const approveAgent = useMutation(api.users.approveAgent);
  const rejectAgent = useMutation(api.users.rejectAgent);
  const setUserRole = useMutation(api.users.setUserRole);
  const updateStatus = useMutation(api.properties.adminUpdateStatus);
  const toggleVerified = useMutation(api.properties.adminToggleVerified);
  const toggleRecommended = useMutation(api.properties.adminToggleRecommended);
  const removeProperty = useMutation(api.properties.remove);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [propertyFilter, setPropertyFilter] = useState<"all" | PropertyStatus>("all");
  const [syncing, setSyncing] = useState(false);
  const [tokenDiagnostic, setTokenDiagnostic] = useState<{
    checked: boolean;
    convexTemplate: "available" | "missing" | "error";
    defaultToken: "available" | "missing" | "error";
    message?: string;
  }>({
    checked: false,
    convexTemplate: "missing",
    defaultToken: "missing",
  });

  const users = useMemo(() => overview?.users ?? [], [overview?.users]);
  const properties = useMemo(() => overview?.properties ?? [], [overview?.properties]);
  const query = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const haystack = `${user.fullName ?? ""} ${user.email} ${user.phone ?? ""} ${user.location ?? ""}`.toLowerCase();
      return matchesRole && (!query || haystack.includes(query));
    });
  }, [users, roleFilter, query]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesStatus = propertyFilter === "all" || property.status === propertyFilter;
      const haystack = `${property.title} ${property.location} ${property.type} ${property.owner?.email ?? ""}`.toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [properties, propertyFilter, query]);

  const hasClerkConvexToken = tokenDiagnostic.convexTemplate === "available";
  const hasConvexIdentity = Boolean(diagnostics?.authenticated);
  const authHelpMessage = hasClerkConvexToken
    ? "Clerk can issue the Convex token, but Convex is not accepting it yet. Set CLERK_JWT_ISSUER_DOMAIN on this Convex deployment, push the backend, then sign out and sign in again."
    : "Clerk is signed in, but it has no JWT template named \"convex\". Open Clerk Dashboard, create or activate the Convex JWT template, then sign out and sign in again.";

  useEffect(() => {
    let cancelled = false;

    async function checkTokens() {
      if (!isSignedIn) {
        setTokenDiagnostic({
          checked: true,
          convexTemplate: "missing",
          defaultToken: "missing",
          message: "No Clerk session is signed in.",
        });
        return;
      }

      try {
        const [convexToken, defaultToken] = await Promise.allSettled([
          getToken({ template: "convex" }),
          getToken(),
        ]);

        if (cancelled) return;

        setTokenDiagnostic({
          checked: true,
          convexTemplate:
            convexToken.status === "fulfilled"
              ? convexToken.value
                ? "available"
                : "missing"
              : "error",
          defaultToken:
            defaultToken.status === "fulfilled"
              ? defaultToken.value
                ? "available"
                : "missing"
              : "error",
          message:
            convexToken.status === "rejected"
              ? String(convexToken.reason)
              : undefined,
        });
      } catch (error) {
        if (!cancelled) {
          setTokenDiagnostic({
            checked: true,
            convexTemplate: "error",
            defaultToken: "error",
            message: error instanceof Error ? error.message : "Token check failed",
          });
        }
      }
    }

    void checkTokens();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  if (loading) {
    return (
      <AppLayout>
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!profile || profile.role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  const handleApprove = async (userId: Id<"users">) => {
    try {
      await approveAgent({ userId });
      toast.success("Agent approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve agent");
    }
  };

  const handleReject = async (userId: Id<"users">) => {
    try {
      await rejectAgent({ userId });
      toast.success("Application rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reject application");
    }
  };

  const handleRoleChange = async (userId: Id<"users">, role: UserRole) => {
    try {
      await setUserRole({ userId, role });
      toast.success(`User role changed to ${role}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update role");
    }
  };

  const handleStatusChange = async (id: Id<"properties">, status: PropertyStatus) => {
    try {
      await updateStatus({ id, status });
      toast.success(`Listing marked ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update listing");
    }
  };

  const handleToggleVerified = async (id: Id<"properties">, verified: boolean) => {
    try {
      await toggleVerified({ id, verified: !verified });
      toast.success(!verified ? "Listing verified" : "Verification removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update verification");
    }
  };

  const handleToggleRecommended = async (id: Id<"properties">, recommended?: boolean) => {
    try {
      await toggleRecommended({ id, recommended: !recommended });
      toast.success(!recommended ? "Listing recommended" : "Recommendation removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update recommendation");
    }
  };

  const handleRemoveProperty = async (id: Id<"properties">) => {
    try {
      await removeProperty({ id });
      toast.success("Listing removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove listing");
    }
  };

  const handleSyncCurrentUser = async () => {
    try {
      setSyncing(true);
      await syncCurrentUser({
        email: profile?.email,
        fullName: profile?.fullName,
        avatarUrl: profile?.avatarUrl,
      });
      toast.success("Current Clerk user synced into Convex");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sync current user");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pb-8 pt-5 md:container md:mx-auto md:max-w-7xl md:px-6 md:pt-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage approvals, user roles, and property quality from one place.
              </p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View App
            </Button>
          </Link>
        </div>

        {(!overview || !diagnostics?.user || !authStatus.isAuthenticated) && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold">Convex and Clerk sync needs attention</h2>
                <p className="mt-1 text-sm">
                  Convex auth: {authStatus.isAuthenticated ? "connected" : "not connected"} ·
                  Identity: {diagnostics?.authenticated ? diagnostics.identity?.email || "available" : "missing"} ·
                  User row: {diagnostics?.user ? "found" : "missing"}
                </p>
                <p className="mt-1 text-sm">
                  Clerk default token: {tokenDiagnostic.defaultToken} ·
                  Clerk Convex token template: {tokenDiagnostic.checked ? tokenDiagnostic.convexTemplate : "checking"}
                </p>
                <p className="mt-1 text-xs">{authHelpMessage}</p>
                {tokenDiagnostic.convexTemplate === "error" && (
                  <div className="mt-3 rounded-xl border border-amber-300 bg-white/70 p-3 text-xs">
                    <p className="font-semibold">Required Clerk setup</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-4">
                      <li>Open Clerk Dashboard for this app.</li>
                      <li>Go to <span className="font-semibold">JWT Templates</span> or <span className="font-semibold">Integrations → Convex</span>.</li>
                      <li>Create/enable the template named <span className="font-semibold">convex</span>.</li>
                      <li>Use issuer <span className="font-semibold">https://adapted-ladybug-29.clerk.accounts.dev</span>.</li>
                      <li>Sign out completely, then sign back in.</li>
                    </ol>
                  </div>
                )}
                {hasClerkConvexToken && !hasConvexIdentity && (
                  <div className="mt-3 rounded-xl border border-amber-300 bg-white/70 p-3 text-xs">
                    <p className="font-semibold">Required Convex setup</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-4">
                      <li>Run <span className="font-semibold">cmd /c npx convex env set CLERK_JWT_ISSUER_DOMAIN https://adapted-ladybug-29.clerk.accounts.dev</span>.</li>
                      <li>Run <span className="font-semibold">cmd /c npx convex dev --once</span> to push auth config and functions.</li>
                      <li>Sign out completely, then sign back in.</li>
                    </ol>
                  </div>
                )}
                {tokenDiagnostic.message && (
                  <p className="mt-1 text-xs text-amber-800">{tokenDiagnostic.message}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => void handleSyncCurrentUser()}
                disabled={syncing || !authStatus.isAuthenticated}
                className="bg-white"
              >
                {syncing ? "Syncing..." : "Sync Current User"}
              </Button>
            </div>
          </div>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat icon={Users} label="Users" value={overview?.stats.users ?? 0} />
          <Stat icon={BadgeCheck} label="Agents" value={overview?.stats.agents ?? 0} />
          <Stat icon={Clock} label="Pending Agents" value={overview?.stats.pendingAgents ?? 0} tone="warning" />
          <Stat icon={Home} label="Listings" value={overview?.stats.properties ?? 0} />
          <Stat icon={TrendingUp} label="Portfolio Value" value={money.format(overview?.stats.totalPropertyValue ?? 0)} />
        </div>

        <div className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users, listings, locations, email..."
              className="h-11 rounded-xl pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={propertyFilter} onValueChange={(value) => setPropertyFilter(value as typeof propertyFilter)}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Listing status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All listings</SelectItem>
              {propertyStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {label(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-muted p-1 md:w-[34rem]">
            <TabsTrigger value="agents" className="rounded-xl">
              Agent Review
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl">
              Users
            </TabsTrigger>
            <TabsTrigger value="listings" className="rounded-xl">
              Listings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-3">
            <SectionTitle
              title="Pending Agent Applications"
              description="Approve qualified applicants so they can access the agent dashboard and verified listing tools."
            />
            {overview?.pendingAgents.length ? (
              <div className="grid gap-3">
                {overview.pendingAgents.map((agent) => (
                  <UserRow key={agent._id} user={agent}>
                    <Button onClick={() => void handleApprove(agent._id)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => void handleReject(agent._id)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </UserRow>
                ))}
              </div>
            ) : (
              <EmptyState title="No pending applications" description="New agent applications will appear here for approval." />
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-3">
            <SectionTitle
              title="User Management"
              description="Review customer, agent, and admin accounts. Promote or downgrade roles for testing and operations."
            />
            {filteredUsers.length ? (
              <div className="grid gap-3">
                {filteredUsers.map((user) => (
                  <UserRow key={user._id} user={user}>
                    <Select value={user.role} onValueChange={(value) => void handleRoleChange(user._id, value as UserRole)}>
                      <SelectTrigger className="h-10 w-full rounded-xl md:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </UserRow>
                ))}
              </div>
            ) : (
              <EmptyState title="No users found" description="Try a different search or role filter." />
            )}
          </TabsContent>

          <TabsContent value="listings" className="space-y-3">
            <SectionTitle
              title="Listing Moderation"
              description="Verify listings, change availability status, and remove listings that should not be visible."
            />
            {filteredProperties.length ? (
              <div className="grid gap-3">
                {filteredProperties.map((property) => (
                  <div key={property._id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-[7rem_minmax(0,1fr)_auto] md:items-center">
                      <img
                        src={property.images[0] || "/windhoek.jpg"}
                        alt={property.title}
                        className="h-28 w-full rounded-xl object-cover md:h-24 md:w-28"
                      />
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-foreground">{property.title}</h3>
                          <StatusBadge value={property.status} />
                          {property.verified && <Badge className="bg-primary text-primary-foreground">Verified</Badge>}
                          {property.recommended && (
                            <Badge className="bg-amber-100 text-amber-700">
                              <Star className="mr-1 h-3 w-3 fill-current" />
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {property.location} · {label(property.type)} · {property.listingMode}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          {money.format(property.price)}
                          {property.listingMode === "rent" ? "/month" : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Owner: {property.owner?.fullName || property.owner?.email || "Unknown"}
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 md:w-[34rem] md:grid-cols-4">
                        <Select
                          value={property.status}
                          onValueChange={(value) => void handleStatusChange(property._id, value as PropertyStatus)}
                        >
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {propertyStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {label(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => void handleToggleVerified(property._id, property.verified)}>
                          {property.verified ? "Unverify" : "Verify"}
                        </Button>
                        <Button variant="outline" onClick={() => void handleToggleRecommended(property._id, property.recommended)}>
                          {property.recommended ? "Unrecommend" : "Recommend"}
                        </Button>
                        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => void handleRemoveProperty(property._id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No listings found" description="Try a different search or status filter." />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

function Stat({
  icon: Icon,
  label: statLabel,
  value,
  tone = "default",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10", tone === "warning" && "bg-amber-100")}>
        <Icon className={cn("h-5 w-5 text-primary", tone === "warning" && "text-amber-600")} />
      </div>
      <p className="truncate text-xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{statLabel}</p>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function UserRow({
  user,
  children,
}: {
  user: {
    _id: Id<"users">;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    phone?: string;
    location?: string;
    role: UserRole;
    agentStatus?: "none" | "pending" | "approved" | "rejected";
    specialty?: string;
    bio?: string;
    idDocumentUrl?: string;
    idDocumentName?: string;
    businessRegistrationUrl?: string;
    businessRegistrationName?: string;
    taxCertificateUrl?: string;
    taxCertificateName?: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName || user.email} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">{user.fullName || user.email}</p>
              <RoleBadge role={user.role} />
              {user.agentStatus && user.agentStatus !== "none" && <StatusBadge value={user.agentStatus} />}
            </div>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[user.phone, user.location, user.specialty].filter(Boolean).join(" · ") || "No profile details yet"}
            </p>
            {user.bio && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{user.bio}</p>}
            {(user.idDocumentUrl || user.businessRegistrationUrl || user.taxCertificateUrl) && (
              <div className="mt-2 flex flex-wrap gap-2">
                <DocumentLink href={user.idDocumentUrl} label={user.idDocumentName || "ID Document"} />
                <DocumentLink href={user.businessRegistrationUrl} label={user.businessRegistrationName || "Business Registration"} />
                <DocumentLink href={user.taxCertificateUrl} label={user.taxCertificateName || "Tax Certificate"} />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:justify-end">{children}</div>
      </div>
    </div>
  );
}

function DocumentLink({ href, label: docLabel }: { href?: string; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15"
    >
      {docLabel}
    </a>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles = {
    admin: "bg-primary text-primary-foreground",
    agent: "bg-emerald-100 text-emerald-700",
    customer: "bg-muted text-muted-foreground",
  };
  return <Badge className={styles[role]}>{label(role)}</Badge>;
}

function StatusBadge({ value }: { value: string }) {
  const styles =
    value === "active" || value === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : value === "pending"
        ? "bg-amber-100 text-amber-700"
        : value === "rejected" || value === "inactive"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";
  return <Badge className={styles}>{label(value)}</Badge>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function label(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default Admin;
