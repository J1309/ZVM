import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, DollarSign, Download } from 'lucide-react';
import { getAllBookings } from '../../lib/repositories/bookingRepository';
import { getAllVans } from '../../lib/repositories/fleetRepository';
import { Booking, FleetVan } from '../../lib/types';

export default function AdminReports() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vans, setVans] = useState<FleetVan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllBookings(), getAllVans()]).then(([b, v]) => {
      setBookings(b);
      setVans(v);
      setLoading(false);
    });
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

  const paidBookings = bookings.filter(b => b.status === 'scheduled' || b.status === 'completed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.sessionFee + (b.surcharge || 0), 0);
  const baseRevenue = paidBookings.reduce((sum, b) => sum + b.sessionFee, 0);
  const totalSurcharges = paidBookings.reduce((sum, b) => sum + (b.surcharge || 0), 0);
  const gst = totalRevenue * 0.05;
  const hst = totalRevenue * 0.13;

  const sessionsByVan = vans.map(van => ({
    name: van.name,
    sessions: paidBookings.filter(b => b.vanId === van.id).length,
    revenue: paidBookings.filter(b => b.vanId === van.id).reduce((s, b) => s + b.sessionFee + (b.surcharge || 0), 0),
  }));

  const handleExport = () => {
    const rows = [
      ['Booking ID', 'Van', 'FSA', 'Customer', 'Dog', 'Date', 'Time Slot', 'Plan', 'Fee', 'Surcharge', 'Total', 'Status'],
      ...bookings.map(b => [
        b.id,
        vans.find(v => v.id === b.vanId)?.name || b.vanId,
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
          <p className="text-xs text-dark-400 mb-3 uppercase tracking-wider">Sessions by Van</p>
          <div className="space-y-2 text-sm">
            {sessionsByVan.map(van => (
              <div key={van.name} className="flex justify-between items-center">
                <span className="text-dark-200">{van.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-dark-300 text-xs">{van.sessions} sessions</span>
                  <span className="text-white font-mono text-xs">${van.revenue.toFixed(0)}</span>
                </div>
              </div>
            ))}
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
