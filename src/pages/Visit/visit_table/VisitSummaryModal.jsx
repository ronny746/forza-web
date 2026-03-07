import React, { useState, useEffect, useMemo } from 'react';
import ReactPaginate from 'react-paginate';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import DataTable from 'react-data-table-component';
import { Search, ChevronDown, Check, X, ArrowLeft, Calendar, MapPin, FileText, AlertCircle } from 'lucide-react';
import api from '../../../utils/api';
import Modal from '../../../components/ui/Modal';
import { useTableStyles } from '../../../utils/tableStyles';

const SearchComponent = ({ searchValue, handleSearch }) => {
    return (
        <div className="relative group w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
                type="search"
                placeholder="Search by location, purpose..."
                value={searchValue}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-bg focus:outline-none focus:border-primary-500 transition-colors dark:text-white shadow-sm"
            />
        </div>
    );
};

const VisitSummaryModal = ({ visitSummaryData, setVisitSummaryData }) => {
    const tableStyles = useTableStyles();
    let { id } = useParams();

    const [category, setCategory] = useState([]);
    const [render, setRender] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [toggleCleared, setToggleCleared] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, SetTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [category1, setCategory1] = useState([]);

    const isCheckboxDisabled = (row) => {
        return row.approvedStatus === "Approved" || row.approvedStatus === "Rejected" || !visitSummaryData?.isManager;
    };

    const approveRejectLeave = async (isApprove, id = "") => {
        const ids = selectedRows.map((item) => item.VisitSummaryId);
        try {
            await api.post('/v1/admin/visit_plan/approve-disapprove-visit', {
                visitRequestId: ids,
                isApprove: isApprove,
                rejectReason: rejectReason
            });
            setRender((prev) => !prev);
            setToggleCleared(true);
            setSelectedRows([]);
            setVisible(false);
            setRejectReason("");
            toast.success("Visit accept or reject successfully");
        } catch (err) {
            console.error(err);
            toast.error("Visit accept or reject unsuccessfully");
        }
    };

    const [checkList, setCheckList] = useState({
        srNo: true,
        postNameCheck: true,
    });

    const handleSearch = async (event) => {
        setSearchValue(event.target.value);
        setRender((prev) => !prev);
    };

    const getVisit = async () => {
        setLoading(true);
        try {
            const result = await api.get('/v1/admin/visit_plan/get-visit-summary', {
                params: {
                    searchKey: searchValue,
                    pageIndex: currentPage,
                    pageSize: rowsPerPage,
                    VisitId: visitSummaryData.VisitId,
                },
            });
            if (currentPage === 0) {
                SetTotalItems(result.data.data.count);
            }
            setCategory1(result.data.data.rows);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        getVisit();
    }, [render, currentPage, rowsPerPage]);

    const columns = [
        {
            name: 'S.No',
            selector: (row, index) => index + (currentPage * rowsPerPage) + 1,
            center: true,
            omit: !checkList.srNo,
            sortable: true,
            width: '80px',
            cell: (row, index) => <span className="font-semibold text-primary-600 dark:text-primary-400">{index + (currentPage * rowsPerPage) + 1}</span>
        },
        {
            name: "Visit Date",
            selector: row => row.VisitDate,
            sortable: true,
            omit: !checkList.postNameCheck,
            minWidth: "160px",
            cell: row => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shrink-0">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {moment(row.VisitDate).format('DD-MM-YYYY')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {moment(row.VisitDate).format('dddd')}
                        </div>
                    </div>
                </div>
            )
        },
        {
            name: "From Location",
            selector: row => row.VisitFrom,
            sortable: true,
            omit: !checkList.postNameCheck,
            minWidth: "180px",
            cell: row => (
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500" />
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {row.VisitFrom}
                    </span>
                </div>
            )
        },
        {
            name: "To Location",
            selector: row => row.VisitTo,
            sortable: true,
            omit: !checkList.postNameCheck,
            minWidth: "180px",
            cell: row => (
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-amber-500" />
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {row.VisitTo}
                    </span>
                </div>
            )
        },
        {
            name: "Visit Purpose",
            selector: row => row.VisitPurpose,
            sortable: true,
            omit: !checkList.postNameCheck,
            minWidth: "200px",
            cell: row => (
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {row.VisitPurpose}
                    </span>
                </div>
            )
        },
        {
            name: "Status",
            selector: row => row.approvedStatus,
            sortable: true,
            center: true,
            omit: !checkList.postNameCheck,
            minWidth: "140px",
            cell: row => (
                <div>
                    {row.approvedStatus === "Pending" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span> Pending
                        </span>
                    )}
                    {row.approvedStatus === "Approved" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Check size={12} /> Approved
                        </span>
                    )}
                    {row.approvedStatus === "Rejected" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <X size={12} /> Rejected
                        </span>
                    )}
                </div>
            )
        },
    ];

    const handleChange = ({ selectedRows }) => {
        setSelectedRows(selectedRows);
    };

    const contextActions = useMemo(() => {
        return (
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Delete
            </button>
        );
    }, [selectedRows, toggleCleared]);

    const CustomPagination = () => {
        const count = Number(Math.ceil(totalItems / rowsPerPage));
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4 border-t border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <span className="font-medium whitespace-nowrap">Rows per page:</span>
                        <select
                            className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded px-2 py-1 outline-none focus:border-primary-500"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(0);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <span className="font-medium whitespace-nowrap">
                        Showing {category1?.length ? (currentPage * rowsPerPage) + 1 : 0} - {Math.min((currentPage + 1) * rowsPerPage, totalItems)} of {totalItems}
                    </span>
                </div>
                <ReactPaginate
                    previousLabel="‹"
                    nextLabel="›"
                    pageCount={count}
                    forcePage={currentPage}
                    onPageChange={(page) => setCurrentPage(page.selected)}
                    containerClassName="flex items-center gap-1"
                    pageLinkClassName="px-3 py-1 rounded-md border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                    activeLinkClassName="bg-primary-600 text-white border-primary-600 hover:bg-primary-700 font-medium"
                    previousLinkClassName="px-3 py-1 rounded-md border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                    nextLinkClassName="px-3 py-1 rounded-md border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                    disabledLinkClassName="opacity-50 cursor-not-allowed"
                />
            </div>
        );
    };


    return (
        <>
            <Modal
                isOpen={visible}
                onClose={() => setVisible(false)}
                title="Reject Visit Request"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400">
                        <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">Are you sure you want to reject this visit request? Please provide a reason below.</p>
                    </div>
                    <textarea
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        value={rejectReason}
                        className="input-field w-full resize-none"
                        placeholder="Enter reason for rejection..."
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border mt-6">
                        <button
                            onClick={() => setVisible(false)}
                            className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => approveRejectLeave(0)}
                            className="px-4 py-2 font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl flex items-center gap-2 transition-colors shadow-red-500/30 shadow-md"
                        >
                            <X size={16} /> Yes, Reject
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-6">
                <div>
                    <button
                        onClick={() => { setVisitSummaryData((prev) => ({ ...prev, isOpenSummary: false })) }}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card rounded-xl font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Visit Plans
                    </button>
                </div>

                <div className="card-glass overflow-hidden shadow-md">
                    <div className="p-6 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <SearchComponent searchValue={searchValue} handleSearch={handleSearch} />
                            <div className="flex items-center gap-3">
                                {selectedRows.length > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-sm font-semibold text-primary-800 dark:text-primary-400">
                                        {selectedRows.length} Selected
                                    </span>
                                )}
                                {selectedRows.length > 0 && visitSummaryData?.isManager && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => approveRejectLeave(1)}
                                            className="px-4 py-2 font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center gap-2 transition-colors shadow-emerald-500/30 shadow-md"
                                        >
                                            <Check size={16} /> Approve
                                        </button>
                                        <button
                                            onClick={() => setVisible(true)}
                                            className="px-4 py-2 font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl flex items-center gap-2 transition-colors shadow-red-500/30 shadow-md"
                                        >
                                            <X size={16} /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="react-data-table-container dark:bg-dark-card border-none">
                        <DataTable
                            columns={columns}
                            data={category1}
                            noHeader
                            responsive
                            paginationServer
                            selectableRows
                            highlightOnHover
                            selectableRowsHighlight
                            onSelectedRowsChange={handleChange}
                            contextActions={contextActions}
                            clearSelectedRows={toggleCleared}
                            progressPending={loading}
                            customStyles={tableStyles}
                            selectableRowDisabled={isCheckboxDisabled}
                            noDataComponent={
                                <div className="p-16 text-center flex flex-col items-center">
                                    <Calendar size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No visit summary found</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">This visit plan has no details yet.</p>
                                </div>
                            }
                        />
                        <CustomPagination />
                    </div>
                </div>
            </div>
        </>
    );
};

export default VisitSummaryModal;
