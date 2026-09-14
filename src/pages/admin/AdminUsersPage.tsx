import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Users, Search, ShieldCheck, User, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RegisteredUser {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export const AdminUsersPage: React.FC = () => {
  const { session } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch directly from public.profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      // RLS Detection logic:
      // If the admin can't even see their own profile, or only sees themselves, RLS is filtering it.
      // We know there are multiple users, so if length <= 1, RLS is almost certainly blocking us.
      if (!data || data.length <= 1) {
        setErrorMsg(
          "Query blocked or filtered by Row Level Security (RLS).\n" +
          "To securely allow admins to view this list, please run this exact SQL in your Supabase SQL Editor:\n\n" +
          "CREATE POLICY \"Admins can view all profiles\"\n" +
          "ON public.profiles FOR SELECT\n" +
          "USING ( public.is_admin() );\n"
        );
      }

      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      // Detailed error message if RLS blocks it
      if (err.code === '42501') {
        setErrorMsg('Access denied (RLS). You do not have permission to view other users\' profiles.');
      } else {
        setErrorMsg(err.message || 'Failed to fetch users from public.profiles');
      }
      toast.show(err.message || 'Failed to fetch users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.full_name || 'Anonymous User';
    const searchMatch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter === 'all' || String(u.role).toLowerCase() === roleFilter;
    return searchMatch && roleMatch;
  });

  const adminCount = users.filter((u) => String(u.role).toLowerCase() === 'admin').length;
  const studentCount = users.length - adminCount;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Total Users</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{users.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Students</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{studentCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Admins</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{adminCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === 'user'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Admins
            </button>
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-medium text-slate-500">Loading registered users...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <p className="text-rose-700 font-bold mb-2">Access Denied (RLS)</p>
            <div className="text-sm text-rose-600/80 max-w-2xl mx-auto whitespace-pre-wrap text-left bg-rose-50 p-4 rounded-xl border border-rose-100 font-mono">
              {errorMsg}
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No users found.</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">User Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${String(user.role).toLowerCase() === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {String(user.role).toLowerCase() === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {user.full_name || 'Anonymous User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {String(user.role).toLowerCase() === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <User className="w-3.5 h-3.5" />
                          Student
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
