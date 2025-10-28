import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          {children}
        </div>
      </main>
    </div>
  );
}