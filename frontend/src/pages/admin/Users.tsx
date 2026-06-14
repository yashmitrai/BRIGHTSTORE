import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { Users, Mail, Phone, Calendar, ShieldAlert } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'retailer' | 'admin';
  phone?: string;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users directory', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/40';
      case 'retailer':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/40';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/40';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            User Account Directory
          </h2>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded">
            {users.length} accounts
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-sm text-slate-705 dark:text-slate-350">Directory is empty</h3>
            <p className="text-xs text-slate-400 mt-1">No user accounts found in the database.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    <th className="p-4 pl-6">Profile Info</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Role Permission</th>
                    <th className="p-4">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-200">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 font-extrabold flex items-center justify-center">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {u._id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-350">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.email}</span>
                          </p>
                          {u.phone && (
                            <p className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{u.phone}</span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${getRoleBadgeStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;
