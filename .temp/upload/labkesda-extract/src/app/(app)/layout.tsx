import { AppLayout } from "@/components/layout/AppLayout";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
