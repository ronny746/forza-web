import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import {
    CheckCircle, XCircle, Paperclip,
    LayoutDashboard, BarChart3, Download, ExternalLink, FileDown,
    RefreshCw, Calendar, ChevronRight, Eye, Receipt, Check, X,
    ToggleLeft, ToggleRight, FileText, CreditCard, MapPin, User,
    Clock, AlertCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';
import { useTableStyles } from '../../utils/tableStyles';
import { useAuth } from '../../context/AuthContext';
import { TableSearch, TablePagination, TableEmpty, PageLoader } from '../../components/ui/TableComponents';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(dt.getUTCDate())}-${pad(dt.getUTCMonth() + 1)}-${dt.getUTCFullYear()} ${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`;
};
const shortId = (id) => {
    if (!id) return '—';
    let h = 0;
    for (let i = 0; i < id.length; i++) { h = (h << 5) - h + id.charCodeAt(i); h |= 0; }
    return `FORZA-${Math.abs(h).toString(36).toUpperCase()}`;
};
const getCurrentMonthDates = () => {
    const now = new Date();
    const IST = 5.5 * 3600000;
    const f = new Date(now.getFullYear(), now.getMonth(), 1);
    const l = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    f.setTime(f.getTime() + IST); l.setTime(l.getTime() + IST);
    return { startDate: f.toISOString().split('T')[0], endDate: l.toISOString().split('T')[0] };
};
const normalize = s => String(s || '').replace(/\s+/g, '').toLowerCase();

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    if (!status) return <span className="badge badge-neutral">—</span>;
    const s = status.toLowerCase();
    if (s === 'approved') return <span className="badge badge-success">✓ Approved</span>;
    if (s === 'rejected') return <span className="badge badge-danger">✗ Rejected</span>;
    return <span className="badge badge-warning">⏳ Pending</span>;
};

// ─── Image verified badge ─────────────────────────────────────────────────────
const ImgVerifiedBadge = ({ val }) => {
    const v = normalize(val);
    if (v === 'approved' || v === '1' || v === 'true')
        return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded">Approved</span>;
    if (v === 'rejected' || v === '0' || v === 'false')
        return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 rounded">Rejected</span>;
    return <span className="text-[10px] text-gray-400">{val || 'Pending'}</span>;
};

// ─── Right-side Drawer ────────────────────────────────────────────────────────
// ─── Mode-specific cards (Same as HR to keep consistent) ─────────────────────
const ConveyanceCard = ({ expense }) => {
    const convMap = { '1': 'Car', '2': 'Bike', '3': 'Public Transport', '4': 'Air' };
    const convIcon = { '1': '🚗', '2': '🏍️', '3': '🚌', '4': '✈️' };
    const modeId = String(expense?.ConvModeId || '');
    const rate = Number(expense?.Rate || 0);
    const totalKm = Number(expense?.TotalKm || 0);
    let modeName = convMap[modeId] || 'Transport';
    if (modeId === '1') { modeName = rate === 10 ? 'Car (Self)' : rate === 6 ? 'Car (Company)' : 'Car'; }
    const isCarOrBike = modeId === '1' || modeId === '2';
    const calcAmt = totalKm * rate;
    return (
        <div className="rounded-2xl border border-emerald-200 p-4 mb-3" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{convIcon[modeId] || '🚌'}</span>
                <p className="font-extrabold text-emerald-800 text-sm">Conveyance Details</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                    ['Mode', modeName], ['Rate/KM', isCarOrBike && rate > 0 ? `₹${rate}/km` : '—'],
                    ['From (KM)', isCarOrBike && expense?.DistanceFrom ? `${expense.DistanceFrom} km` : '—'],
                    ['To (KM)', isCarOrBike && expense?.DistanceTo ? `${expense.DistanceTo} km` : '—'],
                    ['Total KM', isCarOrBike && totalKm > 0 ? `${totalKm} km` : '—'],
                    ['Amount', `₹${Number(expense?.amount || 0).toLocaleString('en-IN')}`],
                ].map(([l, v]) => (
                    <div key={l} className="bg-white/70 rounded-xl p-2 border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">{l}</p>
                        <p className="font-semibold text-emerald-900">{v}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HotelCard = ({ expense }) => {
    const typeMap = { metro: 'Metro City Hotel 🏙️', no_metro: 'Non-Metro Hotel 🏨', self_stay: 'Self Stay 🏠' };
    const key = expense?.Reason?.trim()?.toLowerCase();
    return (
        <div className="rounded-2xl border border-amber-200 p-4 mb-3" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)' }}>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🛏️</span>
                <p className="font-extrabold text-amber-800 text-sm">Hotel Details</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/70 rounded-xl p-2 border border-amber-100 col-span-2">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Hotel Type</p>
                    <p className="font-semibold text-amber-900">{typeMap[key] || expense?.Reason || '—'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-2 border border-amber-100 col-span-2">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Submitted Amount</p>
                    <p className="font-black text-amber-900 text-base">₹{Number(expense?.amount || 0).toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>
    );
};

const FoodCard = ({ expense }) => (
    <div className="rounded-2xl border border-rose-200 p-4 mb-3" style={{ background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)' }}>
        <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🍽️</span>
            <p className="font-extrabold text-rose-800 text-sm">Food Details</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/70 rounded-xl p-2 border border-rose-100">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-0.5">Visit Type</p>
                <p className="font-semibold text-rose-900">🍴 {expense?.Reason || '—'}</p>
            </div>
            <div className="bg-white/70 rounded-xl p-2 border border-rose-100">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-0.5">Amount</p>
                <p className="font-black text-rose-900 text-base">₹{Number(expense?.amount || 0).toLocaleString('en-IN')}</p>
            </div>
        </div>
    </div>
);

// \u2500\u2500\u2500 Right-side Drawer (Portaled \u0026 UI Sync) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// ─── Approval Timeline ────────────────────────────────────────────────────────
const Timeline = ({ expense }) => {
    const mgrStatus = expense?.ExpenseStatus || 'InProgress';
    const hrVal = expense?.ExpenseStatusChangeByHr;
    const hrLabel = hrVal === 1 ? 'Released' : hrVal === 0 ? 'On Hold' : 'Pending Verification';

    const step = (label, status, color, note) => (
        <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-black ${color}`}>
                {status === 'Approved' || status === 'Released' ? '✓' : status === 'Rejected' || status === 'Hold' || status === 'On Hold' ? '✕' : '…'}
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className={`text-[11px] font-bold ${status === 'Approved' || status === 'Released' ? 'text-emerald-600' :
                    status === 'Rejected' || status === 'Hold' || status === 'On Hold' ? 'text-red-500' :
                        'text-amber-500'
                    }`}>{note || status}</p>
            </div>
        </div>
    );

    return (
        <div className="rounded-2xl border border-gray-100 p-4 mb-3 bg-gray-50/50">
            <div className="flex flex-col gap-4 relative pl-1">
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200" />
                {step('Manager Approval', mgrStatus,
                    mgrStatus === 'Approved' ? 'bg-emerald-500' : mgrStatus === 'Rejected' ? 'bg-red-500' : 'bg-amber-400')}
                {step('HR Verification', hrLabel,
                    hrVal === 1 ? 'bg-emerald-500' : hrVal === 0 ? 'bg-amber-500' : 'bg-gray-300')}
            </div>
        </div>
    );
};


// ─── Right-side Drawer (Portaled & UI Sync) ───────────────────────────────────
const Drawer = ({ open, onClose, selected, images, setImages, loading, onApprove, onReject, currentId }) => {
    const API_BASE = import.meta.env.VITE_APP_API_URL || 'https://wsn3.workgateway.in';
    const IMG_BASE = `${API_BASE}/application_img/`;

    const approveImage = async (img, idx) => {
        try {
            await api.post('/v1/admin/expense/approve-disapprove-claim', {
                ExpenseReqId: selected.ExpenseReqId,
                ExpenseDocId: img.ExpDocId || img.id,
                isApprove: 1
            });
            setImages(prev => prev.map((im, i) => i === idx ? { ...im, isVerified: 'Approved' } : im));
            toast.success('Image approved');
        } catch { toast.error('Failed to approve image'); }
    };

    const rejectImage = async (img, idx) => {
        try {
            await api.post('/v1/admin/expense/approve-disapprove-claim', {
                ExpenseReqId: selected.ExpenseReqId,
                ExpenseDocId: img.ExpDocId || img.id,
                isApprove: 2,
                rejectReason: 'Rejected by manager'
            });
            setImages(prev => prev.map((im, i) => i === idx ? { ...im, isVerified: 'Rejected' } : im));
            toast.success('Image rejected');
        } catch { toast.error('Failed to reject image'); }
    };

    const validImages = (images || []).filter(img => img?.imageName && img.imageName !== 'temp');

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-stretch">
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="w-full max-w-lg flex flex-col bg-white shadow-2xl h-full"
            >
                {/* ── Sticky Header ── */}
                <div className="shrink-0">
                    <div className="flex items-center justify-between px-5 py-4"
                        style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <FileText size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="font-extrabold text-white text-base leading-tight">Expense Details</p>
                                {selected && <p className="text-primary-300 text-xs mt-0.5">{selected.FirstName} {selected.LastName}</p>}
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                            <XCircle size={17} />
                        </button>
                    </div>

                    {selected && (
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100"
                            style={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)' }}>
                            <div className="w-11 h-11 rounded-2xl text-white font-extrabold text-base flex items-center justify-center shrink-0"
                                style={{ background: 'linear-gradient(135deg,#6457f5,#4f3de8)' }}>
                                {(selected.FirstName?.[0] || '') + (selected.LastName?.[0] || '')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-gray-900 text-sm truncate">{selected.FirstName} {selected.LastName}</p>
                                <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap overflow-hidden">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700">{selected.EMPCode}</span>
                                    <StatusBadge status={selected.ExpenseStatus} />
                                </div>
                            </div>
                            <div className="flex gap-4 shrink-0 text-right">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">Total<br />Amount</p>
                                    <p className="font-black text-gray-800 text-sm mt-0.5">₹{Number(selected.TotalAmount || selected.amount || 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-tight">Pending<br />Amount</p>
                                    <p className="font-black text-amber-600 text-sm mt-0.5">₹{(Number(selected.PendingAmount || (Number(selected.TotalAmount || selected.amount || 0) - Number(selected.PaidAmount || selected.TotalPaidByHr || 0)))).toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-tight">Total<br />Paid</p>
                                    <p className="font-black text-emerald-600 text-base mt-0.5">₹{Number(selected.PaidAmount || selected.TotalPaidByHr || 0).toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Body ── */}
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                        <div className="w-10 h-10 rounded-full border-[3px] border-primary-200 border-t-primary-600 animate-spin" />
                        <p className="text-sm font-semibold text-gray-400">Loading expense details...</p>
                    </div>
                ) : selected ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white scrollbar-thin">
                        {/* Detail grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Visit Date', value: fmtDate(selected.VisitDate || selected.createdAt), icon: Calendar, c: 'text-blue-500' },
                                { label: 'Expense Mode', value: selected.ExpModeDesc, icon: CreditCard, c: 'text-purple-500' },
                                { label: 'From', value: selected.VisitFrom, icon: MapPin, c: 'text-sky-500' },
                                { label: 'To', value: selected.VisitTo, icon: MapPin, c: 'text-rose-500' },
                                { label: 'Purpose', value: selected.VisitPurpose, icon: User, c: 'text-amber-500' },
                                { label: 'Created', value: fmtDate(selected.createdAt), icon: Clock, c: 'text-gray-400' },
                            ].map(({ label, value, icon: I, c }) => (
                                <div key={label} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <I size={10} className={c} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 truncate">{value || '—'}</p>
                                </div>
                            ))}
                        </div>

                        {/* Mode Cards */}
                        {selected.ExpModeDesc === 'Conveyance' && <ConveyanceCard expense={selected} />}
                        {selected.ExpModeDesc === 'Hotel' && <HotelCard expense={selected} />}
                        {selected.ExpModeDesc === 'Food' && <FoodCard expense={selected} />}

                        {/* Remarks */}
                        {selected.VisitRemarks?.trim() && (
                            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> Remarks
                                </p>
                                <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap">{selected.VisitRemarks}</p>
                            </div>
                        )}

                        {/* Approval timeline */}
                        <Timeline expense={selected} />

                        {/* Attachments */}
                        {validImages.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                    <Paperclip size={12} /> Attachments ({validImages.length})
                                </p>
                                <div className="space-y-3">
                                    {validImages.map((img, idx) => {
                                        const isApproved = normalize(img.isVerified) === 'approved' || img.isVerified === '1';
                                        const isRejected = normalize(img.isVerified) === 'rejected' || img.isVerified === '0';
                                        const imgUrl = `${IMG_BASE}${img.imageName}`;
                                        return (
                                            <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
                                                <div className="flex items-center gap-3 p-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                                                        <FileText size={18} className="text-primary-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-600 underline">View</a>
                                                            <a href={imgUrl} download={img.imageName} className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded italic">Download</a>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 rounded opacity-80">₹{img.Amount || 0}</span>
                                                            <ImgVerifiedBadge val={img.isVerified} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {!validImages.length && (
                            <div className="text-center py-10 opacity-30">
                                <FileText size={40} className="mx-auto mb-2" />
                                <p className="text-sm font-bold uppercase tracking-widest">No attachments</p>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* ── Footer ── */}
                {selected && !loading && (
                    <div className="px-5 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50 flex gap-3">
                        {selected.ExpenseStatus?.toLowerCase() === 'inprogress' && String(selected.EMPCode) !== String(currentId) ? (
                            <>
                                <button onClick={onReject} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-2">
                                    <XCircle size={15} /> Reject Claim
                                </button>
                                <button onClick={() => { onApprove(); onClose(); }}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5"
                                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                    <CheckCircle size={15} /> Approve Claim
                                </button>
                            </>
                        ) : (
                            <button onClick={onClose} className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                                {String(selected.EMPCode) === String(currentId) ? 'Close (My Expense)' : 'Close Details'}
                            </button>
                        )}
                    </div>
                )}
            </motion.aside>
        </div>,
        document.body
    );
};


const ExpenseManagement = () => {
    const tableStyles = useTableStyles();
    const { user } = useAuth();

    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [trigger, setTrigger] = useState(false);
    const [filterDates, setFilterDates] = useState(getCurrentMonthDates());
    const [filterModal, setFilterModal] = useState(false);
    const [filterDraft, setFilterDraft] = useState(getCurrentMonthDates());

    // Filters (same as old Table.js)
    const [statusFilter, setStatusFilter] = useState('All');
    const [holdReleaseFilter, setHoldReleaseFilter] = useState('All');
    const [selfToggle, setSelfToggle] = useState(false);

    // Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [expenseImages, setExpenseImages] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // Action modal (reject reason)
    const [actionModal, setActionModal] = useState(false);
    const [reason, setReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Bulk
    const [selectedRows, setSelectedRows] = useState([]);
    const [toggleCleared, setToggleCleared] = useState(false);
    const [bulkApproving, setBulkApproving] = useState(false);

    // Current user EMPCode for self-toggle
    const currentEMPCode = user?.appUserId ||
        localStorage.getItem('EMPCode') || localStorage.getItem('empCode') || '';

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/expense/get-expense', {
                params: {
                    searchKey: search, pageIndex: page, pageSize: perPage,
                    startDate: filterDates.startDate, endDate: filterDates.endDate,
                    EMPCode: 'all',
                    filter: statusFilter // Server-side filtering (All, InProgress, Approved, Rejected)
                },
            });
            setData(res.data.data.rows || []);
            if (page === 0) setTotal(res.data.data.count || 0);
        } catch { /* silent */ }
        setLoading(false);
    }, [trigger, search, page, perPage, filterDates, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (drawerOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [drawerOpen]);

    // Open drawer and load images
    const openDrawer = async (row) => {
        setSelected(row);
        setExpenseImages([]);
        setDrawerOpen(true);
        setDetailLoading(true);
        try {
            const res = await api.get('/v1/admin/expense/get-expense-by-id', {
                params: { ExpenseReqId: row.ExpenseReqId }
            });
            setExpenseImages(res.data?.data?.docsResult || []);
        } catch { /* silent */ }
        setDetailLoading(false);
    };

    // Approve entire expense
    const doApprove = async () => {
        if (!selected) return;
        try {
            await api.post('/v1/admin/expense/approve-disapprove-claim', {
                ExpenseReqId: selected.ExpenseReqId, isApprove: 1, rejectReason: ''
            });
            toast.success('Expense approved');
            // Update in local state immediately
            setData(prev => prev.map(r =>
                r.ExpenseReqId === selected.ExpenseReqId ? { ...r, ExpenseStatus: 'Approved' } : r
            ));
            setSelected(prev => prev ? { ...prev, ExpenseStatus: 'Approved' } : prev);
            setTrigger(p => !p);
        } catch { toast.error('Approve failed'); }
    };

    // Reject entire expense
    const doReject = async () => {
        if (!selected || !reason.trim()) return;
        setActionLoading(true);
        try {
            await api.post('/v1/admin/expense/approve-disapprove-claim', {
                ExpenseReqId: selected.ExpenseReqId, isApprove: 2, rejectReason: reason
            });
            toast.success('Expense rejected');
            setData(prev => prev.map(r =>
                r.ExpenseReqId === selected.ExpenseReqId ? { ...r, ExpenseStatus: 'Rejected' } : r
            ));
            setSelected(prev => prev ? { ...prev, ExpenseStatus: 'Rejected' } : prev);
            setActionModal(false); setReason('');
            setTrigger(p => !p);
        } catch { toast.error('Reject failed'); }
        setActionLoading(false);
    };

    // Bulk approve
    const handleBulkApprove = async () => {
        if (!selectedRows.length) { toast.warn('Select expenses first'); return; }
        setBulkApproving(true);
        try {
            const ids = selectedRows.map(r => r.ExpenseReqId);
            await api.post('/v1/admin/expense/bulk-approve-disapprove-claim', { expenseReqIds: ids, isApprove: true });
            toast.success(`${ids.length} expense(s) approved`);
            setData(prev => prev.map(r => ids.includes(r.ExpenseReqId) ? { ...r, ExpenseStatus: 'Approved' } : r));
            setSelectedRows([]); setToggleCleared(p => !p);
        } catch { toast.error('Bulk approve failed'); }
        setBulkApproving(false);
    };

    // ── Filters (mirrors old Table.js displayedCategory) ─────────────────────
    const displayedData = useMemo(() => {
        let d = data;
        if (selfToggle && currentEMPCode) {
            d = d.filter(r => r.EMPCode === currentEMPCode);
        }
        if (statusFilter !== 'All') {
            const want = normalize(statusFilter);
            d = d.filter(r => {
                const s = normalize(r.ExpenseStatus);
                if (want === 'inprogress') {
                    // Critical fix: Pending means NOT approved and NOT rejected
                    return s !== 'approved' && s !== 'rejected';
                }
                return s === want;
            });
        }
        if (holdReleaseFilter !== 'All') {
            d = d.filter(r => {
                const hrStatus = r.ExpenseStatusChangeByHr === 1 ? 'Released' : 'On Hold';
                return normalize(hrStatus) === normalize(holdReleaseFilter);
            });
        }
        return d;
    }, [data, statusFilter, holdReleaseFilter, selfToggle, currentEMPCode]);

    const statusCounts = useMemo(() => {
        const c = { approved: 0, inprogress: 0, rejected: 0 };
        data.forEach(r => {
            const s = normalize(r.ExpenseStatus);
            if (s === 'approved') c.approved++;
            else if (s === 'rejected') c.rejected++;
            else c.inprogress++; // Everything else is pending/inprogress
        });
        return c;
    }, [data]);

    const exportXlsx = () => {
        const ws = XLSX.utils.json_to_sheet(displayedData.map(r => {
            const total = r.TotalAmount || r.amount || 0;
            const paid = r.PaidAmount || r.TotalPaidByHr || r['Paid Amount'] || 0;
            const pending = r.PendingAmount || (Number(total) - Number(paid)) || 0;

            return {
                'ID': shortId(r.ExpenseReqId),
                'Employee': `${r.FirstName} ${r.LastName}`,
                'EMP Code': r.EMPCode,
                'From': r.VisitFrom,
                'To': r.VisitTo,
                'Mode': r.ExpModeDesc,
                'Total Amount (₹)': Number(total),
                'Paid Amount (₹)': Number(paid),
                'Pending Amount (₹)': Number(pending),
                'Status': r.ExpenseStatus,
                'Date': fmtDate(r.createdAt),
            };
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
        XLSX.writeFile(wb, 'expense_management.xlsx');
    };

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns = [
        {
            name: '#', width: '52px', center: true,
            cell: (_, i) => <span className="text-xs font-bold text-gray-400">{page * perPage + i + 1}</span>,
        },
        {
            name: 'Employee', minWidth: '200px', selector: r => r.FirstName, sortable: true,
            cell: r => (
                <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {r.FirstName?.[0] || '?'}{r.LastName?.[0] || ''}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{r.FirstName} {r.LastName}</p>
                        <p className="text-xs text-gray-400 font-mono">{r.EMPCode}</p>
                    </div>
                </div>
            ),
        },
        {
            name: 'Route', minWidth: '210px',
            cell: r => (
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="px-2 py-1 bg-sky-50 text-sky-700 font-semibold rounded-md max-w-[88px] truncate">{r.VisitFrom || '—'}</span>
                    <ChevronRight size={11} className="text-gray-300 shrink-0" />
                    <span className="px-2 py-1 bg-violet-50 text-violet-700 font-semibold rounded-md max-w-[88px] truncate">{r.VisitTo || '—'}</span>
                </div>
            ),
        },
        {
            name: 'Mode', minWidth: '120px',
            cell: r => r.ExpModeDesc
                ? <span className="badge badge-primary">{r.ExpModeDesc}</span>
                : <span className="text-gray-300 text-xs">—</span>,
        },
        {
            name: 'Amount', minWidth: '110px', right: true,
            cell: r => <span className="font-bold text-emerald-600 text-sm tabular-nums">₹{Number(r.amount ?? 0).toLocaleString('en-IN')}</span>,
        },
        {
            name: 'Status', minWidth: '120px', center: true,
            cell: r => <StatusBadge status={r.ExpenseStatus} />,
        },
        {
            name: 'Date', minWidth: '145px',
            cell: r => <span className="text-xs text-gray-400 tabular-nums">{fmtDate(r.createdAt)}</span>,
        },
        {
            name: '', center: true, width: '80px',
            cell: r => (
                <button
                    onClick={() => openDrawer(r)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold
                               text-primary-600 bg-primary-50 hover:bg-primary-100
                               rounded-lg transition-colors border border-primary-100/50"
                >
                    <Eye size={12} /> View
                </button>
            ),
        },
    ];

    // ── Filter chip config ────────────────────────────────────────────────────
    const statusChips = [
        { label: `All (${total})`, value: 'All', active: 'bg-primary-600 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
        { label: `⏳ Pending (${statusCounts.inprogress})`, value: 'InProgress', active: 'bg-amber-500 text-white', inactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
        { label: `✓ Approved (${statusCounts.approved})`, value: 'Approved', active: 'bg-emerald-500 text-white', inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
        { label: `✗ Rejected (${statusCounts.rejected})`, value: 'Rejected', active: 'bg-red-500 text-white', inactive: 'bg-red-50 text-red-700 hover:bg-red-100' },
    ];

    return (
        <div className="space-y-5 animate-slide-up">
            {/* Page header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title text-2xl font-black">Expense Management</h1>
                    <p className="page-subtitle">Unified dashboard for expense verification and reporting</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                <div className="flex gap-2 mr-auto">
                    <button onClick={exportXlsx} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 hover:bg-emerald-100">
                        <Download size={13} /> Export Excel
                    </button>
                    <button onClick={() => setTrigger(p => !p)} className="p-2 rounded-xl bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setFilterModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 text-primary-700 text-xs font-bold border border-primary-100 hover:bg-primary-100">
                        <Calendar size={13} /> {filterDates.startDate} → {filterDates.endDate}
                    </button>
                </div>
            </div>

            {/* ── Filter bar (mirrors old Table.js) ── */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                {/* Status chips */}
                {statusChips.map(c => (
                    <button key={c.value} onClick={() => { setStatusFilter(c.value); setHoldReleaseFilter('All'); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === c.value ? c.active : c.inactive}`}>
                        {c.label}
                    </button>
                ))}

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* HR Hold / Release */}
                <button onClick={() => setHoldReleaseFilter(holdReleaseFilter === 'On Hold' ? 'All' : 'On Hold')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${holdReleaseFilter === 'On Hold' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
                    🔒 HR Hold
                </button>
                <button onClick={() => setHoldReleaseFilter(holdReleaseFilter === 'Released' ? 'All' : 'Released')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${holdReleaseFilter === 'Released' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>
                    🔓 HR Release
                </button>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* My Expenses toggle */}
                <button
                    onClick={() => setSelfToggle(p => !p)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                                ${selfToggle ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                >
                    {selfToggle ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    My Expenses
                </button>

            </div>

            {selectedRows.length > 0 && statusFilter === 'InProgress' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-sm font-bold text-emerald-800">{selectedRows.length} expense(s) selected</span>
                    <button onClick={handleBulkApprove} disabled={bulkApproving} className="btn-success text-sm py-2">
                        {bulkApproving
                            ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            : <Check size={14} />
                        }
                        Bulk Approve ({selectedRows.length})
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="card-glass overflow-hidden">
                <div className="table-search-bar">
                    <TableSearch value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search name, emp code…" />
                    <span className="badge badge-neutral shrink-0"><Receipt size={11} /> {total} total</span>
                </div>
                <DataTable
                    columns={columns} data={displayedData} noHeader responsive highlightOnHover
                    progressPending={loading}
                    customStyles={{
                        ...tableStyles,
                        rows: {
                            ...tableStyles.rows,
                            style: {
                                ...tableStyles.rows.style,
                                '& [type="checkbox"]:disabled': {
                                    display: 'none',
                                },
                            },
                        },
                    }}
                    selectableRows
                    selectableRowDisabled={r => String(r.EMPCode) === String(currentEMPCode)}
                    onSelectedRowsChange={({ selectedRows: sr }) => setSelectedRows(sr)}
                    clearSelectedRows={toggleCleared}
                    progressComponent={<PageLoader />}
                    noDataComponent={<TableEmpty icon={Receipt} title="No expenses found" subtitle="Adjust filters or date range." />}
                />
                <TablePagination total={total} current={page} perPage={perPage} onPageChange={setPage} onPerPageChange={p => { setPerPage(p); setPage(0); }} />
            </div>

            {/* Expense drawer */}
            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                selected={selected}
                images={expenseImages}
                setImages={setExpenseImages}
                loading={detailLoading}
                onApprove={doApprove}
                onReject={() => setActionModal(true)}
                currentId={currentEMPCode}
            />

            {/* Reject reason modal */}
            <Modal isOpen={actionModal} onClose={() => { setActionModal(false); setReason(''); }} title="Reject Expense" size="sm">
                <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">Provide a reason for rejection.</div>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} className="input-field resize-none" placeholder="Rejection reason…" />
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <button onClick={() => { setActionModal(false); setReason(''); }} className="btn-secondary">Cancel</button>
                        <button onClick={doReject} disabled={!reason.trim() || actionLoading} className="btn-danger">
                            {actionLoading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <X size={14} />}
                            Reject
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Date filter modal */}
            <Modal isOpen={filterModal} onClose={() => setFilterModal(false)} title="Filter by Date Range" size="sm">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="input-label">Start Date</label><input type="date" value={filterDraft.startDate} onChange={e => setFilterDraft(p => ({ ...p, startDate: e.target.value }))} className="input-field" /></div>
                        <div><label className="input-label">End Date</label><input type="date" value={filterDraft.endDate} onChange={e => setFilterDraft(p => ({ ...p, endDate: e.target.value }))} className="input-field" /></div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <button onClick={() => { const d = getCurrentMonthDates(); setFilterDraft(d); setFilterDates(d); setFilterModal(false); }} className="btn-secondary">Reset</button>
                        <button onClick={() => { setFilterDates(filterDraft); setPage(0); setFilterModal(false); }} className="btn-primary">Apply</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ExpenseManagement;
