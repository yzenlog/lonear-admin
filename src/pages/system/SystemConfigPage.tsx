import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  Gauge,
  LockKeyhole,
  PlugZap,
  RefreshCcw,
  RotateCcw,
  Save,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  ToggleRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LonButton, LonInput, LonNumberInput, LonSelect, useLonMessage } from "../../components/ui";
import type { LonNumberInputValue } from "../../components/ui";
import { moduleMeta } from "../../config/modules";
import "./SystemConfigPage.css";

type SystemSwitchKey =
  | "forceTwoFactor"
  | "loginCaptcha"
  | "ipAllowlist"
  | "auditLog"
  | "maintenanceMode"
  | "contentPublishing"
  | "fileUpload"
  | "messageDispatch"
  | "openApi"
  | "webhookDelivery"
  | "scheduledJobs"
  | "betaFeatures";

type SystemSwitchGroupId = "security" | "operation" | "integration";
type SystemSwitchFilter = "all" | SystemSwitchGroupId;
type SwitchRisk = "low" | "medium" | "high";
type ReleaseMode = "stable" | "gray" | "internal";
type NumberConfigKey = "sessionTimeoutMinutes" | "loginLockMinutes" | "uploadMaxMb" | "auditRetentionDays";

type SystemSwitch = {
  key: SystemSwitchKey;
  title: string;
  description: string;
  impact: string;
  owner: string;
  risk: SwitchRisk;
  locked?: boolean;
};

type SystemSwitchGroup = {
  id: SystemSwitchGroupId;
  title: string;
  label: string;
  description: string;
  icon: LucideIcon;
  switchKeys: SystemSwitchKey[];
};

type SystemConfig = {
  switches: Record<SystemSwitchKey, boolean>;
  sessionTimeoutMinutes: LonNumberInputValue;
  loginLockMinutes: LonNumberInputValue;
  uploadMaxMb: LonNumberInputValue;
  auditRetentionDays: LonNumberInputValue;
  releaseMode: ReleaseMode;
  emergencyContact: string;
};

type SystemConfigErrors = Partial<Record<NumberConfigKey | "emergencyContact", string>>;

const SYSTEM_CONFIG_STORAGE_KEY = "lonear-admin.system-config";

const releaseModeOptions: Array<{ value: ReleaseMode; label: string }> = [
  { value: "stable", label: "稳定优先" },
  { value: "gray", label: "灰度优先" },
  { value: "internal", label: "仅内部可见" },
];

const numberFieldRules: Record<NumberConfigKey, { label: string; min: number; max: number }> = {
  sessionTimeoutMinutes: { label: "会话有效期", min: 15, max: 1440 },
  loginLockMinutes: { label: "登录锁定时长", min: 5, max: 240 },
  uploadMaxMb: { label: "单文件大小上限", min: 1, max: 500 },
  auditRetentionDays: { label: "审计保留天数", min: 30, max: 1095 },
};

const systemSwitchDefinitions: SystemSwitch[] = [
  {
    key: "forceTwoFactor",
    title: "强制二次验证",
    description: "要求管理员在密码登录后完成二次验证。",
    impact: "后台登录",
    owner: "安全组",
    risk: "medium",
  },
  {
    key: "loginCaptcha",
    title: "登录验证码",
    description: "登录失败或异常设备访问时启用验证码校验。",
    impact: "登录入口",
    owner: "安全组",
    risk: "low",
  },
  {
    key: "ipAllowlist",
    title: "后台 IP 白名单",
    description: "只允许白名单网段访问管理后台。",
    impact: "后台访问",
    owner: "技术平台部",
    risk: "high",
  },
  {
    key: "auditLog",
    title: "审计日志采集",
    description: "记录登录、权限、配置和敏感数据变更。",
    impact: "审计中心",
    owner: "风控部",
    risk: "low",
    locked: true,
  },
  {
    key: "maintenanceMode",
    title: "维护模式",
    description: "打开后前台入口展示维护提示，后台管理员仍可登录。",
    impact: "前台访问",
    owner: "系统管理",
    risk: "high",
  },
  {
    key: "contentPublishing",
    title: "内容发布",
    description: "控制文章、公告和 Banner 的发布动作。",
    impact: "内容运营",
    owner: "运营中心",
    risk: "medium",
  },
  {
    key: "fileUpload",
    title: "文件上传",
    description: "控制图片、附件和导入文件的上传入口。",
    impact: "资源中心",
    owner: "技术平台部",
    risk: "medium",
  },
  {
    key: "messageDispatch",
    title: "消息发送",
    description: "控制站内信、邮件和短信的全局发送能力。",
    impact: "消息中心",
    owner: "消息中心",
    risk: "medium",
  },
  {
    key: "openApi",
    title: "开放 API",
    description: "允许外部系统通过访问令牌调用开放接口。",
    impact: "接口网关",
    owner: "技术平台部",
    risk: "high",
  },
  {
    key: "webhookDelivery",
    title: "Webhook 回调",
    description: "向第三方系统推送订单、内容和消息事件。",
    impact: "外部集成",
    owner: "技术平台部",
    risk: "medium",
  },
  {
    key: "scheduledJobs",
    title: "定时任务",
    description: "控制数据同步、报表生成和消息补偿任务。",
    impact: "任务调度",
    owner: "技术平台部",
    risk: "medium",
  },
  {
    key: "betaFeatures",
    title: "实验功能",
    description: "开放正在灰度验证的新菜单和新能力。",
    impact: "全局菜单",
    owner: "产品组",
    risk: "high",
  },
];

const systemSwitchGroups: SystemSwitchGroup[] = [
  {
    id: "security",
    title: "访问与安全",
    label: "安全",
    description: "控制登录、访问边界和审计采集。",
    icon: ShieldCheck,
    switchKeys: ["forceTwoFactor", "loginCaptcha", "ipAllowlist", "auditLog"],
  },
  {
    id: "operation",
    title: "业务能力",
    label: "业务",
    description: "控制前台访问、发布、上传与消息触达。",
    icon: ServerCog,
    switchKeys: ["maintenanceMode", "contentPublishing", "fileUpload", "messageDispatch"],
  },
  {
    id: "integration",
    title: "集成与灰度",
    label: "集成",
    description: "控制开放接口、回调、定时任务和实验功能。",
    icon: PlugZap,
    switchKeys: ["openApi", "webhookDelivery", "scheduledJobs", "betaFeatures"],
  },
];

const defaultSystemConfig: SystemConfig = {
  switches: {
    forceTwoFactor: false,
    loginCaptcha: true,
    ipAllowlist: false,
    auditLog: true,
    maintenanceMode: false,
    contentPublishing: true,
    fileUpload: true,
    messageDispatch: true,
    openApi: false,
    webhookDelivery: true,
    scheduledJobs: true,
    betaFeatures: false,
  },
  sessionTimeoutMinutes: 120,
  loginLockMinutes: 15,
  uploadMaxMb: 50,
  auditRetentionDays: 180,
  releaseMode: "gray",
  emergencyContact: "ops-duty@lonear.local",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) ? clampNumber(Math.round(value), min, max) : fallback;
}

function readReleaseMode(value: unknown, fallback: ReleaseMode): ReleaseMode {
  return releaseModeOptions.some((option) => option.value === value) ? (value as ReleaseMode) : fallback;
}

function normalizeSwitches(value: unknown) {
  const savedSwitches = isRecord(value) ? value : {};

  return systemSwitchDefinitions.reduce<Record<SystemSwitchKey, boolean>>((switches, switchItem) => {
    switches[switchItem.key] = switchItem.locked
      ? defaultSystemConfig.switches[switchItem.key]
      : readBoolean(savedSwitches[switchItem.key], defaultSystemConfig.switches[switchItem.key]);

    return switches;
  }, {} as Record<SystemSwitchKey, boolean>);
}

function getInitialSystemConfig(): SystemConfig {
  if (typeof window === "undefined") {
    return defaultSystemConfig;
  }

  try {
    const savedValue = window.localStorage.getItem(SYSTEM_CONFIG_STORAGE_KEY);
    const parsedValue = savedValue ? JSON.parse(savedValue) : null;

    if (!isRecord(parsedValue)) {
      return defaultSystemConfig;
    }

    return {
      switches: normalizeSwitches(parsedValue.switches),
      sessionTimeoutMinutes: readNumber(
        parsedValue.sessionTimeoutMinutes,
        defaultSystemConfig.sessionTimeoutMinutes as number,
        numberFieldRules.sessionTimeoutMinutes.min,
        numberFieldRules.sessionTimeoutMinutes.max,
      ),
      loginLockMinutes: readNumber(
        parsedValue.loginLockMinutes,
        defaultSystemConfig.loginLockMinutes as number,
        numberFieldRules.loginLockMinutes.min,
        numberFieldRules.loginLockMinutes.max,
      ),
      uploadMaxMb: readNumber(
        parsedValue.uploadMaxMb,
        defaultSystemConfig.uploadMaxMb as number,
        numberFieldRules.uploadMaxMb.min,
        numberFieldRules.uploadMaxMb.max,
      ),
      auditRetentionDays: readNumber(
        parsedValue.auditRetentionDays,
        defaultSystemConfig.auditRetentionDays as number,
        numberFieldRules.auditRetentionDays.min,
        numberFieldRules.auditRetentionDays.max,
      ),
      releaseMode: readReleaseMode(parsedValue.releaseMode, defaultSystemConfig.releaseMode),
      emergencyContact: readString(parsedValue.emergencyContact, defaultSystemConfig.emergencyContact),
    };
  } catch {
    return defaultSystemConfig;
  }
}

function getSafeNumber(value: LonNumberInputValue, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeConfigForSave(config: SystemConfig): SystemConfig {
  return {
    ...config,
    switches: normalizeSwitches(config.switches),
    sessionTimeoutMinutes: getSafeNumber(config.sessionTimeoutMinutes, defaultSystemConfig.sessionTimeoutMinutes as number),
    loginLockMinutes: getSafeNumber(config.loginLockMinutes, defaultSystemConfig.loginLockMinutes as number),
    uploadMaxMb: getSafeNumber(config.uploadMaxMb, defaultSystemConfig.uploadMaxMb as number),
    auditRetentionDays: getSafeNumber(config.auditRetentionDays, defaultSystemConfig.auditRetentionDays as number),
    emergencyContact: config.emergencyContact.trim(),
  };
}

function validateNumberField(value: LonNumberInputValue, key: NumberConfigKey) {
  const rule = numberFieldRules[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `请输入${rule.label}`;
  }

  if (value < rule.min || value > rule.max) {
    return `${rule.label}范围为 ${rule.min}-${rule.max}`;
  }

  return "";
}

function validateSystemConfig(config: SystemConfig) {
  const errors: SystemConfigErrors = {};

  (Object.keys(numberFieldRules) as NumberConfigKey[]).forEach((key) => {
    const error = validateNumberField(config[key], key);

    if (error) {
      errors[key] = error;
    }
  });

  if (!config.emergencyContact.trim()) {
    errors.emergencyContact = "请输入应急联系人";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.emergencyContact.trim())) {
    errors.emergencyContact = "请输入有效的应急邮箱";
  }

  return errors;
}

function getRiskLabel(risk: SwitchRisk) {
  if (risk === "high") {
    return "高风险";
  }

  if (risk === "medium") {
    return "需复核";
  }

  return "低风险";
}

function getReleaseModeLabel(mode: ReleaseMode) {
  return releaseModeOptions.find((option) => option.value === mode)?.label ?? "未配置";
}

function SystemConfigPage() {
  const message = useLonMessage();
  const [savedConfig, setSavedConfig] = useState<SystemConfig>(getInitialSystemConfig);
  const [config, setConfig] = useState<SystemConfig>(savedConfig);
  const [activeGroupId, setActiveGroupId] = useState<SystemSwitchFilter>("all");
  const [errors, setErrors] = useState<SystemConfigErrors>({});
  const [saving, setSaving] = useState(false);
  const [lastSavedText, setLastSavedText] = useState("今天 10:42");
  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const MetaIcon = moduleMeta.systemConfig.icon;
  const visibleSwitchGroups = useMemo(
    () => (activeGroupId === "all" ? systemSwitchGroups : systemSwitchGroups.filter((group) => group.id === activeGroupId)),
    [activeGroupId],
  );
  const enabledSwitchCount = systemSwitchDefinitions.filter((switchItem) => config.switches[switchItem.key]).length;
  const highRiskEnabledCount = systemSwitchDefinitions.filter(
    (switchItem) => switchItem.risk === "high" && config.switches[switchItem.key],
  ).length;
  const lockedSwitchCount = systemSwitchDefinitions.filter((switchItem) => switchItem.locked).length;
  const changedSwitches = systemSwitchDefinitions.filter(
    (switchItem) => config.switches[switchItem.key] !== savedConfig.switches[switchItem.key],
  );
  const changedPolicyCount = (
    [
      "sessionTimeoutMinutes",
      "loginLockMinutes",
      "uploadMaxMb",
      "auditRetentionDays",
      "releaseMode",
      "emergencyContact",
    ] as Array<keyof SystemConfig>
  ).filter((key) => config[key] !== savedConfig[key]).length;
  const pendingChangeCount = changedSwitches.length + changedPolicyCount;
  const releaseModeLabel = getReleaseModeLabel(config.releaseMode);
  const runtimeItems = [
    {
      label: "系统入口",
      value: config.switches.maintenanceMode ? "维护中" : "正常开放",
      tone: config.switches.maintenanceMode ? "amber" : "green",
    },
    {
      label: "发布链路",
      value: config.switches.contentPublishing ? "允许发布" : "已冻结",
      tone: config.switches.contentPublishing ? "green" : "red",
    },
    {
      label: "文件能力",
      value: config.switches.fileUpload ? `${config.uploadMaxMb || 0} MB` : "上传关闭",
      tone: config.switches.fileUpload ? "blue" : "muted",
    },
    {
      label: "接口访问",
      value: config.switches.openApi ? "开放 API" : "内部访问",
      tone: config.switches.openApi ? "amber" : "muted",
    },
  ] as const;
  const riskItems = systemSwitchDefinitions.filter(
    (switchItem) => switchItem.risk === "high" && config.switches[switchItem.key],
  );

  function clearFieldError(key: keyof SystemConfigErrors) {
    setErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
  }

  function updateField<K extends Exclude<keyof SystemConfig, "switches">>(key: K, value: SystemConfig[K]) {
    setConfig((currentConfig) => ({ ...currentConfig, [key]: value }));

    if (key in numberFieldRules || key === "emergencyContact") {
      clearFieldError(key as keyof SystemConfigErrors);
    }
  }

  function toggleSwitch(key: SystemSwitchKey) {
    const switchItem = systemSwitchDefinitions.find((item) => item.key === key);

    if (switchItem?.locked) {
      message.info("审计日志为系统保护项，保持强制开启");
      return;
    }

    setConfig((currentConfig) => ({
      ...currentConfig,
      switches: {
        ...currentConfig.switches,
        [key]: !currentConfig.switches[key],
      },
    }));
  }

  async function saveConfig() {
    if (saving) {
      return;
    }

    const nextErrors = validateSystemConfig(config);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      message.warning("请先修正系统配置项");
      return;
    }

    setSaving(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 420));

      const normalizedConfig = normalizeConfigForSave(config);

      window.localStorage.setItem(SYSTEM_CONFIG_STORAGE_KEY, JSON.stringify(normalizedConfig));
      setConfig(normalizedConfig);
      setSavedConfig(normalizedConfig);
      setLastSavedText("刚刚");
      message.success("系统配置已保存");
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

  function restoreSavedConfig() {
    setConfig(savedConfig);
    setErrors({});
    message.info("已恢复到上次保存的系统配置");
  }

  function resetDefaultConfig() {
    setConfig(defaultSystemConfig);
    setErrors({});
    message.info("已载入默认系统配置，保存后生效");
  }

  return (
    <form className="system-config-page" onSubmit={handleSubmit}>
      <section className="admin-panel system-config-overview" aria-label="系统配置概览">
        <div className="system-config-title-block">
          <span className="system-config-chip">
            <MetaIcon size={14} strokeWidth={2.2} />
            全局开关
          </span>
          <div>
            <h1>{moduleMeta.systemConfig.title}</h1>
            <p>集中控制影响整个后台与前台链路的功能开关、访问策略和安全阈值。</p>
          </div>
        </div>

        <div className="system-config-summary" aria-label="系统配置状态">
          <SummaryMetric icon={<ToggleRight size={15} />} label="已开开关" value={`${enabledSwitchCount}/${systemSwitchDefinitions.length}`} />
          <SummaryMetric icon={<AlertTriangle size={15} />} label="高风险开启" value={String(highRiskEnabledCount)} tone="amber" />
          <SummaryMetric icon={<LockKeyhole size={15} />} label="保护项" value={String(lockedSwitchCount)} />
          <SummaryMetric icon={<Clock3 size={15} />} label="最近保存" value={lastSavedText} />
        </div>

        <div className="system-config-actions">
          <LonButton
            type="button"
            variant="secondary"
            leadingIcon={<RefreshCcw size={14} strokeWidth={2.2} />}
            disabled={!hasChanges || saving}
            onClick={restoreSavedConfig}
          >
            恢复
          </LonButton>
          <LonButton
            type="button"
            variant="ghost"
            leadingIcon={<RotateCcw size={14} strokeWidth={2.2} />}
            disabled={saving}
            onClick={resetDefaultConfig}
          >
            默认值
          </LonButton>
          <LonButton type="submit" loading={saving} leadingIcon={<Save size={14} strokeWidth={2.2} />} disabled={!hasChanges}>
            保存配置
          </LonButton>
        </div>
      </section>

      <div className="system-config-layout">
        <main className="system-config-main">
          <section className="admin-panel system-switch-panel">
            <SectionHead
              icon={<SlidersHorizontal size={16} strokeWidth={2.1} />}
              title="功能开关"
              description="变更会影响对应模块的入口、任务或外部调用能力。"
              action={
                <div className="system-config-tabs" role="tablist" aria-label="系统开关分类">
                  <FilterTab active={activeGroupId === "all"} label="全部" onClick={() => setActiveGroupId("all")} />
                  {systemSwitchGroups.map((group) => (
                    <FilterTab
                      active={activeGroupId === group.id}
                      key={group.id}
                      label={group.label}
                      onClick={() => setActiveGroupId(group.id)}
                    />
                  ))}
                </div>
              }
            />

            <div className="system-switch-groups">
              {visibleSwitchGroups.map((group) => (
                <SwitchGroup
                  changedSwitches={changedSwitches}
                  config={config}
                  group={group}
                  key={group.id}
                  onToggle={toggleSwitch}
                />
              ))}
            </div>
          </section>

          <section className="admin-panel system-policy-panel">
            <SectionHead
              icon={<Gauge size={16} strokeWidth={2.1} />}
              title="策略参数"
              description="控制会话、安全锁定、上传限制和审计保留周期。"
            />
            <div className="system-policy-grid">
              <LonNumberInput
                label="会话有效期"
                value={config.sessionTimeoutMinutes}
                min={numberFieldRules.sessionTimeoutMinutes.min}
                max={numberFieldRules.sessionTimeoutMinutes.max}
                step={15}
                error={errors.sessionTimeoutMinutes}
                hint="单位分钟，超时后需要重新登录。"
                onValueChange={(value) => updateField("sessionTimeoutMinutes", value)}
              />
              <LonNumberInput
                label="登录锁定时长"
                value={config.loginLockMinutes}
                min={numberFieldRules.loginLockMinutes.min}
                max={numberFieldRules.loginLockMinutes.max}
                step={5}
                error={errors.loginLockMinutes}
                hint="连续失败后账号冻结的分钟数。"
                onValueChange={(value) => updateField("loginLockMinutes", value)}
              />
              <LonNumberInput
                label="单文件大小上限"
                value={config.uploadMaxMb}
                min={numberFieldRules.uploadMaxMb.min}
                max={numberFieldRules.uploadMaxMb.max}
                step={5}
                error={errors.uploadMaxMb}
                hint="单位 MB，关闭文件上传后仅作为预设保留。"
                onValueChange={(value) => updateField("uploadMaxMb", value)}
              />
              <LonNumberInput
                label="审计保留天数"
                value={config.auditRetentionDays}
                min={numberFieldRules.auditRetentionDays.min}
                max={numberFieldRules.auditRetentionDays.max}
                step={30}
                error={errors.auditRetentionDays}
                hint="到期日志进入归档或清理流程。"
                onValueChange={(value) => updateField("auditRetentionDays", value)}
              />
              <LonSelect
                label="发布策略"
                value={config.releaseMode}
                options={releaseModeOptions}
                hint="决定实验功能和新能力的默认可见范围。"
                onValueChange={(value) => updateField("releaseMode", value as ReleaseMode)}
              />
              <LonInput
                label="应急联系人"
                value={config.emergencyContact}
                error={errors.emergencyContact}
                placeholder="ops-duty@example.com"
                hint="高风险开关变更时用于通知值班负责人。"
                onChange={(event) => updateField("emergencyContact", event.target.value)}
              />
            </div>
          </section>
        </main>

        <aside className="system-config-side">
          <section className="admin-panel system-runtime-panel" aria-label="运行状态">
            <SectionHead icon={<CheckCircle2 size={16} strokeWidth={2.1} />} title="运行状态" description="保存后系统将按这些状态执行。" />
            <div className="system-runtime-list">
              {runtimeItems.map((item) => (
                <StatusRow label={item.label} tone={item.tone} value={item.value} key={item.label} />
              ))}
              <StatusRow label="发布策略" tone="blue" value={releaseModeLabel} />
              <StatusRow label="会话有效期" tone="muted" value={`${config.sessionTimeoutMinutes || 0} 分钟`} />
            </div>
          </section>

          <section className="admin-panel system-change-panel" aria-label="变更影响">
            <SectionHead icon={<AlertTriangle size={16} strokeWidth={2.1} />} title="变更影响" description="高风险和未保存变更会在这里汇总。" />
            <div className="system-change-body">
              <div className="system-pending-box">
                <span>未保存变更</span>
                <strong>{pendingChangeCount}</strong>
              </div>

              {changedSwitches.length > 0 ? (
                <div className="system-change-list">
                  {changedSwitches.slice(0, 5).map((switchItem) => (
                    <ChangeItem key={switchItem.key} label={switchItem.title} value={config.switches[switchItem.key] ? "将开启" : "将关闭"} />
                  ))}
                </div>
              ) : (
                <p className="system-change-empty">当前开关状态与已保存配置一致。</p>
              )}

              <div className="system-risk-block">
                <div className="system-risk-title">
                  <Sparkles size={14} strokeWidth={2.2} />
                  <span>风险提示</span>
                </div>
                {riskItems.length > 0 ? (
                  riskItems.map((switchItem) => (
                    <ChangeItem key={switchItem.key} label={switchItem.title} value={switchItem.impact} danger />
                  ))
                ) : (
                  <p className="system-change-empty">暂无高风险开关处于开启状态。</p>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}

export default SystemConfigPage;

function SummaryMetric({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "amber";
}) {
  return (
    <div className={`system-summary-metric tone-${tone}`}>
      <span className="system-summary-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionHead({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="system-section-head">
      <span className="system-section-icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div className="system-section-action">{action}</div> : null}
    </div>
  );
}

function FilterTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`system-config-tab ${active ? "active" : ""}`} type="button" role="tab" aria-selected={active} onClick={onClick}>
      {label}
    </button>
  );
}

function SwitchGroup({
  group,
  config,
  changedSwitches,
  onToggle,
}: {
  group: SystemSwitchGroup;
  config: SystemConfig;
  changedSwitches: SystemSwitch[];
  onToggle: (key: SystemSwitchKey) => void;
}) {
  const Icon = group.icon;
  const enabledCount = group.switchKeys.filter((key) => config.switches[key]).length;

  return (
    <article className="system-switch-group">
      <div className="system-switch-group-head">
        <span className="system-switch-group-icon">
          <Icon size={16} strokeWidth={2.1} />
        </span>
        <div>
          <h3>{group.title}</h3>
          <p>{group.description}</p>
        </div>
        <strong>
          {enabledCount}/{group.switchKeys.length}
        </strong>
      </div>
      <div className="system-switch-list">
        {group.switchKeys.map((key) => {
          const switchItem = systemSwitchDefinitions.find((item) => item.key === key);

          if (!switchItem) {
            return null;
          }

          return (
            <SwitchCard
              changed={changedSwitches.some((changedSwitch) => changedSwitch.key === key)}
              checked={config.switches[key]}
              key={key}
              switchItem={switchItem}
              onToggle={() => onToggle(key)}
            />
          );
        })}
      </div>
    </article>
  );
}

function SwitchCard({
  switchItem,
  checked,
  changed,
  onToggle,
}: {
  switchItem: SystemSwitch;
  checked: boolean;
  changed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`system-switch-card ${checked ? "active" : ""} ${changed ? "changed" : ""}`}
      type="button"
      aria-pressed={checked}
      disabled={switchItem.locked}
      onClick={onToggle}
    >
      <span className="system-switch-copy">
        <span className="system-switch-title-row">
          <strong>{switchItem.title}</strong>
          <em className={`system-risk-pill risk-${switchItem.risk}`}>{switchItem.locked ? "强制开启" : getRiskLabel(switchItem.risk)}</em>
        </span>
        <small>{switchItem.description}</small>
        <span className="system-switch-meta">
          <span>{switchItem.impact}</span>
          <span>{switchItem.owner}</span>
        </span>
      </span>
      <span className={`system-toggle ${checked ? "active" : ""}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "red" | "blue" | "muted";
}) {
  return (
    <div className="system-status-row">
      <span>{label}</span>
      <strong className={`system-status-pill tone-${tone}`}>{value}</strong>
    </div>
  );
}

function ChangeItem({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  const Icon = danger ? AlertTriangle : BellRing;

  return (
    <div className={`system-change-item ${danger ? "danger" : ""}`}>
      <span className="system-change-icon">
        <Icon size={14} strokeWidth={2.2} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
