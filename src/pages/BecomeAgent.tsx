import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

const benefits = [
  "Verified badge on your profile",
  "Appear in the agents directory",
  "Manage your own listings",
  "Receive WhatsApp and phone leads",
];

type DocumentField = "idDocument" | "businessRegistration" | "taxCertificate";

const BecomeAgent = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { profile } = useUserProfile();
  const applyAsAgent = useMutation(api.users.applyAsAgent);
  const generateUploadUrl = useMutation(api.properties.generateUploadUrl);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<DocumentField | null>(null);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || user?.fullName || "",
    phone: profile?.phone || "",
    email: user?.primaryEmailAddress?.emailAddress || profile?.email || "",
    location: profile?.location || "",
    agencyName: profile?.agencyName || "",
    specialty: profile?.specialty || "",
    bio: profile?.bio || "",
    whatsapp: profile?.whatsapp || profile?.phone || "",
  });
  const [documents, setDocuments] = useState({
    idDocument: null as UploadedDocument | null,
    businessRegistration: null as UploadedDocument | null,
    taxCertificate: null as UploadedDocument | null,
  });

  if (isLoaded && !isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDocument = async (field: DocumentField, file: File | null) => {
    if (!file) {
      setDocuments((prev) => ({ ...prev, [field]: null }));
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      toast.error("Document must be smaller than 2.5MB");
      return;
    }

    if (!isLoaded || !isSignedIn) {
      toast.error("Please sign in before uploading documents");
      navigate("/login");
      return;
    }

    try {
      setUploadingDocument(field);
      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Document upload failed");
      }

      const { storageId } = (await result.json()) as { storageId: string };
      setDocuments((prev) => ({
        ...prev,
        [field]: {
          name: file.name,
          url: storageId,
        },
      }));
      toast.success("Document uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload document";
      toast.error(message);
    } finally {
      setUploadingDocument(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!agreedToTerms) return;
    if (!formData.fullName || !formData.phone || !formData.location || !formData.specialty || !formData.bio) {
      toast.error("Please complete the required fields");
      return;
    }
    if (!documents.idDocument) {
      toast.error("Please upload your ID document");
      return;
    }
    if (!documents.businessRegistration && !formData.agencyName.trim()) {
      toast.error("Add an agency name or upload business registration");
      return;
    }

    try {
      setIsSubmitting(true);
      await applyAsAgent({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        agencyName: formData.agencyName.trim() || undefined,
        specialty: formData.specialty.trim(),
        bio: formData.bio.trim(),
        whatsapp: formData.whatsapp.trim() || undefined,
        idDocumentUrl: documents.idDocument.url,
        idDocumentName: documents.idDocument.name,
        businessRegistrationUrl: documents.businessRegistration?.url,
        businessRegistrationName: documents.businessRegistration?.name,
        taxCertificateUrl: documents.taxCertificate?.url,
        taxCertificateName: documents.taxCertificate?.name,
      });
      toast.success("Agent application submitted");
      navigate("/profile");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit application";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6 md:px-0 md:pt-8 md:container md:max-w-5xl md:mx-auto">
        <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground mb-5">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <aside className="bg-card border border-border rounded-lg p-5 h-fit">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BadgeCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Become a Verified Agent</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Submit your professional profile. Admin will review and approve your agent account.
            </p>

            <div className="mt-6 space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            {profile?.agentStatus && profile.agentStatus !== "none" && (
              <div className="mt-6 rounded-lg bg-secondary p-3 text-sm">
                Current status: <span className="font-semibold capitalize">{profile.agentStatus}</span>
              </div>
            )}
          </aside>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Application Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Field icon={User} label="Full Name" value={formData.fullName} onChange={(v) => updateField("fullName", v)} required />
              <Field icon={Phone} label="Phone Number" value={formData.phone} onChange={(v) => updateField("phone", v)} required />
              <Field icon={Mail} label="Email" value={formData.email} onChange={(v) => updateField("email", v)} type="email" disabled />
              <Field icon={MapPin} label="Operating Area" value={formData.location} onChange={(v) => updateField("location", v)} required />
              <Field icon={FileText} label="Agency Name" value={formData.agencyName} onChange={(v) => updateField("agencyName", v)} />
              <Field icon={BadgeCheck} label="Specialty" value={formData.specialty} onChange={(v) => updateField("specialty", v)} required />
              <Field icon={Phone} label="WhatsApp Number" value={formData.whatsapp} onChange={(v) => updateField("whatsapp", v)} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Experience / Bio</label>
              <textarea
                rows={5}
                value={formData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Tell clients and admins about your real estate experience..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                required
              />
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">Verification Documents</h3>
                <p className="text-xs text-muted-foreground">
                  Upload documents for admin review. ID is required; business registration is recommended for agencies.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <DocumentUpload
                  label="ID Document"
                  required
                  document={documents.idDocument}
                  uploading={uploadingDocument === "idDocument"}
                  onChange={(file) => updateDocument("idDocument", file)}
                />
                <DocumentUpload
                  label="Business Registration"
                  document={documents.businessRegistration}
                  uploading={uploadingDocument === "businessRegistration"}
                  onChange={(file) => updateDocument("businessRegistration", file)}
                />
                <DocumentUpload
                  label="Tax Certificate"
                  document={documents.taxCertificate}
                  uploading={uploadingDocument === "taxCertificate"}
                  onChange={(file) => updateDocument("taxCertificate", file)}
                />
              </div>
            </div>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                I confirm the information is accurate and agree to follow Ndunda agent standards.
              </span>
            </label>

            <Button variant="hero" size="xl" className="w-full" disabled={!agreedToTerms || isSubmitting || Boolean(uploadingDocument)}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={type}
          value={value}
          disabled={disabled}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted"
        />
      </div>
    </div>
  );
}

type UploadedDocument = {
  name: string;
  url: string;
};

function DocumentUpload({
  label,
  document,
  uploading,
  required,
  onChange,
}: {
  label: string;
  document: UploadedDocument | null;
  uploading?: boolean;
  required?: boolean;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-3 text-center transition-colors hover:border-primary/60">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        disabled={uploading}
        required={required && !document}
      />
      {uploading ? (
        <>
          <FileText className="mb-2 h-7 w-7 animate-pulse text-primary" />
          <span className="text-xs font-semibold text-foreground">Uploading...</span>
        </>
      ) : document ? (
        <>
          <FileCheck2 className="mb-2 h-7 w-7 text-primary" />
          <span className="line-clamp-2 text-xs font-semibold text-foreground">{document.name}</span>
          <span className="mt-1 text-[11px] text-muted-foreground">Tap to replace</span>
        </>
      ) : (
        <>
          <FileText className="mb-2 h-7 w-7 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            {label}{required ? " *" : ""}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground">PDF or image</span>
        </>
      )}
    </label>
  );
}

export default BecomeAgent;
