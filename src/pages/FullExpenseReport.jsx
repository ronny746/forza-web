import React, { useState, useEffect } from 'react';
import { 
    FileSpreadsheet, Search, Calendar, Users, Filter, 
    ArrowRight, CheckCircle2, Clock, PauseCircle, ChevronRight,
    BarChart3, RefreshCw, Download
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import api from '../utils/api';
import { useTableStyles } from '../utils/tableStyles';
import { PageLoader } from '../components/ui/TableComponents';

const FullExpenseReport = () => {
    const baseStyles = useTableStyles();
    // Override global hide-pagination
    const tableStyles = {
        ...baseStyles,
        pagination: { style: { display: 'flex', borderTop: '1px solid #f1f5f9' } }
    };

    // -- State --
    const [rows, setRows] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const [filter, setFilter] = useState({
        emp: 'all',
        startDate: `${new Date().getFullYear()}-01-01`,
        endDate: new Date().toISOString().split('T')[0],
        status: 'all',
        search: ''
    });

    // -- Fetch Data --
    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = {
                searchKey: filter.search || '',
                empCode: filter.emp === 'all' ? '' : filter.emp,
                startDate: filter.startDate,
                endDate: filter.endDate
            };
            
            // We use the new dedicated full-report endpoint
            const res = await api.get('/v1/admin/expense/full-expense-report', { params });
            const data = res.data?.data || [];
            setRows(data);
        } catch (err) {
            toast.error('Failed to fetch full report');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReport();
    }, [filter.emp, filter.startDate, filter.endDate]);

    useEffect(() => {
        api.get('/v1/admin/user_details/get-all-user')
            .then(res => setEmployees(res.data?.data?.data?.userData || []))
            .catch(() => { });
    }, []);

    // -- Export --
    const exportExcel = () => {
        if (!rows.length) return toast.warning('No data to export');
        setExportLoading(true);
        try {
            const mapped = rows.map((r, i) => ({
                'S.No': i + 1,
                'Expense Date': r.ExpenseDate || r.Date || '—',
                'EMP Code': r.EmployeeId || r.EMPCode || '—',
                'Employee Name': r.EmployeeName || '—',
                'Expense Type': r.ExpenseType || '—',
                'Details': r.Details || r.Reason || '—',
                'Route': `${r.VisitFrom || ''} to ${r.VisitTo || ''}`,
                'Purpose': r.Purpose || '—',
                'Visit Remarks': r.VisitRemarks || '—',
                'Visit Period': `${r.VisitFromDate || '—'} to ${r.VisitToDate || '—'}`,
                'Total Amount': Number(r.TotalAmount || 0),
                'Paid Amount': Number(r.PaidAmount || 0),
                'Pending Amount': Number(r.PendingAmount || 0),
                'Distance (KM)': r.Distance || '—',
                'Rate': r.Rate || '—',
                'Reason': r.ExpenseReason || '—',
                'Payment Status': r.PaymentStatus || 'Unpaid',
                'Paid Date': r.PaidAt || '—',
                'Paid By': r.PaidByName || '—',
                'Payment Remarks': r.PaymentRemarks || '—',
                'Manager Status': r.ManagerStatus || '—',
                'Approved By': r.ApprovedByName || '—',
                'Manager Reject Reason': r.ManagerRejectReason || '—',
                'HR Status': r.HrStatus || 'Pending',
                'HR Hold Reason': r.HrHoldReason || '—'
            }));

            const ws = XLSX.utils.json_to_sheet(mapped);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Full Expense Report');
            XLSX.writeFile(wb, `Full_Expense_Report_${filter.startDate}_to_${filter.endDate}.xlsx`);
            toast.success('Excel exported ✓');
        } catch (err) {
            toast.error('Excel export failed');
        }
        setExportLoading(false);
    };

    // -- Table Columns --
    const columns = [
        {
            name: 'Date',
            selector: r => r.ExpenseDate,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Employee',
            selector: r => r.EmployeeName,
            sortable: true,
            cell: r => (
                <div className="py-2">
                    <p className="font-bold text-gray-800 leading-tight">{r.EmployeeName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{r.EmployeeId}</p>
                </div>
            ),
            width: '170px'
        },
        {
            name: 'Expense Info',
            selector: r => r.ExpenseType,
            cell: r => (
                <div className="py-2">
                    <p className="font-bold text-blue-600 text-[11px] mb-0.5">{r.ExpenseType}</p>
                    <p className="text-[9px] text-gray-400 italic max-w-[140px] truncate">{r.Purpose || '—'}</p>
                </div>
            ),
            width: '160px'
        },
        {
            name: 'Route',
            selector: r => r.VisitFrom,
            cell: r => (
                <div className="text-[10px] font-medium text-gray-600">
                    {r.VisitFrom} → {r.VisitTo}
                </div>
            ),
            width: '180px'
        },
        {
            name: 'Amount',
            selector: r => r.TotalAmount,
            sortable: true,
            cell: r => (
                <div className="font-black text-gray-900 border-l-4 border-slate-100 pl-3 py-1">
                    ₹{Number(r.TotalAmount || 0).toLocaleString()}
                </div>
            ),
            width: '110px'
        },
        {
            name: 'Manager',
            selector: r => r.ManagerStatus,
            cell: r => (
                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight
                    ${r.ManagerStatus === 'Approved' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-50 text-gray-400 border border-gray-100 uppercase'}`}>
                    {r.ManagerStatus || 'Pending'}
                </span>
            ),
            width: '100px'
        },
        {
            name: 'HR Desk',
            selector: r => r.HrStatus,
            cell: r => (
                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight
                    ${r.HrStatus === 'Released' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                      r.HrStatus === 'Hold' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                      'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                    {r.HrStatus || 'Pending'}
                </span>
            ),
            width: '100px'
        },
        {
            name: 'Payment',
            selector: r => r.PaymentStatus,
            cell: r => (
                <div className="flex flex-col items-start gap-1">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight
                        ${r.PaymentStatus === 'Paid' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-gray-100 text-gray-500 border border-gray-100'}`}>
                        {r.PaymentStatus || 'Unpaid'}
                    </span>
                    {r.PaidAt && <p className="text-[8px] text-gray-400 font-bold">{r.PaidAt.split(' ')[0]}</p>}
                </div>
            ),
            width: '105px'
        }
    ];

    const filteredRows = rows.filter(r => 
        (r.EmployeeName || '').toLowerCase().includes(filter.search.toLowerCase()) ||
        (r.EmployeeId || '').toLowerCase().includes(filter.search.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200">
                            <BarChart3 size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Full Expense Report</h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Comprehensive analysis and excel export of all employee expenses</p>
                </div>

                <button 
                    onClick={exportExcel}
                    disabled={exportLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                >
                    {exportLoading ? <RefreshCw className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                    EXPORT TO EXCEL
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 border-b-4 border-b-primary-600">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Employee */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            <Users size={12} className="text-primary-500" /> Employee
                        </label>
                        <select 
                            value={filter.emp}
                            onChange={(e) => setFilter({...filter, emp: e.target.value})}
                            className="w-full p-3 rounded-2xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                        >
                            <option value="all">ALL EMPLOYEES</option>
                            {employees.map(u => (
                                <option key={u.EMPCode} value={u.EMPCode}>{u.FirstName} {u.LastName} ({u.EMPCode})</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            <Calendar size={12} className="text-primary-500" /> Date Period (Visit From - To)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                type="date"
                                min={`${new Date().getFullYear()}-01-01`}
                                value={filter.startDate}
                                onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                                className="w-full p-3 rounded-2xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="relative">
                                <input 
                                    type="date"
                                    min={`${new Date().getFullYear()}-01-01`}
                                    value={filter.endDate}
                                    onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                                    className="w-full p-3 rounded-2xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            <Search size={12} className="text-primary-500" /> Quick Search
                        </label>
                        <input 
                            type="text"
                            placeholder="Type name or code..."
                            value={filter.search}
                            onChange={(e) => setFilter({...filter, search: e.target.value})}
                            className="w-full p-3 rounded-2xl bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                <DataTable
                    columns={columns}
                    data={filteredRows}
                    pagination
                    paginationPerPage={15}
                    paginationRowsPerPageOptions={[15, 30, 50, 100]}
                    progressPending={loading}
                    progressComponent={<PageLoader />}
                    customStyles={tableStyles}
                    highlightOnHover
                    pointerOnHover
                    noDataComponent={
                        <div className="py-20 text-center">
                            <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-300 mb-4">
                                <BarChart3 size={32} />
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No records found for selected criteria</p>
                        </div>
                    }
                />
                
                {!loading && filteredRows.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center sm:px-8">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-0.5">
                                Showing {filteredRows.length} total entries
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FullExpenseReport;
