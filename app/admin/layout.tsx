import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-white/10 lg:px-4 lg:py-6">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="text-xl font-black text-white">Pop Tennis</h1>
        </header>
        <AdminNav orientation="vertical" />
      </aside>

      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl lg:max-w-5xl">
          <header className="mb-6 lg:hidden">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Admin</p>
            <h1 className="text-2xl font-black text-white">Pop Tennis Console</h1>
          </header>
          <AdminNav className="lg:hidden" />
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
