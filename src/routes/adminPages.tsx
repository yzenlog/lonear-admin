import type { ComponentType } from "react";
import type { ModuleId } from "../config/modules";
import OperationLogPage from "../pages/audit/OperationLogPage";
import ArticleManagementPage from "../pages/content/ArticleManagementPage";
import BannerManagementPage from "../pages/content/BannerManagementPage";
import FileManagementPage from "../pages/content/FileManagementPage";
import DataModelPage from "../pages/development/DataModelPage";
import WorkbenchPage from "../pages/dashboard/WorkbenchPage";
import MessageInboxPage from "../pages/message/MessageInboxPage";
import NoticeManagementPage from "../pages/message/NoticeManagementPage";
import ComponentShowcasePage from "../pages/showcase/ComponentShowcasePage";
import DictionaryManagementPage from "../pages/system/DictionaryManagementPage";
import MenuManagementPage from "../pages/system/MenuManagementPage";
import OrganizationManagementPage from "../pages/system/OrganizationManagementPage";
import PermissionManagementPage from "../pages/system/PermissionManagementPage";
import RoleManagementPage from "../pages/system/RoleManagementPage";
import SystemConfigPage from "../pages/system/SystemConfigPage";
import WebsiteConfigPage from "../pages/system/WebsiteConfigPage";

type AdminPageRouteProps = {
  moduleId: ModuleId;
};

const adminPageMap: Record<ModuleId, ComponentType> = {
  dashboard: WorkbenchPage,
  componentShowcase: ComponentShowcasePage,
  dataModels: DataModelPage,
  roles: RoleManagementPage,
  permissions: PermissionManagementPage,
  menus: MenuManagementPage,
  orgs: OrganizationManagementPage,
  dictionaries: DictionaryManagementPage,
  websiteConfig: WebsiteConfigPage,
  systemConfig: SystemConfigPage,
  operationLogs: OperationLogPage,
  notices: NoticeManagementPage,
  files: FileManagementPage,
  messages: MessageInboxPage,
  banners: BannerManagementPage,
  articles: ArticleManagementPage,
};

export function AdminPageRoute({ moduleId }: AdminPageRouteProps) {
  const Page = adminPageMap[moduleId];

  return <Page />;
}
