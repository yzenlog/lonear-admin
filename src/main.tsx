import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { MessageProvider, NotificationProvider } from "./components/ui";
import { registerServiceWorker } from "./pwa";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MessageProvider>
      <NotificationProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </NotificationProvider>
    </MessageProvider>
  </React.StrictMode>,
);

registerServiceWorker();
