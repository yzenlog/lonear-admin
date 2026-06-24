function isStandaloneDisplayMode() {
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };

  return window.matchMedia("(display-mode: standalone)").matches || standaloneNavigator.standalone === true;
}

export function syncPwaDisplayMode() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const standaloneQuery = window.matchMedia("(display-mode: standalone)");
  const syncDisplayMode = () => {
    document.documentElement.dataset.displayMode = isStandaloneDisplayMode() ? "standalone" : "browser";
  };

  syncDisplayMode();

  if (typeof standaloneQuery.addEventListener === "function") {
    standaloneQuery.addEventListener("change", syncDisplayMode);
    return;
  }

  standaloneQuery.addListener(syncDisplayMode);
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) {
    return;
  }

  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  };

  if (document.readyState === "complete") {
    register();
    return;
  }

  window.addEventListener("load", register, { once: true });
}
