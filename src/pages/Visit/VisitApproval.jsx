import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import moment from 'moment';
import DataTable from 'react-data-table-component';
import ReactPaginate from 'react-paginate';
import { 
    Calendar, MapPin, FileText, Check, X, Search, User, 
    ClipboardCheck, Filter, RefreshCw, ChevronLeft, ChevronRight,
    Clock, AlertTriangle, TrendingUp
} from 'lucide-react';
import api from '../../utils/api';
import { useTableStyles } from '../../utils/tableStyles';
import Modal from '../../components/ui/Modal';

const VisitApproval = () => {
    const tableStyles = useTableStyles();
    const [pendingVisits, setPendingVisits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [rejectModal, setRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [searchValue, setSearchValue] = useState("");
    
    // Pagination states
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filter states
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        searchEMPCode: "all"
    });

    const fetchUsers = async () => {
        try {
            const result = await api.get('/v1/admin/visit_plan/get-user');
            setUsers(result.data.data.data.userData);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPendingVisits = async () => {
        setLoading(true);
        try {
            const result = await api.get('/v1/admin/visit_plan/get-all-pending-visits', {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    searchEMPCode: filters.searchEMPCode,
                    pageIndex: currentPage,
                    pageSize: rowsPerPage
                }
            });
            setPendingVisits(result.data.data.rows);
            setTotalItems(result.data.data.count);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load pending visits");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchPendingVisits();
    }, [filters, currentPage, rowsPerPage]);

    const handleAction = async (isApprove) => {
        const ids = selectedRows.map(row => row.VisitSummaryId);
        if (ids.length === 0) return;

        try {
            await api.post('/v1/admin/visit_plan/approve-disapprove-visit', {
                visitRequestId: ids,
                isApprove,
                rejectReason: !isApprove ? rejectReason : ""
            });
            toast.success(`Visits ${isApprove ? 'approved' : 'rejected'} successfully`);
            setRejectModal(false);
            setRejectReason("");
            setSelectedRows([]);
            fetchPendingVisits();
        } catch (err) {
            toast.error("Process failed, please try again");
        }
    };

    const resetFilters = () => {
        setFilters({
            startDate: "",
            endDate: "",
            searchEMPCode: "all"
        });
        setSearchValue("");
        setCurrentPage(0);
    };

    const CustomPagination = () => {
        const count = Math.ceil(totalItems / rowsPerPage);
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4 bg-white border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <span>Items per page:</span>
                        <select
                            className="bg-slate-50 border border-slate-100 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500/10"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(0);
                            }}
                        >
                            {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <span>
                        Showing {totalItems > 0 ? (currentPage * rowsPerPage) + 1 : 0} - {Math.min((currentPage + 1) * rowsPerPage, totalItems)} of {totalItems}
                    </span>
                </div>
                <ReactPaginate
                    previousLabel={<ChevronLeft size={16} />}
                    nextLabel={<ChevronRight size={16} />}
                    pageCount={count}
                    onPageChange={({ selected }) => setCurrentPage(selected)}
                    forcePage={currentPage}
                    containerClassName="flex items-center gap-1"
                    pageClassName="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                    activeClassName="bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-100"
                    previousClassName="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
                    nextClassName="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
                    disabledClassName="opacity-30 cursor-not-allowed"
                />
            </div>
        );
    };

    const columns = [
        {
            name: 'Employee info',
            minWidth: '240px',
            sortable: true,
            selector: row => row.EmployeeName,
            cell: row => (
                <div className="flex items-center gap-4 py-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                        <User size={18} className="text-slate-400" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 text-sm tracking-tight">{row.EmployeeName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-primary-50 text-[10px] font-black text-primary-600 tracking-wider">
                                {row.EMPCode}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            name: 'Visit Matrix',
            minWidth: '300px',
            cell: row => (
                <div className="py-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Calendar size={12} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                            {moment(row.VisitDate).format('DD MMMM, YYYY')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">({moment(row.VisitDate).fromNow()})</span>
                    </div>
                    <div className="flex items-center gap-2 group">
                        <MapPin size={12} className="text-primary-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-bold text-slate-500 tracking-tight">
                            {row.VisitFrom} <span className="text-slate-300 mx-1">→</span> {row.VisitTo}
                        </span>
                    </div>
                </div>
            )
        },
        {
            name: 'Audit / Purpose',
            selector: row => row.VisitPurpose,
            minWidth: '250px',
            cell: row => (
                <div className="flex items-start gap-3 py-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-50 text-slate-400">
                        <FileText size={14} />
                    </div>
                    <div>
                        <span className="text-xs font-medium text-slate-600 leading-relaxed block max-w-[200px]">
                            {row.VisitPurpose || "No purpose specified"}
                        </span>
                    </div>
                </div>
            )
        }
    ];

    const filteredData = pendingVisits.filter(row => 
        row.EmployeeName.toLowerCase().includes(searchValue.toLowerCase()) ||
        row.VisitPurpose.toLowerCase().includes(searchValue.toLowerCase()) ||
        row.EMPCode.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center shadow-xl shadow-orange-100 transition-transform hover:scale-105">
                            <ClipboardCheck className="text-white" size={24} />
                        </div>
                        Approval Center
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={12} /> Pending Reviews: <span className="text-orange-600">{totalItems}</span>
                        </p>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp size={12} /> Compliance: <span className="text-emerald-600">Active</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selectedRows.length > 0 && (
                        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 animate-in slide-in-from-right duration-300">
                            <button
                                onClick={() => handleAction(true)}
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                <Check size={14} /> Batch Approve ({selectedRows.length})
                            </button>
                            <button
                                onClick={() => setRejectModal(true)}
                                className="px-5 py-2.5 bg-white text-rose-600 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-2"
                            >
                                <X size={14} /> Deny
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Visits</div>
                        <div className="text-2xl font-black text-slate-900">{totalItems} Visits</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Employees</div>
                        <div className="text-2xl font-black text-slate-900">{users.length} Active</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Year</div>
                        <div className="text-2xl font-black text-slate-900">{new Date().getFullYear()} Target</div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex flex-wrap items-end gap-6">
                    <div className="space-y-2.5 flex-1 min-w-[240px]">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                            <User size={12} /> Select Employee
                        </label>
                        <select
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all shadow-inner"
                            value={filters.searchEMPCode}
                            onChange={(e) => {
                                setFilters(f => ({ ...f, searchEMPCode: e.target.value }));
                                setCurrentPage(0);
                            }}
                        >
                            <option value="all">Across All Personnel</option>
                            {users.map(u => (
                                <option key={u.EMPCode} value={u.EMPCode}>{u.FirstName} {u.LastName} ({u.EMPCode})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                            <Calendar size={12} /> Start Range
                        </label>
                        <input
                            type="date"
                            className="bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all shadow-inner"
                            value={filters.startDate}
                            onChange={(e) => {
                                setFilters(f => ({ ...f, startDate: e.target.value }));
                                setCurrentPage(0);
                            }}
                        />
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                            <Calendar size={12} /> End Range
                        </label>
                        <input
                            type="date"
                            className="bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all shadow-inner"
                            value={filters.endDate}
                            onChange={(e) => {
                                setFilters(f => ({ ...f, endDate: e.target.value }));
                                setCurrentPage(0);
                            }}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={resetFilters}
                            className="p-3.5 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-2xl transition-all shadow-inner"
                            title="Reset Controls"
                        >
                            <RefreshCw size={22} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Quick search across visible results..."
                            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary-500/5 transition-all"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </div>
                </div>

                <div className="react-data-table-container">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        selectableRows
                        onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                        progressPending={loading}
                        progressComponent={
                            <div className="p-32 flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-slate-100"></div>
                                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Synchronizing Recordset</p>
                            </div>
                        }
                        customStyles={tableStyles}
                        highlightOnHover
                        noHeader
                        responsive
                        noDataComponent={
                            <div className="p-32 text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Check size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">System Fully Compliant</h3>
                                <p className="text-slate-500 text-sm font-medium mt-2 max-w-xs mx-auto">All visit requests have been processed. No pending entities located in current context.</p>
                                <button onClick={resetFilters} className="mt-8 text-primary-600 font-bold text-xs uppercase tracking-widest hover:text-primary-700 transition-colors">Refresh Search</button>
                            </div>
                        }
                    />
                    <CustomPagination />
                </div>
            </div>

            {/* Reject Modal */}
            <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Audit Reject Protocol">
                <div className="p-2 space-y-6">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800">
                        <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                        <div className="text-sm">
                            <span className="font-bold block mb-1">Attention Required</span>
                            You are about to deny <span className="font-bold underline decoration-rose-300 underline-offset-4">{selectedRows.length} visit record(s)</span>. This action will be logged in the audit trail.
                        </div>
                    </div>
                    
                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rejection Rationale</label>
                        <textarea
                            className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/5 resize-none h-40 text-sm font-medium shadow-inner"
                            placeholder="Specify internal reason for denial..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button 
                            onClick={() => setRejectModal(false)} 
                            className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Abort
                        </button>
                        <button 
                            onClick={() => handleAction(false)} 
                            className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-rose-100 hover:bg-rose-700 hover:-translate-y-0.5 transition-all"
                        >
                            Confirm Denial
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default VisitApproval;
