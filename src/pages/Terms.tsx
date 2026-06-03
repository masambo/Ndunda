import AppLayout from "@/components/layout/AppLayout";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => (
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
          <h1 className="text-2xl font-semibold text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 2, 2026</p>
        </div>
      </div>

      <div className="space-y-5 rounded-lg border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Use of Ndunda</h2>
          <p>
            Ndunda helps users discover, publish, and inquire about property listings in Namibia.
            Users are responsible for providing accurate information and using the platform lawfully.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Listings</h2>
          <p>
            Property publishers must only list properties they are authorized to advertise. Ndunda may
            remove listings that appear inaccurate, unsafe, fraudulent, unavailable, or inappropriate.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Agents</h2>
          <p>
            Agent verification is reviewed by administrators. Approval may be changed or removed if
            supplied information becomes inaccurate or platform standards are not followed.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Inquiries and Bookings</h2>
          <p>
            Viewing requests and booking requests are communication tools. Final agreements, payments,
            inspections, and legal obligations remain between the parties involved.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Liability</h2>
          <p>
            Ndunda does not guarantee the availability, condition, ownership, pricing, or legality of
            every listing. Users should verify property details before making commitments.
          </p>
        </section>
      </div>
    </div>
  </AppLayout>
);

export default Terms;
