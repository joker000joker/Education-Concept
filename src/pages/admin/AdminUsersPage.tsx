import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';
import { Users, Search, ShieldCheck, User, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getRegisteredStudentName } from './AdminAnalyseTestPage';

interface RegisteredUser {
  id: string;
  full_name: string | null;
  name?: string | null;
  display_name?: string | null;
  username?: string | null;
  student_name?: string | null;
  role: string;
  created_at: string;
  [key: string]: any;
}

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser, profile: currentProfile } = useAuth();
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
      // Fetch directly from public.profiles with all existing stored profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
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
    const studentDisplayName = getRegisteredStudentName(u, currentUser, currentProfile);
    const searchMatch = studentDisplayName.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilter === 'all' || String(u.role).toLowerCase() === roleFilter;
    return searchMatch && roleMatch;
  });

  const adminCount = users.filter((u) => String(u.role).toLowerCase() === 'admin').length;
  const studentCount = users.length - adminCount;

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>
      {/* Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#141C2E] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Users</h3>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC]">{users.length}</p>
        </div>

        <div className="bg-white dark:bg-[#141C2E] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Students</h3>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC]">{studentCount}</p>
        </div>

        <div className="bg-white dark:bg-[#141C2E] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Admins</h3>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC]">{adminCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#1B263B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-[#1B263B] p-1 rounded-xl">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === 'all'
                  ? 'bg-white dark:bg-[#141C2E] text-slate-900 dark:text-[#F8FAFC] shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === 'user'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400'
              }`}
            >
              Admins
            </button>
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1B263B] rounded-lg transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading registered users...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <p className="text-rose-700 dark:text-rose-400 font-bold mb-2">Access Denied (RLS)</p>
            <div className="text-sm text-rose-600/80 dark:text-rose-300 max-w-2xl mx-auto whitespace-pre-wrap text-left bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 font-mono">
              {errorMsg}
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No users found.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#1B263B] border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-[#1B263B]/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${String(user.role).toLowerCase() === 'admin' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
                          {String(user.role).toLowerCase() === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                          {getRegisteredStudentName(user, currentUser, currentProfile)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {String(user.role).toLowerCase() === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                          <User className="w-3.5 h-3.5" />
                          Student
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
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
