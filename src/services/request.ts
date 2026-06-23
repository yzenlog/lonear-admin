import { getAccessToken } from "./apiTokens";

type ApiResponse<T> = {
  code?: number | string;
  data?: T;
  message?: string;
  msg?: string;
  success?: boolean;
};

export type QueryParamValue = string | number | boolean | Date | null | undefined;

export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>;

export type ApiErrorCode = "ABORTED" | "BUSINESS_ERROR" | "HTTP_ERROR" | "NETWORK_ERROR" | "PARSE_ERROR" | "TIMEOUT";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly payload?: unknown;
  readonly status: number;

  constructor(message: string, status: number, code: ApiErrorCode, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export type ApiResponseType = "arrayBuffer" | "blob" | "json" | "text" | "void";

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  params?: QueryParams;
  rawResponse?: boolean;
  responseType?: ApiResponseType;
  skipAuth?: boolean;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15000;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSuccessCode(code: unknown) {
  return code === undefined || code === 0 || code === "0" || code === 200 || code === "200";
}

function isNumericCode(code: unknown) {
  return typeof code === "number" || (typeof code === "string" && /^-?\d+$/.test(code));
}

function getResponseMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) {
    return fallback;
  }

  const message = payload.message ?? payload.msg ?? payload.error;

  return typeof message === "string" && message.trim().length > 0 ? message : fallback;
}

function isWrappedPayload(payload: Record<string, unknown>) {
  const hasData = "data" in payload;
  const hasMessage = "message" in payload || "msg" in payload;

  return (
    (hasData && ("success" in payload || "code" in payload || hasMessage)) ||
    ("success" in payload && (hasData || hasMessage)) ||
    ("code" in payload && hasMessage && isNumericCode(payload.code))
  );
}

function isAbsoluteUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

function joinUrl(baseUrl: string, path: string) {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

function appendQueryParam(searchParams: URLSearchParams, key: string, value: QueryParamValue) {
  if (value === null || value === undefined) {
    return;
  }

  searchParams.append(key, value instanceof Date ? value.toISOString() : String(value));
}

function buildUrl(path: string, params?: QueryParams) {
  const requestUrl = joinUrl(API_BASE_URL, path);
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(requestUrl, origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => appendQueryParam(url.searchParams, key, item));
        return;
      }

      appendQueryParam(url.searchParams, key, value);
    });
  }

  return isAbsoluteUrl(requestUrl) ? url.toString() : `${url.pathname}${url.search}`;
}

function shouldSendJson(body: unknown) {
  return (
    body !== undefined &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(body) &&
    typeof body !== "string"
  );
}

function normalizeBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (shouldSendJson(body)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return JSON.stringify(body);
  }

  return body as BodyInit;
}

async function parsePayload(response: Response, responseType: ApiResponseType): Promise<unknown> {
  if (response.status === 204 || responseType === "void") {
    return undefined;
  }

  if (responseType === "blob") {
    return response.blob();
  }

  if (responseType === "arrayBuffer") {
    return response.arrayBuffer();
  }

  if (responseType === "text") {
    return response.text();
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return response.text();
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("接口返回数据解析失败", response.status, "PARSE_ERROR", text);
  }
}

function unwrapPayload<T>(payload: unknown, rawResponse: boolean): T {
  if (rawResponse || !isRecord(payload)) {
    return payload as T;
  }

  if (!isWrappedPayload(payload)) {
    return payload as T;
  }

  const wrappedPayload = payload as ApiResponse<T>;
  const isSuccessful = wrappedPayload.success === undefined ? isSuccessCode(wrappedPayload.code) : wrappedPayload.success;

  if (!isSuccessful) {
    throw new ApiError(getResponseMessage(payload, "业务请求失败"), 200, "BUSINESS_ERROR", payload);
  }

  return "data" in wrappedPayload ? (wrappedPayload.data as T) : (payload as T);
}

function createAbortController(signal?: AbortSignal | null, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  let didTimeout = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const abortFromSignal = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", abortFromSignal, { once: true });
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeoutMs);
  }

  return {
    controller,
    didTimeout: () => didTimeout,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      signal?.removeEventListener("abort", abortFromSignal);
    },
  };
}

export async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    body,
    headers,
    params,
    rawResponse = false,
    responseType = "json",
    signal,
    skipAuth = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...init
  } = options;
  const requestHeaders = new Headers(headers);
  const token = getAccessToken();

  if (!skipAuth && token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const abortable = createAbortController(signal, timeoutMs);

  try {
    const response = await fetch(buildUrl(path, params), {
      ...init,
      body: normalizeBody(body, requestHeaders),
      headers: requestHeaders,
      signal: abortable.controller.signal,
    });
    const payload = await parsePayload(response, responseType);

    if (!response.ok) {
      throw new ApiError(getResponseMessage(payload, `请求失败：${response.status}`), response.status, "HTTP_ERROR", payload);
    }

    return unwrapPayload<T>(payload, rawResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (abortable.didTimeout()) {
      throw new ApiError("请求超时，请稍后重试", 0, "TIMEOUT", error);
    }

    if (abortable.controller.signal.aborted) {
      throw new ApiError("请求已取消", 0, "ABORTED", error);
    }

    throw new ApiError("网络请求失败，请检查网络连接", 0, "NETWORK_ERROR", error);
  } finally {
    abortable.cleanup();
  }
}

export const apiClient = {
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>(path, { ...options, method: "GET" }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, body, method: "PATCH" }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, body, method: "POST" }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, body, method: "PUT" }),
  request,
};

