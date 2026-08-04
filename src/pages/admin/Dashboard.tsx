import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity, MapPinned } from 'lucide-react';
import { getAllBookings } from '../../lib/repositories/bookingRepository';
import { getAllVans } from '../../lib/repositories/fleetRepository';
import { getAllZones } from '../../lib/repositories/fsaRepository';
import { getAllVaccines } from '../../lib/repositories/vaccineRepository';
import { Booking, FleetVan, FSARecord, VaccineRecord } from '../../lib/types';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vans, setVans] = useState<FleetVan[]>([]);
  const [zones, setZones] = useState<FSARecord[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllBookings(), getAllVans(), getAllZones(), getAllVaccines()]).then(
      ([b, v, z, vac]) => {
        setBookings(b);
        setVans(v);
        setZones(z);
        setVaccines(vac);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 skeleton-shimmer rounded-xl" />
        ))}
      </div>
    );
  }

  const paidBookings = bookings.filter(b => b.status === 'scheduled' || b.status === 'completed');
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.sessionFee + (b.surcharge || 0), 0);
  const scheduledSessions = bookings.filter(b => b.status === 'scheduled').length;
  const completedSessions = bookings.filter(b => b.status === 'completed').length;
  const activeVans = vans.filter(v => v.status === 'Active').length;
  const activeZones = zones.filter(z => z.status === 'active').length;
  const pendingVaccines = vaccines.filter(v => v.status === 'pending').length;
  const uniqueClients = new Set(paidBookings.map(b => b.customerName)).size;

  const stats = [
    { label: 'Total Paid Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Scheduled (Upcoming)', value: scheduledSessions.toLocaleString(), icon: Activity, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Completed Sessions', value: completedSessions.toLocaleString(), icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Paid Clients', value: uniqueClients.toLocaleString(), icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Service Zones', value: activeZones.toLocaleString(), icon: MapPinned, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Pending Vaccines', value: pendingVaccines.toLocaleString(), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Dashboard</h2>
        <p className="text-dark-300 text-sm mt-1">Real-time overview of your ZoomieVan operations.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-5 bg-dark-700/50 rounded-xl border border-dark-600"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dark-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>
      <div className="p-5 bg-dark-700/50 rounded-xl border border-dark-600">
        <p className="text-xs text-dark-400 mb-2 uppercase tracking-wider">Operations &amp; Revenue Overview</p>
        <p className="text-dark-200 text-sm leading-relaxed">
          {activeVans} vans actively serving {activeZones} zones across Edmonton and Alberta.
          {pendingVaccines > 0 && ` ${pendingVaccines} vaccine records pending review.`}
          {' '}Total paid bookings amount to <strong className="text-emerald-300">${totalRevenue.toFixed(2)} CAD</strong> across {paidBookings.length} paid session{paidBookings.length === 1 ? '' : 's'}.
        </p>
      </div>
    </div>
  );
}
