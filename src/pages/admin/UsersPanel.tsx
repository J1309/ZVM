import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, ChevronDown, Mail, Phone, MapPin, Dog,
  CreditCard, CheckCircle2, Clock, DollarSign, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { getAllUsers } from '../../lib/repositories/userRepository';
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

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAllUsers(), getAllPayments()]).then(([u, p]) => {
      setUsers(u);
      setPayments(p);
      setLoading(false);
    });
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
    if (!q) return enriched;
    return enriched.filter(({ user }) =>
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.dog.name.toLowerCase().includes(q)
    );
  }, [enriched, query]);

  const subscribers = enriched.filter(e => e.currentPlan).length;
  const totalRevenue = enriched.reduce((sum, e) => sum + e.totalSpent, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}
      </div>
    );
  }

  const summary = [
    { label: 'Registered Users', value: users.length.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Subscribers', value: subscribers.toLocaleString(), icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Lifetime Revenue', value: money(totalRevenue), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Registered Users</h2>
        <p className="text-dark-300 text-sm mt-1">Customer accounts, profiles, and subscription history.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {summary.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 sm:p-5 bg-dark-700/50 rounded-xl border border-dark-600"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs text-dark-400 uppercase tracking-wider">{s.label}</span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email, or dog..."
          className="w-full h-11 bg-dark-700/50 border border-dark-600 rounded-xl pl-10 pr-4 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="w-8 h-8 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">
            {query ? `No users match "${query}".` : 'No registered users yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ user, payments: userPayments, currentPlan, totalSpent }) => {
            const isOpen = expanded === user.id;
            return (
              <motion.div
                key={user.id}
                layout
                className="bg-dark-700/40 rounded-xl border border-dark-600 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : user.id)}
                  className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-dark-700/40 transition-colors"
                >
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-brand-500/30 to-brand-600/10 border border-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-300">
                    {initials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-dark-400 truncate">{user.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {currentPlan ? (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${planStyles[currentPlan.planKey] ?? 'bg-dark-600 text-dark-200 border-dark-500'}`}>
                        {currentPlan.planName}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs rounded-lg bg-dark-600/60 text-dark-400 border border-dark-500">No plan</span>
                    )}
                  </div>
                  <div className="text-right shrink-0 w-16 sm:w-20">
                    <p className="text-sm font-semibold text-white">{money(totalSpent)}</p>
                    <p className="text-[10px] text-dark-400 uppercase tracking-wide">spent</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-dark-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-dark-600"
                    >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2.5">
                          <p className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold">Contact & Profile</p>
                          <Detail icon={Mail} text={user.email} />
                          <Detail icon={Phone} text={user.phone || 'No phone'} />
                          <Detail icon={MapPin} text={[user.address.city, user.address.province, user.address.postalCode].filter(Boolean).join(', ') || 'No address'} />
                          <Detail icon={Dog} text={user.dog.name ? `${user.dog.name} · ${user.dog.breed || 'Unknown breed'} · ${user.dog.age}y` : 'No dog profile'} />
                          <div className="flex items-center gap-2 text-xs">
                            {user.legalAccepted
                              ? (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                    <span className="text-green-300 font-medium">
                                      Terms Accepted {user.legalAcceptedAt ? `(${new Date(user.legalAcceptedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})` : ''}
                                    </span>
                                  </>
                                )
                              : (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="text-amber-300 font-medium">Terms Acceptance Pending</span>
                                  </>
                                )}
                          </div>
                          <p className="text-xs text-dark-500">Joined {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>

                        <div className="space-y-2.5">
                          <p className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold">
                            Subscription History ({userPayments.length})
                          </p>
                          {userPayments.length === 0 ? (
                            <p className="text-xs text-dark-500">No purchases yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {userPayments.map(p => (
                                <div key={p.id} className="flex items-center justify-between gap-2 p-2.5 bg-dark-800/60 rounded-lg">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {p.status === 'paid'
                                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                      : <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-white truncate">{p.planName}</p>
                                      <p className="text-[10px] text-dark-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-1.5 py-0.5 text-[10px] rounded uppercase tracking-wide ${statusStyles[p.status]}`}>{p.status.replace('_', ' ')}</span>
                                    <span className="text-xs font-semibold text-white">{money(p.amountCents)}</span>
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
