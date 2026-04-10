/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactPaginate from 'react-paginate';
import DataTable from 'react-data-table-component';
import {
    Search, Filter, Eye, Check, AlertCircle, Clock,
    Calendar, MapPin, CreditCard, IndianRupee, FileText,
    CheckCircle, XCircle, PauseCircle, RefreshCw,
    FileSpreadsheet, Printer, Users, ChevronRight, Paperclip,
    LayoutDashboard, BarChart3, Download, ExternalLink, FileDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { useTableStyles } from '../../utils/tableStyles';
import { getExpenseDetails } from '../../utils/expense_helpers';
import Loader from '../../components/ui/Loader';
import { TableSearch, TablePagination, TableEmpty, PageLoader } from '../../components/ui/TableComponents';

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

// ─── HR Status filter — CLIENT-SIDE using ExpenseStatusChangeByHr ─────────────
// API /get-expense-for-hr returns ALL rows.
//   ExpenseStatusChangeByHr: null/undefined → Pending
//   ExpenseStatusChangeByHr: 0              → Hold
//   ExpenseStatusChangeByHr: 1              → Released
const HR_FILTERS = [
    { value: 'pending', label: 'Pending' },
    { value: 'hold', label: 'On Hold' },


];

const applyHrFilter = (rows, hr) => {
    if (hr === 'all') return rows;

    return rows.filter(r => {
        const hrVal = r.ExpenseStatusChangeByHr;
        const hrStr = (r.HrStatus || '').toLowerCase();
        const mgrStr = (r.expense_status || r.ExpenseStatus || '').toLowerCase();

        const isReleased = hrVal === 1 || hrStr === 'released' || hrStr === 'approved';
        const isHold = hrVal === 0 || hrStr === 'hold' || hrStr === 'on hold';

        if (hr === 'released') return isReleased;
        if (hr === 'hold') return isHold;
        if (hr === 'pending') {
            // Pending if:
            // 1. Explicitly says "pending" in HrStatus
            // 2. OR is not released/hold AND manager has approved
            // 3. OR is not released/hold AND it's just "waiting" (null/undefined)
            const isPendingStr = hrStr === 'pending' || hrStr === '';
            const isNotActed = (hrVal === null || hrVal === undefined);

            return (isPendingStr || isNotActed) && !isReleased && !isHold;
        }
        return true;
    });
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const HrBadge = ({ row }) => {
    const hrVal = row?.ExpenseStatusChangeByHr;
    const hrStr = (row?.HrStatus || '').toLowerCase();

    const isReleased = hrVal === 1 || hrStr === 'released' || hrStr === 'approved';
    const isHold = hrVal === 0 || hrStr === 'hold' || hrStr === 'on hold';

    if (isReleased)
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 border-emerald-200 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Released</span>;
    if (isHold)
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-amber-50 border-amber-200 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />On Hold</span>;

    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-blue-50 border-blue-200 text-blue-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Pending</span>;
};

// ─── Print helper ─────────────────────────────────────────────────────────────
const printTable = (data, title) => {
    const statusLabel = r => r.ExpenseStatusChangeByHr === 1 ? 'Released' : r.ExpenseStatusChangeByHr === 0 ? 'On Hold' : 'Pending';
    const rows = data.map((r, i) => `
        <tr>
            <td>${i + 1}</td><td>${shortId(r.ExpenseReqId)}</td>
            <td>${(r.FirstName || '')} ${(r.LastName || '')}</td><td>${r.EMPCode || '—'}</td>
            <td>${r.VisitFrom || '—'}</td><td>${r.VisitTo || '—'}</td>
            <td>${r.ExpModeDesc || '—'}</td>
            <td style="max-width: 150px; font-size: 9px; color: #475569;">${getExpenseDetails(r)}</td>
            <td>₹ ${Number(r.amount ?? 0).toLocaleString('en-IN')}</td>
            <td>${fmtDate(r.createdAt)}</td><td>${statusLabel(r)}</td>
        </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>${title}</title>
        <style>body{font-family:sans-serif;font-size:11px}h2{font-size:16px}p{color:#64748b;font-size:10px}
        table{width:100%;border-collapse:collapse}th{background:#f1f5f9;padding:8px;text-align:left;font-size:10px;text-transform:uppercase;border-bottom:2px solid #e2e8f0}
        td{padding:8px;border-bottom:1px solid #f1f5f9}tr:nth-child(even) td{background:#f8fafc}</style>
        </head><body><h2>${title}</h2><p>Generated: ${new Date().toLocaleString('en-IN')}</p>
        <table><thead><tr><th>#</th><th>ID</th><th>Employee</th><th>EMP Code</th><th>From</th><th>To</th><th>Mode</th><th>Details</th><th>Amount</th><th>Date</th><th>HR Status</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <script>window.onload=()=>{window.print();window.close()}</script></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
};

// ─── Excel export via the proper export API ────────────────────────────────────
const exportExcelFull = async (dateFilter, empFilter, searchFilter = '', setExportLoading) => {
    setExportLoading(true);
    try {
        const res = await api.get('/v1/admin/expense/get-export-expense-hr', {
            params: { startDate: dateFilter.startDate, endDate: dateFilter.endDate, empCode: empFilter === 'all' ? '' : empFilter, searchKey: searchFilter }
        });
        let rows = [];
        if (Array.isArray(res.data?.data)) rows = res.data.data;
        else if (Array.isArray(res.data?.data?.rows)) rows = res.data.data.rows;
        else if (Array.isArray(res.data)) rows = res.data;

        if (!rows.length) { toast.warning('No records to export'); setExportLoading(false); return; }

        const ws = XLSX.utils.json_to_sheet(rows.map((r, i) => ({
            '#': i + 1,
            'Expense Date': r.ExpenseDate || r.Date || '—',
            'Emp Code': r.EmployeeId || r.EMPCode || '—',
            'Employee Name': r.EmployeeName || `${r.FirstName || ''} ${r.LastName || ''}`.trim(),
            'Expense Type': r.ExpenseType || r.ExpModeDesc || '—',
            'Details': getExpenseDetails(r),
            'Amount': Number(r.TotalAmount || r.amount || 0),
            'From': r.VisitFrom || '—',
            'To': r.VisitTo || '—',
            'Purpose': r.Purpose || r.VisitPurpose || '—',
            'Status': r.HrStatus || 'Pending'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
        XLSX.writeFile(wb, `HR_Expense_${dateFilter.startDate}.xlsx`);
        toast.success('Excel exported ✓');
    } catch { toast.error('Export failed'); }
    setExportLoading(false);
};

// ─── Conveyance Details Card ──────────────────────────────────────────────────
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
            {isCarOrBike && rate > 0 && totalKm > 0 && (
                <div className="mt-3 bg-emerald-100 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 font-semibold text-center">
                    {totalKm} km × ₹{rate} = <span className="font-black text-emerald-900 text-sm">₹{calcAmt.toLocaleString('en-IN')}</span>
                </div>
            )}
        </div>
    );
};

// ─── Hotel Details Card ───────────────────────────────────────────────────────
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
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">ℹ️ Attachment with receipt required</p>
        </div>
    );
};

// ─── Food Details Card ────────────────────────────────────────────────────────
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
        <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 mt-2">ℹ️ No Limit</p>
    </div>
);

// ─── Approval Timeline ────────────────────────────────────────────────────────
const Timeline = ({ expense }) => {
    // expense_status = manager approval ("Approved" / "Rejected" / "InProgress")
    // verificationStatusByHr = HR status ("Released" / "Hold" / null)
    // ExpenseStatusChangeByHr = 1 (released), 0 (hold), null (pending)
    const mgrStatus = expense?.expense_status || 'InProgress';
    const hrStatusByHr = expense?.verificationStatusByHr;
    const hrVal = expense?.ExpenseStatusChangeByHr;

    const hrLabel = hrVal === 1 ? 'Released' : hrVal === 0 ? 'On Hold' : (hrStatusByHr || 'Pending');

    const step = (label, status, color, note) => (
        <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-black ${color}`}>
                {status === 'Approved' || status === 'Released' ? '✓' : status === 'Rejected' || status === 'Hold' || status === 'On Hold' ? '✕' : '…'}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-700">{label}</p>
                <p className={`text-[11px] font-semibold ${status === 'Approved' || status === 'Released' ? 'text-emerald-600' :
                    status === 'Rejected' || status === 'Hold' || status === 'On Hold' ? 'text-red-500' :
                        'text-amber-500'
                    }`}>{note || status}</p>
            </div>
        </div>
    );

    return (
        <div className="rounded-2xl border border-gray-100 p-4 mb-3 bg-gray-50">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Approval Timeline</p>
            <div className="flex flex-col gap-3 relative pl-1">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />
                {step('Manager Approval', mgrStatus,
                    mgrStatus === 'Approved' ? 'bg-emerald-500' : mgrStatus === 'Rejected' ? 'bg-red-500' : 'bg-amber-400')}
                {step('HR Verification', hrLabel,
                    hrVal === 1 ? 'bg-emerald-500' : hrVal === 0 ? 'bg-amber-500' : 'bg-gray-300')}
            </div>
        </div>
    );
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────
const DetailDrawer = ({ expense, images, hrFilter, loading, onClose, onApprove, onHoldClick, onRelease, onDocAction, currentId }) => {
    if (!expense) return null;
    const isPending = hrFilter === 'pending';
    const isHold = hrFilter === 'hold';
    const isReleased = hrFilter === 'released';
    const statusVal = expense.ExpenseStatusChangeByHr;
    const canRelease = statusVal === null || statusVal === undefined || statusVal === 0;
    const canHold = statusVal === null || statusVal === undefined || statusVal === 1;

    const API_BASE = import.meta.env.VITE_APP_API_URL || 'https://wsn3.workgateway.in';
    const IMG_BASE = `${API_BASE}/public/application_img/`;
    const validImgs = images.filter(img => img?.imageName && img.imageName !== 'temp');

    return (
        <div className="w-full max-w-lg flex flex-col bg-white shadow-2xl border-l border-gray-100 h-full"
            style={{ animation: 'sbIn .25s cubic-bezier(.16,1,.3,1)' }}>
            <style>{`@keyframes sbIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
            <Loader show={loading} message="Processing Payroll" subMessage="Compiling expense claims and verification data..." />

            {/* ── Sticky Header (never scrolls away) ── */}
            <div className="shrink-0">
                {/* Dark gradient header */}
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <FileText size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="font-extrabold text-white text-base leading-tight">Expense Details</p>
                            <p className="text-primary-300 text-xs mt-0.5">{expense.FirstName} {expense.LastName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <XCircle size={16} />
                    </button>
                </div>

                {/* Employee summary card — always visible, never scrolls away */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100"
                    style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                    <div className="w-11 h-11 rounded-2xl text-white font-extrabold text-base flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)' }}>
                        {(expense.FirstName?.[0] || '') + (expense.LastName?.[0] || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-gray-900 text-sm truncate">{expense.FirstName} {expense.LastName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700">{expense.EMPCode}</span>
                            <HrBadge row={expense} />
                        </div>
                    </div>
                    <div className="flex gap-4 shrink-0 text-right">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">Total<br />Amount</p>
                            <p className="font-black text-gray-800 text-sm mt-0.5">₹{Number(expense.TotalAmount || expense.amount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-tight">Pending<br />Amount</p>
                            <p className="font-black text-amber-600 text-sm mt-0.5">₹{(Number(expense.PendingAmount || (Number(expense.TotalAmount || expense.amount || 0) - Number(expense.PaidAmount || expense.TotalPaidByHr || 0)))).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-tight">Total<br />Paid</p>
                            <p className="font-black text-emerald-600 text-base mt-0.5">₹{Number(expense.PaidAmount || expense.TotalPaidByHr || 0).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* \u2500\u2500 Scrollable body with loading state \u2500\u2500 */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 rounded-full border-[3px] border-primary-200 border-t-primary-600 animate-spin" />
                    <p className="text-sm font-semibold text-gray-400">Loading expense details...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Travel info */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Visit Date', value: fmtDate(expense.VisitDate || expense.createdAt), icon: Calendar, c: 'text-blue-500' },
                            { label: 'Expense Mode', value: expense.ExpModeDesc, icon: CreditCard, c: 'text-purple-500' },
                            { label: 'From', value: expense.VisitFrom, icon: MapPin, c: 'text-sky-500' },
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

                    {/* Mode-specific cards */}
                    {expense.ExpModeDesc === 'Conveyance' && <ConveyanceCard expense={expense} />}
                    {expense.ExpModeDesc === 'Hotel' && <HotelCard expense={expense} />}
                    {expense.ExpModeDesc === 'Food' && <FoodCard expense={expense} />}

                    {/* Remarks */}
                    {expense.VisitRemarks && (
                        <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
                            <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest mb-1">Remarks</p>
                            <p className="text-xs text-gray-700 font-medium">{expense.VisitRemarks}</p>
                        </div>
                    )}

                    {/* Approval timeline */}
                    <Timeline expense={expense} />

                    {/* Attachments */}
                    {validImgs.length > 0 && (
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Attachments ({validImgs.length})</p>
                            <div className="space-y-2">
                                {validImgs.map((img, i) => {
                                    const imgUrl = `${IMG_BASE}${img.imageName}`;
                                    const s = img?.verificationStatusByHr || img?.isVerified || 'Pending';
                                    const sColor = s === 'Released' || s === 'Approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                                        s === 'Hold' || s === 'Holded' || s === 'Rejected' ? 'text-red-600 bg-red-50 border-red-200' :
                                            'text-amber-600 bg-amber-50 border-amber-200';
                                    const canActOnDoc = img?.isVerified === 'Approved' && String(expense.EMPCode) !== String(currentId);
                                    return (
                                        <div key={i} className="border border-gray-200 rounded-2xl p-3 bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                                                    <Paperclip size={20} className="text-primary-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <a href={imgUrl} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs font-bold text-primary-600 underline">View</a>
                                                        <a href={imgUrl} download={img.imageName}
                                                            className="text-[10px] font-semibold text-gray-600 bg-gray-200 px-2 py-0.5 rounded border border-gray-300">↓ Download</a>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[11px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded">₹{img?.Amount || '—'}</span>
                                                        <span className={`text-[11px] font-bold border px-2 py-0.5 rounded ${sColor}`}>{s}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {(img?.hold_reason_by_hr || img?.hold_reason_by_finance) && (
                                                <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                                                    <p className="text-[9px] font-black text-red-500 uppercase">Hold Reason</p>
                                                    <p className="text-xs font-semibold text-red-700">{img.hold_reason_by_hr || img.hold_reason_by_finance}</p>
                                                </div>
                                            )}
                                            {/* Per-doc actions */}
                                            {canActOnDoc && (
                                                <div className="flex gap-2 mt-2">
                                                    {(!img.verificationStatusByHr || img.verificationStatusByHr === 'InProgress') && (
                                                        <>
                                                            <button onClick={() => onDocAction(img.ExpenseDocId, false)}
                                                                className="flex-1 text-[11px] font-bold py-1.5 rounded-lg text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200">
                                                                On Hold
                                                            </button>
                                                            <button onClick={() => onDocAction(img.ExpenseDocId, true)}
                                                                className="flex-1 text-[11px] font-bold py-1.5 rounded-lg text-white bg-emerald-500 hover:bg-emerald-600">
                                                                Release
                                                            </button>
                                                        </>
                                                    )}
                                                    {img.verificationStatusByHr === 'Released' && (
                                                        <button onClick={() => onDocAction(img.ExpenseDocId, false)}
                                                            className="flex-1 text-[11px] font-bold py-1.5 rounded-lg text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200">
                                                            Put On Hold
                                                        </button>
                                                    )}
                                                    {img.verificationStatusByHr === 'Hold' && (
                                                        <button onClick={() => onDocAction(img.ExpenseDocId, true)}
                                                            className="flex-1 text-[11px] font-bold py-1.5 rounded-lg text-white bg-emerald-500 hover:bg-emerald-600">
                                                            Release
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {validImgs.length === 0 && (
                        <div className="text-center py-6 text-gray-300">
                            <Paperclip size={32} className="mx-auto mb-2" />
                            <p className="text-sm font-semibold text-gray-400">No attachments</p>
                        </div>
                    )}
                </div>
            )}

            {/* Footer actions */}
            <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex gap-2">
                <button onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                    {String(expense.EMPCode) === String(currentId) ? 'Close (My Expense)' : 'Close'}
                </button>
                {canHold && String(expense.EMPCode) !== String(currentId) && (
                    <button onClick={onHoldClick}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-amber-800 bg-amber-100 hover:bg-amber-200 flex items-center justify-center gap-1.5 transition-colors border border-amber-200">
                        <PauseCircle size={13} /> On Hold
                    </button>
                )}
                {canRelease && String(expense.EMPCode) !== String(currentId) && (
                    <button onClick={onApprove}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 transition-colors shadow"
                        style={{ background: '#0f172a' }}>
                        <CheckCircle size={13} /> Release
                    </button>
                )}
            </div>
        </div>
    );
};




// \u2500\u2500\u2500 Main Page \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const ExpenseHR = () => {
    const { user } = useAuth();
    const desigId = Number(user?.DesigId || 0);

    // state
    const [allRows, setAllRows] = useState([]);
    const [data, setData] = useState([]);
    const [employees, setEmployees] = useState([]);  // from /get-all-user
    const [search, setSearch] = useState('');
    const [hrFilter, setHrFilter] = useState('pending');
    const [empFilter, setEmpFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [tick, setTick] = useState(false);
    const [filterModal, setFilterModal] = useState(false);
    const [dateDraft, setDateDraft] = useState({ ...getMonthDates(), startDate: `${new Date().getFullYear()}-01-01` });
    const [dateFilter, setDateFilter] = useState({ ...getMonthDates(), startDate: `${new Date().getFullYear()}-01-01` });

    // drawer
    const [drawer, setDrawer] = useState(false);
    const [selected, setSelected] = useState(null);
    const [imgs, setImgs] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // action modal
    const [actionModal, setActionModal] = useState(false);
    const [actionType, setActionType] = useState('');
    const [reason, setReason] = useState('');
    const [actLoading, setActLoading] = useState(false);
    const [pendingDocId, setPendingDocId] = useState(null);

    // bulk
    const [selected2, setSelected2] = useState([]);
    const [cleared, setCleared] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (drawer) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [drawer]);

    const tableStyles = useTableStyles();
    const dept = (user?.Department || '').toLowerCase();
    const isHR = dept === 'human resource' || dept === 'hr' || Number(user?.DeptId) === 3;
    const isAdmin = desigId === 9 || desigId === 12 || dept === 'admin' || dept === 'it' || dept === 'administration' || Number(user?.DeptId) === 4;
    const allowed = isHR || isAdmin;

    // ── Fetch employee list from /get-all-user → result.data.data.data.userData ──
    useEffect(() => {
        if (!allowed) return;
        api.get('/v1/admin/user_details/get-all-user')
            .then(res => {
                const users = res.data?.data?.data?.userData || res.data?.data?.userData || [];
                setEmployees(users);
            })
            .catch(() => { });
    }, [allowed]);

    // ── Fetch all HR expenses ──
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/expense/get-expense-for-hr', {
                params: {
                    searchKey: search,
                    pageIndex: 0,
                    pageSize: 10000,
                    startDate: dateFilter.startDate,
                    endDate: dateFilter.endDate,
                    EMPCode: empFilter,
                    hrFilter: hrFilter,
                    paymentFilter: 'all',
                },
            });
            setAllRows(res.data?.data?.rows || []);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        if (allowed) fetchData();
    }, [tick, search, dateFilter, empFilter, hrFilter, allowed]);


    // ── Client-side filter + paginate ──
    useEffect(() => {
        if (!allowed) return;
        // Since we now use server-side filtering for hrFilter & paymentFilter,
        // we only apply client-side pagination here.
        const filtered = allRows;
        setTotal(filtered.length);
        const start = page * perPage;
        setData(filtered.slice(start, start + perPage));
    }, [allRows, page, perPage, allowed]);

    // ── Open detail drawer ──
    const openDetail = async (row) => {
        setSelected(row); setImgs([]); setDrawer(true); setDetailLoading(true);
        try {
            const r = await api.get('/v1/admin/expense/get-expense-by-id', { params: { ExpenseReqId: row.ExpenseReqId } });
            // API returns: r.data.data.data[0] = expense detail, r.data.data.docsResult = images
            const detail = r.data?.data?.data?.[0];
            const docs = r.data?.data?.docsResult || [];
            if (detail) setSelected(prev => ({ ...prev, ...detail }));
            setImgs(docs);
        } catch (err) { console.error('openDetail error', err); }
        setDetailLoading(false);
    };

    // ── Do HR action (hold / release) on entire expense ──
    const doAction = async (isRelease, expId) => {
        setActLoading(true);
        try {
            await api.post('/v1/admin/expense/approve-disapprove-claim-by-hr', {
                ExpenseReqId: expId, isRelease, holdReason: reason,
            });
            toast.success(isRelease ? 'Released ✓' : 'Put on Hold ✓');
            setDrawer(false); setActionModal(false); setReason(''); setTick(p => !p);
        } catch { toast.error('Action failed. Retry.'); }
        setActLoading(false);
    };

    // ── Per-document action ──
    const doDocAction = async (docId, isRelease) => {
        try {
            await api.post('/v1/admin/expense/approve-disapprove-claim-by-hr', {
                ExpenseReqId: selected?.ExpenseReqId,
                ExpenseDocId: docId,
                isRelease,
                holdReason: '',
            });
            toast.success(isRelease ? 'Document released ✓' : 'Document put on hold ✓');
            // Refresh images with correct path
            const r = await api.get('/v1/admin/expense/get-expense-by-id', { params: { ExpenseReqId: selected?.ExpenseReqId } });
            const docs = r.data?.data?.docsResult || [];
            setImgs(docs);
            setTick(p => !p);
        } catch { toast.error('Action failed'); }
    };

    // ── Bulk action ──
    const doBulk = async (isRelease) => {
        if (!selected2.length) { toast.warning('Select at least one row'); return; }
        setActLoading(true);
        try {
            await api.post('/v1/admin/expense/bulk-approve-disapprove-claim-by-hr', {
                expenseReqIds: selected2.map(r => r.ExpenseReqId),
                isRelease,
                holdReason: isRelease ? '' : (reason || 'Bulk hold by HR'),
            });
            toast.success(`${selected2.length} expense(s) ${isRelease ? 'released' : 'put on hold'} ✓`);
            setSelected2([]); setCleared(p => !p); setActionModal(false); setReason(''); setTick(p => !p);
        } catch { toast.error('Bulk action failed'); }
        setActLoading(false);
    };

    // ── Table columns ──
    const columns = [
        {
            name: '#', width: '52px', center: true,
            cell: (_, i) => <span className="font-bold text-primary-500 text-sm">{page * perPage + i + 1}</span>
        },
        {
            name: 'ID', minWidth: '110px',
            cell: r => <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{shortId(r.ExpenseReqId)}</span>
        },
        {
            name: 'Employee', minWidth: '190px', sortable: true, selector: r => r.FirstName,
            cell: r => (
                <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-primary-700 bg-primary-100 shrink-0">
                        {(r.FirstName?.[0] || '') + (r.LastName?.[0] || '')}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{r.FirstName} {r.LastName}</p>
                        <p className="text-[11px] text-gray-400">{r.EMPCode}</p>
                    </div>
                </div>
            )
        },
        {
            name: 'Route', minWidth: '190px',
            cell: r => (
                <div className="flex items-center gap-1.5 text-xs font-medium flex-wrap py-1">
                    <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{r.VisitFrom || '—'}</span>
                    <ChevronRight size={10} className="text-gray-300 shrink-0" />
                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{r.VisitTo || '—'}</span>
                </div>
            )
        },
        {
            name: 'Mode', minWidth: '110px', sortable: true, selector: r => r.ExpModeDesc,
            cell: r => <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">{r.ExpModeDesc || '—'}</span>
        },
        {
            name: 'Details', minWidth: '150px',
            cell: r => <span className="text-xs font-bold text-gray-700 truncate max-w-[140px]">{r.Details || '—'}</span>
        },
        {
            name: 'Amount', minWidth: '110px', center: true, sortable: true, selector: r => r.amount,
            cell: r => <span className="font-black text-emerald-600 text-sm">₹&nbsp;{Number(r.amount ?? 0).toLocaleString('en-IN')}</span>
        },
        {
            name: 'Date', minWidth: '140px', sortable: true, selector: r => r.createdAt,
            cell: r => <span className="text-xs text-gray-500 whitespace-nowrap">{fmtDate(r.createdAt)}</span>
        },
        { name: 'HR Status', minWidth: '130px', center: true, cell: r => <HrBadge row={r} /> },
        {
            name: 'Action', width: '80px', center: true,
            cell: r => (
                <button onClick={() => openDetail(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors whitespace-nowrap">
                    <Eye size={12} /> View
                </button>
            )
        },
    ];

    const isPendingFilter = hrFilter === 'pending';
    const pageCount = Math.ceil(total / perPage);

    if (!allowed) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
                <XCircle size={64} className="text-red-300" />
                <h2 className="text-2xl font-extrabold text-gray-900">Access Denied</h2>
                <p className="text-gray-400 max-w-sm text-sm">Only HR personnel can access this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <Loader show={exportLoading} message="Processing Payroll" subMessage="Compiling expense claims and verification data..." />
            <div className="page-header">
                <div>
                    <h1 className="page-title text-2xl font-black">Expense Management Portal</h1>
                    <p className="page-subtitle">Unified dashboard for expense verification and settlement actions</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                {/* ── Toolbar ── */}
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
                    <TableSearch
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Search name…"
                    />

                    <select value={hrFilter} onChange={e => { setHrFilter(e.target.value); setPage(0); }}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white shadow-sm focus:outline-none focus:border-primary-400 cursor-pointer">
                        {HR_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>

                    <div className="relative">
                        <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select value={empFilter} onChange={e => { setEmpFilter(e.target.value); setPage(0); }}
                            className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-white shadow-sm focus:outline-none focus:border-primary-400 cursor-pointer">
                            <option value="all">All Employees</option>
                            {employees.map(e => <option key={e.EMPCode} value={e.EMPCode}>{e.FirstName} {e.LastName} ({e.EMPCode})</option>)}
                        </select>
                    </div>

                    <div className="ml-auto flex gap-2 flex-wrap text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-700 text-xs font-bold border border-primary-100 mr-2">
                            <Clock size={11} /> {dateFilter.startDate} → {dateFilter.endDate}
                        </span>
                        <button onClick={() => setFilterModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                            <Filter size={13} /> Date Range
                        </button>
                        <button onClick={() => exportExcelFull(dateFilter, empFilter, search, setExportLoading)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 shadow-sm">
                            <FileSpreadsheet size={13} /> Excel
                        </button>
                        <button onClick={() => printTable(allRows.filter(r => hrFilter === 'all' ? true : applyHrFilter([r], hrFilter).length > 0), 'HR Expense Report')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 hover:bg-rose-100 shadow-sm">
                            <Printer size={13} /> Print
                        </button>
                        <button onClick={() => setTick(p => !p)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 shadow-sm">
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {selected2.length > 0 && isPendingFilter && (
                    <div className="flex items-center justify-between px-5 py-3 bg-primary-50 border-b border-primary-100 flex-wrap gap-3">
                        <span className="text-sm font-bold text-primary-800">{selected2.length} selected</span>
                        <div className="flex gap-2">
                            <button onClick={() => doBulk(true)} disabled={actLoading}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                <Check size={13} /> Bulk Release
                            </button>
                            <button onClick={() => { setActionType('bulk-hold'); setActionModal(true); }} disabled={actLoading}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl disabled:opacity-50">
                                <PauseCircle size={13} /> Bulk Hold
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 text-xs text-gray-500 font-semibold">
                    <span>Total: <strong className="text-gray-700">{total}</strong></span>
                    <span>|</span>
                    <span>Showing: <strong className="text-primary-600">{HR_FILTERS.find(f => f.value === hrFilter)?.label}</strong></span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <DataTable
                        columns={columns} data={data} noHeader responsive highlightOnHover
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
                        selectableRows={isPendingFilter}
                        selectableRowDisabled={r => String(r.EMPCode) === String(user?.appUserId || localStorage.getItem('EMPCode'))}
                        onSelectedRowsChange={({ selectedRows }) => setSelected2(selectedRows)}
                        clearSelectedRows={cleared}
                        noDataComponent={<TableEmpty icon={FileText} title="No records found" subtitle="Try changing the status filter or date range." />}
                    />
                </div>

                <TablePagination
                    total={total}
                    current={page}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={p => { setPerPage(Number(p)); setPage(0); }}
                />
            </div>

            {drawer && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-stretch">
                    <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
                    <DetailDrawer
                        expense={selected} images={imgs} hrFilter={hrFilter}
                        loading={detailLoading}
                        onClose={() => setDrawer(false)}
                        onApprove={() => doAction(true, selected?.ExpenseReqId)}
                        onHoldClick={() => { setActionType('hold'); setDrawer(false); setActionModal(true); }}
                        onRelease={() => doAction(true, selected?.ExpenseReqId)}
                        onDocAction={(docId, isRelease) => doDocAction(docId, isRelease)}
                        currentId={user?.appUserId || localStorage.getItem('EMPCode') || localStorage.getItem('empCode')}
                    />
                </div>,
                document.body
            )}

            <Modal isOpen={actionModal} onClose={() => { setActionModal(false); setReason(''); }} title="Reason Required" size="sm">
                <div className="space-y-4">
                    <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <AlertCircle size={17} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-amber-800">Provide a reason for putting on hold.</p>
                    </div>
                    <textarea value={reason} onChange={e => setReason(e.target.value)}
                        rows={4} placeholder="Enter reason…" className="input-field resize-none w-full" />
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => { setActionModal(false); setReason(''); }}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100">Cancel</button>
                        <button disabled={!reason.trim() || actLoading}
                            onClick={() => actionType === 'bulk-hold' ? doBulk(false) : doAction(false, selected?.ExpenseReqId)}
                            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 flex items-center gap-2 disabled:opacity-50">
                            {actLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PauseCircle size={14} />}
                            Put On Hold
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={filterModal} onClose={() => setFilterModal(false)} title="Date Range Filter" size="sm">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {(() => {
                            const curYearMin = `${new Date().getFullYear()}-01-01`;
                            return (
                                <>
                                    <div>
                                        <label className="input-label">Start Date</label>
                                        <input type="date" value={dateDraft.startDate} min={curYearMin}
                                            onChange={e => setDateDraft(p => ({ ...p, startDate: e.target.value }))} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="input-label">End Date</label>
                                        <input type="date" value={dateDraft.endDate} min={curYearMin}
                                            onChange={e => setDateDraft(p => ({ ...p, endDate: e.target.value }))} className="input-field" />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <button onClick={() => { const d = getMonthDates(); setDateDraft(d); setDateFilter(d); setFilterModal(false); }}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Reset</button>
                        <button onClick={() => { setDateFilter(dateDraft); setPage(0); setFilterModal(false); }}
                            className="btn-primary">Apply</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ExpenseHR;
