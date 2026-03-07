import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import {
    Search, Filter, Eye, Check, AlertCircle, Clock,
    Calendar, MapPin, CreditCard, IndianRupee, FileText,
    CheckCircle, XCircle, PauseCircle, RefreshCw,
    FileSpreadsheet, Printer, Users, ChevronRight, Paperclip,
    LayoutDashboard, BarChart3, Download, ExternalLink, FileDown, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/ui/Modal';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { useTableStyles } from '../utils/tableStyles';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getMonthDates = () => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const fmt = d => d.toISOString().split('T')[0];
    return { startDate: fmt(new Date(y, m, 1)), endDate: fmt(new Date(y, m + 1, 0)) };
};

const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    const p = n => n.toString().padStart(2, '0');
    return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
};

const shortId = (id) => {
    if (!id) return '—';
    let h = 0;
    for (let i = 0; i < id.length; i++) { h = (h << 5) - h + id.charCodeAt(i); h |= 0; }
    return `FRZ-${Math.abs(h).toString(36).toUpperCase().slice(0, 6)}`;
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const FinanceBadge = ({ row }) => {
    // Finance verification is usually per document, but for the row we can show an overall status
    // Logic: If all docs are finance-approved -> Verified, else Pending / Hold
    const totalDocs = row?.totalDocs || 0;
    const releasedDocs = row?.releasedDocsByFinance || 0; // Assuming API returns this
    const holdDocs = row?.holdDocsByFinance || 0;

    if (totalDocs > 0 && releasedDocs === totalDocs)
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 border-emerald-200 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Verified</span>;
    if (holdDocs > 0)
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-rose-50 border-rose-200 text-rose-700"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />On Hold</span>;

    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-blue-50 border-blue-200 text-blue-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Pending Audit</span>;
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────
const DetailDrawer = ({ expense, images, loading, onClose, onDocAction, currentId }) => {
    if (!expense) return null;
    const API_BASE = import.meta.env.VITE_APP_API_URL || 'https://wsn3.workgateway.in';
    const IMG_BASE = `${API_BASE}/application_img/`;
    const validImgs = images.filter(img => img?.imageName && img.imageName !== 'temp');

    return (
        <div className="w-full max-w-lg flex flex-col bg-white shadow-2xl border-l border-gray-100 h-full"
            style={{ animation: 'sbIn .25s cubic-bezier(.16,1,.3,1)' }}>
            <style>{`@keyframes sbIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

            <div className="shrink-0">
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="font-extrabold text-white text-base leading-tight">Finance Audit</p>
                            <p className="text-emerald-100/70 text-xs mt-0.5">{expense.FirstName} {expense.LastName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <XCircle size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100"
                    style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                    <div className="w-11 h-11 rounded-2xl text-white font-extrabold text-base flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)' }}>
                        {(expense.FirstName?.[0] || '') + (expense.LastName?.[0] || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-gray-900 text-sm truncate">{expense.FirstName} {expense.LastName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{expense.EMPCode}</span>
                            <FinanceBadge row={expense} />
                        </div>
                    </div>
                    <div className="flex gap-4 shrink-0 text-right">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">Claimed</p>
                            <p className="font-black text-gray-800 text-sm mt-0.5">₹{Number(expense.amount ?? 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-tight">Pending</p>
                            <p className="font-black text-amber-600 text-sm mt-0.5">₹{(Number(expense.TotalAmount || expense.amount || 0) - Number(expense.PaidAmount || expense.TotalPaidByHr || 0)).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-tight">Paid</p>
                            <p className="font-black text-emerald-600 text-base mt-0.5">₹{Number(expense.PaidAmount || expense.TotalPaidByHr || 0).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 rounded-full border-[3px] border-emerald-200 border-t-emerald-600 animate-spin" />
                    <p className="text-sm font-semibold text-gray-400">Auditing claims...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Visit Date', value: fmtDate(expense.VisitDate || expense.createdAt), icon: Calendar, c: 'text-blue-500' },
                            { label: 'Mode', value: expense.ExpModeDesc, icon: CreditCard, c: 'text-purple-500' },
                            { label: 'From', value: expense.VisitFrom, icon: MapPin, c: 'text-emerald-500' },
                            { label: 'To', value: expense.VisitTo, icon: MapPin, c: 'text-rose-500' },
                            { label: 'Purpose', value: expense.VisitPurpose, icon: FileText, c: 'text-amber-500' },
                            { label: 'Created', value: fmtDate(expense.createdAt), icon: Clock, c: 'text-gray-400' },
                        ].map(({ label, value, icon: I, c }) => (
                            <div key={label} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <I size={10} className={c} />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
                                </div>
                                <p className="text-xs font-semibold text-gray-800 truncate">{value || '—'}</p>
                            </div>
                        ))}
                    </div>

                    {validImgs.length > 0 && (
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Audit Documents ({validImgs.length})</p>
                            <div className="space-y-2">
                                {validImgs.map((img, i) => {
                                    const imgUrl = `${IMG_BASE}${img.imageName}`;
                                    const s = img?.verificationStatusByFinance || 'Pending';
                                    const sColor = s === 'Approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                                        s === 'Hold' ? 'text-rose-600 bg-rose-50 border-rose-200' :
                                            'text-amber-600 bg-amber-50 border-amber-200';

                                    return (
                                        <div key={i} className="border border-gray-200 rounded-2xl p-3 bg-gray-50 hover:bg-white transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                                    <Paperclip size={20} className="text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-700 underline">View</a>
                                                        <span className="text-[10px] text-gray-400 italic">{img.imageName.slice(0, 15)}...</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[11px] font-bold text-emerald-800 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded">₹{img?.Amount || '—'}</span>
                                                        <span className={`text-[11px] font-bold border px-2 py-0.5 rounded ${sColor}`}>{s}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {img?.hold_reason_by_finance && (
                                                <div className="mt-2 p-2 bg-rose-50 border-l-4 border-rose-400 rounded-r-lg">
                                                    <p className="text-[9px] font-black text-rose-500 uppercase">Rejection Reason</p>
                                                    <p className="text-xs font-semibold text-rose-700">{img.hold_reason_by_finance}</p>
                                                </div>
                                            )}
                                            {/* Finance Actions */}
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => onDocAction(img.ExpenseDocId, true, '')}
                                                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg border transition-all ${s === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                                                    Approve
                                                </button>
                                                <button onClick={() => onDocAction(img.ExpenseDocId, false, prompt('Reason for Hold/Rejection:') || 'Audit Review')}
                                                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg border transition-all ${s === 'Hold' ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}>
                                                    Hold
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="px-4 py-3 border-t border-gray-100 shrink-0">
                <button onClick={onClose}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                    Close Audit View
                </button>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ExpenseFinance = () => {
    const { user } = useAuth();
    const tableStyles = useTableStyles();

    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState(getMonthDates());
    const [tick, setTick] = useState(false);

    // Sidebar drawer
    const [drawer, setDrawer] = useState(false);
    const [selected, setSelected] = useState(null);
    const [imgs, setImgs] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Finance usually audits HR-released claims
            const res = await api.get('/v1/admin/expense/get-expense-for-hr', {
                params: {
                    hrFilter: 'released', // Finance audits only released ones
                    searchKey: search,
                    startDate: dateFilter.startDate,
                    endDate: dateFilter.endDate,
                    pageSize: 1000,
                }
            });
            const rows = res.data?.data?.rows || [];
            setData(rows);
            setTotal(rows.length);
        } catch (err) { }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [tick, search, dateFilter]);

    const openDetail = async (row) => {
        setSelected(row); setImgs([]); setDrawer(true); setDetailLoading(true);
        try {
            const r = await api.get('/v1/admin/expense/get-expense-by-id', { params: { ExpenseReqId: row.ExpenseReqId } });
            setImgs(r.data?.data?.docsResult || []);
        } catch { }
        setDetailLoading(false);
    };

    const doFinanceAction = async (docId, isApprove, reason) => {
        try {
            await api.post('/v1/admin/expense/approve-disapprove-claim-by-finance', {
                ExpenseReqId: selected.ExpenseReqId,
                ExpenseDocId: docId,
                isHold: !isApprove,
                holdReason: reason,
            });
            toast.success(isApprove ? 'Approved ✓' : 'Hold applied ✓');
            // Refresh
            const r = await api.get('/v1/admin/expense/get-expense-by-id', { params: { ExpenseReqId: selected.ExpenseReqId } });
            setImgs(r.data?.data?.docsResult || []);
            setTick(p => !p);
        } catch { toast.error('Action failed'); }
    };

    const columns = [
        { name: '#', width: '50px', cell: (_, i) => i + 1 },
        { name: 'ID', cell: r => <span className="font-mono text-xs font-bold text-gray-500">{shortId(r.ExpenseReqId)}</span>, width: '100px' },
        {
            name: 'Employee', minWidth: '180px',
            cell: r => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-gray-800 text-sm">{r.FirstName} {r.LastName}</span>
                    <span className="text-[11px] text-gray-400">{r.EMPCode}</span>
                </div>
            )
        },
        { name: 'Route', cell: r => <div className="text-xs truncate">{r.VisitFrom} → {r.VisitTo}</div>, minWidth: '150px' },
        { name: 'Amount', cell: r => <span className="font-black text-emerald-700">₹{Number(r.amount).toLocaleString()}</span>, width: '110px' },
        { name: 'Audit', cell: r => <FinanceBadge row={r} />, width: '130px' },
        {
            name: 'Action', width: '90px', center: true,
            cell: r => <button onClick={() => openDetail(r)} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-lg hover:bg-emerald-100 transition-colors">Audit</button>
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Finance Audit Portal</h1>
                    <p className="text-gray-500 text-sm italic">Verification & final approval for HR-released claims</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setTick(p => !p)} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <RefreshCw size={18} className={loading ? 'animate-spin text-emerald-600' : 'text-gray-400'} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto min-h-[500px]">
                <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={data}
                    pagination
                    highlightOnHover
                    responsive
                    customStyles={tableStyles}
                    progressPending={loading}
                />
            </div>

            {/* Side Drawer */}
            <div className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${drawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
                <div className={`absolute inset-y-0 right-0 w-full max-w-lg transition-transform duration-300 transform ${drawer ? 'translate-x-0' : 'translate-x-full'}`}>
                    <DetailDrawer expense={selected} images={imgs} loading={detailLoading} onClose={() => setDrawer(false)} onDocAction={doFinanceAction} />
                </div>
            </div>
        </div>
    );
};

export default ExpenseFinance;
