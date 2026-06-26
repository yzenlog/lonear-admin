import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import {
  CheckCheck,
  Clock3,
  FileText,
  ImagePlus,
  MoreHorizontal,
  Paperclip,
  Search,
  SendHorizontal,
  Smile,
  Sticker,
  UsersRound,
  X,
} from "lucide-react";
import { LonButton, useLonMessage } from "../../components/ui";
import { moduleMeta } from "../../config/modules";
import { useLanguage } from "../../i18n";
import "./ChatRoomPage.css";

type ChannelTone = "blue" | "green" | "amber";

type ChatChannel = {
  id: string;
  name: string;
  description: string;
  members: number;
  unread: number;
  tone: ChannelTone;
};

type ChatAttachment = {
  id: string;
  kind: "file" | "image";
  name: string;
  size: string;
  url?: string;
};

type StickerId = "approval" | "rocket" | "document" | "coffee";

type ChatMessage = {
  id: string;
  author: string;
  role: string;
  initials: string;
  color: string;
  time: string;
  mine?: boolean;
  text?: string;
  sticker?: StickerId;
  attachments?: ChatAttachment[];
};

type ChatSticker = {
  id: StickerId;
  label: string;
  className: string;
  message: string;
};

const channels: ChatChannel[] = [
  {
    id: "operations",
    name: "运营协作",
    description: "活动、内容和公告上线节奏",
    members: 18,
    unread: 4,
    tone: "blue",
  },
  {
    id: "design",
    name: "设计评审",
    description: "组件状态和页面走查反馈",
    members: 9,
    unread: 0,
    tone: "green",
  },
  {
    id: "support",
    name: "客服同步",
    description: "用户反馈、工单和紧急问题",
    members: 14,
    unread: 2,
    tone: "amber",
  },
];

const initialMessages: Record<string, ChatMessage[]> = {
  operations: [
    {
      id: "msg-ops-1",
      author: "林可",
      role: "内容运营",
      initials: "林",
      color: "#1066cc",
      time: "09:28",
      text: "首页活动 Banner 已完成替换，等待最后一轮发布确认。",
    },
    {
      id: "msg-ops-2",
      author: "周启",
      role: "运营负责人",
      initials: "周",
      color: "#168a55",
      time: "09:34",
      mine: true,
      text: "收到，发布前把落地页截图和素材包一起发到这里。",
    },
    {
      id: "msg-ops-3",
      author: "林可",
      role: "内容运营",
      initials: "林",
      color: "#1066cc",
      time: "09:41",
      text: "素材包和预览图已补齐，复核点只剩移动端顶部间距。",
      attachments: [
        {
          id: "asset-preview",
          kind: "image",
          name: "活动页移动端预览.png",
          size: "428 KB",
          url: "/images/avatars/avatar-1.jpeg",
        },
        {
          id: "asset-kit",
          kind: "file",
          name: "summer-campaign-assets.zip",
          size: "6.8 MB",
        },
      ],
    },
  ],
  design: [
    {
      id: "msg-design-1",
      author: "宋一",
      role: "产品设计",
      initials: "宋",
      color: "#8b3ce6",
      time: "10:08",
      text: "表单错误态的红色在深色模式里更柔和了，组件展示页可以同步更新。",
    },
    {
      id: "msg-design-2",
      author: "周启",
      role: "运营负责人",
      initials: "周",
      color: "#168a55",
      time: "10:11",
      mine: true,
      sticker: "approval",
    },
  ],
  support: [
    {
      id: "msg-support-1",
      author: "陈知",
      role: "客服主管",
      initials: "陈",
      color: "#d92d58",
      time: "11:02",
      text: "登录保护开关开启后，有 3 个老账号需要重新绑定邮箱。",
    },
    {
      id: "msg-support-2",
      author: "周启",
      role: "运营负责人",
      initials: "周",
      color: "#168a55",
      time: "11:06",
      mine: true,
      text: "先走站内信提醒，今晚再看未完成名单。",
    },
  ],
};

const emojiOptions = ["👍", "👌", "🙏", "🔥", "🎉", "✨", "💡", "✅", "🚀", "☕", "😊", "😄"];

const stickers: ChatSticker[] = [
  { id: "approval", label: "已确认", className: "sticker-approval", message: "已确认，继续推进" },
  { id: "rocket", label: "准备上线", className: "sticker-rocket", message: "准备上线" },
  { id: "document", label: "资料已备", className: "sticker-document", message: "资料已备齐" },
  { id: "coffee", label: "稍后同步", className: "sticker-coffee", message: "稍后同步" },
];

const numberFormatter = new Intl.NumberFormat("zh-CN");
const CHAT_INPUT_MAX_HEIGHT = 128;

function formatBytes(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function createMessageId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getTextIcon(label: string) {
  return Array.from(label.trim()).slice(0, 1).join("").toUpperCase() || "?";
}

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  const nextHeight = Math.min(textarea.scrollHeight, CHAT_INPUT_MAX_HEIGHT);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > CHAT_INPUT_MAX_HEIGHT ? "auto" : "hidden";
}

function ChatRoomPage() {
  const { t } = useLanguage();
  const message = useLonMessage();
  const [activeChannelId, setActiveChannelId] = useState(channels[0].id);
  const [channelMessages, setChannelMessages] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [channelQuery, setChannelQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? channels[0];
  const activeMessages = channelMessages[activeChannel.id] ?? [];
  const filteredChannels = useMemo(() => {
    const normalizedQuery = channelQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return channels;
    }

    return channels.filter((channel) => {
      const haystack = `${channel.name} ${channel.description} ${t(channel.name)} ${t(channel.description)}`.toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [channelQuery, t]);
  const onlineMembers = activeChannel.members - Math.min(3, activeChannel.unread + 1);
  const attachmentCount = pendingAttachments.length;

  useEffect(() => {
    const messagesElement = messagesRef.current;

    if (!messagesElement) {
      return;
    }

    messagesElement.scrollTop = messagesElement.scrollHeight;
  }, [activeChannelId, activeMessages.length]);

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [draft]);

  function createAttachment(file: File, preferredKind?: ChatAttachment["kind"]): ChatAttachment {
    const kind = preferredKind ?? (file.type.startsWith("image/") ? "image" : "file");
    const url = kind === "image" ? URL.createObjectURL(file) : undefined;

    if (url) {
      objectUrlsRef.current.push(url);
    }

    return {
      id: createMessageId(),
      kind,
      name: file.name,
      size: formatBytes(file.size),
      url,
    };
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>, preferredKind?: ChatAttachment["kind"]) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setPendingAttachments((currentAttachments) => [
      ...currentAttachments,
      ...selectedFiles.map((file) => createAttachment(file, preferredKind)),
    ]);
    setEmojiOpen(false);
    setStickerOpen(false);
    event.target.value = "";
  }

  function removePendingAttachment(attachmentId: string) {
    setPendingAttachments((currentAttachments) => {
      const removedAttachment = currentAttachments.find((attachment) => attachment.id === attachmentId);

      if (removedAttachment?.url) {
        URL.revokeObjectURL(removedAttachment.url);
        objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== removedAttachment.url);
      }

      return currentAttachments.filter((attachment) => attachment.id !== attachmentId);
    });
  }

  function appendMessage(nextMessage: ChatMessage) {
    setChannelMessages((currentMessages) => ({
      ...currentMessages,
      [activeChannel.id]: [...(currentMessages[activeChannel.id] ?? []), nextMessage],
    }));
  }

  function handleSend() {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft && pendingAttachments.length === 0) {
      message.warning(t("请输入消息内容或添加附件"));
      textareaRef.current?.focus();
      return;
    }

    appendMessage({
      id: createMessageId(),
      author: "周启",
      role: "运营负责人",
      initials: "周",
      color: "#168a55",
      time: getCurrentTime(),
      mine: true,
      text: trimmedDraft || undefined,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    });
    setDraft("");
    setPendingAttachments([]);
    setEmojiOpen(false);
    setStickerOpen(false);
    message.success(t("消息已发送"));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
    resizeTextarea(event.currentTarget);
  }

  function insertEmoji(emoji: string) {
    const input = textareaRef.current;

    if (!input) {
      setDraft((currentDraft) => `${currentDraft}${emoji}`);
      return;
    }

    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    const nextDraft = `${draft.slice(0, selectionStart)}${emoji}${draft.slice(selectionEnd)}`;

    setDraft(nextDraft);
    window.requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(selectionStart + emoji.length, selectionStart + emoji.length);
    });
  }

  function sendSticker(sticker: ChatSticker) {
    appendMessage({
      id: createMessageId(),
      author: "周启",
      role: "运营负责人",
      initials: "周",
      color: "#168a55",
      time: getCurrentTime(),
      mine: true,
      sticker: sticker.id,
      text: sticker.message,
    });
    setEmojiOpen(false);
    setStickerOpen(false);
    message.success(`${t("已发送表情包")}「${t(sticker.label)}」`);
  }

  function toggleEmojiPanel() {
    setEmojiOpen((open) => !open);
    setStickerOpen(false);
  }

  function toggleStickerPanel() {
    setStickerOpen((open) => !open);
    setEmojiOpen(false);
  }

  return (
    <div className="chat-room-page">
      <section className="admin-panel chat-room-shell" aria-label={t("聊天室")}>
        <aside className="chat-room-sidebar">
          <div className="chat-sidebar-header">
            <span className="chat-sidebar-icon" aria-hidden="true">
              {getTextIcon(t(moduleMeta.chatRoom.title))}
            </span>
            <div>
              <span>{t(moduleMeta.chatRoom.scope)}</span>
              <strong>{t(moduleMeta.chatRoom.title)}</strong>
            </div>
          </div>

          <label className="chat-channel-search">
            <Search size={14} strokeWidth={2.15} />
            <input
              value={channelQuery}
              onChange={(event) => setChannelQuery(event.target.value)}
              placeholder={t("搜索聊天室")}
              aria-label={t("搜索聊天室")}
            />
          </label>

          <div className="chat-channel-list" aria-label={t("聊天室频道")}>
            {filteredChannels.map((channel) => (
              <button
                className={`chat-channel-item ${channel.id === activeChannel.id ? "active" : ""}`}
                type="button"
                key={channel.id}
                onClick={() => setActiveChannelId(channel.id)}
              >
                <span className={`chat-channel-mark tone-${channel.tone}`} aria-hidden="true">
                  {getTextIcon(t(channel.name))}
                </span>
                <span className="chat-channel-copy">
                  <strong>{t(channel.name)}</strong>
                  <span>{t(channel.description)}</span>
                </span>
                {channel.unread > 0 ? <span className="chat-channel-badge">{channel.unread}</span> : null}
              </button>
            ))}
          </div>

          <div className="chat-sidebar-summary" aria-label={t("聊天室概览")}>
            <div>
              <span>{t("当前在线")}</span>
              <strong>{numberFormatter.format(onlineMembers)}</strong>
            </div>
            <div>
              <span>{t("今日消息")}</span>
              <strong>{numberFormatter.format(activeMessages.length + 24)}</strong>
            </div>
          </div>
        </aside>

        <main className="chat-room-main">
          <header className="chat-room-header">
            <div className="chat-room-title">
              <span className={`chat-channel-mark tone-${activeChannel.tone}`} aria-hidden="true">
                {getTextIcon(t(activeChannel.name))}
              </span>
              <div>
                <h1>{t(activeChannel.name)}</h1>
                <p>{t(activeChannel.description)}</p>
              </div>
            </div>
            <div className="chat-room-actions">
              <span className="chat-room-stat">
                <UsersRound size={14} strokeWidth={2.1} />
                {numberFormatter.format(activeChannel.members)} {t("成员")}
              </span>
              <span className="chat-room-stat">
                <Clock3 size={14} strokeWidth={2.1} />
                {t("实时")}
              </span>
              <button className="icon-btn" type="button" aria-label={t("更多操作")}>
                <MoreHorizontal size={16} strokeWidth={2.15} />
              </button>
            </div>
          </header>

          <div className="chat-message-list" ref={messagesRef} aria-live="polite">
            {activeMessages.map((chatMessage) => (
              <article className={`chat-message ${chatMessage.mine ? "mine" : ""}`} key={chatMessage.id}>
                <span className="chat-avatar" style={{ background: chatMessage.color }} aria-hidden="true">
                  {chatMessage.initials}
                </span>
                <div className="chat-message-content">
                  <div className="chat-message-meta">
                    <strong>{t(chatMessage.author)}</strong>
                    <span>{t(chatMessage.role)}</span>
                    <time>{chatMessage.time}</time>
                    {chatMessage.mine ? (
                      <span className="chat-message-status">
                        <CheckCheck size={13} strokeWidth={2.2} />
                        {t("已送达")}
                      </span>
                    ) : null}
                  </div>
                  <div className="chat-bubble">
                    {chatMessage.text ? <p>{t(chatMessage.text)}</p> : null}
                    {chatMessage.sticker ? <StickerPreview stickerId={chatMessage.sticker} /> : null}
                    {chatMessage.attachments ? (
                      <div className="chat-attachment-list">
                        {chatMessage.attachments.map((attachment) => (
                          <AttachmentPreview attachment={attachment} key={attachment.id} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <footer className="chat-composer">
            {pendingAttachments.length > 0 ? (
              <div className="chat-pending-attachments" aria-label={t("待发送附件")}>
                {pendingAttachments.map((attachment) => (
                  <div className="chat-pending-attachment" key={attachment.id}>
                    <AttachmentPreview attachment={attachment} compact />
                    <button type="button" aria-label={t("移除附件")} onClick={() => removePendingAttachment(attachment.id)}>
                      <X size={13} strokeWidth={2.2} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {emojiOpen ? (
              <div className="chat-picker-panel" aria-label={t("Emoji 面板")}>
                <div className="chat-emoji-grid">
                  {emojiOptions.map((emoji) => (
                    <button type="button" key={emoji} aria-label={`${t("插入 emoji")} ${emoji}`} onClick={() => insertEmoji(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {stickerOpen ? (
              <div className="chat-picker-panel" aria-label={t("表情包面板")}>
                <div className="chat-sticker-grid">
                  {stickers.map((sticker) => (
                    <button type="button" key={sticker.id} onClick={() => sendSticker(sticker)}>
                      <span className={`chat-sticker-sprite ${sticker.className}`} aria-hidden="true" />
                      <span>{t(sticker.label)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="chat-composer-toolbar" aria-label={t("消息工具")}>
              <button className="icon-btn" type="button" aria-label={t("发送文件")} onClick={() => fileInputRef.current?.click()}>
                <Paperclip size={16} strokeWidth={2.15} />
              </button>
              <button className="icon-btn" type="button" aria-label={t("发送图片")} onClick={() => imageInputRef.current?.click()}>
                <ImagePlus size={16} strokeWidth={2.15} />
              </button>
              <button className={`icon-btn ${emojiOpen ? "active" : ""}`} type="button" aria-label={t("打开 emoji")} onClick={toggleEmojiPanel}>
                <Smile size={16} strokeWidth={2.15} />
              </button>
              <button
                className={`icon-btn ${stickerOpen ? "active" : ""}`}
                type="button"
                aria-label={t("打开表情包")}
                onClick={toggleStickerPanel}
              >
                <Sticker size={16} strokeWidth={2.15} />
              </button>
              <span className="chat-composer-count">
                {attachmentCount > 0 ? `${attachmentCount} ${t("个附件")}` : t("可发送文字、文件、图片、表情包和 emoji")}
              </span>
            </div>

            <div className="chat-input-row">
              <textarea
                ref={textareaRef}
                value={draft}
                rows={2}
                placeholder={t("输入消息，和团队同步最新进展")}
                onChange={handleDraftChange}
                onKeyDown={handleKeyDown}
              />
              <LonButton
                className="chat-send-button"
                leadingIcon={<SendHorizontal size={14} strokeWidth={2.2} />}
                onClick={handleSend}
              >
                {t("发送")}
              </LonButton>
            </div>

            <input
              ref={fileInputRef}
              className="chat-hidden-input"
              type="file"
              multiple
              onChange={(event) => handleAttachmentChange(event, "file")}
            />
            <input
              ref={imageInputRef}
              className="chat-hidden-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handleAttachmentChange(event, "image")}
            />
          </footer>
        </main>
      </section>
    </div>
  );
}

function AttachmentPreview({ attachment, compact = false }: { attachment: ChatAttachment; compact?: boolean }) {
  if (attachment.kind === "image") {
    return (
      <div className={`chat-image-attachment ${compact ? "compact" : ""}`}>
        {attachment.url ? <img src={attachment.url} alt={attachment.name} /> : <ImagePlus size={16} strokeWidth={2.1} />}
        <span>
          <strong>{attachment.name}</strong>
          <small>{attachment.size}</small>
        </span>
      </div>
    );
  }

  return (
    <div className={`chat-file-attachment ${compact ? "compact" : ""}`}>
      <FileText size={compact ? 14 : 16} strokeWidth={2.1} />
      <span>
        <strong>{attachment.name}</strong>
        <small>{attachment.size}</small>
      </span>
    </div>
  );
}

function StickerPreview({ stickerId }: { stickerId: StickerId }) {
  const sticker = stickers.find((item) => item.id === stickerId);

  if (!sticker) {
    return null;
  }

  return (
    <span className="chat-message-sticker">
      <span className={`chat-sticker-sprite ${sticker.className}`} aria-hidden="true" />
      <span>{sticker.label}</span>
    </span>
  );
}

export default ChatRoomPage;
