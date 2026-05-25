import { Fragment, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, LabelList,
} from 'recharts';
import Engineering from '@mui/icons-material/Engineering';
import TaskAlt from '@mui/icons-material/TaskAlt';
import Warning from '@mui/icons-material/Warning';
import Layers from '@mui/icons-material/Layers';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FilterList from '@mui/icons-material/FilterList';
import Timeline from '@mui/icons-material/Timeline';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Visibility from '@mui/icons-material/Visibility';
import FolderOpen from '@mui/icons-material/FolderOpen';
import Folder from '@mui/icons-material/Folder';
import { AppIcon } from '@/components/icons/AppIcon';
import { LossConcreteChartTooltip } from '@/components/loss-concrete/LossConcreteChartTooltip';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DashboardKpiBox } from '@/components/dashboard/DashboardKpiBox';
import { DashboardChartBox, dashboardBarChartHeight } from '@/components/dashboard/DashboardChartBox';
import { dashboardBarChartMargin, dashboardYAxisWidth, truncateAxisLabel } from '@/lib/dashboardChartLayout';
import { DashboardBarValueLabel, type DashboardBarLabelProps } from '@/components/dashboard/DashboardBarValueLabel';
import {
  DASHBOARD_COMPLETE_STATUS,
  DASHBOARD_STATUS_INFO,
  DASHBOARD_STATUS_ORDER,
  DASHBOARD_MONTHS,
  SUPPLIER_COLORS,
} from '@/lib/dashboardConstants';
import {
  recordChartDwgVolume,
  type DashboardConcreteRecord,
  type DashboardFilters,
} from '@/lib/dashboardRecordMapper';
import { useChartColors } from '@/lib/chartTheme';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { app, frame, glass, modal, rq, tableCompact, type } from '@/lib/requestUi';
import { cn } from '@/lib/utils';

const dashTable = {
  table: cn(tableCompact.table, 'min-w-[72rem]'),
  head: tableCompact.head,
  body: tableCompact.body,
} as const;

interface AdminDashboardContentProps {
  /** ชุดข้อมูลเต็มตามช่วงวันที่ — ใช้ KPI และทุกกราฟ */
  chartData: DashboardConcreteRecord[];
  /** ชุดข้อมูลหลังกรองจากกราฟ — ใช้ตารางรายละเอียด */
  tableData: DashboardConcreteRecord[];
  filters: DashboardFilters;
  toggleFilter: (key: keyof DashboardFilters, value: string) => void;
}

type Granularity = 'day' | 'week' | 'month' | 'year';

interface KeyInfo {
  key: string;
  ts: number;
  name: string;
}

export function AdminDashboardContent({ chartData, tableData, filters, toggleFilter }: AdminDashboardContentProps) {
  const {
    grid: cGrid,
    axis: cAxis,
    labelStrong: cLabel,
    dim: cDim,
    cursor: cCursor,
    pieStroke: cPieStroke,
  } = useChartColors();

  const [trendGranularity,       setTrendGranularity]       = useState<Granularity>('month');
  const [statusTrendGranularity, setStatusTrendGranularity] = useState<Granularity>('month');
  const [hiddenStructures,       setHiddenStructures]       = useState<Set<string>>(new Set());
  const [structureDropdownOpen,  setStructureDropdownOpen]  = useState<boolean>(false);
  const structureDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedGroups,  setExpandedGroups]  = useState<Record<string, boolean>>({});
  const [selectedRow,     setSelectedRow]     = useState<DashboardConcreteRecord | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (structureDropdownRef.current && !structureDropdownRef.current.contains(e.target as Node)) {
        setStructureDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (filters.status) {
      setExpandedGroups((prev) => ({ ...prev, [filters.status as string]: true }));
    }
  }, [filters.status]);

  const toggleGroup = useCallback((status: string) => {
    setExpandedGroups((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

  const chartViewData = useMemo(() => {
    if (hiddenStructures.size === 0) return chartData;
    return chartData.filter((item) => !hiddenStructures.has((String(item.Structure || '')).trim()));
  }, [chartData, hiddenStructures]);

  const tableViewData = useMemo(() => {
    if (hiddenStructures.size === 0) return tableData;
    return tableData.filter((item) => !hiddenStructures.has((String(item.Structure || '')).trim()));
  }, [tableData, hiddenStructures]);

  const sortedData = useMemo(
    () => [...tableViewData].sort((a, b) => b.Timestamp - a.Timestamp),
    [tableViewData],
  );

  const groupedData = useMemo<Record<string, DashboardConcreteRecord[]>>(() => {
    const groups: Record<string, DashboardConcreteRecord[]> = {};
    sortedData.forEach((item) => {
      const s = item['Current Status'];
      if (!groups[s]) groups[s] = [];
      groups[s].push(item);
    });
    return groups;
  }, [sortedData]);

  const kpis = useMemo(() => {
    let totalReq = 0, totalDwg = 0, compConf = 0, compDwg = 0, lossConc = 0;
    chartViewData.forEach((item) => {
      const r = parseFloat(String(item['Request Volume'])) || 0;
      const d = parseFloat(String(item['DWG. Volume']))    || 0;
      const c = parseFloat(String(item['Confirm Volume'])) || 0;
      const l = item['Loss Concrete'] != null ? parseFloat(String(item['Loss Concrete'])) || 0 : 0;
      totalReq += r;
      totalDwg += d;
      if (item['Current Status'] === DASHBOARD_COMPLETE_STATUS) {
        compConf += c;
        compDwg  += d;
        lossConc += l;
      }
    });
    return {
      count:           chartViewData.length,
      totalDwgVol:     totalReq.toFixed(2),
      requestVol:      totalReq.toFixed(2),
      dwgVol:          totalDwg.toFixed(2),
      confirmVol:      compConf.toFixed(2),
      lossConcVol:     lossConc.toFixed(2),
      lossConcPercent: compDwg > 0 ? (lossConc / compDwg * 100).toFixed(2) : '0.00',
    };
  }, [chartViewData]);

  const chartStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    chartViewData.forEach((item) => {
      const k = item['Current Status'] || 'Unknown';
      counts[k] = (counts[k] || 0) + 1;
    });
    const ordered = DASHBOARD_STATUS_ORDER.filter((key) => counts[key] > 0).map((name) => ({
      name,
      value: counts[name],
      shortName: DASHBOARD_STATUS_INFO[name]?.short ?? name,
      legend: DASHBOARD_STATUS_INFO[name]?.legend ?? `S${name}`,
      color: DASHBOARD_STATUS_INFO[name]?.color ?? '#64748b',
    }));
    const extra = Object.keys(counts)
      .filter((k) => !(DASHBOARD_STATUS_ORDER as readonly string[]).includes(k))
      .map((name) => ({
        name,
        value: counts[name],
        shortName: name,
        legend: `S${name}`,
        color: '#64748b',
      }));
    return [...ordered, ...extra];
  }, [chartViewData]);

  const chartSupplierData = useMemo(() => {
    const res: Record<string, number> = {};
    chartViewData.forEach((item) => {
      const k = (String(item.Supplier || '')).trim();
      if (!k) return;
      res[k] = (res[k] || 0) + recordChartDwgVolume(item);
    });
    return Object.entries(res)
      .map(([name, vol]) => ({ name, value: +vol.toFixed(2) }))
      .sort((a, b) => b.value - a.value);
  }, [chartViewData]);

  const chartStrengthData = useMemo(() => {
    const res: Record<string, number> = {};
    chartViewData.forEach((item) => {
      const k = String(item.Strength ?? '').trim();
      if (!k) return;
      res[k] = (res[k] || 0) + recordChartDwgVolume(item);
    });
    return Object.entries(res)
      .map(([name, vol]) => ({ name, value: +vol.toFixed(2) }))
      .sort((a, b) => (parseInt(b.name) || 0) - (parseInt(a.name) || 0));
  }, [chartViewData]);

  const chartStructureData = useMemo(() => {
    const res: Record<string, { name: string; dwg: number; confirm: number }> = {};
    chartViewData.forEach((item) => {
      const k = (String(item.Structure || '')).trim();
      if (!k) return;
      if (!res[k]) res[k] = { name: k, dwg: 0, confirm: 0 };
      res[k].dwg += recordChartDwgVolume(item);
      if (item['Current Status'] === DASHBOARD_COMPLETE_STATUS) {
        res[k].confirm += parseFloat(String(item['Confirm Volume'])) || 0;
      }
    });
    return Object.values(res)
      .map((o) => ({ name: o.name, 'DWG Vol': +o.dwg.toFixed(2), 'Confirm Vol': +o.confirm.toFixed(2) }))
      .sort((a, b) => b['DWG Vol'] - a['DWG Vol']);
  }, [chartViewData]);

  const chartStaffData = useMemo(() => {
    const res: Record<string, { name: string; dwg: number; confirm: number }> = {};
    chartViewData.forEach((item) => {
      const k = (String(item['Request by'] || '')).trim();
      if (!k) return;
      if (!res[k]) res[k] = { name: k, dwg: 0, confirm: 0 };
      res[k].dwg += recordChartDwgVolume(item);
      if (item['Current Status'] === DASHBOARD_COMPLETE_STATUS) {
        res[k].confirm += parseFloat(String(item['Confirm Volume'])) || 0;
      }
    });
    return Object.values(res)
      .map((o) => ({ name: o.name, 'DWG Vol': +o.dwg.toFixed(2), 'Confirm Vol': +o.confirm.toFixed(2) }))
      .sort((a, b) => b['DWG Vol'] - a['DWG Vol']);
  }, [chartViewData]);

  const statusYWidth = useMemo(
    () => dashboardYAxisWidth(chartStatusData.map((d) => d.legend)),
    [chartStatusData],
  );
  const strengthYWidth = useMemo(
    () => dashboardYAxisWidth(chartStrengthData.map((d) => d.name)),
    [chartStrengthData],
  );
  const structureYWidth = useMemo(
    () => dashboardYAxisWidth(chartStructureData.map((d) => d.name)),
    [chartStructureData],
  );
  const staffYWidth = useMemo(
    () => dashboardYAxisWidth(chartStaffData.map((d) => d.name)),
    [chartStaffData],
  );

  const statusBarTotal = useMemo(
    () => chartStatusData.reduce((s, d) => s + d.value, 0),
    [chartStatusData],
  );
  const strengthBarTotal = useMemo(
    () => chartStrengthData.reduce((s, d) => s + d.value, 0),
    [chartStrengthData],
  );
  const staffBarTotal = useMemo(
    () => chartStaffData.reduce((s, d) => s + d['DWG Vol'], 0),
    [chartStaffData],
  );
  const supplierTotal = useMemo(
    () => chartSupplierData.reduce((s, d) => s + d.value, 0),
    [chartSupplierData],
  );

  const getKeyInfo = useCallback((item: DashboardConcreteRecord, granularity: Granularity): KeyInfo | null => {
    const d = new Date(item.Timestamp);
    if (granularity === 'day') {
      const yyyy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
      return { key: `${yyyy}-${mm}-${dd}`, ts: new Date(yyyy, d.getMonth(), d.getDate()).getTime(), name: `${dd}/${mm}` };
    } else if (granularity === 'week') {
      const dow = d.getDay(), diff = dow === 0 ? -6 : 1 - dow;
      const ws = new Date(d); ws.setDate(d.getDate() + diff); ws.setHours(0,0,0,0);
      const wy = ws.getFullYear(), wm = String(ws.getMonth() + 1).padStart(2,'0'), wd = String(ws.getDate()).padStart(2,'0');
      return { key: `${wy}-${wm}-${wd}`, ts: ws.getTime(), name: `${wd}/${wm}` };
    } else if (granularity === 'month') {
      if (item.Month === 'Unknown') return null;
      const [mon, yr] = item.Month.split(' ');
      const monIdx = (DASHBOARD_MONTHS as readonly string[]).indexOf(mon);
      return { key: item.Month, ts: monIdx >= 0 ? new Date(+yr, monIdx, 1).getTime() : item.Timestamp, name: item.Month };
    } else {
      const yr = d.getFullYear();
      return { key: String(yr), ts: new Date(yr, 0, 1).getTime(), name: String(yr) };
    }
  }, []);

  const chartTimelineVol = useMemo(() => {
    const completedItems = chartViewData.filter(item => item['Current Status'] === DASHBOARD_COMPLETE_STATUS && item.Timestamp > 0);
    const planItems      = chartViewData.filter(item => item.Timestamp > 0);
    if (completedItems.length === 0 && planItems.length === 0) return [];

    const maxTs   = planItems.reduce((m, i) => Math.max(m, i.Timestamp), 0);
    const maxDate = new Date(maxTs);
    let cutoffTs  = 0;
    if (trendGranularity === 'day') {
      const c = new Date(maxDate); c.setDate(c.getDate() - 29); c.setHours(0,0,0,0); cutoffTs = c.getTime();
    } else if (trendGranularity === 'week') {
      const c = new Date(maxDate); c.setDate(c.getDate() - 83); c.setHours(0,0,0,0); cutoffTs = c.getTime();
    } else if (trendGranularity === 'month') {
      const c = new Date(maxDate); c.setMonth(c.getMonth() - 11); c.setDate(1); c.setHours(0,0,0,0); cutoffTs = c.getTime();
    }

    const res: Record<string, { name: string; Volume: number; PlanVolume: number; ts: number }> = {};
    planItems.forEach((item) => {
      if (item.Timestamp < cutoffTs) return;
      const info = getKeyInfo(item, trendGranularity);
      if (!info) return;
      const { key, ts, name } = info;
      if (!res[key]) res[key] = { name, Volume: 0, PlanVolume: 0, ts };
      res[key].PlanVolume += parseFloat(String(item['Request Volume'])) || 0;
    });
    completedItems.forEach((item) => {
      if (item.Timestamp < cutoffTs) return;
      const info = getKeyInfo(item, trendGranularity);
      if (!info) return;
      const { key, ts, name } = info;
      if (!res[key]) res[key] = { name, Volume: 0, PlanVolume: 0, ts };
      res[key].Volume += parseFloat(String(item['Confirm Volume'])) || 0;
    });
    return Object.values(res)
      .sort((a, b) => a.ts - b.ts)
      .map((o) => ({ ...o, Volume: +o.Volume.toFixed(2), PlanVolume: +o.PlanVolume.toFixed(2) }));
  }, [chartViewData, trendGranularity, getKeyInfo]);

  const chartTimelineStatus = useMemo(() => {
    const validItems = chartViewData.filter(item => item.Timestamp > 0);
    if (validItems.length === 0) return [];
    const maxTs   = validItems.reduce((m, i) => Math.max(m, i.Timestamp), 0);
    const maxDate = new Date(maxTs);
    let cutoffTs  = 0;
    if (statusTrendGranularity === 'day') {
      const c = new Date(maxDate); c.setDate(c.getDate() - 29); c.setHours(0,0,0,0); cutoffTs = c.getTime();
    } else if (statusTrendGranularity === 'week') {
      const c = new Date(maxDate); c.setDate(c.getDate() - 83); c.setHours(0,0,0,0); cutoffTs = c.getTime();
    } else if (statusTrendGranularity === 'month') {
      const c = new Date(maxDate); c.setMonth(c.getMonth() - 11); c.setDate(1); c.setHours(0,0,0,0); cutoffTs = c.getTime();
    }

    const res: Record<string, Record<string, number | string>> = {};
    validItems.forEach((item) => {
      if (item.Timestamp < cutoffTs) return;
      const d      = new Date(item.Timestamp);
      const sLabel = DASHBOARD_STATUS_INFO[item['Current Status']]?.legend ?? `S${item['Current Status']}`;
      let key = '', ts = 0, name = '';

      if (statusTrendGranularity === 'day') {
        const yyyy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
        key = `${yyyy}-${mm}-${dd}`; ts = new Date(yyyy, d.getMonth(), d.getDate()).getTime(); name = `${dd}/${mm}`;
      } else if (statusTrendGranularity === 'week') {
        const dow = d.getDay(), diff = dow === 0 ? -6 : 1 - dow;
        const ws = new Date(d); ws.setDate(d.getDate() + diff); ws.setHours(0,0,0,0);
        key = `${ws.getFullYear()}-${String(ws.getMonth()+1).padStart(2,'0')}-${String(ws.getDate()).padStart(2,'0')}`;
        ts = ws.getTime(); name = `${String(ws.getDate()).padStart(2,'0')}/${String(ws.getMonth()+1).padStart(2,'0')}`;
      } else if (statusTrendGranularity === 'month') {
        if (item.Month === 'Unknown') return;
        const [mon, yr] = item.Month.split(' ');
        const monIdx = (DASHBOARD_MONTHS as readonly string[]).indexOf(mon);
        key = item.Month; ts = monIdx >= 0 ? new Date(+yr, monIdx, 1).getTime() : item.Timestamp; name = item.Month;
      } else {
        const yr = d.getFullYear(); key = String(yr); ts = new Date(yr, 0, 1).getTime(); name = String(yr);
      }

      if (!res[key]) {
        res[key] = { name, ts };
        DASHBOARD_STATUS_ORDER.forEach((k) => {
          const legend = DASHBOARD_STATUS_INFO[k]?.legend ?? `S${k}`;
          res[key][legend] = 0;
        });
      }
      if (!(sLabel in res[key])) res[key][sLabel] = 0;
      res[key][sLabel] = (res[key][sLabel] as number) + 1;
    });
    return Object.values(res).sort((a, b) => (a.ts as number) - (b.ts as number));
  }, [chartViewData, statusTrendGranularity]);

  return (
    <>
      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <DashboardKpiBox title="Total Requests"    value={kpis.count}        unit="Items" icon={<AppIcon icon={TaskAlt} size="md" />}    color="from-blue-600 to-cyan-500" />
        <DashboardKpiBox title="Request Volume"    value={kpis.requestVol}   unit="m³"    icon={<AppIcon icon={Layers} size="md" />}       color="from-indigo-600 to-violet-500" />
        <DashboardKpiBox title="DWG. Volume"       value={kpis.dwgVol}       unit="m³"    icon={<AppIcon icon={Timeline} size="md" />}     color="from-slate-600 to-slate-400" />
        <DashboardKpiBox title="Confirm Volume"    value={kpis.confirmVol}   unit="m³"    icon={<AppIcon icon={Engineering} size="md" />}      color="from-emerald-600 to-teal-500" />
        <DashboardKpiBox
          title="Loss Concrete"
          value={kpis.lossConcVol}
          unit={`m³ (${kpis.lossConcPercent}%)`}
          icon={<AppIcon icon={Warning} size="md" />}
          color={parseFloat(kpis.lossConcVol) > 0 ? 'from-rose-600 to-pink-500' : 'from-slate-600 to-slate-400'}
          isAlert={parseFloat(kpis.lossConcVol) > 0}
        />
      </div>

      {/* ── TREND CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <div className="border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] rounded-2xl p-6 shadow-lg backdrop-blur-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <h3 className="text-sm font-bold text-[color:var(--pour-ink-0)] flex items-center gap-2">
              <AppIcon icon={Timeline} size="sm" className="text-emerald-400" /> Completed Volume Trend
            </h3>
            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
              {([{ key: 'day', label: 'Day' }, { key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }, { key: 'year', label: 'Year' }] as { key: Granularity; label: string }[]).map(({ key, label }) => (
                <button key={key} onClick={() => setTrendGranularity(key)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all ${trendGranularity === key ? 'bg-emerald-500 text-[color:var(--pour-ink-0)] shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTimelineVol} margin={{ top: 28, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gradPlanVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#94A3B8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke={cGrid} />
                <XAxis dataKey="name" stroke={cAxis} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={cAxis} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={(props) => (<LossConcreteChartTooltip active={props.active} payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]} label={props.label} valueFormat="volume" />)} cursor={{ stroke: cCursor, strokeWidth: 1, strokeDasharray: '4 4' }} wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }} />
                <Area type="monotone" dataKey="PlanVolume" name="Plan Volume" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 3" fill="url(#gradPlanVol)" dot={{ r: 3, fill: '#94A3B8', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#94A3B8', strokeWidth: 0 }}>
                  <LabelList dataKey="PlanVolume" position="top" style={{ fill: cAxis, fontSize: 10, fontWeight: 600, pointerEvents: 'none' }} formatter={(v) => typeof v === 'number' && v > 0 ? v.toFixed(2) : ''} />
                </Area>
                <Area type="monotone" dataKey="Volume" name="Completed Volume" stroke="#10B981" strokeWidth={3} fill="url(#gradVol)" dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#10B981', strokeWidth: 0 }}>
                  <LabelList dataKey="Volume" position="top" style={{ fill: '#10B981', fontSize: 10, fontWeight: 600, pointerEvents: 'none' }} formatter={(v) => typeof v === 'number' && v > 0 ? v.toFixed(2) : ''} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] rounded-2xl p-6 shadow-lg backdrop-blur-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-[color:var(--pour-ink-0)] flex items-center gap-2">
              <AppIcon icon={TrendingUp} size="sm" className="text-indigo-400" /> Requests Trend by Status
            </h3>
            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
              {([{ key: 'day', label: 'Day' }, { key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }, { key: 'year', label: 'Year' }] as { key: Granularity; label: string }[]).map(({ key, label }) => (
                <button key={key} onClick={() => setStatusTrendGranularity(key)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all ${statusTrendGranularity === key ? 'bg-indigo-500 text-[color:var(--pour-ink-0)] shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
            {DASHBOARD_STATUS_ORDER.map((key) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DASHBOARD_STATUS_INFO[key].color }} />
                <span className="text-[10px] text-slate-400">{DASHBOARD_STATUS_INFO[key].legend}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTimelineStatus} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cGrid} />
                <XAxis dataKey="name" stroke={cAxis} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={cAxis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={(props) => (<LossConcreteChartTooltip active={props.active} payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]} label={props.label} />)} cursor={{ stroke: cCursor, strokeWidth: 1, strokeDasharray: '4 4' }} wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }} />
                {DASHBOARD_STATUS_ORDER.map((key) => (
                  <Line key={key} type="monotone" dataKey={DASHBOARD_STATUS_INFO[key].legend}
                    stroke={DASHBOARD_STATUS_INFO[key].color} strokeWidth={2}
                    dot={{ r: 3, fill: DASHBOARD_STATUS_INFO[key].color, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── FILTER CHARTS — สูงสุด 2 คอลัมน์บนจอใหญ่ เพื่อไม่บีบกราฟ ── */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">

        {/* 1. Status */}
        <DashboardChartBox
          title="Requests by Status (Items)"
          isActive={!!filters.status}
          onClear={() => toggleFilter('status', filters.status!)}
          height={dashboardBarChartHeight(chartStatusData.length)}
          isEmpty={chartStatusData.length === 0}
        >
          <BarChart
            data={chartStatusData}
            layout="vertical"
            margin={dashboardBarChartMargin(statusYWidth)}
            barCategoryGap="22%"
            barSize={22}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={cGrid} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="legend"
              type="category"
              stroke={cAxis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={statusYWidth}
              tickFormatter={(v) => truncateAxisLabel(String(v), 24)}
            />
            <Tooltip
              content={(props) => (
                <LossConcreteChartTooltip
                  active={props.active}
                  payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]}
                  label={props.label}
                />
              )}
              cursor={{ fill: 'rgba(99,102,241,0.08)' }}
              wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              onClick={(entry: { name?: string }) => {
                if (entry?.name) toggleFilter('status', entry.name);
              }}
              style={{ cursor: 'pointer' }}
            >
              {chartStatusData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={filters.status ? (filters.status === entry.name ? entry.color : cDim) : entry.color}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                content={(props) => {
                  const p = props as DashboardBarLabelProps
                  return (
                    <DashboardBarValueLabel
                      x={p.x}
                      y={p.y}
                      width={p.width}
                      height={p.height}
                      value={p.value}
                      total={statusBarTotal}
                      formatValue={(v) => String(Math.round(v))}
                      labelFill={cLabel}
                      pctFill={cAxis}
                    />
                  )
                }}
              />
            </Bar>
          </BarChart>
        </DashboardChartBox>

        {/* 2. Strength */}
        <DashboardChartBox
          title="Volume by Strength (m³)"
          isActive={!!filters.strength}
          onClear={() => toggleFilter('strength', filters.strength!)}
          height={dashboardBarChartHeight(chartStrengthData.length)}
          isEmpty={chartStrengthData.length === 0}
        >
          <BarChart
            data={chartStrengthData}
            layout="vertical"
            margin={dashboardBarChartMargin(strengthYWidth)}
            barCategoryGap="22%"
            barSize={22}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={cGrid} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              stroke={cAxis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={strengthYWidth}
              tickFormatter={(v) => truncateAxisLabel(String(v), 24)}
            />
            <Tooltip
              content={(props) => (
                <LossConcreteChartTooltip
                  active={props.active}
                  payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]}
                  label={props.label}
                  valueFormat="volume"
                />
              )}
              cursor={{ fill: 'rgba(99,102,241,0.08)' }}
              wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              onClick={(entry: { name?: string }) => {
                if (entry?.name) toggleFilter('strength', entry.name);
              }}
              style={{ cursor: 'pointer' }}
            >
              {chartStrengthData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={filters.strength ? (filters.strength === entry.name ? '#F59E0B' : cDim) : '#D97706'}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                content={(props) => {
                  const p = props as DashboardBarLabelProps
                  return (
                    <DashboardBarValueLabel
                      x={p.x}
                      y={p.y}
                      width={p.width}
                      height={p.height}
                      value={p.value}
                      total={strengthBarTotal}
                      formatValue={(v) => v.toFixed(2)}
                      labelFill={cLabel}
                      pctFill={cAxis}
                    />
                  )
                }}
              />
            </Bar>
          </BarChart>
        </DashboardChartBox>

        {/* 3. Structure — กว้างเต็มแถว */}
        {(() => {
          const visibleStructureData = chartStructureData.filter((d) => !hiddenStructures.has(d.name));
          const structureBarTotal = visibleStructureData.reduce((s, d) => s + d['DWG Vol'], 0);
          const allNames = chartStructureData.map((d) => d.name);
          const allSelected = hiddenStructures.size === 0;
          const selectedCount = allNames.length - hiddenStructures.size;
          const structureFilter = (
            <div className="relative" ref={structureDropdownRef}>
              <button
                type="button"
                onClick={() => setStructureDropdownOpen((o) => !o)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all',
                  !allSelected
                    ? 'border-[color:var(--pour-accent)]/40 bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
                    : 'border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] text-pour-muted hover:text-[color:var(--pour-ink-0)]',
                )}
              >
                <AppIcon icon={FilterList} size="xs" sx={{ fontSize: 11 }} />
                {allSelected ? 'All' : `${selectedCount} / ${allNames.length}`}
              </button>
              {structureDropdownOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] shadow-lg">
                  <label className="flex cursor-pointer select-none items-center gap-2.5 border-b border-[color:var(--pour-surface-border)] px-3 py-2 hover:bg-[color:var(--pour-nav-hover-bg)]">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => setHiddenStructures(allSelected ? new Set(allNames) : new Set())}
                      className="h-3.5 w-3.5 accent-[color:var(--pour-accent)]"
                    />
                    <span className="text-[11px] font-bold text-[color:var(--pour-ink-1)]">Select all</span>
                  </label>
                  <div className="max-h-52 overflow-y-auto">
                    {allNames.map((name) => {
                      const checked = !hiddenStructures.has(name);
                      return (
                        <label
                          key={name}
                          className="flex cursor-pointer select-none items-center gap-2.5 px-3 py-1.5 hover:bg-[color:var(--pour-nav-hover-bg)]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setHiddenStructures((prev) => {
                                const next = new Set(prev);
                                if (next.has(name)) next.delete(name);
                                else next.add(name);
                                return next;
                              })
                            }
                            className="h-3.5 w-3.5 shrink-0 accent-[color:var(--pour-accent)]"
                          />
                          <span className="text-[11px] leading-tight text-[color:var(--pour-ink-1)]">{name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
          return (
            <DashboardChartBox
              className="lg:col-span-2"
              title="Volume by Structure (m³)"
              isActive={!!filters.structure}
              onClear={() => toggleFilter('structure', filters.structure!)}
              headerActions={structureFilter}
              height={dashboardBarChartHeight(visibleStructureData.length, 180, 44)}
              isEmpty={visibleStructureData.length === 0}
            >
              <BarChart
                data={visibleStructureData}
                layout="vertical"
                margin={dashboardBarChartMargin(structureYWidth)}
                barCategoryGap="20%"
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={cGrid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={cAxis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={structureYWidth}
                  tickFormatter={(v) => truncateAxisLabel(String(v), 28)}
                />
                <Tooltip
                  content={(props) => (
                    <LossConcreteChartTooltip
                      active={props.active}
                      payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]}
                      label={props.label}
                      valueFormat="volume"
                    />
                  )}
                  cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
                />
                <Bar
                  dataKey="DWG Vol"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                  onClick={(entry: { name?: string }) => {
                    if (entry?.name) toggleFilter('structure', entry.name);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {visibleStructureData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        filters.structure
                          ? filters.structure === entry.name
                            ? '#0EA5E9'
                            : cDim
                          : '#4F46E5'
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="DWG Vol"
                    position="right"
                    content={(props) => {
                      const p = props as DashboardBarLabelProps
                      return (
                        <DashboardBarValueLabel
                          x={p.x}
                          y={p.y}
                          width={p.width}
                          height={p.height}
                          value={p.value}
                          total={structureBarTotal}
                          formatValue={(v) => v.toFixed(2)}
                          labelFill={cLabel}
                          pctFill={cAxis}
                        />
                      )
                    }}
                  />
                </Bar>
              </BarChart>
            </DashboardChartBox>
          );
        })()}

        {/* 4. Staff */}
        <DashboardChartBox
          title="Volume by Staff (m³)"
          isActive={!!filters.staff}
          onClear={() => toggleFilter('staff', filters.staff!)}
          height={dashboardBarChartHeight(chartStaffData.length)}
          isEmpty={chartStaffData.length === 0}
        >
          <BarChart
            data={chartStaffData}
            layout="vertical"
            margin={dashboardBarChartMargin(staffYWidth)}
            barCategoryGap="22%"
            barSize={22}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={cGrid} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              stroke={cAxis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={staffYWidth}
              tickFormatter={(v) => truncateAxisLabel(String(v), 24)}
            />
            <Tooltip
              content={(props) => (
                <LossConcreteChartTooltip
                  active={props.active}
                  payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]}
                  label={props.label}
                  valueFormat="volume"
                />
              )}
              cursor={{ fill: 'rgba(99,102,241,0.08)' }}
              wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
            />
            <Bar
              dataKey="DWG Vol"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              onClick={(entry: { name?: string }) => {
                if (entry?.name) toggleFilter('staff', entry.name);
              }}
              style={{ cursor: 'pointer' }}
            >
              {chartStaffData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={filters.staff ? (filters.staff === entry.name ? '#F59E0B' : cDim) : '#8B5CF6'}
                />
              ))}
              <LabelList
                dataKey="DWG Vol"
                position="right"
                content={(props) => {
                  const p = props as DashboardBarLabelProps
                  return (
                    <DashboardBarValueLabel
                      x={p.x}
                      y={p.y}
                      width={p.width}
                      height={p.height}
                      value={p.value}
                      total={staffBarTotal}
                      formatValue={(v) => v.toFixed(2)}
                      labelFill={cLabel}
                      pctFill={cAxis}
                    />
                  )
                }}
              />
            </Bar>
          </BarChart>
        </DashboardChartBox>

        {/* 5. Supplier Pie */}
        <DashboardChartBox
          title="Supplier Volume (m³)"
          isActive={!!filters.supplier}
          onClear={() => toggleFilter('supplier', filters.supplier!)}
          height={300}
          isEmpty={chartSupplierData.length === 0}
        >
          <PieChart margin={{ top: 4, right: 8, left: 8, bottom: 8 }}>
            <Pie
              data={chartSupplierData}
              cx="50%"
              cy="44%"
              innerRadius="38%"
              outerRadius="58%"
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
              label={false}
              onClick={(entry: { name?: string }) => { if (entry?.name) toggleFilter('supplier', entry.name); }}
              style={{ cursor: 'pointer' }}
            >
              {chartSupplierData.map((entry, i) => {
                const base = SUPPLIER_COLORS[i % SUPPLIER_COLORS.length];
                return (
                  <Cell
                    key={entry.name}
                    fill={filters.supplier ? (filters.supplier === entry.name ? base : cDim) : base}
                    stroke={filters.supplier === entry.name ? '#fff' : cPieStroke}
                    strokeWidth={filters.supplier === entry.name ? 2 : 1}
                  />
                );
              })}
            </Pie>
            <Tooltip
              content={(props) => (
                <LossConcreteChartTooltip
                  active={props.active}
                  payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]}
                  label={props.label}
                  valueFormat="volume"
                />
              )}
              wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 10, lineHeight: '15px', paddingTop: 8 }}
              formatter={(value, entry) => {
                const payload = entry?.payload as { value?: number } | undefined
                const v =
                  payload?.value ??
                  chartSupplierData.find((d) => d.name === value)?.value ??
                  0
                const pct = supplierTotal > 0 ? ((v / supplierTotal) * 100).toFixed(1) : '0.0'
                return `${truncateAxisLabel(String(value), 16)} · ${v.toFixed(2)} m³ (${pct}%)`
              }}
            />
          </PieChart>
        </DashboardChartBox>

      </div>

      {/* ── Detailed records table ── */}
      <section
        className={cn(
          glass.surface,
          'overflow-hidden rounded-[14px] shadow-[var(--glass-shadow-sm)]',
        )}
        aria-label="Detailed records"
      >
        <div
          className={cn(
            rq.cardHeader,
            'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          <h2 className={cn(rq.cardTitle, 'flex items-center gap-2 text-base pour-desktop:text-lg')}>
            <AppIcon icon={Layers} size="md" className="text-[color:var(--pour-accent)]" />
            Detailed Records
          </h2>
          <p
            className={cn(
              type.caption,
              'inline-flex items-center gap-1.5 rounded-full border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] px-3 py-1.5 tabular-nums',
            )}
          >
            Total
            <strong className="font-semibold text-[color:var(--pour-ink-0)]">{tableData.length}</strong>
            items
          </p>
        </div>

        <div className={app.tableWrap}>
          <table className={dashTable.table}>
            <thead className={dashTable.head}>
              <tr>
                <th>Date</th>
                <th>Request By</th>
                <th>Concrete Works</th>
                <th>Structure</th>
                <th>Location</th>
                <th>Strength</th>
                <th className="text-right">DWG Vol.</th>
                <th className="text-right">Confirm Vol.</th>
                <th className="text-right">Loss (m³)</th>
                <th className="text-right">Loss (%DWG)</th>
                <th>Supplier</th>
                <th className="text-center">Detail</th>
              </tr>
            </thead>
            <tbody className={dashTable.body}>
              {Object.keys(groupedData).length === 0 ? (
                <tr>
                  <td colSpan={12} className={tableCompact.emptyCell}>
                    No matching records found
                  </td>
                </tr>
              ) : (
                DASHBOARD_STATUS_ORDER.filter((k) => groupedData[k]).map((statusKey) => {
                  const items = groupedData[statusKey];
                  const isExpanded = expandedGroups[statusKey];
                  const statusColor = DASHBOARD_STATUS_INFO[statusKey]?.color || 'var(--pour-line)';

                  return (
                    <Fragment key={`group-${statusKey}`}>
                      <tr
                        onClick={() => toggleGroup(statusKey)}
                        className="cursor-pointer bg-[color:var(--pour-surface-tint)] transition-colors hover:bg-[color:var(--pour-nav-hover-bg)]"
                      >
                        <td colSpan={12} className="!py-3">
                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                            <AppIcon
                              icon={ChevronRight}
                              size="sm"
                              className={cn(
                                'text-pour-muted transition-transform duration-200',
                                isExpanded && 'rotate-90',
                              )}
                            />
                            {isExpanded ? (
                              <AppIcon icon={FolderOpen} size="sm" sx={{ fontSize: 18 }} className="text-[color:var(--pour-accent)]" />
                            ) : (
                              <AppIcon icon={Folder} size="sm" sx={{ fontSize: 18 }} className="text-pour-muted" />
                            )}
                            <StatusBadge statusId={Number(statusKey)} compact />
                            <span className="rounded-full border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg-muted)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[color:var(--pour-ink-1)]">
                              {items.length} {items.length === 1 ? 'Item' : 'Items'}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {isExpanded
                        ? items.map((row) => (
                            <tr
                              key={row.ID}
                              onClick={() => setSelectedRow(row)}
                              className="group cursor-pointer transition-colors hover:bg-[color:var(--pour-nav-hover-bg)]/60"
                              style={{ boxShadow: `inset 3px 0 0 0 ${statusColor}` }}
                            >
                              <td className="whitespace-nowrap font-medium text-[color:var(--pour-ink-0)]">
                                {row['Casting date']}
                              </td>
                              <td>
                                <span
                                  className={cn(
                                    filters.staff === row['Request by'] &&
                                      'font-semibold text-[color:var(--pour-accent)]',
                                  )}
                                >
                                  {row['Request by']}
                                </span>
                              </td>
                              <td>{row['Concrete Works']}</td>
                              <td>
                                <span
                                  className={cn(
                                    filters.structure === row.Structure &&
                                      'font-semibold text-emerald-600 dark:text-emerald-400',
                                  )}
                                >
                                  {row.Structure}
                                </span>
                              </td>
                              <td className="max-w-[14rem]">{row.Location}</td>
                              <td className="font-medium">{row.Strength}</td>
                              <td className="text-right font-mono tabular-nums text-pour-muted">
                                {parseFloat(String(row['DWG. Volume'])).toFixed(2)}
                              </td>
                              <td className="text-right font-mono font-semibold tabular-nums text-[color:var(--pour-ink-0)]">
                                {row['Current Status'] === DASHBOARD_COMPLETE_STATUS ? (
                                  parseFloat(String(row['Confirm Volume'])).toFixed(2)
                                ) : (
                                  <span className="text-pour-subtle">—</span>
                                )}
                              </td>
                              <td className="text-right font-mono font-semibold tabular-nums">
                                {row['Current Status'] === DASHBOARD_COMPLETE_STATUS &&
                                row['Loss Concrete'] !== null ? (
                                  <span
                                    className={cn(
                                      parseFloat(String(row['Loss Concrete'])) < 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-[color:var(--pour-ink-0)]',
                                    )}
                                  >
                                    {parseFloat(String(row['Loss Concrete'])).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-pour-subtle">—</span>
                                )}
                              </td>
                              <td className="text-right font-mono font-semibold tabular-nums">
                                {row['Current Status'] === DASHBOARD_COMPLETE_STATUS &&
                                row['Loss Concrete'] !== null ? (
                                  (() => {
                                    const lossNum = parseFloat(String(row['Loss Concrete']));
                                    const dwgNum = parseFloat(String(row['DWG. Volume']));
                                    const pct = dwgNum > 0 ? (lossNum / dwgNum * 100).toFixed(2) : '—';
                                    return (
                                      <span
                                        className={cn(
                                          lossNum < 0
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-[color:var(--pour-ink-0)]',
                                        )}
                                      >
                                        {pct}%
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="text-pour-subtle">—</span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={cn(
                                    filters.supplier === row.Supplier &&
                                      'font-semibold text-[color:var(--pour-accent)]',
                                  )}
                                >
                                  {row.Supplier}
                                </span>
                              </td>
                              <td className="text-center text-pour-muted transition-colors group-hover:text-[color:var(--pour-accent)]">
                                <AppIcon icon={Visibility} size="sm" className="inline" />
                                <span className="sr-only">View details</span>
                              </td>
                            </tr>
                          ))
                        : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={!!selectedRow}
        onOpenChange={(open) => {
          if (!open) setSelectedRow(null);
        }}
      >
        <DialogContent className={cn(modal.lg, modal.shell, 'border-[color:var(--glass-border-subtle)]')}>
          {selectedRow ? (
            <>
              <DialogHeader className={modal.header}>
                <DialogTitle className={cn(modal.title, 'flex flex-wrap items-center gap-2')}>
                  <AppIcon icon={TaskAlt} size="md" className="text-[color:var(--pour-accent)]" />
                  Request Details
                  <span className="rounded-md bg-[color:var(--pour-accent-muted)] px-2 py-0.5 font-mono text-sm font-semibold text-[color:var(--pour-accent)]">
                    {selectedRow.ID}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className={modal.body}>
                <div
                  className={cn(
                    frame.insetPanel,
                    'mb-5 flex items-center justify-between gap-3 px-4 py-3',
                  )}
                >
                  <span className={type.bodyStrong}>Current Status</span>
                  <StatusBadge statusId={Number(selectedRow['Current Status'])} />
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                  {[
                    { key: 'Casting date', label: 'Date' },
                    { key: 'Request by', label: 'Request by' },
                    { key: 'Concrete Works', label: 'Concrete Works' },
                    { key: 'Structure', label: 'Structure' },
                    { key: 'Location', label: 'Location' },
                    { key: 'Structure No. or Grid Line', label: 'Structure No. / Grid Line' },
                    { key: 'Strength', label: 'Strength' },
                    { key: 'DWG. Volume', label: 'DWG Volume (m³)' },
                    { key: 'Confirm Volume', label: 'Confirm Volume (m³)' },
                    { key: 'Loss Concrete', label: 'Loss Concrete (m³)' },
                    { key: 'Supplier', label: 'Supplier' },
                    { key: 'Mix code', label: 'Mix Code' },
                    { key: 'Slump', label: 'Slump' },
                  ].map(({ key, label }) => {
                    const rowFields = selectedRow as DashboardConcreteRecord & Record<string, unknown>;
                    const isComplete = selectedRow['Current Status'] === DASHBOARD_COMPLETE_STATUS;

                    if ((key === 'Confirm Volume' || key === 'Loss Concrete') && !isComplete) {
                      return (
                        <div
                          key={key}
                          className="border-b border-[color:var(--glass-border-subtle)] pb-3"
                        >
                          <p className={cn(rq.label, 'mb-1')}>{label}</p>
                          <p className="text-sm text-pour-muted">— (Not completed)</p>
                        </div>
                      );
                    }

                    if (key === 'Loss Concrete' && isComplete) {
                      const lossNum = parseFloat(String(rowFields[key]));
                      const isNeg = lossNum < 0;
                      const badge = isNeg ? ' (Surplus)' : lossNum > 0 ? ' (Over)' : ' (Exact)';
                      return (
                        <div
                          key={key}
                          className="border-b border-[color:var(--glass-border-subtle)] pb-3"
                        >
                          <p className={cn(rq.label, 'mb-1')}>{label}</p>
                          <p
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              isNeg ? 'text-rose-600 dark:text-rose-400' : 'text-[color:var(--pour-ink-0)]',
                            )}
                          >
                            {String(rowFields[key])} m³
                            <span className="text-xs font-normal text-pour-muted">{badge}</span>
                          </p>
                        </div>
                      );
                    }

                    const val = rowFields[key] ?? '—';
                    return (
                      <div
                        key={key}
                        className="border-b border-[color:var(--glass-border-subtle)] pb-3"
                      >
                        <p className={cn(rq.label, 'mb-1')}>{label}</p>
                        <p className={cn(rq.value, 'text-sm')}>{String(val) || '—'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className={modal.footer}>
                <Button type="button" variant="outline" onClick={() => setSelectedRow(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
