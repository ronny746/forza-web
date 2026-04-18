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
import { io } from 'socket.io-client';

const getMonthDates = () => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const fmt = d => d.toISOString().split('T')[0];
    return { startDate: fmt(new Date(y, m, 1)), endDate: fmt(new Date(y, m + 1, 0)) };
};

const fmtDate = (s) => {
    if (!s) return '—';
    if (typeof s === 'string' && (s.includes('-') || s.includes('/'))) {
        const parts = s.split(/[-/]/);
        if (parts.length >= 3) {
            if (parts[0].length === 4) {
                const [y, m, d] = parts;
                const dateObj = new Date(y, m - 1, d.split(' ')[0]);
                if (!isNaN(dateObj.getTime())) {
                    const p = n => n.toString().padStart(2, '0');
                    return `${p(dateObj.getDate())}/${p(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
                }
            } else {
                const [d, m, y] = parts;
                const dateObj = new Date(y.split(' ')[0], m - 1, d);
                if (!isNaN(dateObj.getTime())) {
                    const p = n => n.toString().padStart(2, '0');
                    return `${p(dateObj.getDate())}/${p(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
                }
            }
        }
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const p = n => n.toString().padStart(2, '0');
    return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
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
    const [filter, setFilter] = useState({
        emp: 'all',
        startDate: `${new Date().getFullYear()}-01-01`,
        endDate: getMonthDates().endDate,
        status: 'all',
        paymentStatus: 'paid',
        search: ''
    });
    const [selectedPaidAt, setSelectedPaidAt] = useState('all');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportMessage, setExportMessage] = useState("Preparing Report");
    const [employees, setEmployees] = useState([]);
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        api.get('/v1/admin/user_details/get-all-user')
            .then(res => setEmployees(res.data?.data?.data?.userData || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReport();
        }, 500);
        return () => clearTimeout(timer);
    }, [filter]);

    useEffect(() => {
        setPage(0);
    }, [selectedPaidAt]);

    const fetchReport = async () => {
        setLoading(true);
        setPage(0);
        try {
            const endpoint = '/v1/admin/expense/get-export-expense-hr';
            const params = {
                searchKey: filter.search || '',
                pageIndex: 0,
                pageSize: 5000,
                EMPCode: filter.emp === 'all' ? '' : filter.emp,
                empCode: filter.emp === 'all' ? '' : filter.emp,
            };
            params.startDate = filter.startDate;
            params.endDate = filter.endDate;
            const res = await api.get(endpoint, { params });
            let rows = [];
            if (res.data?.data && Array.isArray(res.data.data)) {
                rows = res.data.data;
            } else if (res.data?.data?.rows && Array.isArray(res.data.data.rows)) {
                rows = res.data.data.rows;
            } else if (Array.isArray(res.data)) {
                rows = res.data;
            }
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
            if (filter.paymentStatus !== 'all') {
                rows = rows.filter(r => {
                    const ps = (r.PaymentStatus || 'Unpaid').toLowerCase();
                    if (filter.paymentStatus === 'paid') return ps === 'paid';
                    if (filter.paymentStatus === 'unpaid') return ps === 'unpaid' || ps === '' || !r.PaymentStatus;
                    if (filter.paymentStatus === 'partialpaid') return ps === 'partialpaid' || ps === 'partial paid';
                    return true;
                });
            }
            setReportData(rows);
            setTotal(rows.length);
            setSelectedPaidAt('all');
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
        setExportProgress(0);
        setExportMessage("Fetching records...");

        let socket = null;
        let socketId = null;

        try {
            // Establish socket connection for progress updates
            const apiUrl = import.meta.env.VITE_APP_API_URL;
            const socketUrl = apiUrl && apiUrl.includes('/api') ? apiUrl.split('/api')[0] : (apiUrl || window.location.origin);
            
            const token = localStorage.getItem('token');
            socket = io(socketUrl, {
                transports: ['websocket'],
                reconnection: false,
                extraHeaders: {
                    // Try both common header names just in case
                    "genie_access_token": `Bearer ${token}`,
                    "Authorization": `Bearer ${token}`
                }
            });

            // Get socket ID
            setExportMessage("Connecting to Sync...");
            socketId = await new Promise((resolve) => {
                socket.on('connect', () => {
                   console.log('Connected to socket progress:', socket.id);
                   resolve(socket.id);
                });
                socket.on('connect_error', (err) => {
                    console.error('Socket connection error:', err);
                    resolve(null);
                });
                setTimeout(() => resolve(null), 3000);
            });

            if (socketId) {
                socket.on('report-progress', (data) => {
                    if (data.percentage !== undefined) setExportProgress(data.percentage);
                    if (data.message) setExportMessage(data.message);
                });
            }

            setExportMessage(isWatermark ? "Preparing Images..." : "Generating PDF...");

            const params = {
                searchKey: filter.search,
                empCode: filter.emp,
                paymentStatus: filter.paymentStatus,
                startDate: filter.startDate,
                endDate: filter.endDate,
                socketId: socketId
            };

            if (selectedPaidAt !== 'all') {
                const pts = selectedPaidAt.split(/[-/]/);
                let cleanDate = selectedPaidAt;
                if (pts.length >= 3) {
                    const [d, m, y] = pts;
                    cleanDate = `${y}-${m}-${d}`;
                }
                params.fromPaidDate = cleanDate;
                params.toPaidDate = cleanDate;
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
        } catch (err) { 
            console.error('PDF Export Error:', err);
            toast.error('PDF export failed'); 
        } finally {
            if (socket) socket.disconnect();
            setExportLoading(false);
            setExportProgress(0);
        }
    };

    const exportExcel = () => {
        if (!finalReportData.length) return toast.warning('No data to export');
        setExportLoading(true);
        try {
            const mapped = finalReportData.map((r, i) => {
                const total = r.TotalAmount || r.amount || 0;
                const paid = r.PaidAmount || 0;
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
                    'HR Status': r.HrStatus || 'Pending'
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

    const finalReportData = selectedPaidAt === 'all'
        ? reportData
        : reportData.filter(r => r.PaidAt && r.PaidAt.split(' ')[0] === selectedPaidAt);

    const uniquePaidDates = Array.from(new Set(
        reportData
            .filter(r => r.PaidAt)
            .map(r => r.PaidAt.split(' ')[0])
    )).sort((a, b) => {
        const parseD = (s) => {
            const pts = s.split(/[-/]/);
            if (pts[0].length === 4) return new Date(pts[0], pts[1] - 1, pts[2]);
            return new Date(pts[2], pts[1] - 1, pts[0]);
        };
        return parseD(b) - parseD(a);
    });

    const totalAmount = finalReportData.reduce((acc, r) => acc + Number(r.amount || r.TotalAmount || 0), 0);
    const paidAmount = finalReportData.reduce((acc, r) => acc + Number(r.PaidAmount || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    return (
        <div className="space-y-6">
            <Loader show={exportLoading} message={exportMessage} percentage={exportProgress} subMessage="Compiling expenses and audit data..." />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Settlement Hub</h1>
                    <p className="text-gray-500 text-sm">Downloadable audits and financial reconciliation reports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Records" value={finalReportData.length} icon={Database} color="bg-blue-500" />
                <StatCard title="Total Amount" value={`₹${totalAmount.toLocaleString('en-IN')}`} icon={IndianRupee} color="bg-emerald-500" />
                <StatCard title="Paid Amount" value={`₹${paidAmount.toLocaleString('en-IN')}`} icon={CheckCircle2} color="bg-green-500" />
                <StatCard title="Pending Amount" value={`₹${pendingAmount.toLocaleString('en-IN')}`} icon={Clock} color="bg-orange-500" />
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex gap-2 border-b border-gray-100 pb-4">
                    <div className="px-4 py-2 rounded-lg font-black text-xs bg-gray-900 text-white uppercase tracking-widest flex items-center gap-2">
                        <Filter size={14} /> Report Filters & Parameters
                    </div>
                </div>

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

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Report Period (from-to)</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(() => {
                                const currentYearMin = `${new Date().getFullYear()}-01-01`;
                                return (
                                    <>
                                        <div>
                                            <input
                                                type="date"
                                                min={currentYearMin}
                                                value={filter.startDate}
                                                onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                                                className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="date"
                                                min={currentYearMin}
                                                value={filter.endDate}
                                                onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                                                className="w-full p-2.5 rounded-xl bg-gray-50 border-none text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
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

                {uniquePaidDates.length > 0 && (
                    <div className="pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <Clock size={14} className="text-blue-600" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Slots Found ({uniquePaidDates.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedPaidAt('all')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedPaidAt === 'all'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                                    }`}
                            >
                                Show All
                            </button>
                            {uniquePaidDates.map(date => (
                                <button
                                    key={date}
                                    onClick={() => setSelectedPaidAt(date)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedPaidAt === date
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100'
                                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                                        }`}
                                >
                                    {fmtDate(date)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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
                        <FileDown size={16} /> Expense Summary Report
                    </button>
                    <button
                        onClick={() => downloadPDF(true)}
                        className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors"
                    >
                        <ShieldCheck size={16} /> Expense Summary Report with Images
                    </button>
                </div>
            </div>

            <div className="card-glass p-0 overflow-hidden">
                <div className="table-search-bar">
                    <div className="flex items-center gap-2">
                        <span className="badge badge-neutral">
                            <BarChart3 size={12} /> {finalReportData.length} records
                        </span>
                        {selectedPaidAt !== 'all' && (
                            <span className="badge border border-emerald-100 bg-emerald-50 text-emerald-700">
                                <FileCheck size={12} /> Filtered: {fmtDate(selectedPaidAt)}
                            </span>
                        )}
                        {loading && (
                            <span className="text-sm text-blue-600 font-semibold flex items-center gap-1 text-[11px]">
                                <RefreshCw size={12} className="animate-spin" /> Fetching...
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
                            name: 'HR Status',
                            cell: r => <HrBadge row={r} />,
                            width: '110px'
                        },
                    ]}
                    data={finalReportData.slice(page * perPage, (page + 1) * perPage)}
                    noHeader
                    responsive
                    highlightOnHover
                    customStyles={tableStyles}
                    progressPending={loading}
                    progressComponent={<PageLoader />}
                    noDataComponent={<TableEmpty icon={BarChart3} title="No Records" subtitle="Adjust filters to see settlement data." />}
                />

                <TablePagination
                    total={finalReportData.length}
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