import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="max-w-md">
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-[var(--color-text-faint)]">{description}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}