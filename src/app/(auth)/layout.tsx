import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader session={session} />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          {children}
        </div>
      </main>
    </div>
  );
}