import { CreateCommunityForm } from "@/components/admin/CreateCommunityForm";

export default function AdminNewCommunityPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Crear comunidad</h2>
      <CreateCommunityForm />
    </div>
  );
}
