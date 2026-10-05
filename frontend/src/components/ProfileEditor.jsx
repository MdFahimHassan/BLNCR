import { useEffect, useState } from "react";
import { CalendarDots, Camera, FloppyDisk, Trash, UserCircle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "./Avatar";
import Button from "./Button";
import Field, { Input } from "./Field";
import Modal from "./Modal";

const MAX_AVATAR_BYTES = 512 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfileEditor({ open, onClose }) {
  const { user, saveProfile, uploadAvatar, removeAvatar, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: user.name, email: user.email });
  }, [open, user.name, user.email]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveProfile({ name: form.name.trim(), email: form.email.trim() });
      toast.success("Your profile has been updated");
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Profile photos must be 512 KB or smaller");
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setPhotoBusy(true);
    try {
      await uploadAvatar(file);
      setPhotoPreview(null);
      toast.success("Profile photo updated");
    } catch (error) {
      setPhotoPreview(null);
      toast.error(error.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoRemove = async () => {
    setPhotoBusy(true);
    try {
      await removeAvatar();
      toast.success("Profile photo removed");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword || deleteConfirmation !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      toast.success("Your account has been deleted");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const hasChanges = form.name.trim() !== user.name || form.email.trim().toLowerCase() !== user.email;
  const joined = user.createdAt
    ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(user.createdAt))
    : null;

  return (
    <Modal open={open} onClose={onClose} title="Your profile" width="max-w-2xl">
      <div className="grid gap-7 sm:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex flex-col items-center border-b border-[var(--color-border-soft)] pb-6 text-center sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
          <div className="relative mb-4">
            <Avatar
              name={user.name}
              id={user.id}
              src={photoPreview || user.avatar}
              size="xl"
              className="border-2 border-[var(--color-surface)] shadow-lg"
            />
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-credit)]" />
          </div>
          <p className="max-w-full truncate text-base font-semibold text-[var(--color-text)]">{user.name}</p>
          <p className="mt-1 max-w-full truncate text-sm text-[var(--color-text-faint)]">{user.email}</p>
          {joined && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--color-text-faint)]">
              <CalendarDots size={14} /> Member since {joined}
            </p>
          )}
          <input
            id="profile-avatar-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handlePhotoChange}
            disabled={photoBusy}
          />
          <label
            htmlFor="profile-avatar-input"
            className={`mt-5 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-border-strong)] ${photoBusy ? "pointer-events-none opacity-50" : ""}`}
          >
            <Camera size={16} /> {photoBusy ? "Updating photo..." : "Change photo"}
          </label>
          {user.avatar && (
            <button
              type="button"
              onClick={handlePhotoRemove}
              disabled={photoBusy}
              className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-xs text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-debit-text)] disabled:opacity-50"
            >
              <Trash size={14} /> Remove photo
            </button>
          )}
        </aside>

        <form onSubmit={handleSave} className="flex min-w-0 flex-col">
          <div className="mb-5 flex items-center gap-2">
            <UserCircle size={18} className="text-[var(--color-accent-text)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Personal details</h3>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Full name" htmlFor="profile-name">
              <Input
                id="profile-name"
                autoComplete="name"
                maxLength={100}
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Email address" htmlFor="profile-email" hint="This is also your sign-in email.">
              <Input
                id="profile-email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </Field>
          </div>
          <div className="mt-6 flex justify-end border-t border-[var(--color-border-soft)] pt-5">
            <Button type="submit" loading={saving} disabled={!hasChanges} icon={FloppyDisk}>
              Save changes
            </Button>
          </div>
          <section className="mt-8 border-t border-[var(--color-border-soft)] pt-5">
            <h3 className="text-sm font-semibold text-[var(--color-debit-text)]">Delete account</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-faint)]">
              Your personal details will be removed and past financial entries retained as Deleted account.
              This cannot be undone.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Current password" htmlFor="delete-account-password">
                <Input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                />
              </Field>
              <Field label={'Type "DELETE" to confirm'} htmlFor="delete-account-confirmation">
                <Input
                  id="delete-account-confirmation"
                  autoComplete="off"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="danger"
                icon={Trash}
                loading={deleting}
                disabled={!deletePassword || deleteConfirmation !== "DELETE"}
                onClick={handleDeleteAccount}
              >
                Delete account
              </Button>
            </div>
          </section>
        </form>
      </div>
    </Modal>
  );
}