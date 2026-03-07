import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Mail, Calendar, Check, CheckCircle, Search, RefreshCw, User, ShieldCheck, Activity, Users, LayoutGrid } from 'lucide-react';
import api from '../../utils/api';
import moment from 'moment';

// --- Reusable Modern Components ---
const StatCard = ({ label, value, color, icon: Icon }) => {
    const themes = {
        blue: 'from-blue-500 to-primary-600 text-blue-600 bg-blue-50',
        emerald: 'from-emerald-500 to-teal-600 text-emerald-600 bg-emerald-50',
        amber: 'from-amber-500 to-orange-600 text-amber-600 bg-amber-50',
        slate: 'from-slate-500 to-slate-700 text-slate-600 bg-slate-50',
    };
    const theme = themes[color] || themes.blue;

    return (
        <div className="card p-6 flex items-center gap-5 hover:border-primary-100 transition-all group">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.split(' ')[0]} flex items-center justify-center shrink-0 shadow-lg shadow-current/10 group-hover:rotate-3 transition-transform`}>
                <Icon size={22} className="text-white" />
            </div>
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
            </div>
        </div>
    );
};

const AttendanceCard = ({ row }) => {
    const hasIn = !!row.PresentTimeIn;
    const hasOut = !!row.PresentTimeOut;

    // Status Logic
    const status = hasIn && hasOut ? 'completed' : hasIn ? 'in-progress' : 'pending';
    const statusConfig = {
        'completed': { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        'in-progress': { label: 'Ongoing', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'pending': { label: 'Waiting', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
    }[status];

    const initials = row.EmployeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';

    return (
        <div className="card hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group overflow-hidden border-slate-100">
            {/* Status Top Bar */}
            <div className={`h-1 w-full ${status === 'completed' ? 'bg-emerald-500' : status === 'in-progress' ? 'bg-amber-500' : 'bg-slate-200'}`} />

            <div className="p-6 space-y-6">
                {/* Header: User Profile */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary-600 font-black text-base shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-black text-slate-900 text-[15px] truncate tracking-tight">{row.EmployeeName || '—'}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-lg bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest">{row.EMPCode}</span>
                                {row.Designatation && <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{row.Designatation}</span>}
                            </div>
                        </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                        {statusConfig.label}
                    </div>
                </div>

                {/* Locations: From -> To */}
                <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                            <MapPin size={12} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Origin</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{row.VisitFrom || 'Branch Site'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        <div className="w-px h-3 bg-slate-200 ml-3 shrink-0" />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 shrink-0 shadow-sm">
                            <MapPin size={12} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Destination</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{row.VisitTo || 'Field Assignment'}</p>
                        </div>
                    </div>
                </div>

                {/* Chronology: Checked In / Checked Out */}
                <div className="flex items-center justify-between gap-4 py-2">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marked In</p>
                        <div className="flex items-center gap-2">
                            <Clock size={14} className={hasIn ? 'text-emerald-500' : 'text-slate-300'} />
                            <span className={`text-sm font-black ${hasIn ? 'text-slate-900' : 'text-slate-300'}`}>{row.PresentTimeIn || '--:--'}</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-slate-100 shrink-0" />

                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marked Out</p>
                        <div className="flex items-center gap-2 justify-end">
                            <span className={`text-sm font-black ${hasOut ? 'text-rose-500' : 'text-slate-300'}`}>{row.PresentTimeOut || '--:--'}</span>
                            <Clock size={14} className={hasOut ? 'text-rose-500' : 'text-slate-300'} />
                        </div>
                    </div>
                </div>

                {/* Footer: Contextual info */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${row.isPlanned ? 'text-primary-600 bg-primary-50 border border-primary-100' : 'text-slate-500 bg-slate-50 border border-slate-100'}`}>
                        {row.isPlanned ? <><ShieldCheck size={12} strokeWidth={2.5} /> Authorized</> : <><Activity size={12} /> Ad-hoc</>}
                    </div>

                    {row.Email && (
                        <a href={`mailto:${row.Email}`} className="p-2 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                            <Mail size={14} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

const Attendance = () => {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(9);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [trigger, setTrigger] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/attendence/get-attendence', {
                params: { searchKey: search, pageIndex: page, pageSize: perPage },
            });
            setData(res.data.data.rows || []);
            if (page === 0) setTotal(res.data.data.count || 0);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [trigger, search, page, perPage]);

    const completed = data.filter(r => r.PresentTimeIn && r.PresentTimeOut).length;
    const inProgress = data.filter(r => r.PresentTimeIn && !r.PresentTimeOut).length;
    const pending = data.filter(r => !r.PresentTimeIn).length;

    const stats = [
        { label: 'Cloud Ledger', value: total, color: 'blue', icon: LayoutGrid },
        { label: 'Daliy Completed', value: completed, color: 'emerald', icon: CheckCircle },
        { label: 'Active Personnel', value: inProgress, color: 'amber', icon: Activity },
        { label: 'Pending Sync', value: pending, color: 'slate', icon: Clock },
    ];

    return (
        <div className="space-y-10 animate-fade-in pb-20 max-w-[1400px] mx-auto">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-100">
                            <Users className="text-white" size={20} />
                        </div>
                        Personnel Attendance
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Real-time status of all field executives and branch staff</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setTrigger(p => !p)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:border-primary-100 hover:text-primary-600 transition-all active:scale-95 shadow-sm">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh Matrix
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                <div className="relative group w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                    <input
                        type="search"
                        placeholder="Scan registry by name or code..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-300 transition-all"
                    />
                </div>

                <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <span className="hidden sm:inline">Active Synchronizers:</span>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] text-slate-500`}>{i}</div>)}
                    </div>
                </div>
            </div>

            {/* Grid Display */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-[6px] border-slate-50" />
                        <div className="absolute inset-0 w-16 h-16 rounded-full border-[6px] border-primary-600 border-t-transparent animate-spin" />
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                        <Clock size={40} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Zero Presence Detected</h4>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">Either no personnel have logged in yet, or your search parameters returned no results.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data.map((row, i) => <AttendanceCard key={i} row={row} />)}
                    </div>

                    {/* Pagination (Simplified visually) */}
                    <div className="flex items-center justify-center py-10">
                        <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm gap-2">
                            {[...Array(Math.ceil(total / perPage)).keys()].slice(0, 5).map(idx => (
                                <button
                                    key={idx}
                                    onClick={() => setPage(idx)}
                                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${page === idx ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
