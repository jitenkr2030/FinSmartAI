"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginForm from "./LoginForm";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/auth/signin");
    }
  }, [session, isLoading, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar onMenuClick={() => {}} onLogout={handleLogout} user={session.user} />
      <Sidebar isOpen={false} onClose={() => {}} />
      <div className="lg:ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}