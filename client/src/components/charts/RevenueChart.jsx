import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-sm px-3 py-2 text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-primary-300 font-semibold">₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
    </div>
  );
};

export default function RevenueChart({ data = [] }) {
  return (
    <div className="glass p-5">
      <h3 className="font-display font-semibold text-white mb-5">Revenue Overview</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#252840" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="revenue"
            stroke="#6366f1" strokeWidth={2}
            fill="url(#revenueGrad)"
            dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#818cf8' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
