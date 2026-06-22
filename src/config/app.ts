export const AUTH_STORAGE_KEY = "lonear-admin-auth";
export const THEME_STORAGE_KEY = "lonear-admin-theme";
export const UI_SETTINGS_STORAGE_KEY = "lonear-admin-ui-settings";
export const TAB_STATE_STORAGE_KEY = "lonear-admin-open-tabs";
export const DASHBOARD_NAV_KEY = "section:dashboard:dashboard:工作台";

export type ThemeMode = "light" | "dark";
export type AccentColor = "blue" | "green" | "purple" | "rose";

type AccentTokens = {
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentSoft2: string;
  textOnAccent: string;
};

export type AccentColorOption = {
  id: AccentColor;
  label: string;
  previewColor: string;
  tokens: Record<ThemeMode, AccentTokens>;
};

export type UiSettings = {
  tabsPersistent: boolean;
  showNotice: boolean;
  accentColor: AccentColor;
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  tabsPersistent: true,
  showNotice: true,
  accentColor: "blue",
};

export const ACCENT_COLOR_OPTIONS: AccentColorOption[] = [
  {
    id: "blue",
    label: "海蓝",
    previewColor: "#1066cc",
    tokens: {
      light: {
        accent: "#1066cc",
        accentHover: "#0d57ab",
        accentSoft: "rgba(16, 102, 204, 0.1)",
        accentSoft2: "rgba(16, 102, 204, 0.14)",
        textOnAccent: "#ffffff",
      },
      dark: {
        accent: "#74adff",
        accentHover: "#9bc5ff",
        accentSoft: "rgba(116, 173, 255, 0.15)",
        accentSoft2: "rgba(116, 173, 255, 0.22)",
        textOnAccent: "#ffffff",
      },
    },
  },
  {
    id: "green",
    label: "青绿",
    previewColor: "#168a55",
    tokens: {
      light: {
        accent: "#168a55",
        accentHover: "#107244",
        accentSoft: "rgba(22, 138, 85, 0.1)",
        accentSoft2: "rgba(22, 138, 85, 0.15)",
        textOnAccent: "#ffffff",
      },
      dark: {
        accent: "#4cc38a",
        accentHover: "#75d6a5",
        accentSoft: "rgba(76, 195, 138, 0.14)",
        accentSoft2: "rgba(76, 195, 138, 0.22)",
        textOnAccent: "#07140d",
      },
    },
  },
  {
    id: "purple",
    label: "紫藤",
    previewColor: "#7c3aed",
    tokens: {
      light: {
        accent: "#7c3aed",
        accentHover: "#6630c4",
        accentSoft: "rgba(124, 58, 237, 0.1)",
        accentSoft2: "rgba(124, 58, 237, 0.16)",
        textOnAccent: "#ffffff",
      },
      dark: {
        accent: "#b792ff",
        accentHover: "#cfb9ff",
        accentSoft: "rgba(183, 146, 255, 0.15)",
        accentSoft2: "rgba(183, 146, 255, 0.23)",
        textOnAccent: "#160d2a",
      },
    },
  },
  {
    id: "rose",
    label: "玫红",
    previewColor: "#d92d58",
    tokens: {
      light: {
        accent: "#d92d58",
        accentHover: "#b42347",
        accentSoft: "rgba(217, 45, 88, 0.1)",
        accentSoft2: "rgba(217, 45, 88, 0.15)",
        textOnAccent: "#ffffff",
      },
      dark: {
        accent: "#ff8fa8",
        accentHover: "#ffb0c0",
        accentSoft: "rgba(255, 143, 168, 0.15)",
        accentSoft2: "rgba(255, 143, 168, 0.24)",
        textOnAccent: "#2a0710",
      },
    },
  },
];
