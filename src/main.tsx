import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LonMessageProvider, LonNotificationProvider } from "./components/ui";
import { registerServiceWorker } from "./pwa";
import "./styles/global.css";

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

registerServiceWorker();
