import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");

function renderBootError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  if (!root) return;
  const escapedMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  root.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:Inter,Arial,sans-serif;background:#f8faf9;color:#102018;">
      <div style="max-width:520px;text-align:center;border:1px solid #dbe7df;border-radius:12px;background:#fff;padding:24px;box-shadow:0 12px 30px rgba(16,32,24,0.08);">
        <img src="/Ndunda_logo.png" alt="Ndunda" style="height:56px;width:auto;margin-bottom:18px;" />
        <h1 style="font-size:22px;margin:0 0 8px;">Ndunda could not start</h1>
        <p style="font-size:14px;line-height:1.5;margin:0 0 14px;color:#52645a;">
          The frontend loaded, but React crashed during startup.
        </p>
        <pre style="white-space:pre-wrap;text-align:left;background:#f1f5f2;border-radius:8px;padding:12px;font-size:12px;line-height:1.4;color:#1f3328;">${escapedMessage}</pre>
      </div>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  renderBootError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  renderBootError(event.reason);
});

try {
  if (!root) {
    throw new Error("Missing root element.");
  }

  createRoot(root).render(<App />);
  window.__NDUNDA_APP_STARTED__ = true;
} catch (error) {
  renderBootError(error);
}
