import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LonMessageProvider, LonNotificationProvider } from "./components/ui";
import { registerServiceWorker } from "./pwa";
import "./styles/global.css";

async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCK !== "true") {
    return;
  }

  const { setupMockRequestInterceptor } = await import("./mocks/browser");

  setupMockRequestInterceptor();
}

void enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <LonMessageProvider>
        <LonNotificationProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </LonNotificationProvider>
      </LonMessageProvider>
    </React.StrictMode>,
  );
});

registerServiceWorker();
