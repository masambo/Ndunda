import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Camera, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useUser } from "@clerk/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    cover_photo_url?: string | null;
    location?: string | null;
    bio?: string | null;
    agency_name?: string | null;
    specialty?: string | null;
    whatsapp?: string | null;
    role?: string | null;
  };
}

const MAX_COVER_FILE_SIZE = 8 * 1024 * 1024;
const MAX_COVER_UPLOAD_SIZE = 900 * 1024;

function resizeCoverPhoto(file: File) {
  return new Promise<{ blob: Blob; previewUrl: string }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxWidth = 1600;
      const maxHeight = 640;
      const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Unable to prepare cover photo"));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Unable to prepare cover photo"));
            return;
          }
          if (blob.size > MAX_COVER_UPLOAD_SIZE) {
            reject(new Error("Cover photo is too large. Please choose a smaller image."));
            return;
          }
          resolve({
            blob,
            previewUrl: URL.createObjectURL(blob),
          });
        },
        "image/jpeg",
        0.82,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read cover photo"));
    };

    image.src = objectUrl;
  });
}

const EditProfileDialog = ({ open, onOpenChange, profile }: EditProfileDialogProps) => {
  const { user } = useUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    location: profile.location || "",
    bio: profile.bio || "",
    agency_name: profile.agency_name || "",
    specialty: profile.specialty || "",
    whatsapp: profile.whatsapp || "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [coverPreview, setCoverPreview] = useState<string | null>(profile.cover_photo_url ?? null);
  const [coverUploadBlob, setCoverUploadBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const canEditAgentFields = profile.role === "agent" || profile.role === "admin";

  useEffect(() => {
    if (!open) return;

    setFormData({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      location: profile.location || "",
      bio: profile.bio || "",
      agency_name: profile.agency_name || "",
      specialty: profile.specialty || "",
      whatsapp: profile.whatsapp || "",
    });
    setAvatarPreview(profile.avatar_url);
    setCoverPreview(profile.cover_photo_url ?? null);
    setCoverUploadBlob(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }, [open, profile]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (user) {
        const image = await user.setProfileImage({ file });
        await user.reload();
        setAvatarPreview(image.publicUrl || user.imageUrl || (reader.result as string));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    try {
      await user?.setProfileImage({ file: null });
      await user?.reload();
    } catch {
      // Clerk may not support removal on all plans
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > MAX_COVER_FILE_SIZE) {
      toast.error("Cover photo must be less than 8MB");
      return;
    }

    try {
      const prepared = await resizeCoverPhoto(file);
      setCoverPreview(prepared.previewUrl);
      setCoverUploadBlob(prepared.blob);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to prepare cover photo";
      toast.error(message);
    }
  };

  const handleRemoveCover = () => {
    setCoverPreview(null);
    setCoverUploadBlob(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const clean = (value: string) => value.trim();
      let coverPhotoUrl = coverPreview || "";
      if (coverUploadBlob && coverPreview) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: coverUploadBlob,
        });

        if (!result.ok) {
          throw new Error("Could not upload cover photo");
        }

        const { storageId } = (await result.json()) as { storageId: string };
        coverPhotoUrl = storageId;
      }
      const avatarUrl = avatarPreview?.startsWith("data:") ? (profile.avatar_url ?? "") : (avatarPreview ?? "");

      await updateProfile({
        fullName: clean(formData.full_name),
        phone: clean(formData.phone),
        avatarUrl,
        coverPhotoUrl,
        location: clean(formData.location),
        bio: clean(formData.bio),
        agencyName: clean(formData.agency_name),
        specialty: clean(formData.specialty),
        whatsapp: clean(formData.whatsapp),
      });

      if (user && formData.full_name.trim()) {
        await user.update({ firstName: formData.full_name.trim().split(" ")[0] });
      }

      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[92vh] w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and photo
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-4">
          {canEditAgentFields && (
            <div className="space-y-3">
              <Label>Cover Photo</Label>
              <div className="relative aspect-[3/1] overflow-hidden rounded-lg border border-border bg-primary/10">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                  id="cover-upload"
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    <Camera className="w-4 h-4 mr-2" />
                    {coverPreview ? "Change Cover" : "Upload Cover"}
                  </label>
                </Button>
                {coverPreview && (
                  <Button type="button" variant="outline" size="sm" onClick={handleRemoveCover}>
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled={isUploading}
                asChild
              >
                <label htmlFor="avatar-upload">
                  <Camera className="w-4 h-4 mr-2" />
                  {avatarPreview ? "Change" : "Upload"}
                </label>
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress || ""}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email is managed by Clerk</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+264 81 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+264 81 123 4567"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="Windhoek Central"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            {canEditAgentFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="agency_name">Agency Name</Label>
                  <Input
                    id="agency_name"
                    type="text"
                    placeholder="Ndunda Realty"
                    value={formData.agency_name}
                    onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    type="text"
                    placeholder="Apartments, homes, student rooms"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Profile Bio</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    placeholder="Tell clients about your experience"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border bg-background px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploading}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
