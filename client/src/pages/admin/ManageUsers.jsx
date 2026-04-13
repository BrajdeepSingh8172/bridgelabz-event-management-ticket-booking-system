import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await axiosClient.get('/api/users');
      // ApiResponse shape: { success, data: { users, pagination }, message }
      const raw = data?.data ?? data;
      setUsers(raw?.users ?? (Array.isArray(raw) ? raw : []));
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axiosClient.patch(`/api/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Manage Users</h1>
        <p className="page-subtitle">View and update user roles</p>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-surface-border text-slate-400">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-surface-border/50 hover:bg-white/3">
                <td className="px-5 py-4 text-white font-medium">{u.name}</td>
                <td className="px-4 py-4 text-slate-300">{u.email}</td>
                <td className="px-4 py-4">
                  <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'organizer' ? 'success' : 'neutral'}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-right">
                  <select
                    className="input py-1.5 px-2 text-xs w-auto inline-block"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  >
                    <option value="attendee">Attendee</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
