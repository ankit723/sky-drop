import { requireRole, getCurrentUser } from "@/lib/dal";
import { User, Mail, Phone } from "lucide-react";

export default async function ProfilePage() {
  await requireRole(["CLIENT"]);
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold">Profile</h1><p className="text-muted mt-1">Your account information</p></div>
      <div className="bg-white rounded-xl border border-border-light p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-light">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{user.name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold">{user.name}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Business Client</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-light" /><div><p className="text-xs text-muted">Email</p><p className="text-sm font-medium">{user.email}</p></div></div>
          <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-light" /><div><p className="text-xs text-muted">Phone</p><p className="text-sm font-medium">{user.phone || "Not set"}</p></div></div>
          <div className="flex items-center gap-3"><User className="w-4 h-4 text-muted-light" /><div><p className="text-xs text-muted">Member since</p><p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</p></div></div>
        </div>
      </div>
    </div>
  );
}
