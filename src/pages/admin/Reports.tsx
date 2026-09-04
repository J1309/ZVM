import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, DollarSign, Download } from 'lucide-react';
import { getAllBookings } from '../../lib/repositories/bookingRepository';
import { getAllPayments } from '../../lib/repositories/paymentRepository';
import { getAllUsers } from '../../lib/repositories/userRepository';
import { Booking, Payment, User } from '../../lib/types';

export default function AdminReports() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([getAllBookings(), getAllPayments(), getAllUsers()]).then(([b, p, u]) => {
      if (!active) return;
      setBookings(b);
      setPayments(p);
      setUsers(u);
      setLoading(false);
    });

    const interval = setInterval(() => {
      Promise.all([getAllBookings(), getAllPayments(), getAllUsers()]).then(([b, p, u]) => {
        if (!active) return;
        setBookings(b);
        setPayments(p);
        setUsers(u);
      }).catch(() => {});
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}
        </div>
        <div className="h-48 skeleton-shimmer rounded-xl" />
      </div>
    );
  }

  const paidPayments = payments.filter(p => p.status === 'paid');
  const paymentsTotal = paidPayments.reduce((sum, p) => sum + (p.amountCents / 100), 0);

  const paidUsersWithoutPaymentRow = users.filter(u =>
    u.hasPaid &&
    !paidPayments.some(p => p.userId === u.id || (p.customerEmail && u.email && p.customerEmail.toLowerCase() === u.email.toLowerCase()))
  );
  const usersTotal = paidUsersWithoutPaymentRow.reduce((sum, u) => {
    const isTrial = u.paidPlanName?.toLowerCase().includes('trial') || u.paidPlanName?.toLowerCase().includes('founding');
    return sum + (isTrial ? 70 : 35);
  }, 0);

  const paidBookings = bookings.filter(b => b.status === 'scheduled' || b.status === 'completed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  const totalRevenue = (paymentsTotal + usersTotal) > 0
    ? (paymentsTotal + usersTotal)
    : paidBookings.reduce((sum, b) => sum + b.sessionFee + (b.surcharge || 0), 0);

  const baseRevenue = totalRevenue / 1.05;
  const totalSurcharges = paidBookings.reduce((sum, b) => sum + (b.surcharge || 0), 0);
  const gst = totalRevenue - baseRevenue;
  const hst = totalRevenue * 0.13;

  const plansMap: Record<string, { sessions: number; revenue: number }> = {};
  if (paidPayments.length > 0 || paidUsersWithoutPaymentRow.length > 0) {
    paidPayments.forEach(p => {
      const plan = p.planName || 'Single Run';
      if (!plansMap[plan]) plansMap[plan] = { sessions: 0, revenue: 0 };
      plansMap[plan].sessions += p.sessionsCount || 1;
      plansMap[plan].revenue += p.amountCents / 100;
    });
    paidUsersWithoutPaymentRow.forEach(u => {
      const plan = u.paidPlanName || 'Founding Member Trial Run';
      const isTrial = plan.toLowerCase().includes('trial') || plan.toLowerCase().includes('founding');
      if (!plansMap[plan]) plansMap[plan] = { sessions: 0, revenue: 0 };
      plansMap[plan].sessions += isTrial ? 3 : 1;
      plansMap[plan].revenue += isTrial ? 70 : 35;
    });
  } else {
    paidBookings.forEach(b => {
      const plan = b.planName || 'Single Run';
      if (!plansMap[plan]) plansMap[plan] = { sessions: 0, revenue: 0 };
      plansMap[plan].sessions += 1;
      plansMap[plan].revenue += b.sessionFee + (b.surcharge || 0);
    });
  }

  const sessionsByPlan = Object.entries(plansMap).map(([name, data]) => ({
    name,
    sessions: data.sessions,
    revenue: data.revenue,
  }));

  const handleExport = () => {
    const rows = [
      ['Booking ID', 'FSA', 'Customer', 'Dog', 'Date', 'Time Slot', 'Plan', 'Fee', 'Surcharge', 'Total', 'Status'],
      ...bookings.map(b => [
        b.id,
        b.fsa,
        b.customerName,
        b.dogName,
        b.date,
        b.timeSlot || '',
        b.planName || '',
        b.sessionFee.toFixed(2),
        b.surcharge.toFixed(2),
        (b.sessionFee + b.surcharge).toFixed(2),
        b.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zoomievan_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Financial Reports</h2>
          <p className="text-dark-300 text-sm mt-1">{paidBookings.length} paid sessions · {cancelled.length} cancelled</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 rounded-xl hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25"
        >
          <Download className="w-4 h-4" /> Export CSV
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Paid Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Paid Sessions', value: paidBookings.length.toLocaleString(), icon: Calendar, color: 'text-brand-400' },
          { label: 'Avg. per Session', value: `$${(totalRevenue / (paidBookings.length || 1)).toFixed(2)}`, icon: TrendingUp, color: 'text-blue-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-dark-700/50 rounded-xl border border-dark-600">
            <div className={`${stat.color} mb-1`}><stat.icon className="w-4 h-4" /></div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-xs text-dark-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-dark-700/50 rounded-xl border border-dark-600">
          <p className="text-xs text-dark-400 mb-3 uppercase tracking-wider">Tax Breakdown</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-dark-300">Base Revenue</span><span className="text-white">${baseRevenue.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-dark-300">Surcharges</span><span className="text-white">${totalSurcharges.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-dark-300">GST (5%)</span><span className="text-dark-200">${gst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-dark-300">HST (13%)</span><span className="text-dark-200">${hst.toFixed(2)}</span></div>
            <div className="h-px bg-dark-500 my-2" />
            <div className="flex justify-between font-semibold"><span className="text-white">Total Collected</span><span className="text-brand-400">${(totalRevenue + gst + hst).toFixed(2)}</span></div>
          </div>
        </div>

        <div className="p-5 bg-dark-700/50 rounded-xl border border-dark-600">
          <p className="text-xs text-dark-400 mb-3 uppercase tracking-wider">Revenue by Package</p>
          <div className="space-y-2 text-sm">
            {sessionsByPlan.length === 0 ? (
              <p className="text-xs text-dark-400 italic">No package sessions yet.</p>
            ) : (
              sessionsByPlan.map(plan => (
                <div key={plan.name} className="flex justify-between items-center">
                  <span className="text-dark-200">{plan.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-dark-300 text-xs">{plan.sessions} sessions</span>
                    <span className="text-white font-mono text-xs">${plan.revenue.toFixed(0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {cancelled.length > 0 && (
        <div className="p-4 bg-dark-700/30 rounded-xl border border-dark-600">
          <p className="text-xs text-dark-400 mb-1 uppercase tracking-wider">Lost Revenue (Cancelled)</p>
          <p className="text-lg font-bold text-red-400">
            -${cancelled.reduce((s, b) => s + b.sessionFee + b.surcharge, 0).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
