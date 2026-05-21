import { getCurrentUser } from "@/lib/dal";
import prisma from "@/lib/prisma";
import Sidebar from "@/app/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) return null;

  // Fetch unread notification count
  const notificationCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={user.role}
        userName={user.name}
        notificationCount={notificationCount}
      />
      <main className="flex-1 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
