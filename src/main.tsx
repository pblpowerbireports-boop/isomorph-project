import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// A redeploy replaced the scripts this tab loaded: reload once per tab instead of showing a blank page.
window.addEventListener("vite:preloadError", (event) => {
  if (sessionStorage.getItem("isomorph-reloaded")) return;
  sessionStorage.setItem("isomorph-reloaded", "1");
  event.preventDefault();
  location.reload();
});

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
