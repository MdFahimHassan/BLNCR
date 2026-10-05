import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Modal from "./Modal";
import { ToastProvider, useToast } from "../context/ToastContext";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Focus test">
        <button>First action</button>
        <button onClick={() => setOpen(false)}>Last action</button>
      </Modal>
    </>
  );
}

function ToastHarness() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.error("Request failed")}>Show error</button>
      <button onClick={() => toast.success("Saved")}>Show success</button>
    </>
  );
}

describe("Modal accessibility", () => {
  it("traps keyboard focus and restores focus to its opener on close", async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);
    const opener = screen.getByRole("button", { name: "Open dialog" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Focus test" });
    const close = screen.getByRole("button", { name: "Close" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Last action" }));
    expect(opener).toHaveFocus();
  });
});

describe("toast live regions", () => {
  it("announces errors assertively and successes politely", async () => {
    const user = userEvent.setup();
    render(<ToastProvider><ToastHarness /></ToastProvider>);

    await user.click(screen.getByRole("button", { name: "Show error" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Request failed");
    await user.click(screen.getByRole("button", { name: "Show success" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});