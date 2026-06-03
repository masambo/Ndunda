import AppLayout from "@/components/layout/AppLayout";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => (
  <AppLayout>
    <div className="px-4 pt-4 pb-8 md:px-0 md:pt-8 md:container md:max-w-3xl md:mx-auto">
      <Link to="/help" className="inline-flex items-center gap-2 text-muted-foreground mb-5">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 2, 2026</p>
        </div>
      </div>

      <div className="space-y-5 rounded-lg border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Information We Store</h2>
          <p>
            Ndunda stores account details, profile information, property listings, saved properties,
            agent application documents, reviews, viewing requests, booking requests, and notifications.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">How Information Is Used</h2>
          <p>
            Information is used to authenticate users, display listings, connect users with property
            publishers, review agent applications, and support marketplace operations.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Contact Details</h2>
          <p>
            Phone, WhatsApp, and email details may be shown where users choose to publish listings or
            agent profiles so interested users can make direct contact.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Location Data</h2>
          <p>
            Browser location is used only when a user requests location-based features such as city
            selection or nearby scanning. Listing coordinates are stored only when provided on a listing.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Third-Party Services</h2>
          <p>
            The app uses Clerk for authentication, Convex for backend storage, and optional Google Maps
            embeds for location views when configured.
          </p>
        </section>
      </div>
    </div>
  </AppLayout>
);

export default Privacy;
