import { mockHandlers } from "./handlers";
import type { MockHandler } from "./handlers";

let mockInterceptorStarted = false;

function getFetchUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function getFetchMethod(input: RequestInfo | URL, init?: RequestInit) {
  return (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
}

function getPathname(input: RequestInfo | URL) {
  return new URL(getFetchUrl(input), window.location.origin).pathname;
}

function matchMockHandler(method: string, pathname: string): [MockHandler, RegExpMatchArray] | null {
  for (const handler of mockHandlers) {
    if (handler.method !== method) {
      continue;
    }

    const match = pathname.match(handler.path);

    if (match) {
      return [handler, match];
    }
  }

  return null;
}

export function setupMockRequestInterceptor() {
  if (mockInterceptorStarted || typeof window === "undefined") {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const matchResult = matchMockHandler(getFetchMethod(input, init), getPathname(input));

    if (!matchResult) {
      return originalFetch(input, init);
    }

    const [handler, match] = matchResult;
    const request = new Request(input, init);

    return handler.resolver(request, match);
  };

  mockInterceptorStarted = true;
}

