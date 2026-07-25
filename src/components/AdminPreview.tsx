import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import { 
  Settings, MapPinned, ShieldCheck, Truck, Receipt, 
  AlertTriangle, CheckCircle2, XCircle,
  TrendingUp, Users, Calendar
} from 'lucide-react';
import { Skeleton } from './Skeleton';
import PickupWindowPicker from './PickupWindowPicker';

const adminTabs = [
  { id: 'cms', icon: <Settings className="w-4 h-4" />, label: 'CMS' },
  { id: 'schedule', icon: <Calendar className="w-4 h-4" />, label: 'Pickup Windows' },
  { id: 'fsa', icon: <MapPinned className="w-4 h-4" />, label: 'FSA Manager' },
  { id: 'vaccines', icon: <ShieldCheck className="w-4 h-4" />, label: 'Vaccines' },
  { id: 'fleet', icon: <Truck className="w-4 h-4" />, label: 'Fleet' },
  { id: 'reports', icon: <Receipt className="w-4 h-4" />, label: 'Reports' },
];

function CMSPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-300">Emergency banner is active</span>
        </div>
        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">LIVE</span>
      </div>
      {['Single Run Rate', 'Package 1 Rate', 'Hero Tagline', 'Emergency Banner Text'].map((field) => (
        <div key={field} className="space-y-1">
          <label className="text-xs text-dark-400 uppercase tracking-wider">{field}</label>
          <div className="h-9 bg-dark-700 border border-dark-500 rounded-lg flex items-center px-3">
            <span className="text-xs text-dark-300">Click to edit...</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FSAPanel() {
  const zones = [
    { fsa: 'T5A', city: 'Edmonton', tier: 'Tier 1', surcharge: '$0', region: 'East', status: 'active' },
    { fsa: 'T5L', city: 'Edmonton', tier: 'Tier 1', surcharge: '$0', region: 'North', status: 'active' },
    { fsa: 'T5R', city: 'Edmonton', tier: 'Tier 1', surcharge: '$0', region: 'West', status: 'active' },
    { fsa: 'T5H', city: 'Edmonton', tier: 'Tier 1', surcharge: '$0', region: 'South', status: 'active' },
    { fsa: 'T5X', city: 'Edmonton', tier: 'Tier 1', surcharge: '$0', region: 'South', status: 'active' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-dark-600">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-dark-700">
            <th className="text-left p-3 text-xs text-dark-400 font-medium">FSA</th>
            <th className="text-left p-3 text-xs text-dark-400 font-medium">City</th>
            <th className="text-left p-3 text-xs text-dark-400 font-medium">Region (8d)</th>
            <th className="text-left p-3 text-xs text-dark-400 font-medium">Tier</th>
            <th className="text-left p-3 text-xs text-dark-400 font-medium">Surcharge</th>
            <th className="text-left p-3 text-xs text-dark-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-600">
          {zones.map((zone) => (
            <tr key={zone.fsa} className="hover:bg-dark-700/50">
              <td className="p-3 font-mono text-brand-400 font-semibold">{zone.fsa}</td>
              <td className="p-3 text-dark-200">{zone.city}</td>
              <td className="p-3">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {zone.region}
                </span>
              </td>
              <td className="p-3 text-dark-300">{zone.tier}</td>
              <td className="p-3 text-dark-300">{zone.surcharge}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  zone.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {zone.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VaccinePanel() {
  const queue = [
    { dog: 'Max', owner: 'Sarah C.', type: 'Rabies + DHPP', submitted: '2h ago', status: 'pending' },
    { dog: 'Bella', owner: 'James O.', type: 'Rabies', submitted: '4h ago', status: 'pending' },
    { dog: 'Luna', owner: 'David P.', type: 'DHPP', submitted: '1d ago', status: 'approved' },
  ];

  return (
    <div className="space-y-3">
      {queue.map((item) => (
        <div key={item.dog} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl border border-dark-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-sm">🐕</div>
            <div>
              <p className="text-sm font-semibold text-white">{item.dog} <span className="text-dark-400 font-normal">— {item.owner}</span></p>
              <p className="text-xs text-dark-400">{item.type} · {item.submitted}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {item.status === 'pending' ? (
              <>
                <button className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">Approved</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FleetPanel() {
  const vans = [
    { id: 'VAN-001', name: 'Thunder', status: 'Active', sessions: 12, location: 'Edmonton East' },
    { id: 'VAN-002', name: 'Storm', status: 'Active', sessions: 9, location: 'Edmonton West' },
    { id: 'VAN-003', name: 'Lightning', status: 'Maintenance', sessions: 0, location: 'Shop' },
    { id: 'VAN-004', name: 'Bolt', status: 'Active', sessions: 11, location: 'Edmonton South' },
  ];

  return (
    <div className="space-y-3">
      {vans.map((van) => (
        <div key={van.id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl border border-dark-600">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              van.status === 'Active' ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              🚐
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{van.name} <span className="text-dark-400 font-mono text-xs">{van.id}</span></p>
              <p className="text-xs text-dark-400">{van.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-dark-300">{van.sessions} today</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              van.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {van.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Revenue', value: '$12,847', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-400' },
          { label: 'Clients', value: '342', icon: <Users className="w-4 h-4" />, color: 'text-blue-400' },
          { label: 'Sessions', value: '1,247', icon: <Calendar className="w-4 h-4" />, color: 'text-brand-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-3 bg-dark-700/50 rounded-xl border border-dark-600 text-center">
            <div className={`${stat.color} flex justify-center mb-1`}>{stat.icon}</div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-xs text-dark-400">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="p-4 bg-dark-700/50 rounded-xl border border-dark-600">
        <p className="text-xs text-dark-400 mb-3">Tax Breakdown (This Month)</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-dark-300">Base Revenue</span><span className="text-white">$10,247.00</span></div>
          <div className="flex justify-between"><span className="text-dark-300">Delivery Surcharges</span><span className="text-white">$1,340.00</span></div>
          <div className="flex justify-between"><span className="text-dark-300">GST Collected</span><span className="text-dark-200">$579.35</span></div>
          <div className="flex justify-between"><span className="text-dark-300">HST Collected</span><span className="text-dark-200">$681.12</span></div>
          <div className="h-px bg-dark-500 my-2" />
          <div className="flex justify-between font-semibold"><span className="text-white">Total</span><span className="text-brand-400">$12,847.47</span></div>
        </div>
      </div>
      <button className="w-full py-2.5 text-sm font-medium bg-dark-700 border border-dark-500 text-dark-200 rounded-xl hover:bg-dark-600 transition-colors">
        Export CRA Spreadsheet →
      </button>
    </div>
  );
}

export default function AdminPreview() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [activeTab, setActiveTab] = useState('cms');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const renderPanel = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      );
    }
    switch (activeTab) {
      case 'cms': return <CMSPanel />;
      case 'schedule': return <PickupWindowPicker readOnly />;
      case 'fsa': return <FSAPanel />;
      case 'vaccines': return <VaccinePanel />;
      case 'fleet': return <FleetPanel />;
      case 'reports': return <ReportsPanel />;
      default: return <CMSPanel />;
    }
  };

  return (
    <section className="relative py-24 lg:py-32 bg-dark-800/20 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-brand-500 font-semibold text-sm uppercase tracking-[0.15em] mb-4 block">
            Operations Hub
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Complete <span className="text-gradient">Admin Control</span>
          </h2>
          <p className="mt-6 text-lg text-dark-300 leading-relaxed">
            Our administrative operations hub gives your team full control over content, logistics, 
            compliance, fleet management, and CRA-compliant financial reporting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-dark-600 bg-dark-800/80 overflow-hidden shadow-2xl">
            {/* Mock window chrome */}
            <div className="flex items-center justify-between px-4 py-3 bg-dark-700 border-b border-dark-600">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-dark-400 font-mono">admin.zoomievan.ca</span>
              <div className="w-12" />
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-dark-600 overflow-x-auto">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-brand-400 border-brand-500 bg-brand-500/5'
                      : 'text-dark-400 border-transparent hover:text-dark-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="p-6 min-h-[300px]">
              {renderPanel()}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
