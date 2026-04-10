import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactPaginate from 'react-paginate';
import DataTable from 'react-data-table-component';
import {
    Search, Filter, Eye, Check, AlertCircle, Clock,
    Calendar, MapPin, CreditCard, IndianRupee, FileText,
    CheckCircle, XCircle, PauseCircle, RefreshCw,
    FileSpreadsheet, Printer, Users, ChevronRight, Paperclip,
    LayoutDashboard, BarChart3, Download, ExternalLink, FileDown,
    Save, Plus, History, Info, TrendingUp, Wallet
} from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/ui/Modal';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { useTableStyles } from '../utils/tableStyles';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getExpenseDetails } from '../utils/expense_helpers';
import Loader from '../components/ui/Loader';

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
    if (s.includes('T')) {
        return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
    }
    return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
};

const shortId = (id) => {
    if (!id) return '—';
    let h = 0;
    for (let i = 0; i < id.length; i++) { h = (h << 5) - h + id.charCodeAt(i); h |= 0; }
    return `FRZ-${Math.abs(h).toString(36).toUpperCase().slice(0, 6)}`;
};

const PAYMENT_FILTERS = [
    { value: 'all', label: 'All Released' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'PartialPaid', label: 'Partial' },
    { value: 'Paid', label: 'Paid' },
];

const PaymentStatusBadge = ({ status }) => {
    const s = String(status || '').toLowerCase();
    if (s === 'paid')
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 border-emerald-200 text-emerald-700">Paid</span>;
    if (s === 'partialpaid' || s === 'partial')
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 border-amber-200 text-amber-700">Partial</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-gray-50 border-gray-200 text-gray-400">Unpaid</span>;
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────
const DetailDrawer = ({ row, onClose }) => {
    if (!row) return null;
    return createPortal(
        <div className="fixed inset-0 z-[10000]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl border-l border-gray-100 flex flex-col"
                style={{ animation: 'sbIn .3s cubic-bezier(.16,1,.3,1)' }}>
                <style>{`@keyframes sbIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

                <div className="p-5 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white">
                            <Info size={20} />
                        </div>
                        <div>
                            <p className="font-black text-gray-900 leading-tight">Expense Detail</p>
                            <p className="text-[11px] text-primary-500 font-bold uppercase tracking-wider">{shortId(row.ExpenseReqId)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-white flex items-center justify-center text-gray-400 transition-colors shadow-sm">
                        <XCircle size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-primary-50/50 border border-primary-100">
                            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Total Bill</p>
                            <p className="text-xl font-black text-primary-900">₹{Number(row.TotalAmount).toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Paid Amount</p>
                            <p className="text-xl font-black text-emerald-900">₹{Number(row.PaidAmount || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status Overview</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Payment Status</span>
                                <PaymentStatusBadge status={row.PaymentStatus} />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">HR Verification</span>
                                <span className="text-emerald-600 font-bold">{row.HrStatus}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Manager Approval</span>
                                <span className="text-primary-600 font-bold">{row.ManagerStatus}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">General Information</p>
                        {[
                            { label: 'Employee', value: row.EmployeeName, sub: row.EMPCode, icon: Users },
                            { label: 'Expense Type', value: row.ExpenseType, icon: CreditCard },
                            { label: 'Visit Dates', value: `${row.VisitFromDate} to ${row.VisitToDate}`, icon: Calendar },
                            { label: 'Route', value: `${row.VisitFrom} → ${row.VisitTo}`, icon: MapPin },
                            { label: 'Purpose', value: row.VisitPurpose, icon: FileText },
                            { label: 'Approved By', value: row.ApprovedByName, icon: CheckCircle },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    <item.icon size={14} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p>
                                    <p className="text-sm font-bold text-gray-800">{item.value || '—'}</p>
                                    {item.sub && <p className="text-[11px] font-medium text-gray-500">{item.sub}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={onClose} className="w-full py-3 rounded-2xl bg-primary-600 text-white font-black text-sm shadow-xl shadow-primary-100 active:scale-95 transition-transform">
                        Close Details
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ExpensePaymentHistory = () => {
    const { user } = useAuth();
    const globalTableStyles = useTableStyles();
    const tableStyles = {
        ...globalTableStyles,
        pagination: {
            style: {
                display: 'flex',
                fontSize: '12px',
                fontWeight: '700',
                color: '#64748b',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #f1f5f9',
                minHeight: '60px',
            },
        },
    };

    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [tick, setTick] = useState(false);

    const [search, setSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [empFilter, setEmpFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState(getMonthDates());

    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);

    const [paymentModal, setPaymentModal] = useState(false);
    const [historyModal, setHistoryModal] = useState(false);
    const [selectedExp, setSelectedExp] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [payLoading, setPayLoading] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [payAmt, setPayAmt] = useState('');
    const [payRemarks, setPayRemarks] = useState('');

    const [selectedRows, setSelectedRows] = useState([]);
    const [clearSelectedRows, setClearSelectedRows] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/expense/payment-report', {
                params: {
                    paymentFilter,
                    startDate: dateFilter.startDate,
                    endDate: dateFilter.endDate,
                    EMPCode: empFilter,
                    pageIndex: 0,
                    pageSize: 5000,
                    searchKey: search
                }
            });
            setRows(res.data?.data?.rows || []);
            setTotal(res.data?.data?.count || 0);
            setSummary(res.data?.summary || null);
        } catch (err) {
            toast.error('Failed to fetch payment report');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [tick, paymentFilter, empFilter, dateFilter, search]);

    useEffect(() => {
        api.get('/v1/admin/user_details/get-all-user')
            .then(res => {
                const users = res.data?.data?.data?.userData || res.data?.data?.userData || [];
                setEmployees(users);
            })
            .catch(() => { });
    }, []);

    const handleMarkPayment = (row) => {
        setSelectedExp(row);
        setPayAmt(row.PendingAmount);
        setPayRemarks('');
        setPaymentModal(true);
    };

    const submitPayment = async () => {
        if (!payAmt || payAmt <= 0) { toast.warning('Valid amount required'); return; }
        setPayLoading(true);
        try {
            const res = await api.post('/v1/admin/expense/mark-payment', {
                ExpenseReqId: selectedExp.ExpenseReqId,
                PaidAmount: Number(payAmt),
                PaymentRemarks: payRemarks
            });
            if (res.data.error) {
                toast.error(res.data.message);
            } else {
                toast.success(res.data.message || 'Payment recorded');
                setPaymentModal(false);
                setTick(p => !p);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record payment');
        }
        setPayLoading(false);
    };

    const handleBulkPayment = async () => {
        if (!selectedRows.length) return;
        if (!window.confirm(`Mark ${selectedRows.length} expenses as FULLY PAID?`)) return;
        setLoading(true);
        try {
            const res = await api.post('/v1/admin/expense/bulk-mark-payment', {
                expenseReqIds: selectedRows.map(r => r.ExpenseReqId),
                PaymentRemarks: 'Bulk full payment by HR'
            });
            toast.success(res.data.message || 'Bulk payment successful');
            setSelectedRows([]);
            setClearSelectedRows(p => !p);
            setTick(p => !p);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Bulk payment failed');
        }
        setLoading(false);
    };

    const viewHistory = async (row) => {
        setSelectedExp(row);
        setHistoryModal(true);
        setHistoryLoading(true);
        try {
            const res = await api.get('/v1/admin/expense/payment-history', { params: { ExpenseReqId: row.ExpenseReqId } });
            setHistoryData(res.data?.data || null);
        } catch (err) { toast.error('History fetch failed'); }
        setHistoryLoading(false);
    };

    const exportData = async () => {
        setExportLoading(true);
        try {
            const res = await api.get('/v1/admin/expense/export-payment-report', {
                params: { paymentFilter, startDate: dateFilter.startDate, endDate: dateFilter.endDate, EMPCode: empFilter }
            });
            const data = (res.data?.data || []).map(r => ({
                ...r,
                'Details': getExpenseDetails(r)
            }));
            if (!data.length) { toast.warning('No data to export'); setExportLoading(false); return; }
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Payments');
            const selectedEmp = employees.find(e => e.EMPCode === empFilter);
            const namePart = selectedEmp ? `${selectedEmp.FirstName}_${selectedEmp.LastName}`.replace(/\s+/g, '_') : 'Global';
            XLSX.writeFile(wb, `Payment_Report_${namePart}_${dateFilter.startDate}.xlsx`);
            toast.success('XLSX generated successfully!');
        } catch (err) { toast.error('Export failed'); }
        setExportLoading(false);
    };

    const exportPDF = async () => {
        setExportLoading(true);
        try {
            const res = await api.get('/v1/admin/expense/export-payment-report', {
                params: { paymentFilter, startDate: dateFilter.startDate, endDate: dateFilter.endDate, EMPCode: empFilter }
            });
            const data = res.data?.data || [];
            if (!data.length) { toast.warning('No data to export'); setExportLoading(false); return; }

            const doc = new jsPDF('l', 'mm', 'a4');

            // Header
            doc.setFontSize(18);
            doc.setTextColor(40);
            doc.text('FORZA - Payment Tracking Report', 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Period: ${fmtDate(dateFilter.startDate)} to ${fmtDate(dateFilter.endDate)}`, 14, 28);
            doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 33);
            doc.text(`Status Filter: ${paymentFilter === 'all' ? 'All Released' : paymentFilter}`, 14, 38);

            const tableColumn = [
                "Emp Code", "Employee Name", "Expense ID", "Type", "Details",
                "Total Amount", "Paid Amount", "Pending Amount", "Status", "Paid On"
            ];
            const tableRows = [];

            data.forEach(item => {
                const total = item.TotalAmount || item['Total Amount'] || 0;
                const paid = item.PaidAmount || item['Paid Amount'] || 0;
                const pending = item.PendingAmount || item['Pending Amount'] || 0;
                const empCode = item.EMPCode || item['Employee Code'] || item.EmployeeId || '—';
                const empName = item.EmployeeName || item['Employee Name'] || '—';

                const rowData = [
                    empCode,
                    empName,
                    item.ExpenseReqId || item['Expense ID'] || '—',
                    item.ExpenseType || item['Expense Type'] || '—',
                    getExpenseDetails(item),
                    `INR ${Number(total).toLocaleString()}`,
                    `INR ${Number(paid).toLocaleString()}`,
                    `INR ${Number(pending).toLocaleString()}`,
                    item.PaymentStatus || item['Payment Status'] || 'Unpaid',
                    item.PaidAt || item['Paid On'] || '—'
                ];
                tableRows.push(rowData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10, fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3 },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                columnStyles: {
                    4: { halign: 'right', fontStyle: 'bold' },
                    5: { halign: 'right', fontStyle: 'bold' },
                    6: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }
                }
            });

            const selectedEmp = employees.find(e => e.EMPCode === empFilter);
            const namePart = selectedEmp ? `${selectedEmp.FirstName}_${selectedEmp.LastName}`.replace(/\s+/g, '_') : 'Global';
            doc.save(`Payment_Report_${namePart}_${dateFilter.startDate}.pdf`);
            toast.success('PDF generated successfully!');
        } catch (err) {
            console.error(err);
            toast.error('PDF Export failed');
        }
        setExportLoading(false);
    };

    const openDetails = (row) => {
        setSelectedExp(row);
        setShowDetail(true);
    };

    const columns = [
        {
            name: 'ID', width: '100px',
            cell: r => <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{shortId(r.ExpenseReqId)}</span>
        },
        {
            name: 'Employee', minWidth: '180px', sortable: true, selector: r => r.EmployeeName,
            cell: r => (
                <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-primary-700 bg-primary-50 border border-primary-100">
                        {r.EmployeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-[12px] truncate">{r.EmployeeName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{r.EMPCode}</p>
                    </div>
                </div>
            )
        },
        {
            name: 'Financials', minWidth: '100px',
            cell: r => (
                <div className="py-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Bill: <span className="text-gray-900">₹{r.TotalAmount}</span></p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Paid: ₹{r.PaidAmount}</p>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Due: <span className="text-rose-600">₹{r.PendingAmount}</span></p>
                </div>
            )
        },
        { name: 'Status', width: '90px', center: true, cell: r => <PaymentStatusBadge status={r.PaymentStatus} /> },
        {
            name: 'Expense Fill Date', width: '150px', selector: r => r.ExpenseDate,
            cell: r => <span className="text-[11px] font-bold text-gray-600">{r.ExpenseDate}</span>
        },
        {
            name: 'Visit Info', minWidth: '180px',
            cell: r => (
                <div className="py-1">
                    <p className="text-[11px] font-bold text-gray-700 truncate">{r.ExpenseType}</p>
                    <p className="text-[10px] text-primary-600 font-bold">{r.VisitFromDate} - {r.VisitToDate}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{r.VisitFrom} → {r.VisitTo}</p>
                </div>
            )
        },
        {
            name: 'Actions', width: '120px', right: true,
            cell: r => (
                <div className="flex gap-1">
                    <button onClick={() => openDetails(r)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                        <Eye size={15} />
                    </button>
                    <button onClick={() => viewHistory(r)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                        <History size={15} />
                    </button>
                    {r.PaymentStatus !== 'Paid' && (
                        <button onClick={() => handleMarkPayment(r)} className="px-2.5 h-7 rounded-lg text-[10px] font-black text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all">
                            PAY
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-2">
            <Loader show={exportLoading} message="Processing Payments" subMessage="Compiling settlement records and generating audits..." />

            {/* ── Header & Summary ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        Payment Desk
                        <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 font-medium">Track and process payments for HR released expense claims.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Due', val: `₹${summary?.TotalPending?.toLocaleString() || 0}`, icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Paid Total', val: `₹${summary?.TotalPaid?.toLocaleString() || 0}`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Count', val: summary?.UnpaidCount || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Fully Paid', val: summary?.PaidCount || 0, icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50' },
                    ].map((s, i) => (
                        <div key={i} className="px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                                <s.icon size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                                <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-4">
                <div className="relative min-w-[240px] flex-1">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Search employee, ID, route..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:bg-white focus:ring-2 ring-primary-50 transition-all font-medium" />
                </div>

                <div className="flex items-center gap-2">
                    <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(0); }}
                        className="px-4 py-2.5 rounded-2xl border border-gray-100 bg-white text-sm font-bold text-gray-700 focus:outline-none ring-offset-2 focus:ring-2 ring-primary-50 shadow-sm cursor-pointer">
                        {PAYMENT_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>

                    <select value={empFilter} onChange={e => { setEmpFilter(e.target.value); setPage(0); }}
                        className="px-4 py-2.5 rounded-2xl border border-gray-100 bg-white text-sm font-bold text-gray-700 focus:outline-none ring-offset-2 focus:ring-2 ring-primary-50 shadow-sm cursor-pointer max-w-[180px]">
                        <option value="all">All Employees</option>
                        {employees.map(e => <option key={e.EMPCode} value={e.EMPCode}>{e.FirstName} {e.LastName}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                        {(() => {
                            const curYearMin = `${new Date().getFullYear()}-01-01`;
                            return (
                                <>
                                    <div className="flex items-center gap-2 px-2 border-r border-gray-200">
                                        <Calendar size={14} className="text-primary-500" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From</span>
                                    </div>
                                    <input type="date" value={dateFilter.startDate} min={curYearMin} onChange={e => { setDateFilter(prev => ({ ...prev, startDate: e.target.value })); setPage(0); }}
                                        className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 py-1" />
                                    <span className="text-gray-300 font-bold px-1">→</span>
                                    <div className="flex items-center gap-2 px-2 border-l border-gray-200">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</span>
                                    </div>
                                    <input type="date" value={dateFilter.endDate} min={curYearMin} onChange={e => { setDateFilter(prev => ({ ...prev, endDate: e.target.value })); setPage(0); }}
                                        className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 py-1" />
                                </>
                            );
                        })()}
                    </div>
                </div>

                <div className="flex gap-2 ml-auto">
                    {selectedRows.length > 0 && (
                        <button onClick={handleBulkPayment}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary-600 text-white text-sm font-black hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-95">
                            <Plus size={16} /> Mark Paid
                        </button>
                    )}
                    <button onClick={exportData}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-all">
                        <FileSpreadsheet size={16} /> Release Expense
                    </button>
                    {/* <button onClick={exportPDF}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition-all">
                        <FileDown size={16} /> PDF
                    </button> */}
                    <button onClick={() => setTick(!tick)}
                        className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-primary-600 hover:bg-gray-50 transition-all shadow-sm active:rotate-180 duration-500">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Table Container ── */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-x-auto min-h-[500px] flex flex-col">
                <DataTable
                    columns={columns}
                    data={rows}
                    progressPending={loading}
                    progressComponent={<div className="p-32 flex flex-col items-center gap-4"><div className="w-12 h-12 rounded-full border-4 border-primary-50 border-t-primary-600 animate-spin" /><p className="text-gray-400 font-black text-[11px] uppercase tracking-widest">Loading Payments...</p></div>}
                    customStyles={tableStyles}
                    selectableRows={paymentFilter !== 'Paid'}
                    onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                    clearSelectedRows={clearSelectedRows}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
                    responsive
                    noDataComponent={<div className="p-32 text-center flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200 mb-2">
                            <LayoutDashboard size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">No payment records found.</p>
                        <button onClick={() => { setSearch(''); setPaymentFilter('all'); setEmpFilter('all'); }} className="text-primary-600 text-xs font-black uppercase tracking-widest hover:underline">Clear all filters</button>
                    </div>}
                />

                <div className="p-4 border-t border-gray-50 bg-gray-50/10 px-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total {total} entries found across all pages
                    </p>
                </div>
            </div>

            {/* ── Modals ── */}

            <AnimatePresence>
                {showDetail && (
                    <DetailDrawer row={selectedExp} onClose={() => setShowDetail(false)} />
                )}
            </AnimatePresence>

            {/* Mark Payment Modal */}
            <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment">
                {selectedExp && (
                    <div className="space-y-6">
                        <div className="p-5 rounded-3xl bg-primary-600 text-white shadow-xl shadow-primary-100 relative overflow-hidden">
                            <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-primary-100 uppercase tracking-widest mb-1">Expense Req ID</p>
                                    <p className="text-sm font-black">{shortId(selectedExp.ExpenseReqId)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-primary-100 uppercase tracking-widest mb-1">Due Amount</p>
                                    <p className="text-3xl font-black">₹{Number(selectedExp.PendingAmount).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/10 text-xs font-bold text-primary-100 relative z-10">
                                <p>{selectedExp.EmployeeName} • {selectedExp.EMPCode}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>Payment Amount (₹)</span>
                                    <button onClick={() => setPayAmt(selectedExp.PendingAmount)} className="text-primary-600 hover:underline">Full Amount</button>
                                </div>
                                <div className="relative">
                                    <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)}
                                        className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 text-2xl font-black text-gray-900 focus:outline-none focus:bg-white focus:ring-4 ring-primary-50 transition-all transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks / Note</label>
                                <textarea value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="Ref No, NEFT ID, or internal note..." rows={3}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-medium focus:outline-none focus:bg-white focus:ring-4 ring-primary-50 transition-all resize-none" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setPaymentModal(false)} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={submitPayment} disabled={payLoading}
                                className="flex-[2] py-4 rounded-2xl bg-primary-600 text-white font-black shadow-xl shadow-primary-100 flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-50">
                                {payLoading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                {Number(payAmt) >= selectedExp.PendingAmount ? 'Full Payment' : 'Partial Payment'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* History Modal */}
            <Modal isOpen={historyModal} onClose={() => setHistoryModal(false)} title="Payment History">
                <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    {historyLoading ? (
                        <div className="py-24 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-primary-50 border-t-primary-600 animate-spin" />
                            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Fetching Timeline...</p>
                        </div>
                    ) : historyData ? (
                        <div className="space-y-6">
                            <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{historyData.expense.ExpenseId}</p>
                                    <p className="text-sm font-black text-gray-900">{selectedExp?.EmployeeName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Paid</p>
                                    <p className="text-2xl font-black text-emerald-600">₹{Number(historyData.expense.PaidAmount).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="relative pl-10 space-y-8 py-4">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-primary-50" />
                                {historyData.history.length === 0 ? (
                                    <div className="py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-3 text-gray-400 font-bold ml-[-10px]">
                                        <Clock size={24} /> <p>No payments recorded yet</p>
                                    </div>
                                ) : (
                                    historyData.history.map((h, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[30px] top-1.5 w-5 h-5 rounded-full bg-white border-4 border-primary-600 shadow-sm" />
                                            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="text-xl font-black text-primary-600">₹{Number(h.PaidAmount).toLocaleString()}</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{h.PaidAt}</p>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                                                        <Wallet size={16} />
                                                    </div>
                                                </div>
                                                {h.PaymentRemarks && (
                                                    <div className="mb-4 p-3 rounded-2xl bg-primary-50/50 border border-primary-50 text-[13px] text-primary-700 font-medium leading-relaxed italic">
                                                        "{h.PaymentRemarks}"
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 pt-3 border-t border-gray-50 text-gray-400">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[9px] uppercase">
                                                        {h.PaidByName?.split(' ').map(x => x[0]).join('')}
                                                    </div>
                                                    <p className="text-[11px] font-bold">Processed by <span className="text-gray-900">{h.PaidByName}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : null}
                    <button onClick={() => setHistoryModal(false)} className="w-full py-4 mt-6 rounded-2xl bg-gray-100 text-gray-600 font-black text-sm hover:bg-gray-200 transition-colors">Close Timeline</button>
                </div>
            </Modal>


        </div>
    );
};

export default ExpensePaymentHistory;
