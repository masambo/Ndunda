import AppLayout from "@/components/layout/AppLayout";
import { BadgeCheck, Phone, MessageCircle, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMemo } from "react";
import { stableCacheKey, useLocalCache } from "@/hooks/useLocalCache";

const Agents = () => {
  const convexAgents = useQuery(api.users.listAgents);
  const freshAgents = useMemo(
    () =>
      convexAgents?.map((agent) => ({
      id: agent._id,
      name: agent.fullName || agent.email,
      image: agent.avatarUrl || "",
      listings: agent.listingCount,
      verified: true,
      speciality: agent.specialty || "Ndunda Agent",
      location: agent.location || "Namibia",
      phone: agent.whatsapp || agent.phone || "",
      })),
    [convexAgents],
  );
  const cached = useLocalCache(
    stableCacheKey("agents", { scope: "approved" }),
    freshAgents,
    { ttl: 10 * 60 * 1000 },
  );
  const agents = cached.value ?? [];
  const loading = convexAgents === undefined && !cached.hasCachedValue;

  const handleWhatsApp = (phone: string, name: string) => {
    if (!phone) return;
    const phoneNumber = phone.replace(/\s+/g, "").replace(/\+/g, "");
    const message = encodeURIComponent(`Hi ${name}, I'm interested in your properties on Ndunda.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-2 md:px-0 md:pt-8 md:pb-4 md:container md:max-w-7xl md:mx-auto">
        <div className="mb-5 md:mb-7">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Verified Agents</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Contact trusted agents by WhatsApp or phone.
          </p>
        </div>

        <Link
          to="/become-agent"
          className="block bg-card rounded-lg p-4 md:p-5 mb-6 md:mb-8 border border-border hover:border-primary/40 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">Become an Agent</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Join our network of verified rental agents
              </p>
            </div>
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
          </div>
        </Link>
      </div>

      <div className="px-4 pb-6 md:hidden space-y-4">
        {loading && <AgentLoading />}
        {!loading && agents.length === 0 && <EmptyAgents />}
        {agents.map((agent, index) => (
          <div
            key={agent.id}
            className="bg-card rounded-lg p-4 border border-border shadow-card animate-slide-up hover:shadow-lifted transition-all"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex gap-4">
              <Link to={`/agents/${agent.id}`} className="relative shrink-0">
                {agent.image ? (
                  <img
                    src={agent.image}
                    alt={agent.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="w-8 h-8 text-primary" />
                  </div>
                )}
                {agent.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <BadgeCheck className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/agents/${agent.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{agent.speciality}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-2">
                    <span>{agent.listings} listings</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {agent.location}
                    </span>
                  </div>
                </Link>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={!agent.phone}
                    onClick={() => handleWhatsApp(agent.phone, agent.name)}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!agent.phone}
                    onClick={() => handleCall(agent.phone)}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block px-0 pb-8 md:container md:max-w-7xl md:mx-auto">
        {loading && <AgentLoading />}
        {!loading && agents.length === 0 && <EmptyAgents />}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="bg-card rounded-lg p-6 shadow-card hover:shadow-lifted transition-all border border-border"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <Link to={`/agents/${agent.id}`} className="relative shrink-0">
                    {agent.image ? (
                      <img
                        src={agent.image}
                        alt={agent.name}
                        className="w-24 h-24 md:w-28 md:h-28 rounded-lg object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <BadgeCheck className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    {agent.verified && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                        <BadgeCheck className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/agents/${agent.id}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors mb-1">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{agent.speciality}</p>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{agent.listings} listings</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      {agent.location}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="default"
                    size="default"
                    className="flex-1"
                    disabled={!agent.phone}
                    onClick={() => handleWhatsApp(agent.phone, agent.name)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    className="flex-1"
                    disabled={!agent.phone}
                    onClick={() => handleCall(agent.phone)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

function AgentLoading() {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-border bg-card">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function EmptyAgents() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <BadgeCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
      <h2 className="font-semibold text-foreground">No approved agents yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Approved Convex agent accounts will appear here.
      </p>
    </div>
  );
}

export default Agents;
