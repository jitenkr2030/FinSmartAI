import { AppLayout } from "@/components/layout/AppLayout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}