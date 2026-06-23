import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronsRight, CopyX, Layers, RefreshCw, X } from "lucide-react";
import { moduleMeta } from "../../../config/modules";
import type { ModuleId } from "../../../config/modules";
import type { PageTabsStyle } from "../../../config/app";
import "./PageTabs.css";

type PageTabsProps = {
  tabs: ModuleId[];
  activeModule: ModuleId;
  styleVariant: PageTabsStyle;
  onSelect: (id: ModuleId) => void;
  onRefresh: (id: ModuleId) => void;
  onClose: (id: ModuleId) => void;
  onCloseOthers: (id: ModuleId) => void;
  onCloseRight: (id: ModuleId) => void;
  onCloseAll: () => void;
};

type ContextMenuState = {
  id: ModuleId;
  x: number;
  y: number;
};

const MENU_WIDTH = 168;
const MENU_HEIGHT = 186;
const VIEWPORT_GAP = 8;
const MENU_OFFSET_Y = 6;

function PageTabs({
  tabs,
  activeModule,
  styleVariant,
  onSelect,
  onRefresh,
  onClose,
  onCloseOthers,
  onCloseRight,
  onCloseAll,
}: PageTabsProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const contextMenuIndex = contextMenu ? tabs.indexOf(contextMenu.id) : -1;
  const canCloseCurrent = contextMenu?.id !== "dashboard";
  const canCloseOthers = contextMenu ? tabs.some((id) => id !== "dashboard" && id !== contextMenu.id) : false;
  const canCloseRight = contextMenu
    ? tabs.slice(contextMenuIndex + 1).some((id) => id !== "dashboard")
    : false;
  const canCloseAll = tabs.some((id) => id !== "dashboard");

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    });
  }, [contextMenu]);

  function closeContextMenu() {
    setContextMenu(null);
  }

  function openContextMenu(id: ModuleId, left: number, top: number) {
    const maxLeft = Math.max(VIEWPORT_GAP, window.innerWidth - MENU_WIDTH - VIEWPORT_GAP);
    const maxTop = Math.max(VIEWPORT_GAP, window.innerHeight - MENU_HEIGHT - VIEWPORT_GAP);

    setContextMenu({
      id,
      x: Math.max(VIEWPORT_GAP, Math.min(left, maxLeft)),
      y: Math.max(VIEWPORT_GAP, Math.min(top, maxTop)),
    });
  }

  function openContextMenuBelowTab(id: ModuleId, element: HTMLElement) {
    const rect = element.getBoundingClientRect();

    openContextMenu(id, rect.left, rect.bottom + MENU_OFFSET_Y);
  }

  function handleContextMenu(event: MouseEvent<HTMLDivElement>, id: ModuleId) {
    event.preventDefault();
    openContextMenuBelowTab(id, event.currentTarget);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: ModuleId) {
    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) {
      return;
    }

    event.preventDefault();
    openContextMenuBelowTab(id, event.currentTarget);
  }

  function runMenuAction(action: (id: ModuleId) => void) {
    if (!contextMenu) {
      return;
    }

    const targetId = contextMenu.id;
    setContextMenu(null);
    action(targetId);
  }

  return (
    <>
      <div className={`tabs page-tabs page-tabs-${styleVariant}`} role="tablist" aria-label="已打开页面">
        {tabs.map((id) => {
          const meta = moduleMeta[id];
          const Icon = meta.icon;
          const active = id === activeModule;

          return (
            <div
              className={`tab-item ${active ? "active" : ""}`}
              key={id}
              onContextMenu={(event) => handleContextMenu(event, id)}
            >
              <button
                className="tab"
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(id)}
                onKeyDown={(event) => handleTabKeyDown(event, id)}
              >
                <Icon size={13} strokeWidth={2.1} />
                <span>{meta.title}</span>
              </button>
              {id === "dashboard" ? null : (
                <button
                  className="tab-close"
                  type="button"
                  aria-label={`关闭${meta.title}`}
                  onClick={() => onClose(id)}
                >
                  <X size={12} strokeWidth={2.1} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {contextMenu
        ? createPortal(
            <div
              className="tab-context-menu"
              ref={menuRef}
              role="menu"
              aria-label={`${moduleMeta[contextMenu.id].title} 标签操作`}
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button className="tab-menu-item" type="button" role="menuitem" onClick={() => runMenuAction(onRefresh)}>
                <RefreshCw size={14} strokeWidth={2.1} />
                <span>刷新页面</span>
              </button>
              <button
                className="tab-menu-item"
                type="button"
                role="menuitem"
                disabled={!canCloseCurrent}
                onClick={() => runMenuAction(onClose)}
              >
                <X size={14} strokeWidth={2.1} />
                <span>关闭当前</span>
              </button>
              <button
                className="tab-menu-item"
                type="button"
                role="menuitem"
                disabled={!canCloseOthers}
                onClick={() => runMenuAction(onCloseOthers)}
              >
                <Layers size={14} strokeWidth={2.1} />
                <span>关闭其他</span>
              </button>
              <button
                className="tab-menu-item"
                type="button"
                role="menuitem"
                disabled={!canCloseRight}
                onClick={() => runMenuAction(onCloseRight)}
              >
                <ChevronsRight size={14} strokeWidth={2.1} />
                <span>关闭右侧</span>
              </button>
              <span className="tab-menu-separator" role="separator" />
              <button
                className="tab-menu-item"
                type="button"
                role="menuitem"
                disabled={!canCloseAll}
                onClick={() => {
                  setContextMenu(null);
                  onCloseAll();
                }}
              >
                <CopyX size={14} strokeWidth={2.1} />
                <span>关闭全部</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default PageTabs;
