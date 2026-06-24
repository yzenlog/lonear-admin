import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LonMessageProvider, LonNotificationProvider } from "./components/ui";
import { DomTranslator, LanguageProvider } from "./i18n";
import { registerServiceWorker, syncPwaDisplayMode } from "./pwa";
import "./styles/global.css";

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK === "false") {
    return;
  }

  const { setupMockRequestInterceptor } = await import("./mocks/browser");

  setupMockRequestInterceptor();
}

void enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <LanguageProvider>
        <DomTranslator>
          <LonMessageProvider>
            <LonNotificationProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </LonNotificationProvider>
          </LonMessageProvider>
        </DomTranslator>
      </LanguageProvider>
    </React.StrictMode>,
  );
});

registerServiceWorker();
syncPwaDisplayMode();
