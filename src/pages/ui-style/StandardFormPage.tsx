import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Hash,
  Link2,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  Search,
  SendHorizontal,
  Settings2,
  SlidersHorizontal,
  UploadCloud,
  UserRound,
} from "lucide-react";
import {
  LonButton,
  LonCheckboxGroup,
  LonDatePicker,
  LonInput,
  LonNumberInput,
  LonRadioGroup,
  LonSelect,
  LonUpload,
  useLonMessage,
} from "../../components/ui";
import type { LonNumberInputValue } from "../../components/ui";
import { moduleMeta } from "../../config/modules";
import "./StandardFormPage.css";

type PublishMode = "manual" | "scheduled" | "approval";
type Priority = "low" | "normal" | "high";
type ReviewLevel = "none" | "team" | "legal";
type FormStatus = "draft" | "enabled" | "paused";

type StandardFormValue = {
  title: string;
  code: string;
  module: string;
  status: FormStatus;
  owner: string;
  ownerEmail: string;
  contactPhone: string;
  landingUrl: string;
  searchKeyword: string;
  priority: Priority;
  startDate: string;
  endDate: string;
  budget: LonNumberInputValue;
  userLimit: LonNumberInputValue;
  publishMode: PublishMode;
  reviewLevel: ReviewLevel;
  channels: string[];
  notifications: string[];
  description: string;
  internalNote: string;
};

type StandardFormErrors = Partial<Record<keyof StandardFormValue, string>>;

const defaultFormValue: StandardFormValue = {
  title: "夏季活动页面配置",
  code: "OPS-2026-001",
  module: "content",
  status: "enabled",
  owner: "运营中心",
  ownerEmail: "ops@example.com",
  contactPhone: "13800000000",
  landingUrl: "https://example.com/summer",
  searchKeyword: "夏季活动",
  priority: "normal",
  startDate: "2026-07-01",
  endDate: "2026-07-31",
  budget: 26000,
  userLimit: 5000,
  publishMode: "approval",
  reviewLevel: "team",
  channels: ["desktop", "mobile"],
  notifications: ["message", "email"],
  description:
    "用于演示后台标准表单的输入、选择、日期、数字、上传、长文本和校验状态。",
  internalNote: "提交前确认投放城市、素材版本和回滚联系人。",
};

const moduleOptions = [
  { value: "system", label: "系统管理" },
  { value: "content", label: "内容运营" },
  { value: "message", label: "消息中心" },
  { value: "audit", label: "审计中心" },
];

const statusOptions = [
  { value: "draft", label: "草稿" },
  { value: "enabled", label: "启用中" },
  { value: "paused", label: "已暂停" },
];

const priorityOptions = [
  { value: "low", label: "低优先级" },
  { value: "normal", label: "普通优先级" },
  { value: "high", label: "高优先级" },
];

const publishModeOptions = [
  {
    value: "manual",
    label: "手动提交",
    description: "保存草稿后由负责人手动发布。",
  },
  {
    value: "scheduled",
    label: "定时生效",
    description: "按生效日期自动进入可用状态。",
  },
  {
    value: "approval",
    label: "审批后生效",
    description: "提交后进入审批流，适合正式配置。",
  },
];

const reviewLevelOptions = [
  { value: "none", label: "无需复核", description: "低风险配置可直接提交。" },
  { value: "team", label: "团队复核", description: "提交到团队负责人确认。" },
  {
    value: "legal",
    label: "法务复核",
    description: "涉及合规文案时使用。",
    disabled: true,
  },
];

const channelOptions = [
  {
    value: "desktop",
    label: "桌面端",
    description: "后台与 PC 端入口同步可见。",
  },
  {
    value: "mobile",
    label: "移动端",
    description: "移动工作台和轻应用入口可见。",
  },
  {
    value: "api",
    label: "开放 API",
    description: "允许外部系统读取当前配置。",
  },
];

const notificationOptions = [
  {
    value: "message",
    label: "站内信",
    description: "提交、审批、驳回时发送站内提醒。",
  },
  { value: "email", label: "邮件", description: "同步发送给负责人和协作者。" },
  { value: "webhook", label: "Webhook", description: "推送到外部流程系统。" },
];

function validateForm(value: StandardFormValue) {
  const errors: StandardFormErrors = {};

  if (!value.title.trim()) {
    errors.title = "请输入表单标题";
  }

  if (!value.code.trim()) {
    errors.code = "请输入业务编号";
  } else if (!/^[A-Z]{2,5}-\d{4}-\d{3}$/.test(value.code.trim())) {
    errors.code = "格式示例：OPS-2026-001";
  }

  if (!value.module) {
    errors.module = "请选择所属模块";
  }

  if (!value.owner.trim()) {
    errors.owner = "请输入负责人或团队";
  }

  if (!value.ownerEmail.trim()) {
    errors.ownerEmail = "请输入负责人邮箱";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.ownerEmail.trim())) {
    errors.ownerEmail = "请输入正确的邮箱格式";
  }

  if (!value.contactPhone.trim()) {
    errors.contactPhone = "请输入联系电话";
  } else if (!/^1\d{10}$/.test(value.contactPhone.trim())) {
    errors.contactPhone = "请输入 11 位手机号";
  }

  if (!value.landingUrl.trim()) {
    errors.landingUrl = "请输入落地页地址";
  } else if (!/^https?:\/\/.+/.test(value.landingUrl.trim())) {
    errors.landingUrl = "请输入 http 或 https 开头的地址";
  }

  if (!value.startDate) {
    errors.startDate = "请选择开始日期";
  }

  if (!value.endDate) {
    errors.endDate = "请选择结束日期";
  } else if (value.startDate && value.endDate < value.startDate) {
    errors.endDate = "结束日期不能早于开始日期";
  }

  if (value.budget === "") {
    errors.budget = "请输入预算金额";
  }

  if (value.userLimit === "") {
    errors.userLimit = "请输入参与人数上限";
  }

  if (value.channels.length === 0) {
    errors.channels = "至少选择一个展示端";
  }

  if (value.notifications.length === 0) {
    errors.notifications = "至少选择一种提醒方式";
  }

  if (value.description.trim().length < 10) {
    errors.description = "说明至少需要 10 个字符";
  }

  return errors;
}

function getCompletionCount(value: StandardFormValue) {
  return [
    value.title,
    value.code,
    value.module,
    value.status,
    value.owner,
    value.ownerEmail,
    value.contactPhone,
    value.landingUrl,
    value.searchKeyword,
    value.priority,
    value.startDate,
    value.endDate,
    value.budget,
    value.userLimit,
    value.publishMode,
    value.reviewLevel,
    value.channels.length > 0 ? "channels" : "",
    value.notifications.length > 0 ? "notifications" : "",
    value.description,
    value.internalNote,
  ].filter((item) => String(item).trim()).length;
}

function StandardFormPage() {
  const message = useLonMessage();
  const [savedValue, setSavedValue] = useState(defaultFormValue);
  const [formValue, setFormValue] = useState(defaultFormValue);
  const [errors, setErrors] = useState<StandardFormErrors>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [savedAttachmentCount, setSavedAttachmentCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const hasChanges =
    JSON.stringify(formValue) !== JSON.stringify(savedValue) ||
    attachments.length !== savedAttachmentCount;
  const completionCount = getCompletionCount(formValue);
  const MetaIcon = moduleMeta.standardForm.icon;

  function updateForm<K extends keyof StandardFormValue>(
    key: K,
    value: StandardFormValue[K],
  ) {
    setFormValue((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function resetForm() {
    setFormValue(savedValue);
    setAttachments([]);
    setSavedAttachmentCount(0);
    setErrors({});
    message.info("已恢复到上次提交的表单内容");
  }

  async function submitForm() {
    if (submitting) {
      return;
    }

    const nextErrors = validateForm(formValue);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      message.warning("请先处理表单中的校验项");
      return;
    }

    setSubmitting(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 460));
      setSavedValue(formValue);
      setSavedAttachmentCount(attachments.length);
      message.success("标准表单已提交");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitForm();
  }

  return (
    <form className="standard-form-page" onSubmit={handleSubmit}>
      <section
        className="admin-panel standard-form-shell"
        aria-label="标准表单展示页"
      >
        <header className="standard-form-toolbar">
          <div className="standard-form-title-block">
            <span className="standard-form-chip">
              <MetaIcon size={14} strokeWidth={2.2} />
              UI 风格
            </span>
            <div>
              <h1>{moduleMeta.standardForm.title}</h1>
              <p>
                一个完整表单内集中展示
                input、select、radio、多选、上传、日期、数字和长文本状态。
              </p>
            </div>
          </div>

          <div className="standard-form-status" aria-label="表单展示状态">
            <span>
              已填写 <strong>{completionCount}/20</strong>
            </span>
            <span>
              附件 <strong>{attachments.length}</strong>
            </span>
          </div>

          <div className="standard-form-actions">
            <LonButton
              type="button"
              variant="secondary"
              leadingIcon={<RefreshCcw size={14} strokeWidth={2.2} />}
              disabled={!hasChanges || submitting}
              onClick={resetForm}
            >
              重置
            </LonButton>
            <LonButton
              type="submit"
              loading={submitting}
              leadingIcon={<Save size={14} strokeWidth={2.2} />}
            >
              提交表单
            </LonButton>
          </div>
        </header>

        <section className="standard-form-section">
          <SectionHead
            icon={<ClipboardList size={16} strokeWidth={2.2} />}
            title="各种类型 input"
            description="文本、编号、邮箱、电话、URL、搜索、只读和禁用状态。"
          />
          <div className="standard-form-body">
            <div className="standard-form-grid standard-form-grid-three">
              <LonInput
                label="表单标题"
                value={formValue.title}
                placeholder="请输入标题"
                error={errors.title}
                hint="展示基础 text 输入状态。"
                leadingIcon={<FileText size={14} strokeWidth={2.1} />}
                onChange={(event) => updateForm("title", event.target.value)}
              />
              <LonInput
                label="业务编号"
                value={formValue.code}
                placeholder="OPS-2026-001"
                error={errors.code}
                hint="用于检索、详情页和审计日志追踪。"
                leadingIcon={<Hash size={14} strokeWidth={2.1} />}
                onChange={(event) =>
                  updateForm("code", event.target.value.toUpperCase())
                }
              />
              <LonInput
                label="负责人"
                value={formValue.owner}
                placeholder="请输入负责人或团队"
                error={errors.owner}
                hint="展示负责人文本输入。"
                leadingIcon={<UserRound size={14} strokeWidth={2.1} />}
                onChange={(event) => updateForm("owner", event.target.value)}
              />
              <LonInput
                label="负责人邮箱"
                value={formValue.ownerEmail}
                placeholder="name@example.com"
                type="email"
                error={errors.ownerEmail}
                hint="展示 email 输入类型。"
                leadingIcon={<Mail size={14} strokeWidth={2.1} />}
                onChange={(event) =>
                  updateForm("ownerEmail", event.target.value)
                }
              />
              <LonInput
                label="联系电话"
                value={formValue.contactPhone}
                placeholder="请输入手机号"
                type="tel"
                error={errors.contactPhone}
                hint="展示电话输入类型。"
                leadingIcon={<Phone size={14} strokeWidth={2.1} />}
                onChange={(event) =>
                  updateForm("contactPhone", event.target.value)
                }
              />
              <LonInput
                label="落地页地址"
                value={formValue.landingUrl}
                placeholder="https://example.com/page"
                type="url"
                error={errors.landingUrl}
                hint="展示 URL 输入类型。"
                leadingIcon={<Link2 size={14} strokeWidth={2.1} />}
                onChange={(event) =>
                  updateForm("landingUrl", event.target.value)
                }
              />
              <LonInput
                label="搜索关键词"
                value={formValue.searchKeyword}
                placeholder="输入关键词"
                type="search"
                hint="展示 search 输入类型。"
                leadingIcon={<Search size={14} strokeWidth={2.1} />}
                onChange={(event) =>
                  updateForm("searchKeyword", event.target.value)
                }
              />
              <LonInput
                label="只读字段"
                value="系统自动生成"
                readOnly
                hint="展示只读输入状态。"
                leadingIcon={<FileText size={14} strokeWidth={2.1} />}
              />
              <LonInput
                label="禁用字段"
                value="暂不可编辑"
                disabled
                hint="展示禁用输入状态。"
                leadingIcon={<FileText size={14} strokeWidth={2.1} />}
              />
            </div>
          </div>
        </section>

        <section className="standard-form-section">
          <SectionHead
            icon={<SlidersHorizontal size={16} strokeWidth={2.2} />}
            title="下拉、单选与复选"
            description="选择类控件覆盖常规状态、描述文本和禁用选项。"
          />
          <div className="standard-form-body">
            <div className="standard-form-grid standard-form-grid-three">
              <LonSelect
                label="所属模块"
                value={formValue.module}
                options={moduleOptions}
                error={errors.module}
                hint="展示基础下拉选择。"
                onValueChange={(value) => updateForm("module", value)}
              />
              <LonSelect
                label="当前状态"
                value={formValue.status}
                options={statusOptions}
                hint="展示状态类 select。"
                onValueChange={(value) =>
                  updateForm("status", value as FormStatus)
                }
              />
              <LonSelect
                label="优先级"
                value={formValue.priority}
                options={priorityOptions}
                hint="展示优先级 select。"
                onValueChange={(value) =>
                  updateForm("priority", value as Priority)
                }
              />
            </div>

            <div className="standard-choice-grid">
              <LonRadioGroup
                label="发布方式"
                value={formValue.publishMode}
                options={publishModeOptions}
                direction="vertical"
                onValueChange={(value) =>
                  updateForm("publishMode", value as PublishMode)
                }
              />
              <LonRadioGroup
                label="复核等级"
                value={formValue.reviewLevel}
                options={reviewLevelOptions}
                direction="vertical"
                onValueChange={(value) =>
                  updateForm("reviewLevel", value as ReviewLevel)
                }
              />
              <LonCheckboxGroup
                label="展示端"
                value={formValue.channels}
                options={channelOptions}
                error={errors.channels}
                direction="vertical"
                onValueChange={(value) => updateForm("channels", value)}
              />
              <LonCheckboxGroup
                label="提醒方式"
                value={formValue.notifications}
                options={notificationOptions}
                error={errors.notifications}
                direction="vertical"
                onValueChange={(value) => updateForm("notifications", value)}
              />
            </div>
          </div>
        </section>

        <section className="standard-form-section">
          <SectionHead
            icon={<CalendarClock size={16} strokeWidth={2.2} />}
            title="日期与数字"
            description="日期选择、数值步进和金额/容量类输入。"
          />
          <div className="standard-form-body">
            <div className="standard-form-grid standard-form-grid-four">
              <LonDatePicker
                label="开始日期"
                value={formValue.startDate}
                error={errors.startDate}
                hint="展示开始日期选择。"
                onChange={(event) =>
                  updateForm("startDate", event.target.value)
                }
              />
              <LonDatePicker
                label="结束日期"
                value={formValue.endDate}
                error={errors.endDate}
                hint="展示结束日期选择。"
                onChange={(event) => updateForm("endDate", event.target.value)}
              />
              <LonNumberInput
                label="预算金额"
                value={formValue.budget}
                min={0}
                max={999999}
                step={1000}
                error={errors.budget}
                hint="单位：元。"
                onValueChange={(value) => updateForm("budget", value)}
              />
              <LonNumberInput
                label="参与人数上限"
                value={formValue.userLimit}
                min={0}
                max={999999}
                step={100}
                error={errors.userLimit}
                hint="单位：人。"
                onValueChange={(value) => updateForm("userLimit", value)}
              />
            </div>
          </div>
        </section>

        <section className="standard-form-section">
          <SectionHead
            icon={<UploadCloud size={16} strokeWidth={2.2} />}
            title="上传与长文本"
            description="附件、说明、内部备注和表单提交动作集中展示。"
          />
          <div className="standard-form-body">
            <div className="standard-form-grid standard-form-grid-two">
              <LonUpload
                label="配置附件"
                files={attachments}
                multiple
                buttonLabel="选择附件"
                accept=".png,.jpg,.jpeg,.pdf,.xlsx"
                hint="支持图片、PDF、表格等配置资料。"
                onFilesChange={setAttachments}
              />
              <div className="standard-form-stack">
                <label
                  className={`lon-form-field standard-textarea-field ${errors.description ? "has-error" : ""}`}
                >
                  <span className="lon-form-label">说明备注</span>
                  <textarea
                    className="standard-textarea"
                    value={formValue.description}
                    placeholder="请输入这次配置的背景、影响范围和上线注意事项"
                    aria-invalid={errors.description ? true : undefined}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                  />
                  <span
                    className={
                      errors.description ? "lon-form-error" : "lon-form-hint"
                    }
                  >
                    {errors.description ??
                      "建议说明配置目的、影响范围和回滚方式。"}
                  </span>
                </label>
                <label className="lon-form-field standard-textarea-field">
                  <span className="lon-form-label">内部备注</span>
                  <textarea
                    className="standard-textarea standard-textarea-compact"
                    value={formValue.internalNote}
                    placeholder="请输入仅后台可见的补充说明"
                    onChange={(event) =>
                      updateForm("internalNote", event.target.value)
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <footer className="standard-form-submit-panel" aria-label="表单操作">
          <div className="standard-submit-copy">
            <span className="standard-submit-icon" aria-hidden="true">
              <Settings2 size={16} strokeWidth={2.2} />
            </span>
            <div>
              <h2>表单操作</h2>
              <p>
                保留提交、重置、加载与禁用状态，便于核对按钮在表单尾部的表现。
              </p>
            </div>
          </div>
          <div className="standard-submit-actions">
            <LonButton
              type="button"
              variant="ghost"
              leadingIcon={<CheckCircle2 size={14} strokeWidth={2.2} />}
            >
              保存草稿
            </LonButton>
            <LonButton
              type="button"
              variant="secondary"
              leadingIcon={<RefreshCcw size={14} strokeWidth={2.2} />}
              disabled={!hasChanges || submitting}
              onClick={resetForm}
            >
              重置
            </LonButton>
            <LonButton
              type="submit"
              loading={submitting}
              leadingIcon={<SendHorizontal size={14} strokeWidth={2.2} />}
            >
              提交表单
            </LonButton>
          </div>
        </footer>
      </section>
    </form>
  );
}

export default StandardFormPage;

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
    <div className="standard-section-head">
      <span className="standard-section-icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
