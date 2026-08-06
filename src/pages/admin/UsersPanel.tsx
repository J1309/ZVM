import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, ChevronDown, Mail, Phone, MapPin, Dog,
  CheckCircle2, Clock, ShieldCheck, ShieldAlert, Plus, Edit2, Trash2, X, Save
} from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../lib/repositories/userRepository';
import { getAllPayments } from '../../lib/repositories/paymentRepository';
import { User, Payment } from '../../lib/types';

const planStyles: Record<string, string> = {
  package_2: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  package_1: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  trial_run: 'bg-brand-500/10 text-brand-300 border-brand-500/20',
  single_run: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
};

const statusStyles: Record<Payment['status'], string> = {
  paid: 'bg-green-500/10 text-green-400',
  checkout_created: 'bg-amber-500/10 text-amber-400',
  cancelled: 'bg-dark-600 text-dark-300',
  failed: 'bg-red-500/10 text-red-400',
  refunded: 'bg-orange-500/10 text-orange-400',
};

const money = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

interface Enriched {
  user: User;
  payments: Payment[];
  currentPlan: Payment | null;
  totalSpent: number;
}

const emptyUserForm = {
  name: '',
  email: '',
  phone: '',
  role: 'customer' as 'customer' | 'admin',
  address: { line1: '', city: 'Edmonton', province: 'AB', postalCode: '' },
  dog: { name: '', breed: '', weight: 30, age: 3, energyLevel: 'High', reactivityNotes: '' },
  password: 'Password123!',
};

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  // CRUD Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [saving, setSaving] = useState(false);

  const reloadData = () => {
    setLoading(true);
    Promise.all([getAllUsers(), getAllPayments()]).then(([u, p]) => {
      setUsers(u);
      setPayments(p);
      setLoading(false);
    });
  };

  useEffect(() => {
    reloadData();
  }, []);

  const enriched = useMemo<Enriched[]>(() => {
    return users.map(user => {
      const userPayments = payments
        .filter(p => p.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const paid = userPayments.filter(p => p.status === 'paid');
      return {
        user,
        payments: userPayments,
        currentPlan: paid[0] ?? null,
        totalSpent: paid.reduce((sum, p) => sum + p.amountCents, 0),
      };
    });
  }, [users, payments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter(({ user }) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesQuery = !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone && user.phone.includes(q)) ||
        (user.dog.name && user.dog.name.toLowerCase().includes(q)) ||
        (user.address.postalCode && user.address.postalCode.toLowerCase().includes(q));
      return matchesRole && matchesQuery;
    });
  }, [enriched, query, roleFilter]);

  const handleOpenAddModal = () => {
    setUserForm(emptyUserForm);
    setEditingUser(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'customer',
      address: {
        line1: user.address?.line1 || '',
        city: user.address?.city || 'Edmonton',
        province: user.address?.province || 'AB',
        postalCode: user.address?.postalCode || '',
      },
      dog: {
        name: user.dog?.name || '',
        breed: user.dog?.breed || '',
        weight: user.dog?.weight || 30,
        age: user.dog?.age || 3,
        energyLevel: user.dog?.energyLevel || 'High',
        reactivityNotes: user.dog?.reactivityNotes || '',
      },
      password: '',
    });
    setShowAddModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;
    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          address: userForm.address,
          dog: userForm.dog,
        });
      } else {
        await createUser({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          address: userForm.address,
          dog: userForm.dog,
          vaccines: { rabiesFileName: '', dhppFileName: '', vetName: '', vetPhone: '' },
          legalAccepted: true,
          legalAcceptedAt: new Date().toISOString(),
          legalVersion: '2026-07-14',
        });
      }
      setShowAddModal(false);
      reloadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This cannot be undone.`)) return;
    await deleteUser(id);
    reloadData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-dark-700/30 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search user, dog, email, postal code..."
              className="w-full h-11 bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <div className="flex bg-dark-800 rounded-xl border border-dark-600 p-1">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                roleFilter === 'all' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('customer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                roleFilter === 'customer' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                roleFilter === 'admin' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
              }`}
            >
              Admins
            </button>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="h-11 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-sm font-bold text-white hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Users List Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-dark-800/40 rounded-2xl border border-dark-700/60">
          <Users className="w-8 h-8 text-dark-500 mx-auto mb-2" />
          <p className="text-sm text-dark-300 font-medium">No matching user accounts found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ user, payments: userPayments, currentPlan, totalSpent }) => {
            const isOpen = expanded === user.id;
            return (
              <motion.div
                key={user.id}
                layout
                className="bg-dark-800/80 rounded-2xl border border-dark-600 overflow-hidden hover:border-dark-500 transition-colors"
              >
                <div className="flex items-center gap-3 p-3 sm:p-4 text-left">
                  <button
                    onClick={() => setExpanded(isOpen ? null : user.id)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-brand-500/30 to-brand-600/10 border border-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-300">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        {user.role === 'admin' && (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-md">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dark-400 truncate">{user.email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      {currentPlan ? (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-xl border ${planStyles[currentPlan.planKey] ?? 'bg-dark-600 text-dark-200 border-dark-500'}`}>
                          {currentPlan.planName}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs rounded-xl bg-dark-700 text-dark-400 border border-dark-600">No plan</span>
                      )}
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="text-sm font-bold text-white">{money(totalSpent)}</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wide font-semibold">total spent</p>
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-dark-700">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      title="Edit User Profile"
                      className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      title="Delete User"
                      className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpanded(isOpen ? null : user.id)}
                      className="p-2 text-dark-400 hover:text-white rounded-lg transition"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-dark-600 bg-dark-900/40"
                    >
                      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">Contact &amp; Profile Details</p>
                          <Detail icon={Mail} text={user.email} />
                          <Detail icon={Phone} text={user.phone || 'No phone provided'} />
                          <Detail icon={MapPin} text={[user.address?.line1, user.address?.city, user.address?.province, user.address?.postalCode].filter(Boolean).join(', ') || 'No address set'} />
                          <Detail icon={Dog} text={user.dog?.name ? `${user.dog.name} · ${user.dog.breed || 'Unknown breed'} · ${user.dog.weight || 0}lbs · ${user.dog.age || 0}y` : 'No dog profile set'} />
                          
                          <div className="pt-2 border-t border-dark-700/60">
                            <div className="flex items-center gap-2 text-xs">
                              {user.legalAccepted ? (
                                <>
                                  <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                                  <span className="text-green-300 font-medium">
                                    Terms Accepted {user.legalAcceptedAt ? `(${new Date(user.legalAcceptedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})` : ''}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="text-amber-300 font-medium">Terms Acceptance Pending</span>
                                </>
                              )}
                            </div>
                            <p className="text-[11px] text-dark-400 mt-1">Joined {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">
                            Purchase &amp; Subscription History ({userPayments.length})
                          </p>
                          {userPayments.length === 0 ? (
                            <p className="text-xs text-dark-400 italic">No package purchases yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {userPayments.map(p => (
                                <div key={p.id} className="flex items-center justify-between gap-2 p-3 bg-dark-800 border border-dark-700/80 rounded-xl">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {p.status === 'paid' ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white truncate">{p.planName}</p>
                                      <p className="text-[10px] text-dark-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${statusStyles[p.status]}`}>
                                      {p.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs font-bold text-white">{money(p.amountCents)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 border border-dark-600 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-dark-600 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">
                  {editingUser ? `Edit Account: ${editingUser.name}` : 'Create New User Account'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-dark-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="(780) 555-0199"
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1">Account Role</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value as 'customer' | 'admin' })}
                    className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Address Fields */}
              <div className="pt-2 border-t border-dark-700/60 space-y-3">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-wider">Address Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={userForm.address.line1}
                      onChange={e => setUserForm({ ...userForm, address: { ...userForm.address, line1: e.target.value } })}
                      placeholder="1234 Jasper Ave"
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Postal Code (FSA)</label>
                    <input
                      type="text"
                      value={userForm.address.postalCode}
                      onChange={e => setUserForm({ ...userForm, address: { ...userForm.address, postalCode: e.target.value.toUpperCase() } })}
                      placeholder="T5J 1N1 or T8A 1A1"
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white uppercase focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dog Profile Fields */}
              <div className="pt-2 border-t border-dark-700/60 space-y-3">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-wider">Dog Profile</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Dog Name</label>
                    <input
                      type="text"
                      value={userForm.dog.name}
                      onChange={e => setUserForm({ ...userForm, dog: { ...userForm.dog, name: e.target.value } })}
                      placeholder="Max"
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Breed</label>
                    <input
                      type="text"
                      value={userForm.dog.breed}
                      onChange={e => setUserForm({ ...userForm, dog: { ...userForm.dog, breed: e.target.value } })}
                      placeholder="Golden Retriever"
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Weight (lbs)</label>
                    <input
                      type="number"
                      value={userForm.dog.weight}
                      onChange={e => setUserForm({ ...userForm, dog: { ...userForm.dog, weight: Number(e.target.value) } })}
                      className="w-full h-10 bg-dark-900 border border-dark-600 rounded-xl px-3 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-dark-600 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-dark-600 text-dark-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/25 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save User Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-dark-300">
      <Icon className="w-3.5 h-3.5 text-dark-500 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
}
