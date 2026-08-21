import { useRef, useState } from "react";
import { User, Pencil, Check, X, Camera } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

function Profile() {
  const { user } = useAuth();

  const currentName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "";

  const avatarUrl = user?.user_metadata?.custom_avatar_url || "";

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const fileInputRef = useRef(null);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const handleSave = async () => {
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      toast.error("Please enter your name.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      if (error) {
        throw error;
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(error?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(currentName);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Please choose an image smaller than 3MB.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Cache-bust so the new image shows immediately.
      const versionedUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { custom_avatar_url: versionedUrl },
      });

      if (updateError) {
        throw updateError;
      }

      setAvatarLoadError(false);
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Upload avatar error:", error);

      const message =
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("bucket not found")
          ? "Avatar storage isn't set up yet. Please create an 'avatars' bucket in Supabase Storage."
          : error?.message || "Failed to upload profile picture.";

      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage your account information.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-white">
              {avatarUrl && !avatarLoadError ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  onError={() => setAvatarLoadError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={36} />
              )}
            </div>

            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              aria-label="Change profile picture"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              <Camera size={15} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-slate-900">
              {currentName || "BudgetFlow User"}
            </p>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
            {uploadingAvatar && (
              <p className="mt-1 text-xs font-medium text-indigo-600">
                Uploading...
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>

            {isEditing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-slate-900">
                {currentName || "Not set"}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <p className="rounded-lg bg-slate-50 p-3 text-slate-900">
              {user?.email}
            </p>
          </div>

          {memberSince && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Member Since
              </label>
              <p className="rounded-lg bg-slate-50 p-3 text-slate-900">
                {memberSince}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <X size={18} />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                <Check size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              <Pencil size={18} />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default Profile;
