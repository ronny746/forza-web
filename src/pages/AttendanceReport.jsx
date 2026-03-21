import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Calendar, Search, FileSpreadsheet, RefreshCw, Database, MapPin, Clock, FileText, ChevronDown, Download, Users, ClipboardList } from 'lucide-react';
import Loader from '../components/ui/Loader';
import { toast } from 'react-toastify';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { useTableStyles } from '../utils/tableStyles';
import { TableSearch, TablePagination, TableEmpty, PageLoader } from '../components/ui/TableComponents';
import moment from 'moment';

const getMonthDates = () => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const fmt = d => d.toISOString().split('T')[0];
    return { startDate: fmt(new Date(y, m, 1)), endDate: fmt(new Date(y, m + 1, 0)) };
};

const AttendanceReport = () => {
    const tableStyles = useTableStyles();
    const [filter, setFilter] = useState({
        emp: 'all',
        startDate: getMonthDates().startDate,
        endDate: getMonthDates().endDate,
        search: ''
    });

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Initial Fetch for Employee list
    useEffect(() => {
        api.get('/v1/admin/user_details/get-all-user')
            .then(res => setEmployees(res.data?.data?.data?.userData || []))
            .catch(() => { });
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/attendence/get-report', {
                params: {
                    searchKey: filter.search || '',
                    pageIndex: 0,
                    pageSize: 5000,
                    searchEMPCode: filter.emp,
                    startDate: filter.startDate,
                    endDate: filter.endDate
                }
            });

            const rows = res.data?.data?.reportData || [];

            const filteredRows = rows.filter(r => {
                const searchLower = filter.search.toLowerCase();
                if (!searchLower) return true;
                return (
                    (r.FirstName + ' ' + r.LastName).toLowerCase().includes(searchLower) ||
                    (r.EMPCode || '').toLowerCase().includes(searchLower) ||
                    (r.VisitFrom || '').toLowerCase().includes(searchLower) ||
                    (r.VisitTo || '').toLowerCase().includes(searchLower)
                );
            });

            setReportData(filteredRows);
            setTotalItems(res.data?.DataCount || filteredRows.length);

            if (!filteredRows.length) toast.info('No matching records found.');
            else toast.success(`Generated ${filteredRows.length} records`);
        } catch (error) {
            toast.error('API Fetch Error');
            console.error(error);
        }
        setLoading(false);
    };

    const StatusBadge = ({ row }) => {
        const hasCheckIn = !!row.PresentTimeIn;
        const hasCheckOut = !!row.PresentTimeOut;

        if (hasCheckIn && hasCheckOut) {
            return <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">Completed</span>;
        } else if (hasCheckIn && !hasCheckOut) {
            return <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100">In Progress</span>;
        } else {
            return <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100">Pending</span>;
        }
    };

    const exportExcel = async () => {
        if (!reportData.length) return toast.warning('Generate report first');
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/attendence/get-export-report', {
                params: {
                    startDate: filter.startDate,
                    endDate: filter.endDate,
                    searchKey: filter.emp
                }
            });

            const category = res.data?.reportData || res.data?.data?.reportData || reportData;

            if (!category || category.length === 0) {
                toast.warning('No data available to export');
                setLoading(false);
                return;
            }

            const mappedData = category.map((item, index) => ({
                "Sr.No": index + 1,
                "Emp Code": item.EMPCode,
                "Employee Name": item.FirstName + " " + item.LastName,
                "Reporting Manager": item.ManagerName || '—',
                "From": item.VisitFrom || '—',
                "To": item.VisitTo || '—',
                "Purpose": item.VisitPurpose || '—',
                "Check In Time": item.PresentTimeIn || '—',
                "Check Out Time": item.PresentTimeOut || '—',
                "Check In Address": item.CheckInAddress || '—',
                "Check Out Address": item.CheckOutAddress || '—',
                "hasExpense": item.hasExpense || '—',
                "Distance(in KM)": item.Distance || '—'
            }));

            const ws = XLSX.utils.json_to_sheet(mappedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

            const fileName = (filter.emp !== 'all' && mappedData[0]?.["Employee Name"])
                ? `${mappedData[0]?.["Employee Name"]} Attendance Report.xlsx`
                : `Global Attendance Report.xlsx`;

            XLSX.writeFile(wb, fileName);
            toast.success('Excel file exported successfully');
        } catch (error) {
            toast.error('Export Failed');
            console.error(error);
        }
        setLoading(false);
    };

    const columns = [
        {
            name: 'Personnel Info',
            selector: r => `${r.FirstName || ''} ${r.LastName || ''}`,
            sortable: true,
            minWidth: '240px',
            cell: r => (
                <div className="flex items-center gap-3.5 py-4">
                    <div className="w-10 h-10 rounded-[0.8rem] bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        {r.FirstName?.charAt(0)}{r.LastName?.charAt(0)}
                    </div>
                    <div>
                        <div className="font-black text-slate-900 text-[13px] tracking-tight">{r.FirstName} {r.LastName}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-primary-500/70 uppercase tracking-widest leading-none">{r.EMPCode}</span>
                            <span className="text-[10px] text-slate-300">|</span>
                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{r.Designatation || ''}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            name: 'Movement',
            minWidth: '220px',
            cell: r => (
                <div className="space-y-1.5 py-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                        <span className="text-xs font-bold text-slate-700 max-w-[140px] truncate">{r.VisitFrom || 'Default Site'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
                        <span className="text-xs font-bold text-slate-700 max-w-[140px] truncate">{r.VisitTo || 'Assignment Site'}</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Check In',
            selector: r => r.PresentTimeIn,
            sortable: true,
            minWidth: '150px',
            cell: r => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${r.PresentTimeIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                        <Clock size={16} />
                    </div>
                    <div>
                        <div className={`text-xs font-black ${r.PresentTimeIn ? 'text-slate-900' : 'text-slate-300'}`}>{r.PresentTimeIn || '--:--'}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry</div>
                    </div>
                </div>
            )
        },
        {
            name: 'Check Out',
            selector: r => r.PresentTimeOut,
            sortable: true,
            minWidth: '150px',
            cell: r => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${r.PresentTimeOut ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-300'}`}>
                        <Clock size={16} />
                    </div>
                    <div>
                        <div className={`text-xs font-black ${r.PresentTimeOut ? 'text-slate-900' : 'text-slate-300'}`}>{r.PresentTimeOut || '--:--'}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Exit</div>
                    </div>
                </div>
            )
        },
        {
            name: 'Attendance Status',
            cell: r => <StatusBadge row={r} />,
            width: '140px',
            center: true
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <Loader show={loading} message="Analyzing Attendance" subMessage="Preparing detailed movement records..." />

            {/* Header Content */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-900 flex items-center justify-center">
                            <ClipboardList className="text-white" size={20} />
                        </div>
                        Attendance Report
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Detailed attendance and movement records</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportExcel}
                        disabled={loading || !reportData.length}
                        className="btn bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                        <Download size={14} /> Export Excel
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="card p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                        <label className="input-label">Select Employee</label>
                        <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500" size={16} />
                            <select
                                value={filter.emp}
                                onChange={e => setFilter({ ...filter, emp: e.target.value })}
                                className="input-field pl-12"
                            >
                                <option value="all">All Personnel</option>
                                {employees.map(e => <option key={e.EMPCode} value={e.EMPCode}>{e.FirstName} {e.LastName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="input-label">Start Date</label>
                        <input type="date" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} className="input-field" />
                    </div>

                    <div className="space-y-2">
                        <label className="input-label">End Date</label>
                        <input type="date" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} className="input-field" />
                    </div>

                    <div className="space-y-2">
                        <label className="input-label">Search Records</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500" size={16} />
                            <input type="text" placeholder="Name, code, site..." value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} className="input-field pl-12" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-50">
                    <button
                        onClick={() => { setFilter({ ...getMonthDates(), emp: 'all', search: '' }); setReportData([]); }}
                        className="text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> Reset Filters
                    </button>

                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="px-10 py-4 bg-primary-900 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest flex items-center gap-3 hover:bg-primary-800 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {loading ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="card-glass p-0 overflow-hidden">
                <div className="table-search-bar">
                    <TableSearch
                        value={filter.search}
                        onChange={e => setFilter({ ...filter, search: e.target.value })}
                        placeholder="Search attendance mapping…"
                    />
                    <div className="flex items-center gap-2">
                        <span className="badge badge-neutral">
                            <ClipboardList size={12} /> {reportData.length} records
                        </span>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={reportData.slice(page * perPage, (page + 1) * perPage)}
                    noHeader
                    responsive
                    highlightOnHover
                    customStyles={tableStyles}
                    progressPending={loading}
                    progressComponent={<PageLoader />}
                    noDataComponent={<TableEmpty icon={Database} title="Audits Pending" subtitle="Fetch data to generate attendance reports." />}
                />

                <TablePagination
                    total={reportData.length}
                    current={page}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={p => { setPerPage(p); setPage(0); }}
                />
            </div>
        </div>
    );
};

export default AttendanceReport;
