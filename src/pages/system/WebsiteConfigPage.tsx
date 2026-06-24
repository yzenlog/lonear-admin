import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { CheckCircle2, Clock3, Globe2, Info, RefreshCcw, Save, ToggleRight } from "lucide-react";
import { LonButton, LonInput, useLonMessage } from "../../components/ui";
import { moduleMeta } from "../../config/modules";
import "./WebsiteConfigPage.css";

type WebsiteConfig = {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  domain: string;
  icpNumber: string;
  contactEmail: string;
  siteEnabled: boolean;
  registrationEnabled: boolean;
  commentsEnabled: boolean;
  maintenanceMode: boolean;
};

type WebsiteConfigErrors = Partial<Record<keyof WebsiteConfig, string>>;

const WEBSITE_CONFIG_STORAGE_KEY = "lonear-admin.website-config";

const defaultWebsiteConfig: WebsiteConfig = {
  siteName: "Lonear Portal",
  siteDescription: "企业内容与服务门户",
  siteKeywords: "企业门户, 内容运营, 在线服务",
  domain: "https://portal.lonear.local",
  icpNumber: "沪ICP备 20260123 号",
  contactEmail: "support@lonear.local",
  siteEnabled: true,
  registrationEnabled: false,
  commentsEnabled: true,
  maintenanceMode: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function getInitialWebsiteConfig() {
  if (typeof window === "undefined") {
    return defaultWebsiteConfig;
  }

  try {
    const savedValue = window.localStorage.getItem(WEBSITE_CONFIG_STORAGE_KEY);
    const parsedValue = savedValue ? JSON.parse(savedValue) : null;

    if (!isRecord(parsedValue)) {
      return defaultWebsiteConfig;
    }

    return {
      siteName: readString(parsedValue.siteName, defaultWebsiteConfig.siteName),
      siteDescription: readString(
        parsedValue.siteDescription ?? parsedValue.siteSubtitle ?? parsedValue.seoDescription,
        defaultWebsiteConfig.siteDescription,
      ),
      siteKeywords: readString(parsedValue.siteKeywords ?? parsedValue.seoKeywords, defaultWebsiteConfig.siteKeywords),
      domain: readString(parsedValue.domain, defaultWebsiteConfig.domain),
      icpNumber: readString(parsedValue.icpNumber, defaultWebsiteConfig.icpNumber),
      contactEmail: readString(parsedValue.contactEmail ?? parsedValue.publicEmail, defaultWebsiteConfig.contactEmail),
      siteEnabled: readBoolean(parsedValue.siteEnabled, defaultWebsiteConfig.siteEnabled),
      registrationEnabled: readBoolean(parsedValue.registrationEnabled, defaultWebsiteConfig.registrationEnabled),
      commentsEnabled: readBoolean(parsedValue.commentsEnabled, defaultWebsiteConfig.commentsEnabled),
      maintenanceMode: readBoolean(parsedValue.maintenanceMode, defaultWebsiteConfig.maintenanceMode),
    };
  } catch {
    return defaultWebsiteConfig;
  }
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function validateWebsiteConfig(config: WebsiteConfig) {
  const errors: WebsiteConfigErrors = {};

  if (!config.siteName.trim()) {
    errors.siteName = "请输入网站名称";
  }

  if (!config.siteDescription.trim()) {
    errors.siteDescription = "请输入网站简介";
  }

  if (config.domain.trim() && !isValidHttpUrl(config.domain.trim())) {
    errors.domain = "请输入以 http 或 https 开头的有效域名";
  }

  if (config.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail.trim())) {
    errors.contactEmail = "请输入有效联系邮箱";
  }

  return errors;
}

function getKeywordList(keywords: string) {
  return keywords
    .split(/[,，]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getCompletedBasicCount(config: WebsiteConfig) {
  return [config.siteName, config.siteDescription, config.siteKeywords, config.domain, config.icpNumber, config.contactEmail].filter(
    (value) => value.trim().length > 0,
  ).length;
}

function getEnabledSwitchCount(config: WebsiteConfig) {
  return [config.siteEnabled, config.registrationEnabled, config.commentsEnabled, config.maintenanceMode].filter(Boolean).length;
}

function WebsiteConfigPage() {
  const message = useLonMessage();
  const [savedConfig, setSavedConfig] = useState<WebsiteConfig>(getInitialWebsiteConfig);
  const [config, setConfig] = useState<WebsiteConfig>(savedConfig);
  const [errors, setErrors] = useState<WebsiteConfigErrors>({});
  const [saving, setSaving] = useState(false);
  const [lastSavedText, setLastSavedText] = useState("今天 10:36");
  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const keywordList = useMemo(() => getKeywordList(config.siteKeywords), [config.siteKeywords]);
  const completedBasicCount = getCompletedBasicCount(config);
  const enabledSwitchCount = getEnabledSwitchCount(config);
  const MetaIcon = moduleMeta.websiteConfig.icon;

  function updateConfig<K extends keyof WebsiteConfig>(key: K, value: WebsiteConfig[K]) {
    setConfig((currentConfig) => ({ ...currentConfig, [key]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
  }

  async function saveConfig() {
    if (saving) {
      return;
    }

    const nextErrors = validateWebsiteConfig(config);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      message.warning("请先补全基础配置");
      return;
    }

    setSaving(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      window.localStorage.setItem(WEBSITE_CONFIG_STORAGE_KEY, JSON.stringify(config));
      setSavedConfig(config);
      setLastSavedText("刚刚");
      message.success("网站基础配置已保存");
    } catch {
      message.error("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveConfig();
  }

  function resetConfig() {
    setConfig(savedConfig);
    setErrors({});
    message.info("已恢复到上次保存的配置");
  }

  return (
    <form className="website-config-page" onSubmit={handleSubmit}>
      <section className="admin-panel website-config-overview" aria-label="网站基础配置概览">
        <div className="website-config-title-block">
          <span className="website-status-chip">
            <MetaIcon size={14} strokeWidth={2.2} />
            基础配置
          </span>
          <div>
            <h1>{moduleMeta.websiteConfig.title}</h1>
            <p>先维护网站名称、简介、关键字和几个常用开关，后续再逐步扩展高级配置。</p>
          </div>
        </div>

        <div className="website-config-summary" aria-label="配置状态">
          <SummaryMetric icon={<CheckCircle2 size={15} />} label="基础项" value={`${completedBasicCount}/6`} />
          <SummaryMetric icon={<ToggleRight size={15} />} label="已开开关" value={`${enabledSwitchCount}/4`} />
          <SummaryMetric icon={<Clock3 size={15} />} label="最近保存" value={lastSavedText} />
        </div>

        <div className="website-config-actions">
          <LonButton
            type="button"
            variant="secondary"
            leadingIcon={<RefreshCcw size={14} strokeWidth={2.2} />}
            disabled={!hasChanges || saving}
            onClick={resetConfig}
          >
            恢复
          </LonButton>
          <LonButton type="submit" loading={saving} leadingIcon={<Save size={14} strokeWidth={2.2} />} disabled={!hasChanges}>
            保存配置
          </LonButton>
        </div>
      </section>

      <div className="website-basic-layout">
        <section className="admin-panel website-basic-form-panel">
          <SectionHead icon={<Globe2 size={16} strokeWidth={2.1} />} title="基础信息" description="面向用户和搜索展示的核心站点信息。" />
          <div className="website-section-body">
            <div className="website-form-grid">
              <LonInput
                label="网站名称"
                value={config.siteName}
                error={errors.siteName}
                placeholder="例如 Lonear Portal"
                onChange={(event) => updateConfig("siteName", event.target.value)}
              />
              <LonInput
                label="访问域名"
                value={config.domain}
                error={errors.domain}
                placeholder="https://www.example.com"
                onChange={(event) => updateConfig("domain", event.target.value)}
              />
              <TextareaField
                label="网站简介"
                value={config.siteDescription}
                error={errors.siteDescription}
                hint={`${config.siteDescription.length}/120，建议一句话说清楚网站用途。`}
                rows={3}
                placeholder="用于首页简介、分享摘要和后台识别"
                onChange={(value) => updateConfig("siteDescription", value)}
              />
              <TextareaField
                label="网站关键字"
                value={config.siteKeywords}
                hint="用逗号分隔，例如：企业门户, 内容运营, 在线服务。"
                rows={3}
                placeholder="关键字一, 关键字二, 关键字三"
                onChange={(value) => updateConfig("siteKeywords", value)}
              />
              <LonInput
                label="备案号"
                value={config.icpNumber}
                placeholder="例如 沪ICP备 20260000 号"
                onChange={(event) => updateConfig("icpNumber", event.target.value)}
              />
              <LonInput
                label="联系邮箱"
                value={config.contactEmail}
                error={errors.contactEmail}
                placeholder="support@example.com"
                onChange={(event) => updateConfig("contactEmail", event.target.value)}
              />
            </div>
          </div>
        </section>

        <aside className="website-basic-side">
          <section className="admin-panel website-switch-panel">
            <SectionHead icon={<ToggleRight size={16} strokeWidth={2.1} />} title="常用开关" description="只保留第一版最常改的开关。" />
            <div className="website-switch-list">
              <ToggleRow
                title="启用网站"
                description="关闭后前台展示站点停用提示。"
                checked={config.siteEnabled}
                onToggle={() => updateConfig("siteEnabled", !config.siteEnabled)}
              />
              <ToggleRow
                title="开放注册"
                description="允许新用户自行注册账号。"
                checked={config.registrationEnabled}
                onToggle={() => updateConfig("registrationEnabled", !config.registrationEnabled)}
              />
              <ToggleRow
                title="开启评论"
                description="控制文章、公告等内容的评论入口。"
                checked={config.commentsEnabled}
                onToggle={() => updateConfig("commentsEnabled", !config.commentsEnabled)}
              />
              <ToggleRow
                title="维护模式"
                description="临时维护时打开，提醒用户稍后再试。"
                checked={config.maintenanceMode}
                onToggle={() => updateConfig("maintenanceMode", !config.maintenanceMode)}
              />
            </div>
          </section>

          <section className="admin-panel website-preview-panel" aria-label="基础配置预览">
            <SectionHead icon={<Info size={16} strokeWidth={2.1} />} title="预览" description="保存前快速确认展示文案。" />
            <div className="website-preview-card">
              <span>{config.siteEnabled ? "网站启用中" : "网站已停用"}</span>
              <h2>{config.siteName || "未命名网站"}</h2>
              <p>{config.siteDescription || "还没有填写网站简介。"}</p>
              <div className="website-keyword-list">
                {keywordList.length > 0 ? keywordList.map((keyword) => <em key={keyword}>{keyword}</em>) : <em>暂无关键字</em>}
              </div>
              <dl>
                <div>
                  <dt>域名</dt>
                  <dd>{config.domain || "未配置"}</dd>
                </div>
                <div>
                  <dt>备案</dt>
                  <dd>{config.icpNumber || "未配置"}</dd>
                </div>
              </dl>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}

export default WebsiteConfigPage;

function SummaryMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="website-summary-metric">
      <span className="website-summary-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionHead({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="website-section-head">
      <span className="website-section-icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="website-toggle-row" type="button" aria-pressed={checked} onClick={onToggle}>
      <span className="website-toggle-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className={`website-toggle ${checked ? "active" : ""}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function TextareaField({
  label,
  value,
  error,
  hint,
  placeholder,
  rows = 4,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  const message = error || hint;

  return (
    <label className={`lon-form-field website-textarea-field ${error ? "has-error" : ""}`}>
      <span className="lon-form-label">{label}</span>
      <textarea
        className="website-textarea"
        value={value}
        rows={rows}
        aria-invalid={error ? true : undefined}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {message ? <span className={error ? "lon-form-error" : "lon-form-hint"}>{message}</span> : null}
    </label>
  );
}
