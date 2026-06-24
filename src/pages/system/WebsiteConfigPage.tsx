import { useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  Globe2,
  Info,
  Palette,
  RefreshCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  ToggleRight,
} from "lucide-react";
import {
  LonButton,
  LonInput,
  LonNumberInput,
  LonRadioGroup,
  LonSelect,
  useLonMessage,
} from "../../components/ui";
import { moduleMeta } from "../../config/modules";
import "./WebsiteConfigPage.css";

type WebsiteStatus = "online" | "maintenance" | "internal";
type AnalyticsProvider = "none" | "ga4" | "umami" | "matomo";
type RobotsPolicy = "index" | "limited" | "private";

type WebsiteConfig = {
  siteName: string;
  siteSubtitle: string;
  siteStatus: WebsiteStatus;
  domain: string;
  icpNumber: string;
  publicEmail: string;
  defaultLanguage: string;
  brandColor: string;
  logoUrl: string;
  faviconUrl: string;
  seoTitleTemplate: string;
  seoKeywords: string;
  seoDescription: string;
  shareTitle: string;
  shareSummary: string;
  shareImage: string;
  registrationEnabled: boolean;
  commentsEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  accessWhitelist: string;
  cookieConsentEnabled: boolean;
  sitemapEnabled: boolean;
  analyticsEnabled: boolean;
  analyticsProvider: AnalyticsProvider;
  analyticsId: string;
  robotsPolicy: RobotsPolicy;
  cacheMinutes: number;
};

type WebsiteConfigErrors = Partial<Record<keyof WebsiteConfig, string>>;

type ConfigSectionItem = {
  id: string;
  title: string;
  description: string;
  icon: typeof Globe2;
  complete: boolean;
};

const WEBSITE_CONFIG_STORAGE_KEY = "lonear-admin.website-config";

const defaultWebsiteConfig: WebsiteConfig = {
  siteName: "Lonear Portal",
  siteSubtitle: "企业内容与服务门户",
  siteStatus: "online",
  domain: "https://portal.lonear.local",
  icpNumber: "沪ICP备 20260123 号",
  publicEmail: "support@lonear.local",
  defaultLanguage: "zh-CN",
  brandColor: "#1066cc",
  logoUrl: "/logo.png",
  faviconUrl: "/icon.png",
  seoTitleTemplate: "{page} - Lonear Portal",
  seoKeywords: "企业门户, 内容运营, 在线服务",
  seoDescription: "Lonear Portal 为企业用户提供内容发布、消息触达和业务服务入口。",
  shareTitle: "Lonear Portal",
  shareSummary: "统一访问企业内容、公告和服务入口。",
  shareImage: "/images/share-cover.png",
  registrationEnabled: false,
  commentsEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: "网站正在进行短时维护，预计 30 分钟内恢复访问。",
  accessWhitelist: "127.0.0.1\n10.0.0.0/8",
  cookieConsentEnabled: true,
  sitemapEnabled: true,
  analyticsEnabled: true,
  analyticsProvider: "umami",
  analyticsId: "lonear-portal",
  robotsPolicy: "index",
  cacheMinutes: 15,
};

const languageOptions = [
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁体中文" },
  { value: "en-US", label: "English" },
  { value: "ja-JP", label: "日本語" },
];

const statusOptions = [
  { value: "online", label: "正式开放", description: "访客可正常访问前台页面" },
  { value: "maintenance", label: "维护中", description: "展示维护提示，仅白名单可访问" },
  { value: "internal", label: "内部可见", description: "仅登录用户和内网白名单可访问" },
];

const analyticsProviderOptions = [
  { value: "none", label: "暂不接入" },
  { value: "ga4", label: "Google Analytics 4" },
  { value: "umami", label: "Umami" },
  { value: "matomo", label: "Matomo" },
];

const robotsPolicyOptions = [
  { value: "index", label: "允许收录", description: "搜索引擎可抓取公开页面" },
  { value: "limited", label: "仅收录内容页", description: "屏蔽登录、搜索和管理入口" },
  { value: "private", label: "禁止收录", description: "为测试或内部门户关闭索引" },
];

const brandColorOptions = [
  { value: "#1066cc", label: "商务蓝" },
  { value: "#1a9d62", label: "增长绿" },
  { value: "#e08a00", label: "运营橙" },
  { value: "#8b3ce6", label: "品牌紫" },
  { value: "#e0413a", label: "警示红" },
  { value: "#1a1d21", label: "中性黑" },
];

const statusLabelMap: Record<WebsiteStatus, string> = {
  online: "正式开放",
  maintenance: "维护中",
  internal: "内部可见",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getInitialWebsiteConfig() {
  if (typeof window === "undefined") {
    return defaultWebsiteConfig;
  }

  try {
    const savedValue = window.localStorage.getItem(WEBSITE_CONFIG_STORAGE_KEY);
    const parsedValue = savedValue ? JSON.parse(savedValue) : null;

    return isRecord(parsedValue) ? { ...defaultWebsiteConfig, ...parsedValue } : defaultWebsiteConfig;
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

  if (!config.domain.trim()) {
    errors.domain = "请输入访问域名";
  } else if (!isValidHttpUrl(config.domain.trim())) {
    errors.domain = "请输入以 http 或 https 开头的有效域名";
  }

  if (config.publicEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.publicEmail.trim())) {
    errors.publicEmail = "请输入有效联系邮箱";
  }

  if (!/^#[0-9a-f]{6}$/i.test(config.brandColor.trim())) {
    errors.brandColor = "请输入 6 位十六进制色值";
  }

  if (config.analyticsEnabled && config.analyticsProvider !== "none" && !config.analyticsId.trim()) {
    errors.analyticsId = "开启统计后需要填写追踪 ID";
  }

  return errors;
}

function getSeoScore(config: WebsiteConfig) {
  const seoFields = [
    config.seoTitleTemplate,
    config.seoKeywords,
    config.seoDescription,
    config.shareTitle,
    config.shareSummary,
    config.shareImage,
  ];

  return Math.round((seoFields.filter((field) => field.trim().length > 0).length / seoFields.length) * 100);
}

function getEnabledSwitchCount(config: WebsiteConfig) {
  return [
    config.registrationEnabled,
    config.commentsEnabled,
    config.maintenanceMode,
    config.cookieConsentEnabled,
    config.sitemapEnabled,
    config.analyticsEnabled,
  ].filter(Boolean).length;
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function WebsiteConfigPage() {
  const message = useLonMessage();
  const [savedConfig, setSavedConfig] = useState<WebsiteConfig>(getInitialWebsiteConfig);
  const [config, setConfig] = useState<WebsiteConfig>(savedConfig);
  const [errors, setErrors] = useState<WebsiteConfigErrors>({});
  const [saving, setSaving] = useState(false);
  const [lastSavedText, setLastSavedText] = useState("今天 10:36");
  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const seoScore = getSeoScore(config);
  const enabledSwitchCount = getEnabledSwitchCount(config);
  const MetaIcon = moduleMeta.websiteConfig.icon;
  const configSections = useMemo<ConfigSectionItem[]>(
    () => [
      {
        id: "website-basic",
        title: "基础信息",
        description: "站点身份、访问入口和品牌资产",
        icon: Globe2,
        complete: Boolean(config.siteName.trim() && config.domain.trim()) && !errors.siteName && !errors.domain,
      },
      {
        id: "website-seo",
        title: "SEO 与分享",
        description: "搜索结果和社交分享默认文案",
        icon: Search,
        complete: seoScore >= 80,
      },
      {
        id: "website-access",
        title: "访问与体验",
        description: "开放状态、维护提示和访客开关",
        icon: ShieldCheck,
        complete: Boolean(config.maintenanceMode ? config.maintenanceMessage.trim() : true),
      },
      {
        id: "website-integration",
        title: "集成与索引",
        description: "统计、Cookie、站点地图和缓存",
        icon: Settings2,
        complete: !errors.analyticsId,
      },
    ],
    [config.domain, config.maintenanceMessage, config.maintenanceMode, config.siteName, errors.analyticsId, errors.domain, errors.siteName, seoScore],
  );
  const completedSectionCount = configSections.filter((section) => section.complete).length;

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
      message.warning("还有配置需要确认，请查看红色提示");
      scrollToSection("website-basic");
      return;
    }

    setSaving(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 520));
      window.localStorage.setItem(WEBSITE_CONFIG_STORAGE_KEY, JSON.stringify(config));
      setSavedConfig(config);
      setLastSavedText("刚刚");
      message.success("网站配置已保存");
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

  function previewWebsite() {
    if (!isValidHttpUrl(config.domain.trim())) {
      message.warning("请先填写有效访问域名");
      setErrors((currentErrors) => ({ ...currentErrors, domain: "请输入以 http 或 https 开头的有效域名" }));
      scrollToSection("website-basic");
      return;
    }

    window.open(config.domain.trim(), "_blank", "noopener,noreferrer");
  }

  return (
    <form className="website-config-page" onSubmit={handleSubmit}>
      <section className="admin-panel website-config-overview" aria-label="网站配置概览">
        <div className="website-config-title-block">
          <span className={`website-status-chip ${config.siteStatus}`}>
            <MetaIcon size={14} strokeWidth={2.2} />
            {statusLabelMap[config.siteStatus]}
          </span>
          <div>
            <h1>{moduleMeta.websiteConfig.title}</h1>
            <p>集中管理站点基础信息、搜索展示、访问策略和第三方集成，修改前后都能看见影响范围。</p>
          </div>
        </div>

        <div className="website-config-summary" aria-label="配置状态">
          <SummaryMetric icon={<CheckCircle2 size={15} />} label="完成分组" value={`${completedSectionCount}/4`} />
          <SummaryMetric icon={<Sparkles size={15} />} label="SEO 完整度" value={`${seoScore}%`} />
          <SummaryMetric icon={<ToggleRight size={15} />} label="已开开关" value={`${enabledSwitchCount}/6`} />
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
          <LonButton
            type="button"
            variant="secondary"
            leadingIcon={<ExternalLink size={14} strokeWidth={2.2} />}
            onClick={previewWebsite}
          >
            预览
          </LonButton>
          <LonButton type="submit" loading={saving} leadingIcon={<Save size={14} strokeWidth={2.2} />} disabled={!hasChanges}>
            保存配置
          </LonButton>
        </div>
      </section>

      <div className="website-config-workspace">
        <aside className="website-config-sidebar" aria-label="网站配置导航">
          <section className="admin-panel website-section-nav-panel">
            <div className="website-side-head">
              <strong>配置分组</strong>
              <span>{hasChanges ? "有未保存改动" : "已同步"}</span>
            </div>
            <nav className="website-section-nav">
              {configSections.map((section) => (
                <button type="button" key={section.id} onClick={() => scrollToSection(section.id)}>
                  <span className="website-nav-icon">
                    <section.icon size={14} strokeWidth={2.2} />
                  </span>
                  <span>
                    <strong>{section.title}</strong>
                    <small>{section.description}</small>
                  </span>
                  <Check className={section.complete ? "complete" : ""} size={13} strokeWidth={2.4} />
                </button>
              ))}
            </nav>
          </section>

          <section className="admin-panel website-live-preview-panel" aria-label="前台预览">
            <div className="website-side-head">
              <strong>前台预览</strong>
              <span>实时</span>
            </div>
            <div className="website-browser-preview">
              <div className="website-browser-bar" aria-hidden="true">
                <span />
                <span />
                <span />
                <em>{config.domain.replace(/^https?:\/\//, "")}</em>
              </div>
              <div className="website-preview-screen" style={{ "--preview-accent": config.brandColor } as CSSProperties}>
                <div className="website-preview-header">
                  <span className="website-preview-logo">{config.siteName.slice(0, 1).toUpperCase() || "L"}</span>
                  <strong>{config.siteName || "未命名网站"}</strong>
                </div>
                <h2>{config.shareTitle || config.siteName || "分享标题"}</h2>
                <p>{config.shareSummary || config.seoDescription || "补全描述后，这里会展示前台分享摘要。"}</p>
                <div className="website-preview-actions">
                  <span>立即访问</span>
                  <span>了解更多</span>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <div className="website-config-sections">
          <ConfigSection
            id="website-basic"
            icon={<Globe2 size={16} strokeWidth={2.1} />}
            title="基础信息"
            description="这些信息会出现在浏览器标题、备案页、品牌入口和公开联系渠道。"
            meta="建议先确认"
          >
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
                leadingIcon={<Globe2 size={13} strokeWidth={2.1} />}
                placeholder="https://www.example.com"
                onChange={(event) => updateConfig("domain", event.target.value)}
              />
              <LonInput
                label="站点副标题"
                value={config.siteSubtitle}
                hint="用于登录页、分享卡片和部分前台页脚。"
                placeholder="一句话说明网站提供什么服务"
                onChange={(event) => updateConfig("siteSubtitle", event.target.value)}
              />
              <LonSelect
                label="默认语言"
                value={config.defaultLanguage}
                options={languageOptions}
                onValueChange={(value) => updateConfig("defaultLanguage", value)}
              />
              <LonInput
                label="公开联系邮箱"
                value={config.publicEmail}
                error={errors.publicEmail}
                placeholder="support@example.com"
                onChange={(event) => updateConfig("publicEmail", event.target.value)}
              />
              <LonInput
                label="备案号"
                value={config.icpNumber}
                placeholder="例如 沪ICP备 20260000 号"
                onChange={(event) => updateConfig("icpNumber", event.target.value)}
              />
              <LonInput
                label="Logo 路径"
                value={config.logoUrl}
                hint="支持 public 目录路径或完整图片 URL。"
                placeholder="/logo.png"
                onChange={(event) => updateConfig("logoUrl", event.target.value)}
              />
              <LonInput
                label="Favicon 路径"
                value={config.faviconUrl}
                placeholder="/icon.png"
                onChange={(event) => updateConfig("faviconUrl", event.target.value)}
              />
            </div>

            <div className="website-color-config">
              <div className="website-color-copy">
                <Palette size={15} strokeWidth={2.1} />
                <div>
                  <strong>品牌主色</strong>
                  <span>影响按钮、前台预览和重点状态。请选择对比度清晰的颜色。</span>
                </div>
              </div>
              <div className="website-color-controls">
                <div className="website-color-swatches" aria-label="品牌主色快捷选择">
                  {brandColorOptions.map((option) => (
                    <button
                      type="button"
                      className={config.brandColor === option.value ? "active" : ""}
                      style={{ "--swatch-color": option.value } as CSSProperties}
                      aria-label={`选择${option.label}`}
                      key={option.value}
                      onClick={() => updateConfig("brandColor", option.value)}
                    >
                      <span />
                    </button>
                  ))}
                </div>
                <LonInput
                  label="自定义色值"
                  value={config.brandColor}
                  error={errors.brandColor}
                  placeholder="#1066cc"
                  onChange={(event) => updateConfig("brandColor", event.target.value)}
                />
              </div>
            </div>
          </ConfigSection>

          <ConfigSection
            id="website-seo"
            icon={<Search size={16} strokeWidth={2.1} />}
            title="SEO 与分享"
            description="帮助运营同学直接理解标题、关键词和分享摘要会出现在哪里。"
            meta={`${seoScore}% 完整`}
          >
            <div className="website-form-grid">
              <LonInput
                label="标题模板"
                value={config.seoTitleTemplate}
                hint="可使用 {page} 作为页面标题占位符。"
                placeholder="{page} - 品牌名称"
                onChange={(event) => updateConfig("seoTitleTemplate", event.target.value)}
              />
              <LonInput
                label="默认分享标题"
                value={config.shareTitle}
                placeholder="分享卡片主标题"
                onChange={(event) => updateConfig("shareTitle", event.target.value)}
              />
              <TextareaField
                label="关键词"
                value={config.seoKeywords}
                hint="使用逗号分隔，建议 3 到 8 个核心词。"
                rows={3}
                placeholder="企业门户, 内容运营, 在线服务"
                onChange={(value) => updateConfig("seoKeywords", value)}
              />
              <TextareaField
                label="站点描述"
                value={config.seoDescription}
                hint={`${config.seoDescription.length}/160，搜索结果通常优先展示前 120 到 160 字。`}
                rows={3}
                placeholder="一句清晰的搜索结果摘要"
                onChange={(value) => updateConfig("seoDescription", value)}
              />
              <TextareaField
                label="分享摘要"
                value={config.shareSummary}
                rows={3}
                placeholder="微信、飞书、浏览器分享时展示的摘要"
                onChange={(value) => updateConfig("shareSummary", value)}
              />
              <LonInput
                label="分享封面"
                value={config.shareImage}
                hint="建议 1200 x 630，支持 public 路径或完整图片 URL。"
                placeholder="/images/share-cover.png"
                onChange={(event) => updateConfig("shareImage", event.target.value)}
              />
            </div>
          </ConfigSection>

          <ConfigSection
            id="website-access"
            icon={<ShieldCheck size={16} strokeWidth={2.1} />}
            title="访问与体验"
            description="把危险开关放在同一处，维护、注册和公开访问状态一眼可见。"
            meta={config.maintenanceMode ? "维护提示开启" : "体验正常"}
          >
            <LonRadioGroup
              label="站点可见状态"
              name="site-status"
              value={config.siteStatus}
              options={statusOptions}
              direction="vertical"
              onValueChange={(value) => updateConfig("siteStatus", value as WebsiteStatus)}
            />

            <div className="website-toggle-grid">
              <ToggleRow
                title="开放注册入口"
                description="关闭后新用户只能由管理员邀请或后台创建。"
                checked={config.registrationEnabled}
                onToggle={() => updateConfig("registrationEnabled", !config.registrationEnabled)}
              />
              <ToggleRow
                title="展示评论互动"
                description="控制前台文章、公告等内容的评论入口。"
                checked={config.commentsEnabled}
                onToggle={() => updateConfig("commentsEnabled", !config.commentsEnabled)}
              />
              <ToggleRow
                title="开启维护提示"
                description="访客会看到维护文案，白名单地址仍可访问。"
                checked={config.maintenanceMode}
                onToggle={() => updateConfig("maintenanceMode", !config.maintenanceMode)}
              />
              <ToggleRow
                title="Cookie 同意提示"
                description="接入统计或第三方脚本时建议保持开启。"
                checked={config.cookieConsentEnabled}
                onToggle={() => updateConfig("cookieConsentEnabled", !config.cookieConsentEnabled)}
              />
              <ToggleRow
                title="自动生成 Sitemap"
                description="发布内容后自动更新搜索引擎站点地图。"
                checked={config.sitemapEnabled}
                onToggle={() => updateConfig("sitemapEnabled", !config.sitemapEnabled)}
              />
            </div>

            <div className="website-form-grid">
              <TextareaField
                label="维护提示文案"
                value={config.maintenanceMessage}
                hint="维护模式开启时展示给访客。"
                rows={3}
                disabled={!config.maintenanceMode}
                onChange={(value) => updateConfig("maintenanceMessage", value)}
              />
              <TextareaField
                label="访问白名单"
                value={config.accessWhitelist}
                hint="每行一个 IP、CIDR 或内网域名。"
                rows={3}
                onChange={(value) => updateConfig("accessWhitelist", value)}
              />
            </div>
          </ConfigSection>

          <ConfigSection
            id="website-integration"
            icon={<Settings2 size={16} strokeWidth={2.1} />}
            title="集成与索引"
            description="把第三方统计、爬虫策略和缓存时间放在一起，避免上线前漏配。"
            meta={config.analyticsEnabled ? "统计已启用" : "统计未启用"}
          >
            <div className="website-inline-note">
              <Info size={14} strokeWidth={2.1} />
              <span>这些配置通常会影响前台脚本、robots.txt、sitemap.xml 和 CDN 缓存，请在保存后安排一次线上验证。</span>
            </div>

            <ToggleRow
              title="启用访问统计"
              description="开启后会在前台注入选定统计服务的追踪标识。"
              checked={config.analyticsEnabled}
              onToggle={() => updateConfig("analyticsEnabled", !config.analyticsEnabled)}
            />

            <div className="website-form-grid">
              <LonSelect
                label="统计服务"
                value={config.analyticsEnabled ? config.analyticsProvider : "none"}
                disabled={!config.analyticsEnabled}
                options={analyticsProviderOptions}
                onValueChange={(value) => updateConfig("analyticsProvider", value as AnalyticsProvider)}
              />
              <LonInput
                label="追踪 ID"
                value={config.analyticsId}
                error={errors.analyticsId}
                disabled={!config.analyticsEnabled || config.analyticsProvider === "none"}
                placeholder="例如 G-XXXX 或站点 ID"
                onChange={(event) => updateConfig("analyticsId", event.target.value)}
              />
              <LonNumberInput
                label="前台配置缓存"
                value={config.cacheMinutes}
                min={0}
                max={1440}
                step={5}
                hint="单位：分钟。设置为 0 表示每次请求都读取最新配置。"
                onValueChange={(value) => updateConfig("cacheMinutes", typeof value === "number" ? value : 0)}
              />
            </div>

            <LonRadioGroup
              label="搜索引擎策略"
              name="robots-policy"
              value={config.robotsPolicy}
              options={robotsPolicyOptions}
              direction="vertical"
              onValueChange={(value) => updateConfig("robotsPolicy", value as RobotsPolicy)}
            />
          </ConfigSection>
        </div>
      </div>

      <section className="admin-panel website-save-bar" aria-label="保存网站配置">
        <div>
          <strong>{hasChanges ? "有未保存的配置改动" : "所有配置已保存"}</strong>
          <span>{hasChanges ? "保存后前台读取最新配置，建议预览确认关键页面。" : `最近保存：${lastSavedText}`}</span>
        </div>
        <div>
          <LonButton
            type="button"
            variant="secondary"
            leadingIcon={<Eye size={14} strokeWidth={2.2} />}
            onClick={previewWebsite}
          >
            预览前台
          </LonButton>
          <LonButton type="submit" loading={saving} leadingIcon={<Save size={14} strokeWidth={2.2} />} disabled={!hasChanges}>
            保存配置
          </LonButton>
        </div>
      </section>
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

function ConfigSection({
  id,
  icon,
  title,
  description,
  meta,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-panel website-config-section" id={id}>
      <div className="website-section-head">
        <span className="website-section-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="website-section-meta">{meta}</span>
      </div>
      <div className="website-section-body">{children}</div>
    </section>
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
  hint,
  placeholder,
  rows = 4,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="lon-form-field website-textarea-field">
      <span className="lon-form-label">{label}</span>
      <textarea
        className="website-textarea"
        value={value}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="lon-form-hint">{hint}</span> : null}
    </label>
  );
}
