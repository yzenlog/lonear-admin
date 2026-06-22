import { useState } from "react";
import type { FormEvent } from "react";
import { Bell, MoreHorizontal, PanelRight, Settings } from "lucide-react";
import {
  LonButton,
  LonCheckboxGroup,
  LonDatePicker,
  LonDrawer,
  LonInput,
  LonModal,
  LonNumberInput,
  LonRadioGroup,
  LonSelect,
  LonUpload,
  useLonMessage,
  useLonNotification,
} from "../../components/ui";
import type { LonButtonVariant, LonButtonVisualState, LonDrawerPlacement, LonNumberInputValue } from "../../components/ui";
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

function ComponentShowcasePage() {
  const message = useLonMessage();
  const notification = useLonNotification();
  const [activeModal, setActiveModal] = useState<ShowcaseModalType>(null);
  const [activeDrawer, setActiveDrawer] = useState<ShowcaseDrawerType>(null);
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
