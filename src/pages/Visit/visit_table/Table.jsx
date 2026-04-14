import React, { useState, useEffect, useMemo } from 'react';
import ReactPaginate from 'react-paginate';
import { useFormik } from 'formik';
import * as XLSX from 'xlsx';
import moment from 'moment';
import { ChevronDown, Upload, Download, Eye, Calendar, User, MapPin, FileText, Search, RefreshCw, X, Check, FileSpreadsheet, Building2, Info } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { toast } from 'react-toastify';
import api from '../../../utils/api';
import { downloadTemplate } from '../../../utils/template_func';
import Preview from './Preview';
import FilterVisitModal from './FilterVisitModal';
import { useTableStyles } from '../../../utils/tableStyles';

const SearchComponent = ({ searchValue, handleSearch }) => {
    return (
        <div className="relative group w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
                type="search"
                placeholder="Search history..."
                value={searchValue}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all"
            />
        </div>
    );
};

const Table = ({ visitSummaryData, setVisitSummaryData }) => {
    const tableStyles = useTableStyles();
    const [render, setRender] = useState(false);
    const [masterRender, setMasterRender] = useState(false);
    const [filterData, setFilterData] = useState({
        startDate: '',
        endDate: '',
        EMPCode: 'all',
    });
    const [category, setCategory] = useState([]);
    const [notValid, setNotValid] = useState(false);
    const [user, setUsers] = useState([]);
    const [singleUser, setSingleUser] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [planned, setPlanned] = useState('1');
    const [selectedRows, setSelectedRows] = useState([]);
    const [toggleCleared, setToggleCleared] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, SetTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [excelFile, setExcelFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [validatedData, setValidatedData] = useState(null);

    const handleSearch = (event) => {
        setSearchValue(event.target.value);
    };

    // Format date from Excel
    const formatDateFromExcel = (dateValue) => {
        if (!dateValue) return '';

        // If it's already a string in DD/MM/YYYY or DD-MM-YYYY format
        if (typeof dateValue === 'string') {
            const parsed = moment(dateValue, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD']);
            if (parsed.isValid()) {
                return parsed.format('DD-MM-YYYY');
            }
        }

        // If it's a Date object or timestamp
        if (dateValue instanceof Date) {
            return moment(dateValue).format('DD-MM-YYYY');
        }

        // Try to parse as number (Excel serial date)
        if (typeof dateValue === 'number') {
            const date = moment('1899-12-30').add(dateValue, 'days');
            if (date.isValid()) {
                return date.format('DD-MM-YYYY');
            }
        }

        return '';
    };

    const validateDate = (FromDate, ToDate) => {
        if (!excelFile || excelFile.length === 0) {
            toast.error('Please upload visit file');
            return null;
        }
        if (!FromDate || !ToDate) {
            toast.error('Please choose From Date and To Date');
            return null;
        }

        const mFrom = moment(FromDate).startOf('day');
        const mTo = moment(ToDate).endOf('day');

        // Format dates in excel file
        const updatedVisits = excelFile.map((visit) => ({
            ...visit,
            VisitDate: formatDateFromExcel(visit.VisitDate),
        }));

        // Validate all visits
        for (const row of updatedVisits) {
            if (!row.VisitDate) {
                toast.error(`Invalid or missing date in row: ${row.SrNo || 'unknown'}`);
                return null;
            }

            const mVisit = moment(row.VisitDate, 'DD-MM-YYYY');
            if (!mVisit.isValid()) {
                toast.error(`Invalid date format found: ${row.VisitDate}`);
                return null;
            }
            if (mVisit.isBefore(mFrom) || mVisit.isAfter(mTo)) {
                toast.error(`Visit Date (${row.VisitDate}) must be between ${mFrom.format('DD-MM-YYYY')} and ${mTo.format('DD-MM-YYYY')}`);
                return null;
            }
        }

        // Store validated data
        setValidatedData(updatedVisits);
        return updatedVisits;
    };

    const initialValues = {
        EmpCode: '',
        FromDate: '',
        ToDate: '',
    };

    const formik = useFormik({
        initialValues,
        onSubmit: async (values, { resetForm }) => {
            const dataToUpload = validateDate(values.FromDate, values.ToDate);
            if (!dataToUpload) {
                return;
            }
            setLoading(true);
            try {
                await api.post('/v1/admin/visit_plan/create-visit', {
                    values,
                    excelData: dataToUpload,
                });
                setRender((prev) => !prev);
                toast.success('Visit created successfully');
                resetForm();
                setExcelFile(null);
                setValidatedData(null);
                setNotValid(false);
                const fileInput = document.getElementById('excel_pdf');
                if (fileInput) fileInput.value = '';
            } catch (error) {
                console.error(error);
                toast.error('Sorry, try again or check all field');
            }
            setLoading(false);
        },
    });

    const handleRefreshForm = () => {
        formik.resetForm();
        setSingleUser(null);
        setExcelFile(null);
        setValidatedData(null);
        setNotValid(false);
        const fileInput = document.getElementById('excel_pdf');
        if (fileInput) fileInput.value = '';
        toast.info('Form cleared');
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFilterData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
        setMasterRender((prev) => !prev);
    };

    const getAllUser = async () => {
        try {
            const result = await api.get('/v1/admin/visit_plan/get-user');
            setUsers(result.data.data.data.userData);
        } catch (err) {
            console.error(err);
        }
    };

    const getUserById = async (empId) => {
        formik.setFieldValue('EmpCode', empId);
        try {
            const result = await api.get('/v1/admin/visit_plan/get-user-by-id', {
                params: { EMPCode: empId },
            });
            setSingleUser(result.data.data.data.userData[0]);
        } catch (err) {
            console.error(err);
        }
    };

    const getVisit = async () => {
        setLoading(true);
        try {
            const result = await api.get('/v1/admin/visit_plan/get-visit', {
                params: {
                    searchKey: searchValue,
                    pageIndex: currentPage,
                    pageSize: rowsPerPage,
                    planned: planned,
                    searchEMPCode: filterData.EMPCode,
                    startDate: filterData.startDate,
                    endDate: filterData.endDate,
                },
            });
            if (currentPage === 0) SetTotalItems(result.data.data.data.userData.count);
            setCategory(result.data.data.data.userData.rows);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        getAllUser();
    }, []);

    useEffect(() => {
        getVisit();
    }, [render, masterRender, searchValue, planned, currentPage, rowsPerPage]);

    const handleSelectExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);

                if (rawData.length > 0) {
                    // Fuzzy mapping of common headers to expected keys
                    const mapKey = (key) => {
                        const k = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (k === 'empcode' || k === 'empid' || k === 'employeeid' || k === 'employeecode') return 'EMPCode';
                        if (k === 'firstname' || k === 'fname' || k === 'first') return 'FirstName';
                        if (k === 'lastname' || k === 'lname' || k === 'last') return 'LastName';
                        if (k === 'visitdate' || k === 'date' || k === 'vdate') return 'VisitDate';
                        if (k === 'visitfrom' || k === 'from' || k === 'origin' || k === 'start' || k === 'startlocation') return 'VisitFrom';
                        if (k === 'visitto' || k === 'to' || k === 'destination' || k === 'end' || k === 'endlocation') return 'VisitTo';
                        if (k === 'visitpurpose' || k === 'purpose' || k === 'reason' || k === 'remarks') return 'VisitPurpose';
                        return key;
                    };

                    const processedData = rawData.map(row => {
                        const newRow = {};
                        Object.keys(row).forEach(key => {
                            newRow[mapKey(key)] = row[key];
                        });
                        return newRow;
                    });

                    setExcelFile(processedData);
                    setValidatedData(null);
                    setNotValid(false);
                    setShowPreview(true);
                    toast.success(`✅ Loaded ${processedData.length} records. Review in editor.`);
                } else {
                    toast.error('❌ Excel file is empty');
                }
            } catch (error) {
                console.error(error);
                toast.error('❌ Error reading Excel file');
            }
        };
        reader.readAsBinaryString(file);
    };

    const columns = [
        {
            name: '#',
            width: '60px',
            center: true,
            cell: (row, index) => <span className="font-bold text-slate-400">{currentPage * rowsPerPage + index + 1}</span>,
        },
        {
            name: 'Employee info',
            minWidth: '220px',
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold shadow-sm">
                        {row.FirstName?.[0]}{row.LastName?.[0]}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{row.FirstName} {row.LastName}</div>
                        <div className="text-[11px] font-black text-primary-600 uppercase tracking-wider">{row.EMPCode}</div>
                    </div>
                </div>
            ),
        },
        {
            name: 'Plan Details',
            minWidth: '200px',
            cell: (row) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar size={13} className="text-slate-400" />
                        <span className="text-xs font-bold">{moment(row.FromDate).format('DD MMM')} — {moment(row.ToDate).format('DD MMM, YYYY')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${Number(row.isPlanned) === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {Number(row.isPlanned) === 1 ? 'Planned' : 'Unplanned'}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            name: 'Uploaded on',
            selector: (row) => row.createdAt,
            sortable: true,
            width: '180px',
            cell: (row) => (
                <div className="text-xs font-bold text-slate-500">
                    <div>{row.createdAt ? moment(row.createdAt).format('DD/MM/YYYY') : '--'}</div>
                    <div className="text-[10px] opacity-60 font-medium">{row.createdAt ? moment(row.createdAt).format('hh:mm A') : '--:--'}</div>
                </div>
            ),
        },
        {
            name: 'Action',
            center: true,
            width: '100px',
            cell: (row) => (
                <button
                    onClick={() => {
                        setVisitSummaryData({
                            VisitId: row.VisitId,
                            DesigId: row.DesigId,
                            adminId: row.adminId,
                            isManager: row.isManager,
                            isOpenSummary: true,
                        });
                    }}
                    className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-600 hover:text-white rounded-xl transition-all"
                    title="View Summary"
                >
                    <Eye size={18} />
                </button>
            ),
        },
    ];

    const handleChange = ({ selectedRows }) => {
        setSelectedRows(selectedRows);
    };

    const contextActions = useMemo(() => {
        return (
            <button className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Delete Selected
            </button>
        );
    }, [selectedRows, toggleCleared]);

    const CustomPagination = () => {
        const count = Number(Math.ceil(totalItems / rowsPerPage));
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 gap-4 bg-slate-50/50 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                        <span className="uppercase tracking-widest opacity-60">Per Page:</span>
                        <select
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500/10"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(0);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <span className="opacity-60 uppercase tracking-widest">
                        Total {totalItems} Items
                    </span>
                </div>
                <ReactPaginate
                    previousLabel="‹"
                    nextLabel="›"
                    pageCount={count}
                    forcePage={currentPage}
                    onPageChange={(page) => setCurrentPage(page.selected)}
                    containerClassName="flex items-center gap-1"
                    pageLinkClassName="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold hover:bg-white transition-all text-slate-600"
                    activeLinkClassName="!bg-primary-600 !text-white !border-primary-600"
                    previousLinkClassName="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold hover:bg-white transition-all text-slate-600"
                    nextLinkClassName="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold hover:bg-white transition-all text-slate-600"
                    disabledLinkClassName="opacity-30 cursor-not-allowed"
                />
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-100">
                            <MapPin className="text-white" size={20} />
                        </div>
                        Visit Planner
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Configure field visits and upload execution plans</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Building2 size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Unit</p>
                            <p className="text-sm font-bold text-slate-700">Manesar HQ</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Form Card (Admin / Manager side) */}
                <div className="lg:col-span-8 card p-8 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                        <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                            <FilePlus2Icon size={18} />
                        </div>
                        <h3 className="font-bold text-slate-800">Create New Execution Plan</h3>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="space-y-8">

                        {/* Employee Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="input-label">Select Employee</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                                    <select
                                        name="EmpCode"
                                        value={formik.values.EmpCode}
                                        onChange={(e) => {
                                            formik.setFieldValue('EmpCode', e.target.value);
                                            getUserById(e.target.value);
                                        }}
                                        className="input-field pl-12"
                                    >
                                        <option value="">Choose an employee...</option>
                                        {user?.map((item) => (
                                            <option key={item.EMPCode} value={item.EMPCode}>
                                                {item.FirstName} {item.LastName} ({item.EMPCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {formik.touched.EmpCode && formik.errors.EmpCode && (
                                    <p className="text-rose-500 text-[11px] font-bold uppercase tracking-wider pl-1">{formik.errors.EmpCode}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="input-label">Designation</label>
                                    <input type="text" disabled value={singleUser?.Designatation || '—'} className="input-field bg-slate-50 font-bold text-slate-500 border-dashed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="input-label">Dept</label>
                                    <input type="text" disabled value={singleUser?.Department || '—'} className="input-field bg-slate-50 font-bold text-slate-500 border-dashed" />
                                </div>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="input-label">Execution Start</label>
                                <input
                                    type="date"
                                    {...formik.getFieldProps('FromDate')}
                                    className="input-field"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="input-label">Execution End</label>
                                <input
                                    type="date"
                                    {...formik.getFieldProps('ToDate')}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        {/* File Upload Area */}
                        <div className="space-y-4">
                            <label className="input-label">Upload Detailed Plan (.xlsx)</label>
                            <div className={`
                                border-2 border-dashed rounded-[2rem] p-10 text-center transition-all group
                                ${excelFile ? 'border-emerald-200 bg-emerald-50/20' : 'border-primary-100 bg-primary-50/10 hover:border-primary-300 hover:bg-primary-50/30'}
                            `}>
                                <input
                                    type="file"
                                    id="excel_pdf"
                                    accept=".xls,.xlsx"
                                    onChange={handleSelectExcel}
                                    className="hidden"
                                />
                                <label htmlFor="excel_pdf" className="cursor-pointer">
                                    <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${excelFile ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-100 text-primary-600'}`}>
                                        {excelFile ? <Check size={32} /> : <FileSpreadsheet size={32} />}
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">
                                        {excelFile ? `✅ ${excelFile.length} Visits Loaded - Ready to Edit` : 'Click to browse files or drag here'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Only .xlsx or .xls formats supported</p>
                                </label>

                                {notValid && (
                                    <p className="text-rose-500 text-xs font-bold mt-4 animate-shake">Invalid format. Please use Excel file with visit dates.</p>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => downloadTemplate('visit')}
                                    className="inline-flex items-center gap-2 px-6 py-2 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-slate-200"
                                >
                                    <Download size={14} /> Download Sample Template
                                </button>
                            </div>
                        </div>

                        {/* Form Submission Actions */}
                        <div className="pt-6 flex items-center justify-between border-t border-slate-50">
                            <button
                                type="button"
                                onClick={handleRefreshForm}
                                className="flex items-center gap-2 text-slate-400 hover:text-rose-500 text-sm font-bold transition-colors"
                            >
                                <RefreshCw size={16} /> Reset Form
                            </button>

                            <div className="flex items-center gap-3">
                                <Preview
                                    visitData={excelFile}
                                    setVisitData={setExcelFile}
                                    forceOpen={showPreview}
                                    setForceOpen={setShowPreview}
                                    onDataUpdate={(updatedData) => {
                                        setExcelFile(updatedData);
                                        setValidatedData(null);
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !excelFile || excelFile.length === 0}
                                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
                                    {loading ? 'SYCHRONIZING...' : 'AUTHORIZE & UPLOAD'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sidebar Info / FAQ */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="card p-6 bg-primary-50/50 border-primary-100 border-none shadow-none">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-primary-100">
                            <Info size={18} />
                        </div>
                        <h4 className="font-bold text-primary-900 mb-2">Instructions</h4>
                        <ul className="space-y-3">
                            {[
                                'Upload Excel file with visit details',
                                'Click Preview to edit records',
                                'Ensure visit dates fall within range',
                                'File must contain VisitDate column',
                                'Download template for correct headers',
                                'Max 100 visits per upload'
                            ].map((txt, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs font-medium text-primary-700/80 leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                                    {txt}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* History / Ledger Section */}
            <div className="space-y-6 pt-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Visit Registry</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider opacity-60 mt-1">Historical Execution Records</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            name="EMPCode"
                            value={filterData.EMPCode}
                            onChange={handleDateChange}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-4 focus:ring-primary-500/5 outline-none"
                        >
                            <option value="all">All Personnel</option>
                            {user?.map((item) => (
                                <option key={`filter-${item.EMPCode}`} value={item.EMPCode}>
                                    {item.FirstName} {item.LastName}
                                </option>
                            ))}
                        </select>

                        <select
                            onChange={(e) => setPlanned(e.target.value)}
                            value={planned}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-4 focus:ring-primary-500/5 outline-none"
                        >
                            <option value="1">Planned Only</option>
                            <option value="0">Unplanned Only</option>
                            <option value="all">Every Type</option>
                        </select>

                        <FilterVisitModal
                            masterRender={masterRender}
                            setMasterRender={setMasterRender}
                            filterData={filterData}
                            setFilterData={setFilterData}
                        />
                    </div>
                </div>

                <div className="card shadow-2xl shadow-slate-200/50 overflow-hidden border-none bg-white">
                    <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <SearchComponent searchValue={searchValue} handleSearch={handleSearch} />
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Planned</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Un-planned</span>
                            </div>
                        </div>
                    </div>

                    <div className="react-data-table-container">
                        <DataTable
                            columns={columns}
                            data={category}
                            noHeader
                            responsive
                            paginationServer
                            highlightOnHover
                            onSelectedRowsChange={handleChange}
                            contextActions={contextActions}
                            clearSelectedRows={toggleCleared}
                            progressPending={loading}
                            customStyles={tableStyles}
                            theme="default"
                            noDataComponent={
                                <div className="p-20 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                                        <Search size={40} />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 mb-2">Matrix Empty</h4>
                                    <p className="text-slate-400 text-sm font-medium">No visit signatures detected for current filters.</p>
                                </div>
                            }
                        />
                        <CustomPagination />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper for icon since Lucide sometimes needs specific import style in this setup
const FilePlus2Icon = ({ size }) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
);

export default Table;