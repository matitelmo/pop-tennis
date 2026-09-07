import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="text-2xl font-black text-white">Pop Tennis Console</h1>
        </header>
        <AdminNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
