import { BadgeCheck, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo } from "react";
import { stableCacheKey, useLocalCache } from "@/hooks/useLocalCache";

const FeaturedAgents = () => {
  const convexAgents = useQuery(api.users.featuredAgents, { limit: 4 });
  const freshAgents = useMemo(
    () =>
      convexAgents?.map((agent) => ({
        id: agent._id,
        name: agent.fullName || agent.email,
        image: agent.avatarUrl || "",
        listings: agent.listingCount,
      })),
    [convexAgents],
  );
  const cached = useLocalCache(
    stableCacheKey("featured-agents", { limit: 4 }),
    freshAgents,
    { ttl: 10 * 60 * 1000 },
  );
  const agents = cached.value ?? [];
  const loading = convexAgents === undefined && !cached.hasCachedValue;

  if (!loading && agents.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-4 md:px-0 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">Verified Agents</h2>
        <Link
          to="/agents"
          className="flex items-center gap-1.5 text-base md:text-lg font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 md:grid md:grid-cols-4 lg:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0">
        {loading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-24 flex-col items-center shrink-0 rounded-xl border border-border bg-card px-4 py-5 shadow-card md:min-w-0"
            >
              <div className="mb-3 h-20 w-20 rounded-full bg-muted md:h-24 md:w-24" />
              <div className="mb-2 h-4 w-20 rounded bg-muted" />
              <div className="h-3 w-14 rounded bg-muted" />
            </div>
          ))}
        {agents.map((agent) => (
          <Link
            key={agent.id}
            to={`/agents/${agent.id}`}
            className="flex min-w-24 flex-col items-center shrink-0 rounded-xl border border-border bg-card px-4 py-5 shadow-card hover:shadow-lifted hover:-translate-y-0.5 transition-all md:min-w-0"
          >
            <div className="relative mb-3">
              {agent.image ? (
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <BadgeCheck className="w-9 h-9 text-primary" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
              </div>
            </div>
            <span className="text-sm md:text-base font-semibold text-foreground mb-1">{agent.name}</span>
            <span className="text-xs md:text-sm text-muted-foreground">{agent.listings} listings</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FeaturedAgents;
