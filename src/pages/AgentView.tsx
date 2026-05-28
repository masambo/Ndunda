import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import PropertyCard from "@/components/home/PropertyCard";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const AgentView = () => {
  const { id } = useParams<{ id: string }>();
  const convexAgents = useQuery(api.users.listAgents);
  const activeProperties = useQuery(
    api.properties.listByOwner,
    id ? { ownerId: id as Id<"users">, status: "active", limit: 24 } : "skip",
  );
  const loading = convexAgents === undefined;
  const syncedAgent = convexAgents?.find((agent) => agent._id === id);
  const agent = syncedAgent
    ? {
        id: syncedAgent._id,
        name: syncedAgent.fullName || syncedAgent.email,
        image: syncedAgent.avatarUrl || "",
        speciality: syncedAgent.specialty || "Ndunda Agent",
        location: syncedAgent.location || "Namibia",
        phone: syncedAgent.whatsapp || syncedAgent.phone || "",
        email: syncedAgent.email,
        bio: syncedAgent.bio || "Verified Ndunda agent ready to help with property enquiries.",
        agencyName: syncedAgent.agencyName || "Independent",
      }
    : null;
  const agentListings = agent && activeProperties ? activeProperties : [];

  const handleWhatsApp = () => {
    if (!agent?.phone) return;
    const phoneNumber = agent.phone.replace(/\s+/g, "").replace(/\+/g, "");
    const message = encodeURIComponent(`Hi ${agent.name}, I'm interested in properties on Ndunda.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!agent) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] grid place-items-center px-4 text-center">
          <div>
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h1 className="text-xl font-bold text-foreground">Agent not found</h1>
            <Button asChild className="mt-4">
              <Link to="/agents">Back to Agents</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6 md:px-0 md:pt-8 md:container md:max-w-5xl md:mx-auto">
        <Link to="/agents" className="inline-flex items-center gap-2 text-muted-foreground mb-5">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <aside className="bg-card border border-border rounded-lg p-5 shadow-card h-fit">
            <div className="relative w-28 h-28 mx-auto">
              {agent.image ? (
                <img src={agent.image} alt={agent.name} className="w-28 h-28 rounded-full object-cover" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <BadgeCheck className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <div className="text-center mt-4">
              <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
              <p className="text-sm text-primary font-semibold">{agent.speciality}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <Button onClick={handleWhatsApp} disabled={!agent.phone}>
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button variant="outline" disabled={!agent.phone} onClick={() => (window.location.href = `tel:${agent.phone}`)}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            </div>
          </aside>

          <main className="space-y-5">
            <section className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-lg font-semibold text-foreground">Professional Profile</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{agent.bio}</p>
              <div className="grid gap-4 md:grid-cols-3 mt-5 text-sm">
                <Info icon={BriefcaseBusiness} label="Agency" value={agent.agencyName} />
                <Info icon={MapPin} label="Area" value={agent.location} />
                <Info icon={Mail} label="Email" value={agent.email} />
              </div>
            </section>

            <section className="bg-card border border-border rounded-lg p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Listings</h2>
                  <p className="text-sm text-muted-foreground">
                    {agentListings.length} active {agentListings.length === 1 ? "listing" : "listings"}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/search?agent=${agent.id}`}>Browse</Link>
                </Button>
              </div>

              {activeProperties === undefined ? (
                <div className="grid min-h-32 place-items-center rounded-lg border border-border bg-muted/30">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : agentListings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                  <p className="font-semibold text-foreground">No active listings yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Listings will appear here once this agent publishes active properties.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {agentListings.map((property) => (
                    <PropertyCard
                      key={property._id}
                      id={property._id}
                      title={property.title}
                      location={property.location}
                      price={property.price}
                      image={property.images[0] || "/placeholder.svg"}
                      images={property.images}
                      ownerName={property.owner?.fullName || property.owner?.email}
                      ownerAvatarUrl={property.owner?.avatarUrl}
                      ownerRole={property.owner?.role}
                      bedrooms={property.bedrooms}
                      bathrooms={property.bathrooms}
                      size={property.size ?? 0}
                      type={property.type}
                      isNew={property.isNew}
                      listingMode={property.listingMode}
                      rentalType={property.rentalType}
                      pricingModel={
                        property.rentalType === "short-term"
                          ? {
                              daily: property.dailyPrice ?? undefined,
                              weekly: property.weeklyPrice ?? undefined,
                              monthly: property.monthlyPrice ?? undefined,
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </AppLayout>
  );
};

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

export default AgentView;
