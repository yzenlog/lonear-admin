import type { ModuleId } from "../../../config/modules";
import { moduleRecords } from "../../../mocks/managementRecords";
import ManagementModulePage from "../management-module-page/ManagementModulePage";

export type ManagementPageModuleId = Exclude<ModuleId, "dashboard" | "componentShowcase" | "chatRoom" | "roles">;

type ManagementPageProps = {
  moduleId: ManagementPageModuleId;
};

function ManagementPage({ moduleId }: ManagementPageProps) {
  return <ManagementModulePage moduleId={moduleId} records={moduleRecords[moduleId]} />;
}

export default ManagementPage;
