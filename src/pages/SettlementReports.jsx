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

const fmtDateTime = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const p = n => n.toString().padStart(2, '0');
    return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
};

const PaymentStatusBadge = ({ status }) => {
    const st = (status || 'Unpaid').toLowerCase();

    if (st === 'paid')
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-50 border-emerald-200 text-emerald-700">Paid</span>;

    if (st === 'partialpaid' || st === 'partial paid')
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-blue-50 border-blue-200 text-blue-700">Partial Paid</span>;

    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-red-50 border-red-200 text-red-700">Unpaid</span>;
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
    const [filterType, setFilterType] = useState('expense'); // 'expense' or 'payment'
    const [filter, setFilter] = useState({
        emp: 'all',
        startDate: getMonthDates().startDate,
        endDate: getMonthDates().endDate,
        fromPaidDate: '',
        toPaidDate: '',
        status: 'all',
        paymentStatus: 'all',  // ✅ नया - Paid/Unpaid/PartialPaid
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

    // Auto-fetch when filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReport();
        }, 500);
        return () => clearTimeout(timer);
    }, [filter, filterType]);

    const fetchReport = async () => {
        setLoading(true);
        setPage(0); // Reset to first page
        try {
            const endpoint = '/v1/admin/expense/get-export-expense-hr';
            const params = {
                searchKey: filter.search || '',
                pageIndex: 0,
                pageSize: 5000,
                EMPCode: filter.emp === 'all' ? '' : filter.emp,
                empCode: filter.emp === 'all' ? '' : filter.emp,
            };

            // Add dates based on filter type
            if (filterType === 'expense') {
                params.startDate = filter.startDate;
                params.endDate = filter.endDate;
            } else {
                params.fromPaidDate = filter.fromPaidDate;
                params.toPaidDate = filter.toPaidDate;
            }

            const res = await api.get(endpoint, { params });

            let rows = [];
            // Backend returns: { error: false, data: [...] }
            if (res.data?.data && Array.isArray(res.data.data)) {
                rows = res.data.data;
            } else if (res.data?.data?.rows && Array.isArray(res.data.data.rows)) {
                rows = res.data.data.rows;
            } else if (Array.isArray(res.data)) {
                rows = res.data;
            }

            console.log('Fetched rows:', rows.length, rows);

            // Filter by status
            if (filter.status !== 'all') {
                rows = rows.filter(r => {
                    const st = (r.HrStatus || r.status || '').toLowerCase();
                    const isReleased = st === 'released' || st === 'approved' || r.ExpenseStatusChangeByHr === 1;
                    const isHold = st === 'hold' || st === 'on hold' || r.ExpenseStatusChangeByHr === 0;
                    if (filter.status === 'released') return isReleased;
                    if (filter.status === 'hold') return isHold;
                    if (filter.status === 'pending') return !isReleased && !isHold;
                    return true;
                });
            }

            // Filter by payment status (Paid/Unpaid/PartialPaid)
            if (filter.paymentStatus !== 'all') {
                rows = rows.filter(r => {
                    const ps = (r.PaymentStatus || 'Unpaid').toLowerCase();
                    if (filter.paymentStatus === 'paid') return ps === 'paid';
                    if (filter.paymentStatus === 'unpaid') return ps === 'unpaid' || ps === '' || !r.PaymentStatus;
                    if (filter.paymentStatus === 'partialpaid') return ps === 'partialpaid' || ps === 'partial paid';
                    return true;
                });
            }

            // NOTE: Paid date filtering is already done in backend via fromPaidDate & toPaidDate params
            // No need to filter on client side

            setReportData(rows);
            setTotal(rows.length);
            if (!rows.length) toast.info('No results for this criteria');
        } catch (error) {
            console.error(error);
            toast.error('Report generation failed');
        }
        setLoading(false);
    };

    const downloadPDF = async (isWatermark = false) => {
        if (!reportData.length) return toast.warning('No data to export');
        setExportLoading(true);
        try {
            const params = {
                searchKey: filter.search,
                empCode: filter.emp,
                paymentStatus: filter.paymentStatus,  // ✅ Add payment status
            };

            if (filterType === 'expense') {
                params.startDate = filter.startDate;
                params.endDate = filter.endDate;
            } else {
                params.fromPaidDate = filter.fromPaidDate;
                params.toPaidDate = filter.toPaidDate;
            }

            const res = await api.get(isWatermark ? '/v1/admin/expense/pdf-with-watermark' : '/v1/admin/expense/pdf-report', {
                params,
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
                const total = r.TotalAmount || r.amount || 0;
                const paid = r.PaidAmount || 0;  // Now coming from backend
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
                    'Paid At': r.PaidAt || '—',
                    'Payment Status': r.PaymentStatus || 'Unpaid',
                    'HR Status': r.HrStatus || 'Pending'
                };
            });
            const ws = XLSX.utils.json_to_sheet(mapped);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Report');
            const selectedEmp = employees.find(e => e.EMPCode === filter.emp);
            const namePart = selectedEmp ? `${selectedEmp.FirstName}_${selectedEmp.LastName}`.replace(/\s+/g, '_') : 'Global';
            XLSX.writeFile(wb, `Settlement_${namePart}_${filterType === 'expense' ? filter.startDate : filter.fromPaidDate}.xlsx`);
            toast.success('Excel exported ✓');
        } catch { toast.error('Excel export failed'); }
        setExportLoading(false);
    };

    const totalAmount = reportData.reduce((acc, r) => acc + Number(r.amount || r.TotalAmount || 0), 0);
    const paidAmount = reportData.reduce((acc, r) => acc + Number(r.PaidAmount || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    return (
        <div className="space-y-6">
            <Loader show={exportLoading} message="Preparing Report" subMessage="Compiling expenses and audit data..." />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Settlement Hub</h1>
                    <p className="text-gray-500 text-sm">Downloadable audits and financial reconciliation reports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Records" value={reportData.length} icon={Database} color="bg-blue-500" />
                <StatCard title="Total Amount" value={`₹${totalAmount.toLocaleString('en-IN')}`} icon={IndianRupee} color="bg-emerald-500" />
                <StatCard title="Paid Amount" value={`₹${paidAmount.toLocaleString('en-IN')}`} icon={CheckCircle2} color="bg-green-500" />
                <StatCard title="Pending Amount" value={`₹${pendingAmount.toLocaleString('en-IN')}`} icon={Clock} color="bg-orange-500" />
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                {/* Filter Type Toggle */}
                <div className="flex gap-2 border-b border-gray-100 pb-4">
                    <button
                        onClick={() => setFilterType('expense')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filterType === 'expense'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Calendar size={14} className="inline mr-2" />
                        Expense Date Range
                    </button>
                    <button
                        onClick={() => setFilterType('payment')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filterType === 'payment'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Clock size={14} className="inline mr-2" />
                        Payment Date Range
                    </button>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee</label>
                        <select
                            value={filter.emp}
                            onChange={e => setFilter({ ...filter, emp: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Employees</option>
                            {employees.map(e => (
                                <option key={e.EMPCode} value={e.EMPCode}>
                                    {e.FirstName} {e.LastName} ({e.EMPCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Conditional Date Ranges */}
                    {filterType === 'expense' ? (
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expense Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <input
                                        type="date"
                                        value={filter.startDate}
                                        onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                                        className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1">From</p>
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        value={filter.endDate}
                                        onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                                        className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1">To</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <input
                                        type="date"
                                        value={filter.fromPaidDate}
                                        onChange={e => setFilter({ ...filter, fromPaidDate: e.target.value })}
                                        className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1">From</p>
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        value={filter.toPaidDate}
                                        onChange={e => setFilter({ ...filter, toPaidDate: e.target.value })}
                                        className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1">To</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                        <select
                            value={filter.status}
                            onChange={e => setFilter({ ...filter, status: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="released">Released</option>
                            <option value="hold">On Hold</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div> */}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Status</label>
                        <select
                            value={filter.paymentStatus}
                            onChange={e => setFilter({ ...filter, paymentStatus: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Payment</option>
                            <option value="paid">Paid</option>
                            <option value="partialpaid">Partial Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={filter.search}
                                onChange={e => setFilter({ ...filter, search: e.target.value })}
                                className="w-full pl-9 p-2.5 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                    <button
                        onClick={exportExcel}
                        className="px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition-colors"
                    >
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                    <button
                        onClick={() => downloadPDF(false)}
                        className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors"
                    >
                        <FileDown size={16} /> Export PDF
                    </button>
                    <button
                        onClick={() => downloadPDF(true)}
                        className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors"
                    >
                        <ShieldCheck size={16} /> Export with Images
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="card-glass p-0 overflow-hidden">
                <div className="table-search-bar">
                    <div className="flex items-center gap-2">
                        <span className="badge badge-neutral">
                            <BarChart3 size={12} /> {reportData.length} records
                        </span>
                        {loading && (
                            <span className="text-sm text-blue-600 font-semibold flex items-center gap-1">
                                <RefreshCw size={12} className="animate-spin" /> Updating...
                            </span>
                        )}
                    </div>
                </div>

                <DataTable
                    columns={[
                        {
                            name: 'Date',
                            selector: r => fmtDate(r.createdAt || r.ExpenseDate || r.Date),
                            width: '100px'
                        },
                        {
                            name: 'Personnel Info',
                            minWidth: '200px',
                            sortable: true,
                            cell: r => (
                                <div className="flex flex-col py-1.5 gap-0.5">
                                    <div className="font-black text-slate-900 text-[13px] tracking-tight truncate leading-tight">
                                        {r.EmployeeName || `${r.FirstName || ''} ${r.LastName || ''}`.trim() || '—'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">
                                            {r.EMPCode || r.EmployeeId}
                                        </span>
                                    </div>
                                </div>
                            )
                        },
                        {
                            name: 'Details',
                            minWidth: '140px',
                            cell: r => <span className="text-[11px] font-bold text-gray-700 truncate max-w-[130px]">{getExpenseDetails(r)}</span>
                        },
                        {
                            name: 'Route',
                            grow: 1,
                            cell: r => <span className="text-[11px] font-medium">{r.VisitFrom || '—'} → {r.VisitTo || '—'}</span>
                        },
                        {
                            name: 'Total Amount',
                            selector: r => `₹${Number(r.TotalAmount || 0).toLocaleString()}`,
                            right: true,
                            width: '120px'
                        },
                        {
                            name: 'Paid',
                            selector: r => `₹${Number(r.PaidAmount || 0).toLocaleString()}`,
                            right: true,
                            width: '110px',
                            cell: r => <span className="text-[11px] font-bold text-green-600">₹{Number(r.PaidAmount || 0).toLocaleString()}</span>
                        },
                        {
                            name: 'Pending',
                            selector: r => `₹${Number(r.PendingAmount || 0).toLocaleString()}`,
                            right: true,
                            width: '110px',
                            cell: r => <span className="text-[11px] font-bold text-orange-600">₹{Number(r.PendingAmount || 0).toLocaleString()}</span>
                        },
                        {
                            name: 'Paid At',
                            selector: r => r.PaidAt || '—',
                            width: '160px',
                            cell: r => <span className="text-[11px] font-medium">{r.PaidAt || '—'}</span>
                        },
                        {
                            name: 'Payment Status',
                            cell: r => <PaymentStatusBadge status={r.PaymentStatus} />,
                            width: '130px'
                        },
                        {
                            name: 'HR Status',
                            cell: r => <HrBadge row={r} />,
                            width: '110px'
                        },
                    ]}
                    data={reportData.slice(page * perPage, (page + 1) * perPage)}
                    noHeader
                    responsive
                    highlightOnHover
                    customStyles={tableStyles}
                    progressPending={loading}
                    progressComponent={<PageLoader />}
                    noDataComponent={<TableEmpty icon={BarChart3} title="No Records" subtitle="Adjust filters to see settlement data." />}
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