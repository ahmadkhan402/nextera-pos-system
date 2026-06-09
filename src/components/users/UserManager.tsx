import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Crown,
  Shield,
  User,
  Users,
  Lock,
  Activity,
  Mail,
  AtSign,
} from 'lucide-react';
import { User as UserType } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { usersService } from '../../lib/services';
import { UserModal } from './UserModal';
import { swalConfig } from '../../lib/sweetAlert';

export function UserManager() {
  const { state, dispatch } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredUsers = state.users.filter(user => {
    const search = searchTerm.toLowerCase();

    return (
      (user.name ?? '').toLowerCase().includes(search) ||
      (user.email ?? '').toLowerCase().includes(search) ||
      (user.username ?? '').toLowerCase().includes(search)
    );
  });

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === state.currentUser?.id) {
      swalConfig.warning('You cannot delete your own account');
      return;
    }

    const result = await swalConfig.deleteConfirm('user');

    if (result.isConfirmed) {
      setLoading(true);
      swalConfig.loading('Deleting user...');

      try {
        await usersService.delete(userId);

        dispatch({
          type: 'SET_USERS',
          payload: state.users.filter(u => u.id !== userId),
        });

        swalConfig.success('User deleted successfully!');
      } catch (error: any) {
        swalConfig.error(`Error deleting user: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const toggleUserStatus = async (user: UserType) => {
    if (user.id === state.currentUser?.id) {
      swalConfig.warning('You cannot deactivate your own account');
      return;
    }

    setLoading(true);
    swalConfig.loading(`${user.active ? 'Deactivating' : 'Activating'} user...`);

    try {
      const updatedUser = await usersService.update(user.id, {
        active: !user.active,
      });

      dispatch({
        type: 'SET_USERS',
        payload: state.users.map(u => (u.id === user.id ? updatedUser : u)),
      });

      swalConfig.success(
        `User ${user.active ? 'deactivated' : 'activated'} successfully!`
      );
    } catch (error: any) {
      swalConfig.error(`Error updating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-50 text-amber-700 ring-amber-100';
      case 'manager':
        return 'bg-blue-50 text-blue-700 ring-blue-100';
      case 'cashier':
        return 'bg-purple-50 text-purple-700 ring-purple-100';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-100';
    }
  };

  const activeUsers = state.users.filter(u => u.active).length;
  const inactiveUsers = state.users.filter(u => !u.active).length;
  const adminUsers = state.users.filter(u => u.role === 'admin').length;
  const managerUsers = state.users.filter(u => u.role === 'manager').length;

  return (
    <div className="min-h-full space-y-5 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-slate-950 via-blue-950 to-sky-800 p-5 shadow-2xl shadow-blue-950/20 lg:p-6">
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                Access Control
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                User Management
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100/80">
                Manage system users, roles, permissions and account status.
              </p>
            </div>

            <button
              onClick={handleAddUser}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
              Add User
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <UserStatCard
              icon={Users}
              label="Total Users"
              value={state.users.length.toString()}
              tone="blue"
            />

            <UserStatCard
              icon={UserCheck}
              label="Active Users"
              value={activeUsers.toString()}
              tone="emerald"
            />

            <UserStatCard
              icon={Crown}
              label="Admins"
              value={adminUsers.toString()}
              tone="purple"
            />

            <UserStatCard
              icon={Shield}
              label="Managers"
              value={managerUsers.toString()}
              tone="amber"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur-2xl lg:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search user name, email or username..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <MiniStatusBadge
              icon={Activity}
              label={`${activeUsers} Active`}
              tone="emerald"
            />

            <MiniStatusBadge
              icon={UserX}
              label={`${inactiveUsers} Inactive`}
              tone="rose"
            />

            <MiniStatusBadge
              icon={Lock}
              label="Protected Access"
              tone="blue"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-xl shadow-slate-200/70">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">System Users</h2>

            <p className="text-sm font-medium text-slate-500">
              Showing {filteredUsers.length} user
              {filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
            <Shield className="h-4 w-4" />
            Role Based Access
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Users className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
              No users found
            </h3>

            <p className="mt-1 max-w-md text-sm font-medium text-slate-500">
              Try changing your search term or create a new system user.
            </p>

            <button
              onClick={handleAddUser}
              disabled={loading}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map(user => {
                  const isCurrentUser = user.id === state.currentUser?.id;

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-blue-50/40"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-100">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-black">
                                {getInitials(user.name)}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="max-w-[240px] truncate text-sm font-black text-slate-900">
                                {user.name}
                              </p>

                              {isCurrentUser && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700 ring-1 ring-blue-100">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex max-w-[280px] items-center gap-2 truncate text-xs font-semibold text-slate-500">
                              <AtSign className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{user.username}</span>
                            </div>

                            <div className="mt-0.5 flex max-w-[280px] items-center gap-2 truncate text-xs font-semibold text-slate-400">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {user.lastLogin ? (
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {new Date(user.lastLogin).toLocaleDateString()}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">
                              {new Date(user.lastLogin).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                            Never
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <button
                          onClick={() => toggleUserStatus(user)}
                          disabled={loading || isCurrentUser}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 ring-rose-100 hover:bg-rose-100'
                          }`}
                        >
                          {user.active ? (
                            <UserCheck className="h-3.5 w-3.5" />
                          ) : (
                            <UserX className="h-3.5 w-3.5" />
                          )}
                          {user.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            disabled={loading}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={loading}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition-all hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={editingUser}
      />
    </div>
  );
}

function getInitials(name?: string) {
  if (!name) return 'U';

  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface UserStatCardProps {
  icon: typeof User;
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}

function UserStatCard({ icon: Icon, label, value, tone }: UserStatCardProps) {
  const toneClasses = {
    blue: 'bg-blue-500/15 text-blue-200 ring-blue-300/25',
    emerald: 'bg-emerald-500/15 text-emerald-200 ring-emerald-300/25',
    purple: 'bg-purple-500/15 text-purple-200 ring-purple-300/25',
    amber: 'bg-amber-500/15 text-amber-200 ring-amber-300/25',
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/15">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100/70">
            {label}
          </p>

          <p className="mt-1 truncate text-xl font-black leading-tight text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface MiniStatusBadgeProps {
  icon: typeof UserCheck;
  label: string;
  tone: 'blue' | 'emerald' | 'rose';
}

function MiniStatusBadge({ icon: Icon, label, tone }: MiniStatusBadgeProps) {
  const classes = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ring-1 ${classes[tone]}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <th
      className={`px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}