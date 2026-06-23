import { useState } from "react";
import type { FormEvent, PointerEvent } from "react";
import {
  Bell,
  CircleAlert,
  Download,
  FilterX,
  Image as ImageIcon,
  MoreHorizontal,
  PanelRight,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Send,
  Settings,
  Tags,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  LonButton,
  LonCheckboxGroup,
  LonDatePicker,
  LonDrawer,
  LonInput,
  LonModal,
  LonNumberInput,
  LonPopconfirm,
  LonRadioGroup,
  LonSelect,
  LonTag,
  LonUpload,
  useLonMessage,
  useLonNotification,
} from "../../components/ui";
import type {
  LonButtonVariant,
  LonButtonVisualState,
  LonDrawerPlacement,
  LonNumberInputValue,
  LonTagTone,
} from "../../components/ui";
import PanelHeader from "../../components/shared/panel-header/PanelHeader";
import { moduleMeta } from "../../config/modules";

type ShowcaseButton = {
  label: string;
  variant: LonButtonVariant;
  visualState?: LonButtonVisualState;
  loading?: boolean;
  disabled?: boolean;
};

type ShowcaseFormValues = {
  title: string;
  quota: LonNumberInputValue;
  publishDate: string;
  scope: string;
  channels: string[];
  owner: string;
};

type ShowcaseModalType = "basic" | "confirm" | "large" | null;
type ShowcaseDrawerType = LonDrawerPlacement | "detail" | null;
type ShowcaseImage = {
  title: string;
  description: string;
  src: string;
  downloadName: string;
  meta: string;
};
type ImagePreviewState = {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
};
type ImageDragOrigin = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};
type ShowcaseTag = {
  label: string;
  tone: LonTagTone;
  dot?: boolean;
  selected?: boolean;
  disabled?: boolean;
};

const showcaseTagRows: Array<{
  title: string;
  description: string;
  tags: ShowcaseTag[];
}> = [
  {
    title: "基础标签",
    description: "用于分类、属性和轻量标记",
    tags: [
      { label: "默认", tone: "neutral" },
      { label: "已选", tone: "blue", selected: true },
      { label: "无圆点", tone: "neutral", dot: false },
      { label: "禁用", tone: "neutral", disabled: true },
    ],
  },
  {
    title: "语义标签",
    description: "用于区分状态、风险和团队属性",
    tags: [
      { label: "进行中", tone: "blue" },
      { label: "已完成", tone: "green" },
      { label: "待复核", tone: "amber" },
      { label: "已下线", tone: "red" },
      { label: "运营组", tone: "purple" },
    ],
  },
];

const selectableTagOptions: ShowcaseTag[] = [
  { label: "内容运营", tone: "blue" },
  { label: "权限审计", tone: "green" },
  { label: "安全风险", tone: "red" },
  { label: "团队协作", tone: "purple" },
];

const initialClosableTags: ShowcaseTag[] = [
  { label: "新用户", tone: "green" },
  { label: "重要公告", tone: "amber" },
  { label: "内部可见", tone: "blue" },
];

const showcaseImages: ShowcaseImage[] = [
  {
    title: "品牌 Logo",
    description: "透明底品牌主视觉资源",
    src: "/logo.png",
    downloadName: "lonear-logo.png",
    meta: "1254 x 1254 · PNG",
  },
  {
    title: "应用图标",
    description: "PWA 与桌面入口图标",
    src: "/icon.png",
    downloadName: "lonear-icon.png",
    meta: "512 x 512 · PNG",
  },
];
const defaultImagePreviewState: ImagePreviewState = {
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
};

function ComponentShowcasePage() {
  const message = useLonMessage();
  const notification = useLonNotification();
  const [activeModal, setActiveModal] = useState<ShowcaseModalType>(null);
  const [activeDrawer, setActiveDrawer] = useState<ShowcaseDrawerType>(null);
  const [previewImage, setPreviewImage] = useState<ShowcaseImage | null>(null);
  const [imagePreviewState, setImagePreviewState] = useState<ImagePreviewState>(defaultImagePreviewState);
  const [imageDragOrigin, setImageDragOrigin] = useState<ImageDragOrigin | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(["内容运营", "权限审计"]);
  const [closableTags, setClosableTags] = useState<ShowcaseTag[]>(initialClosableTags);
  const [formValues, setFormValues] = useState<ShowcaseFormValues>({
    title: "运营权限复核",
    quota: 12,
    publishDate: "2026-06-22",
    scope: "business",
    channels: ["message", "audit"],
    owner: "operation",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [formNotice, setFormNotice] = useState("表单已同步");
  const buttonRows: Array<{
    title: string;
    description: string;
    buttons: ShowcaseButton[];
  }> = [
    {
      title: "Primary",
      description: "页面主行动作",
      buttons: [
        { label: "默认", variant: "primary" },
        { label: "悬停", variant: "primary", visualState: "hover" },
        { label: "按下", variant: "primary", visualState: "active" },
        { label: "加载中", variant: "primary", loading: true },
        { label: "禁用", variant: "primary", disabled: true },
      ],
    },
    {
      title: "Secondary",
      description: "页面辅助动作",
      buttons: [
        { label: "默认", variant: "secondary" },
        { label: "悬停", variant: "secondary", visualState: "hover" },
        { label: "按下", variant: "secondary", visualState: "active" },
        { label: "加载中", variant: "secondary", loading: true },
        { label: "禁用", variant: "secondary", disabled: true },
      ],
    },
    {
      title: "Ghost",
      description: "低权重工具动作",
      buttons: [
        { label: "默认", variant: "ghost" },
        { label: "悬停", variant: "ghost", visualState: "hover" },
        { label: "按下", variant: "ghost", visualState: "active" },
        { label: "加载中", variant: "ghost", loading: true },
        { label: "禁用", variant: "ghost", disabled: true },
      ],
    },
    {
      title: "Danger",
      description: "删除、退出等危险动作",
      buttons: [
        { label: "默认", variant: "danger" },
        { label: "悬停", variant: "danger", visualState: "hover" },
        { label: "按下", variant: "danger", visualState: "active" },
        { label: "加载中", variant: "danger", loading: true },
        { label: "禁用", variant: "danger", disabled: true },
      ],
    },
  ];

  function updateFormValue<Key extends keyof ShowcaseFormValues>(key: Key, value: ShowcaseFormValues[Key]) {
    setFormValues((currentValues) => ({ ...currentValues, [key]: value }));
    setFormNotice("表单已修改");
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormNotice("表单已保存");
  }

  function handleFormReset() {
    setFormValues({
      title: "",
      quota: 0,
      publishDate: "",
      scope: "system",
      channels: [],
      owner: "system",
    });
    setFiles([]);
    setFormNotice("表单已重置");
  }

  function toggleSelectedTag(label: string) {
    setSelectedTags((currentTags) =>
      currentTags.includes(label) ? currentTags.filter((tag) => tag !== label) : [...currentTags, label],
    );
  }

  function removeClosableTag(label: string) {
    setClosableTags((currentTags) => currentTags.filter((tag) => tag.label !== label));
  }

  function openImagePreview(image: ShowcaseImage) {
    setPreviewImage(image);
    setImagePreviewState(defaultImagePreviewState);
    setImageDragOrigin(null);
  }

  function closeImagePreview() {
    setPreviewImage(null);
    setImagePreviewState(defaultImagePreviewState);
    setImageDragOrigin(null);
  }

  function updatePreviewScale(delta: number) {
    setImagePreviewState((currentState) => ({
      ...currentState,
      scale: Math.min(2.5, Math.max(0.5, Number((currentState.scale + delta).toFixed(2)))),
    }));
  }

  function rotatePreview(delta: number) {
    setImagePreviewState((currentState) => ({
      ...currentState,
      rotation: currentState.rotation + delta,
    }));
  }

  function resetImagePreview() {
    setImagePreviewState(defaultImagePreviewState);
    setImageDragOrigin(null);
  }

  function startImageDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setImageDragOrigin({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: imagePreviewState.offsetX,
      offsetY: imagePreviewState.offsetY,
    });
  }

  function updateImageDrag(event: PointerEvent<HTMLDivElement>) {
    if (!imageDragOrigin || imageDragOrigin.pointerId !== event.pointerId) {
      return;
    }

    setImagePreviewState((currentState) => ({
      ...currentState,
      offsetX: imageDragOrigin.offsetX + event.clientX - imageDragOrigin.startX,
      offsetY: imageDragOrigin.offsetY + event.clientY - imageDragOrigin.startY,
    }));
  }

  function stopImageDrag(event: PointerEvent<HTMLDivElement>) {
    if (!imageDragOrigin || imageDragOrigin.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setImageDragOrigin(null);
  }

  return (
    <>
      <section className="admin-panel message-showcase-panel">
        <PanelHeader icon={Bell} title="Message 全局提示" action="顶部弹出提示" />
        <div className="message-showcase-grid">
          <div className="button-showcase-meta">
            <strong>页面上方提示</strong>
            <span>适合保存、删除、上传、同步等轻量反馈。</span>
          </div>
          <div className="button-state-list">
            <LonButton variant="secondary" onClick={() => message.success("保存成功，配置已同步")}>
              Success
            </LonButton>
            <LonButton variant="secondary" onClick={() => message.info("已打开角色字段配置")}>
              Info
            </LonButton>
            <LonButton variant="secondary" onClick={() => message.warning("存在未发布的运营内容")}>
              Warning
            </LonButton>
            <LonButton variant="danger" onClick={() => message.error("删除失败，请稍后重试")}>
              Error
            </LonButton>
            <LonButton
              variant="ghost"
              onClick={() => message.loading("文件上传中...", { duration: 2200, closable: true })}
            >
              Loading
            </LonButton>
          </div>
        </div>
      </section>

      <section className="admin-panel message-showcase-panel">
        <PanelHeader icon={Bell} title="Notification 通知" action="左右侧气泡" />
        <div className="message-showcase-grid">
          <div className="button-showcase-meta">
            <strong>侧边通知气泡</strong>
            <span>适合任务完成、权限变更、异步结果等需要标题和描述的反馈。</span>
          </div>
          <div className="button-state-list">
            <LonButton
              variant="primary"
              onClick={() =>
                notification.success({
                  title: "同步完成",
                  description: "角色权限与菜单缓存已在当前工作区完成刷新。",
                })
              }
            >
              右侧成功
            </LonButton>
            <LonButton
              variant="secondary"
              onClick={() =>
                notification.info({
                  title: "左侧通知",
                  description: "这条通知从页面左侧弹出，适合靠近左侧导航的反馈。",
                  placement: "left",
                })
              }
            >
              左侧通知
            </LonButton>
            <LonButton
              variant="secondary"
              onClick={() =>
                notification.warning({
                  title: "存在待复核内容",
                  description: "3 个运营角色包含临时授权，请在今天下班前完成确认。",
                })
              }
            >
              右侧警告
            </LonButton>
            <LonButton
              variant="danger"
              onClick={() =>
                notification.error({
                  title: "发布失败",
                  description: "通知通道暂时不可用，请检查系统配置后重试。",
                  placement: "left",
                  duration: 0,
                })
              }
            >
              左侧常驻
            </LonButton>
          </div>
        </div>
      </section>

      <section className="admin-panel modal-showcase-panel">
        <PanelHeader icon={CircleAlert} title="Popconfirm 气泡确认框" action="就地二次确认" />
        <div className="modal-showcase-grid">
          <div className="modal-showcase-copy">
            <strong>轻量确认</strong>
            <span>适合删除、发布、撤销等需要二次确认但不必打开弹窗的操作。</span>
          </div>
          <div className="button-state-list">
            <LonPopconfirm
              title="确认删除此条记录？"
              description="删除后审计记录仍会保留，但业务数据不可恢复。"
              okText="删除"
              okButtonVariant="danger"
              placement="top"
              onConfirm={() => message.error("记录已删除")}
            >
              <LonButton variant="danger" leadingIcon={<Trash2 size={14} strokeWidth={2.2} />}>
                删除记录
              </LonButton>
            </LonPopconfirm>
            <LonPopconfirm
              title="确认发布公告？"
              description="发布后所有可见用户都会收到站内通知。"
              okText="发布"
              placement="bottom"
              onConfirm={() => message.success("公告已发布")}
            >
              <LonButton variant="primary" leadingIcon={<Send size={14} strokeWidth={2.2} />}>
                发布公告
              </LonButton>
            </LonPopconfirm>
            <LonPopconfirm
              title="撤销本次变更？"
              description="未保存的字段调整会被恢复到上一次提交状态。"
              okText="撤销"
              okButtonVariant="danger"
              placement="left"
              onConfirm={() => message.warning("本次变更已撤销")}
            >
              <LonButton variant="secondary" leadingIcon={<Undo2 size={14} strokeWidth={2.2} />}>
                左侧确认
              </LonButton>
            </LonPopconfirm>
            <LonPopconfirm
              title="清空筛选条件？"
              description="当前页面的状态、组织和时间筛选会被清除。"
              okText="清空"
              placement="right"
              onConfirm={() => message.info("筛选条件已清空")}
            >
              <LonButton variant="ghost" leadingIcon={<FilterX size={14} strokeWidth={2.2} />}>
                右侧确认
              </LonButton>
            </LonPopconfirm>
          </div>
        </div>
      </section>

      <section className="admin-panel modal-showcase-panel">
        <PanelHeader icon={MoreHorizontal} title="Modal 弹窗" action="全局浮层" />
        <div className="modal-showcase-grid">
          <div className="modal-showcase-copy">
            <strong>对话式反馈</strong>
            <span>适合确认操作、编辑表单、查看详情等打断式场景。</span>
          </div>
          <div className="button-state-list">
            <LonButton variant="secondary" onClick={() => setActiveModal("basic")}>
              基础弹窗
            </LonButton>
            <LonButton variant="danger" onClick={() => setActiveModal("confirm")}>
              确认弹窗
            </LonButton>
            <LonButton variant="ghost" onClick={() => setActiveModal("large")}>
              大内容弹窗
            </LonButton>
          </div>
        </div>
      </section>

      <section className="admin-panel drawer-showcase-panel">
        <PanelHeader icon={PanelRight} title="Drawer 抽屉" action="四向浮层" />
        <div className="drawer-showcase-grid">
          <div className="drawer-showcase-copy">
            <strong>非打断式详情</strong>
            <span>适合编辑表单、查看详情、筛选配置等保留页面上下文的场景。</span>
          </div>
          <div className="button-state-list">
            <LonButton variant="secondary" onClick={() => setActiveDrawer("right")}>
              右侧抽屉
            </LonButton>
            <LonButton variant="secondary" onClick={() => setActiveDrawer("top")}>
              顶部抽屉
            </LonButton>
            <LonButton variant="secondary" onClick={() => setActiveDrawer("bottom")}>
              底部抽屉
            </LonButton>
            <LonButton variant="secondary" onClick={() => setActiveDrawer("left")}>
              左侧抽屉
            </LonButton>
            <LonButton variant="secondary" onClick={() => setActiveDrawer("detail")}>
              详情抽屉
            </LonButton>
          </div>
        </div>
      </section>

      <section className="admin-panel button-showcase-panel">
        <PanelHeader
          icon={moduleMeta.componentShowcase.icon}
          title="Button 按钮"
          action={moduleMeta.componentShowcase.action}
        />
        <div className="button-showcase-grid">
          {buttonRows.map((row) => (
            <article className="button-showcase-row" key={row.title}>
              <div className="button-showcase-meta">
                <strong>{row.title}</strong>
                <span>{row.description}</span>
              </div>
              <div className="button-state-list">
                {row.buttons.map((button) => (
                  <LonButton
                    variant={button.variant}
                    visualState={button.visualState}
                    loading={button.loading}
                    key={`${row.title}-${button.label}`}
                    disabled={button.disabled}
                  >
                    {button.label}
                  </LonButton>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel tag-showcase-panel">
        <PanelHeader icon={Tags} title="Tag 标签" action={`${selectedTags.length} 个已选`} />
        <div className="tag-showcase-grid">
          {showcaseTagRows.map((row) => (
            <article className="tag-showcase-row" key={row.title}>
              <div className="button-showcase-meta">
                <strong>{row.title}</strong>
                <span>{row.description}</span>
              </div>
              <div className="tag-state-list">
                {row.tags.map((tag) => (
                  <LonTag
                    disabled={tag.disabled}
                    dot={tag.dot}
                    key={`${row.title}-${tag.label}`}
                    selected={tag.selected}
                    tone={tag.tone}
                  >
                    {tag.label}
                  </LonTag>
                ))}
              </div>
            </article>
          ))}
          <article className="tag-showcase-row">
            <div className="button-showcase-meta">
              <strong>可选择标签</strong>
              <span>适合筛选项、批量标记和轻量偏好</span>
            </div>
            <div className="tag-state-list">
              {selectableTagOptions.map((tag) => (
                <LonTag
                  key={tag.label}
                  selected={selectedTags.includes(tag.label)}
                  tone={tag.tone}
                  onClick={() => toggleSelectedTag(tag.label)}
                >
                  {tag.label}
                </LonTag>
              ))}
            </div>
          </article>
          <article className="tag-showcase-row">
            <div className="button-showcase-meta">
              <strong>可关闭标签</strong>
              <span>适合动态筛选、临时分类和搜索条件</span>
            </div>
            <div className="tag-state-list">
              {closableTags.length > 0 ? (
                closableTags.map((tag) => (
                  <LonTag
                    closable
                    closeLabel={`移除${tag.label}标签`}
                    key={tag.label}
                    tone={tag.tone}
                    onClose={() => removeClosableTag(tag.label)}
                  >
                    {tag.label}
                  </LonTag>
                ))
              ) : (
                <span className="tag-showcase-empty">标签已清空</span>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="admin-panel image-showcase-panel">
        <PanelHeader icon={ImageIcon} title="Image 图片" action="点击预览" />
        <div className="image-showcase-grid">
          {showcaseImages.map((image) => (
            <button
              className="image-showcase-card"
              key={image.title}
              type="button"
              onClick={() => openImagePreview(image)}
            >
              <span className="image-showcase-thumb">
                <img alt={image.title} src={image.src} />
              </span>
              <span className="image-showcase-info">
                <strong>{image.title}</strong>
                <span>{image.description}</span>
                <small>{image.meta}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-panel form-showcase-panel">
        <PanelHeader icon={Settings} title="Form 表单组件" action={formNotice} />
        <form className="form-showcase-grid" onSubmit={handleFormSubmit}>
          <LonInput
            label="Input 输入框"
            value={formValues.title}
            placeholder="请输入任务名称"
            hint="用于站内信和审计记录标题"
            onChange={(event) => updateFormValue("title", event.target.value)}
          />
          <LonNumberInput
            label="NumberInput 数字输入框"
            value={formValues.quota}
            min={0}
            max={99}
            step={1}
            hint="0-99"
            onValueChange={(value) => updateFormValue("quota", value)}
          />
          <LonDatePicker
            label="日期选择器"
            value={formValues.publishDate}
            min="2026-01-01"
            onChange={(event) => updateFormValue("publishDate", event.target.value)}
          />
          <LonSelect
            label="下拉选择"
            value={formValues.owner}
            options={[
              { value: "system", label: "系统管理" },
              { value: "operation", label: "运营中心" },
              { value: "audit", label: "审计中心" },
            ]}
            onValueChange={(value) => updateFormValue("owner", value)}
          />
          <LonRadioGroup
            label="Radio"
            value={formValues.scope}
            options={[
              { value: "system", label: "系统角色" },
              { value: "business", label: "业务角色" },
              { value: "temporary", label: "临时授权" },
            ]}
            onValueChange={(value) => updateFormValue("scope", value)}
          />
          <LonCheckboxGroup
            label="多选"
            value={formValues.channels}
            options={[
              { value: "message", label: "站内信" },
              { value: "audit", label: "审计日志" },
              { value: "notice", label: "通知公告" },
            ]}
            onValueChange={(value) => updateFormValue("channels", value)}
          />
          <div className="form-showcase-wide">
            <LonUpload
              label="Upload 上传"
              files={files}
              accept=".png,.jpg,.jpeg,.pdf,.zip"
              multiple
              onFilesChange={(nextFiles) => {
                setFiles(nextFiles);
                setFormNotice(nextFiles.length > 0 ? "附件已选择" : "附件已清空");
              }}
            />
          </div>
          <div className="form-showcase-actions form-showcase-wide">
            <LonButton variant="secondary" type="button" onClick={handleFormReset}>
              重置
            </LonButton>
            <LonButton variant="primary" type="submit">
              保存
            </LonButton>
          </div>
        </form>
      </section>

      <LonModal
        open={activeModal === "basic"}
        title="编辑角色说明"
        description="弹窗用于承载少量上下文和明确操作。"
        onClose={() => setActiveModal(null)}
        footer={
          <>
            <LonButton variant="secondary" onClick={() => setActiveModal(null)}>
              取消
            </LonButton>
            <LonButton
              variant="primary"
              onClick={() => {
                setActiveModal(null);
                message.success("弹窗内容已保存");
              }}
            >
              保存
            </LonButton>
          </>
        }
      >
        <p>这里可以放置简短说明、轻量表单或业务确认信息。弹窗默认支持遮罩点击和 Escape 关闭。</p>
      </LonModal>

      <LonModal
        open={activeModal === "confirm"}
        title="确认删除临时授权"
        description="删除后，该角色关联的临时访问权限会立即失效。"
        size="small"
        maskClosable={false}
        onClose={() => setActiveModal(null)}
        footer={
          <>
            <LonButton variant="secondary" onClick={() => setActiveModal(null)}>
              取消
            </LonButton>
            <LonButton
              variant="danger"
              onClick={() => {
                setActiveModal(null);
                message.error("已删除临时授权");
              }}
            >
              删除
            </LonButton>
          </>
        }
      >
        <p>这是一个高风险确认弹窗，关闭入口保留，但遮罩点击不会关闭。</p>
      </LonModal>

      <LonModal
        open={activeModal === "large"}
        title="角色权限详情"
        description="较宽弹窗适合展示列表、权限摘要或多段说明。"
        size="large"
        onClose={() => setActiveModal(null)}
        footer={
          <LonButton variant="primary" onClick={() => setActiveModal(null)}>
            知道了
          </LonButton>
        }
      >
        <ul className="modal-showcase-list">
          <li>
            <span>菜单权限</span>
            <small>系统管理、内容运营、审计中心</small>
          </li>
          <li>
            <span>按钮权限</span>
            <small>新增、编辑、导出、发布</small>
          </li>
          <li>
            <span>数据范围</span>
            <small>所属组织及下级组织</small>
          </li>
        </ul>
      </LonModal>

      <LonModal
        open={Boolean(previewImage)}
        title={previewImage?.title ?? "图片预览"}
        description={previewImage?.meta}
        size="large"
        onClose={closeImagePreview}
        footer={
          <div className="image-preview-toolbar" aria-label="图片预览操作">
            <button
              aria-label="缩小图片"
              className="image-preview-tool"
              disabled={imagePreviewState.scale <= 0.5}
              title="缩小"
              type="button"
              onClick={() => updatePreviewScale(-0.25)}
            >
              <ZoomOut size={15} strokeWidth={2.2} />
            </button>
            <span className="image-preview-scale">{Math.round(imagePreviewState.scale * 100)}%</span>
            <button
              aria-label="放大图片"
              className="image-preview-tool"
              disabled={imagePreviewState.scale >= 2.5}
              title="放大"
              type="button"
              onClick={() => updatePreviewScale(0.25)}
            >
              <ZoomIn size={15} strokeWidth={2.2} />
            </button>
            <span className="image-preview-divider" aria-hidden="true" />
            <button
              aria-label="向左旋转"
              className="image-preview-tool"
              title="向左旋转"
              type="button"
              onClick={() => rotatePreview(-90)}
            >
              <RotateCcw size={15} strokeWidth={2.2} />
            </button>
            <button
              aria-label="向右旋转"
              className="image-preview-tool"
              title="向右旋转"
              type="button"
              onClick={() => rotatePreview(90)}
            >
              <RotateCw size={15} strokeWidth={2.2} />
            </button>
            <span className="image-preview-divider" aria-hidden="true" />
            <button
              aria-label="重置预览"
              className="image-preview-tool"
              title="重置"
              type="button"
              onClick={resetImagePreview}
            >
              <RefreshCw size={15} strokeWidth={2.2} />
            </button>
            <a
              aria-label="下载图片"
              className="image-preview-tool"
              download={previewImage?.downloadName}
              href={previewImage?.src ?? "#"}
              title="下载"
            >
              <Download size={15} strokeWidth={2.2} />
            </a>
          </div>
        }
      >
        {previewImage ? (
          <div
            className={`image-preview-stage ${imageDragOrigin ? "is-dragging" : ""}`}
            onPointerCancel={stopImageDrag}
            onPointerDown={startImageDrag}
            onPointerMove={updateImageDrag}
            onPointerUp={stopImageDrag}
          >
            <img
              alt={previewImage.title}
              className="image-preview-media"
              src={previewImage.src}
              style={{
                transform: `translate(${imagePreviewState.offsetX}px, ${imagePreviewState.offsetY}px) scale(${imagePreviewState.scale}) rotate(${imagePreviewState.rotation}deg)`,
              }}
            />
          </div>
        ) : null}
      </LonModal>

      <LonDrawer
        open={activeDrawer === "right"}
        title="编辑角色字段"
        description="抽屉适合承载表单或配置项，页面上下文仍可见。"
        onClose={() => setActiveDrawer(null)}
        footer={
          <>
            <LonButton variant="secondary" onClick={() => setActiveDrawer(null)}>
              取消
            </LonButton>
            <LonButton
              variant="primary"
              onClick={() => {
                setActiveDrawer(null);
                message.success("抽屉内容已保存");
              }}
            >
              保存
            </LonButton>
          </>
        }
      >
        <LonInput
          label="字段名称"
          value={formValues.title}
          placeholder="请输入字段名称"
          onChange={(event) => updateFormValue("title", event.target.value)}
        />
        <p style={{ marginTop: 14 }}>抽屉默认支持遮罩点击和 Escape 关闭，从右侧滑入。</p>
      </LonDrawer>

      <LonDrawer
        open={activeDrawer === "top"}
        title="批量筛选"
        description="顶部抽屉适合展示横向筛选、全局提示或短表单。"
        placement="top"
        onClose={() => setActiveDrawer(null)}
        footer={
          <>
            <LonButton variant="secondary" onClick={() => setActiveDrawer(null)}>
              清空
            </LonButton>
            <LonButton
              variant="primary"
              onClick={() => {
                setActiveDrawer(null);
                message.info("顶部筛选已应用");
              }}
            >
              应用
            </LonButton>
          </>
        }
      >
        <p>可放置跨页面的筛选、批量操作或上下文提示，从顶部滑入并保持主体页面可见。</p>
      </LonDrawer>

      <LonDrawer
        open={activeDrawer === "left"}
        title="导航配置"
        description="左侧抽屉适合承载导航、目录或辅助配置。"
        placement="left"
        onClose={() => setActiveDrawer(null)}
        footer={
          <LonButton variant="primary" onClick={() => setActiveDrawer(null)}>
            完成
          </LonButton>
        }
      >
        <ul className="drawer-showcase-list">
          <li>
            <span>工作台</span>
            <small>默认入口</small>
          </li>
          <li>
            <span>系统管理</span>
            <small>角色与权限</small>
          </li>
          <li>
            <span>审计中心</span>
            <small>日志追踪</small>
          </li>
        </ul>
      </LonDrawer>

      <LonDrawer
        open={activeDrawer === "detail"}
        title="角色权限详情"
        description="较宽抽屉适合展示列表、权限摘要或多段说明。"
        size="large"
        onClose={() => setActiveDrawer(null)}
        footer={
          <LonButton variant="primary" onClick={() => setActiveDrawer(null)}>
            知道了
          </LonButton>
        }
      >
        <ul className="drawer-showcase-list">
          <li>
            <span>菜单权限</span>
            <small>系统管理、内容运营、审计中心</small>
          </li>
          <li>
            <span>按钮权限</span>
            <small>新增、编辑、导出、发布</small>
          </li>
          <li>
            <span>数据范围</span>
            <small>所属组织及下级组织</small>
          </li>
          <li>
            <span>最近更新</span>
            <small>今天 14:32 · 运营中心</small>
          </li>
        </ul>
      </LonDrawer>

      <LonDrawer
        open={activeDrawer === "bottom"}
        title="筛选条件"
        description="底部抽屉适合移动端或轻量筛选面板。"
        placement="bottom"
        onClose={() => setActiveDrawer(null)}
        footer={
          <>
            <LonButton variant="secondary" onClick={() => setActiveDrawer(null)}>
              重置
            </LonButton>
            <LonButton
              variant="primary"
              onClick={() => {
                setActiveDrawer(null);
                message.info("筛选条件已应用");
              }}
            >
              应用
            </LonButton>
          </>
        }
      >
        <p>可按状态、组织、更新时间等维度组合筛选，底部抽屉在窄屏下更易触达。</p>
      </LonDrawer>
    </>
  );
}

export default ComponentShowcasePage;
