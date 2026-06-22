import { useOutletContext } from "react-router-dom";
import type { ModuleId } from "../../../config/modules";
import type { AdminLayoutOutletContext } from "../../../layouts/AdminLayout";
import { filterModuleRecords } from "../../../utils/navigation";
import ManagementModulePage from "../management-module-page/ManagementModulePage";

export type ManagementPageModuleId = Exclude<ModuleId, "dashboard" | "componentShowcase" | "roles">;

type ManagementPageProps = {
  moduleId: ManagementPageModuleId;
};

function ManagementPage({ moduleId }: ManagementPageProps) {
  const { query } = useOutletContext<AdminLayoutOutletContext>();

  return <ManagementModulePage moduleId={moduleId} records={filterModuleRecords(moduleId, query)} query={query} />;
}

export default ManagementPage;
