import { UserManagement } from "@/components/settings/user-management";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="mt-1 text-slate-500">User accounts, roles and access</p>
      </div>
      <UserManagement />
    </div>
  );
}
