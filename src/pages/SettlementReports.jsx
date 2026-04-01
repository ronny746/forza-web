/* eslint-disable */
import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import {
    Users, Calendar, Search, FileSpreadsheet, FileDown, FileCheck,
    RefreshCw, Filter, Trash2, ClipboardList, ShieldCheck, Database,
    ArrowUpRight, BarChart3, Receipt, CheckCircle2, Clock, IndianRupee
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { useTableStyles } from '../utils/tableStyles';
import { TableSearch, TablePagination, TableEmpty, PageLoader } from '../components/ui/TableComponents';
import Loader from '../components/ui/Loader';
import { getExpenseDetails } from '../utils/expense_helpers';

const getMonthDates = () => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const fmt = d => d.toISOString().split('T')[0];
    return { startDate: fmt(new Date(y, m, 1)), endDate: fmt(new Date(y, m + 1, 0)) };
};

const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const p = n => n.toString().padStart(2, '0');
    return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
};

const HrBadge = ({ row }) => {
    const v = (row?.HrStatus || row?.status || '').toLowerCase();
    const hrVal = row?.ExpenseStatusChangeByHr;
    const isReleased = v === 'released' || v === 'approved' || hrVal === 1 || hrVal === '1';
    const isHold = v === 'hold' || v === 'on hold' || hrVal === 0 || hrVal === '0';

    if (isReleased)
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-50 border-emerald-200 text-emerald-700">Released</span>;
    if (isHold)
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-amber-50 border-amber-200 text-amber-700">On Hold</span>;

    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-blue-50 border-blue-200 text-blue-700">Pending</span>;
};

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon size={22} className="text-white" />
        </div>
        <div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{value}</p>
        </div>
    </div>
);

const SettlementReports = () => {
    const tableStyles = useTableStyles();
    const [filter, setFilter] = useState({
        emp: 'all',
        ...getMonthDates(),
        status: 'all',
        search: ''
    });
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        api.get('/v1/admin/user_details/get-all-user')
            .then(res => setEmployees(res.data?.data?.data?.userData || []))
            .catch(() => { });

        // Fetch initially
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const endpoint = '/v1/admin/expense/get-export-expense-hr';
            const res = await api.get(endpoint, {
                params: {
                    searchKey: filter.search || '',
                    pageIndex: 0,
                    pageSize: 5000,
                    startDate: filter.startDate,
                    endDate: filter.endDate,
                    EMPCode: filter.emp === 'all' ? '' : filter.emp,
                    empCode: filter.emp === 'all' ? '' : filter.emp
                }
            });

            let rows = [];
            if (res.data?.data?.rows) rows = res.data.data.rows;
            else if (res.data?.data) rows = Array.isArray(res.data.data) ? res.data.data : (res.data.data.rows || []);
            else if (Array.isArray(res.data)) rows = res.data;

            if (filter.status !== 'all') {
                rows = rows.filter(r => {
                    const st = (r.HrStatus || r.status || '').toLowerCase();
                    const isReleased = st === 'released' || st === 'approved' || r.ExpenseStatusChangeByHr === 1;
                    const isHold = st === 'hold' || st === 'on hold' || r.ExpenseStatusChangeByHr === 0;
                    if (filter.status === '1') return isReleased;
                    if (filter.status === '0') return isHold;
                    if (filter.status === 'pending') return !isReleased && !isHold;
                    return true;
                });
            }
            setReportData(rows);
            if (!rows.length) toast.info('No results for this criteria');
        } catch { toast.error('Report generation failed'); }
        setLoading(false);
    };

    const downloadPDF = async (isWatermark = false) => {
        if (!reportData.length) return toast.warning('No data to export');
        // if (filter.emp === 'all') return toast.warning('Please select a specific employee to download their PDF report');
        setExportLoading(true);
        try {
            const res = await api.get(isWatermark ? '/v1/admin/expense/pdf-with-watermark' : '/v1/admin/expense/pdf-report', {
                params: { searchKey: filter.search, startDate: filter.startDate, endDate: filter.endDate, empCode: filter.emp },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const selectedEmp = employees.find(e => e.EMPCode === filter.emp);
            const empName = selectedEmp ? `${selectedEmp.FirstName}_${selectedEmp.LastName}`.replace(/\s+/g, '_') : filter.emp;
            link.download = `ExpenseReport_${empName}_${isWatermark ? 'WM' : 'STD'}.pdf`;
            link.click();
            toast.success('PDF generated ✓');
        } catch { toast.error('PDF export failed'); }
        setExportLoading(false);
    };

    const exportExcel = () => {
        if (!reportData.length) return toast.warning('No data to export');
        setExportLoading(true);
        try {
            const mapped = reportData.map((r, i) => {
                const total = r.amount || r.TotalAmount || 0;
                const paid = r.PaidAmount || r.TotalPaidByHr || r['Paid Amount'] || 0;
                const pending = r.PendingAmount || (Number(total) - Number(paid)) || 0;

                return {
                    'S.No': i + 1,
                    'Date': fmtDate(r.createdAt || r.Date),
                    'EMP Code': r.EMPCode || r.EmployeeId || '—',
                    'Name': r.EmployeeName || `${r.FirstName || ''} ${r.LastName || ''}`.trim() || '—',
                    'Expense Type': r.ExpModeDesc || r.ExpenseType || '—',
                    'Expense Details': getExpenseDetails(r),
                    'Route': `${r.VisitFrom || ''} to ${r.VisitTo || ''}`,
                    'Total Amount': Number(total),
                    'Paid Amount': Number(paid),
                    'Pending Amount': Number(pending),
                    'Status': r.HrStatus || 'Pending'
                };
            });
            const ws = XLSX.utils.json_to_sheet(mapped);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Report');
            const selectedEmp = employees.find(e => e.EMPCode === filter.emp);
            const namePart = selectedEmp ? `${selectedEmp.FirstName}_${selectedEmp.LastName}`.replace(/\s+/g, '_') : 'Global';
            XLSX.writeFile(wb, `Settlement_${namePart}_${filter.startDate}.xlsx`);
            toast.success('Excel exported ✓');
        } catch { toast.error('Excel export failed'); }
        setExportLoading(false);
    };

    const totalAmount = reportData.reduce((acc, r) => acc + Number(r.amount || r.TotalAmount || 0), 0);

    return (
        <div className="space-y-6">
            <Loader show={exportLoading} message="Preparing Report" subMessage="Compiling expenses and audit data..." />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Settlement Hub</h1>
                    <p className="text-gray-500 text-sm">Downloadable audits and financial reconciliation reports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Volume" value={reportData.length} icon={Database} color="bg-blue-500" />
                <StatCard title="Total Amount" value={`₹${totalAmount.toLocaleString('en-IN')}`} icon={IndianRupee} color="bg-emerald-500" />
                <StatCard title="Avg per Claim" value={`₹${(reportData.length ? totalAmount / reportData.length : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} icon={BarChart3} color="bg-primary-500" />
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee</label>
                        <select value={filter.emp} onChange={e => setFilter({ ...filter, emp: e.target.value })} className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-blue-500">
                            <option value="all">All</option>
                            {employees.map(e => <option key={e.EMPCode} value={e.EMPCode}>{e.FirstName} {e.LastName} ({e.EMPCode})</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="date" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} className="p-2.5 rounded-xl bg-gray-50 border-none text-xs font-bold focus:ring-2 focus:ring-blue-500" />
                            <input type="date" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} className="p-2.5 rounded-xl bg-gray-50 border-none text-xs font-bold focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Audit Status</label>
                        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-blue-500">
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="1">Released</option>
                            <option value="0">On Hold</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precise Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input type="text" placeholder="Search criteria..." value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} className="w-full pl-9 p-2.5 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                    <button onClick={() => fetchReport()} disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 bg-blue-600 shadow-blue-100 hover:bg-blue-700">
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                        Fetch Data
                    </button>
                    <button onClick={exportExcel} className="px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition-colors">
                        <FileSpreadsheet size={16} /> Expense Excel
                    </button>
                    <button onClick={() => downloadPDF(false)} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors">
                        <FileDown size={16} /> Expense Detail PDF
                    </button>
                    <button onClick={() => downloadPDF(true)} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors">
                        <ShieldCheck size={16} /> Expense Image PDF
                    </button>
                </div>
            </div>

            <div className="card-glass p-0 overflow-hidden">
                <div className="table-search-bar">
                    <TableSearch
                        value={filter.search}
                        onChange={e => setFilter({ ...filter, search: e.target.value })}
                        placeholder="Search settlements…"
                    />
                    <div className="flex items-center gap-2">
                        <span className="badge badge-neutral">
                            <BarChart3 size={12} /> {reportData.length} records
                        </span>
                    </div>
                </div>

                <DataTable
                    columns={[
                        { name: 'Date', selector: r => fmtDate(r.createdAt || r.ExpenseDate || r.Date), width: '110px' },
                        {
                            name: 'Personnel Info', minWidth: '220px', sortable: true,
                            cell: r => (
                                <div className="flex flex-col py-1.5 gap-0.5">
                                    <div className="font-black text-slate-900 text-[13px] tracking-tight truncate leading-tight">{r.EmployeeName || `${r.FirstName || ''} ${r.LastName || ''}`.trim() || '—'}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{r.EMPCode || r.EmployeeId}</span>
                                        <span className="text-[10px] text-slate-300 font-medium">|</span>
                                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[100px]">{r.Designatation || ''}</span>
                                    </div>
                                </div>
                            )
                        },
                        {
                            name: 'Details', minWidth: '150px',
                            cell: r => <span className="text-[11px] font-bold text-gray-700 truncate max-w-[140px]">{getExpenseDetails(r)}</span>
                        },
                        { name: 'Route', selector: r => `${r.VisitFrom || ''} → ${r.VisitTo || ''}`, grow: 1, cell: r => <span className="text-[11px] font-medium">{r.VisitFrom} → {r.VisitTo}</span> },
                        { name: 'Amount', selector: r => `₹${Number(r.amount || r.TotalAmount || 0).toLocaleString()}`, right: true, width: '110px' },
                        { name: 'Status', cell: r => <HrBadge row={r} />, width: '130px' },
                    ]}
                    data={reportData.slice(page * perPage, (page + 1) * perPage)}
                    noHeader
                    responsive
                    highlightOnHover
                    customStyles={tableStyles}
                    progressPending={loading}
                    progressComponent={<PageLoader />}
                    noDataComponent={<TableEmpty icon={BarChart3} title="Audits Pending" subtitle="Fetch data to generate settlement reports." />}
                />

                <TablePagination
                    total={total}
                    current={page}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={p => { setPerPage(p); setPage(0); }}
                />
            </div>
        </div>
    );
};

export default SettlementReports;
