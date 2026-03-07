import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { Calendar, Check, X, AlertCircle, FileText, Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';
import { useTableStyles } from '../../utils/tableStyles';
import { TableSearch, TablePagination, TableEmpty, PageLoader } from '../../components/ui/TableComponents';

// ─── Validation ────────────────────────────────────────────────────────────────
const leaveSchema = Yup.object({
    FromDate: Yup.string().required('From Date is required'),
    ToDate: Yup.string().required('To Date is required')
        .test('afterFrom', 'To Date must be after From Date', function (v) {
            const { FromDate } = this.parent;
            return !FromDate || !v || new Date(v) >= new Date(FromDate);
        }),
    LeaveTypeId: Yup.string().required('Leave Type is required'),
    Reason: Yup.string().trim().required('Reason is required').min(3, 'Reason too short'),
});

const LeaveManagement = () => {
    const tableStyles = useTableStyles();
    const [data, setData] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [trigger, setTrigger] = useState(false);
    const [applyModal, setApplyModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectId, setRejectId] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);
    const [approveLoading, setApproveLoading] = useState(''); // stores the id of row being approved

    // ─── Formik ───────────────────────────────────────────────────────────────
    const formik = useFormik({
        initialValues: { FromDate: '', ToDate: '', LeaveTypeId: '', Reason: '' },
        validationSchema: leaveSchema,
        onSubmit: async (values, { resetForm, setSubmitting }) => {
            try {
                await api.post('/v1/admin/leave_management/apply-leave', values);
                toast.success('✅ Leave applied successfully!');
                resetForm();
                setApplyModal(false);
                setTrigger(p => !p);
            } catch (err) {
                const msg = err.response?.data?.message || 'Failed to apply leave';
                toast.error(`❌ ${msg}`);
            } finally {
                setSubmitting(false);
            }
        },
    });

    // ─── Fetch Leaves ─────────────────────────────────────────────────────────
    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/leave_management/get-all-leave', {
                params: { searchKey: search, pageIndex: page, pageSize: perPage },
            });
            // API can return nested differently — handle both shapes
            const rows = res.data?.data?.data?.rows ?? res.data?.data?.rows ?? [];
            const count = res.data?.data?.data?.count ?? res.data?.data?.count ?? 0;
            setData(rows);
            if (page === 0) setTotal(count);
        } catch (err) {
            toast.error('Failed to load leave records');
        }
        setLoading(false);
    };

    // ─── Approve ─────────────────────────────────────────────────────────────
    const approveLeave = async (id) => {
        setApproveLoading(id);
        try {
            await api.post('/v1/admin/leave_management/approve-disapprove-leave', {
                leaveRequestId: id,
                isApprove: 1,
                rejectReason: '',
            });
            toast.success('✅ Leave approved!');
            setTrigger(p => !p);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Approval failed');
        }
        setApproveLoading('');
    };

    // ─── Reject ───────────────────────────────────────────────────────────────
    const rejectLeave = async () => {
        if (!rejectReason.trim()) {
            toast.warning('Please enter a rejection reason');
            return;
        }
        setRejectLoading(true);
        try {
            await api.post('/v1/admin/leave_management/approve-disapprove-leave', {
                leaveRequestId: rejectId,
                isApprove: 0,
                rejectReason,
            });
            toast.success('Leave rejected');
            setRejectModal(false);
            setRejectReason('');
            setRejectId('');
            setTrigger(p => !p);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Rejection failed');
        }
        setRejectLoading(false);
    };

    useEffect(() => { fetchLeaves(); }, [trigger, search, page, perPage]);

    // Fetch leave types once
    useEffect(() => {
        api.get('/v1/admin/leave_management/get-all-leave-type')
            .then(r => setLeaveTypes(r.data?.data?.leaveData || []))
            .catch(() => { });
    }, []);

    // ─── Status badge ─────────────────────────────────────────────────────────
    const statusBadge = (r) => {
        const status = r.Description || '';
        if (status === 'Approved') return <span className="badge badge-success"><Check size={10} />Approved</span>;
        if (status === 'Rejected') return <span className="badge badge-danger"><X size={10} />Rejected</span>;
        return (
            <span className="badge badge-warning">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-slow" />Pending
            </span>
        );
    };

    // ─── Columns ─────────────────────────────────────────────────────────────
    const columns = [
        {
            name: '#', width: '56px', center: true,
            cell: (_, i) => <span className="text-sm font-semibold text-primary-500">{page * perPage + i + 1}</span>,
        },
        {
            name: 'Employee', minWidth: '180px',
            cell: r => (
                <div className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(r.FirstName?.[0] || '?')}{(r.LastName?.[0] || '')}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{r.FirstName} {r.LastName}</p>
                        {r.EMPCode && <p className="text-xs text-gray-400">{r.EMPCode}</p>}
                    </div>
                </div>
            ),
        },
        {
            name: 'Leave Type', selector: r => r.LeaveType, sortable: true, minWidth: '130px',
            cell: r => <span className="badge badge-primary">{r.LeaveType || '—'}</span>,
        },
        {
            name: 'From', selector: r => r.FromDate, sortable: true, minWidth: '120px',
            cell: r => <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><Calendar size={13} className="text-primary-400 shrink-0" />{r.FromDate || '—'}</span>,
        },
        {
            name: 'To', selector: r => r.ToDate, sortable: true, minWidth: '120px',
            cell: r => <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><Calendar size={13} className="text-rose-400 shrink-0" />{r.ToDate || '—'}</span>,
        },
        {
            name: 'Reason', minWidth: '160px',
            cell: r => (
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                    <FileText size={12} className="shrink-0" />{r.Reason || '—'}
                </span>
            ),
        },
        {
            name: 'Status', center: true, minWidth: '120px',
            cell: r => statusBadge(r),
        },
        {
            name: 'Approved By', minWidth: '140px',
            cell: r => <span className="text-sm text-gray-600 dark:text-gray-400">{r.AdminName || '—'}</span>,
        },
        {
            name: 'Action', center: true, minWidth: '130px',
            cell: r => {
                // Only admin (adminId === 3) who is not designation 3 gets action buttons
                // For pending leaves (LeavestatusId not 2 or 3)
                const isPending = r.LeavestatusId !== 2 && r.LeavestatusId !== 3;
                const canAct = r.adminId === 3 && r.DesigId !== 3;

                if (!canAct) return <span className="text-xs text-gray-400">—</span>;
                if (!isPending) return statusBadge(r);
                return (
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => { setRejectId(r.Id); setRejectModal(true); }}
                            className="action-btn-reject"
                            title="Reject"
                        >
                            <X size={13} />
                        </button>
                        <button
                            onClick={() => approveLeave(r.Id)}
                            disabled={approveLoading === r.Id}
                            className="action-btn-approve"
                            title="Approve"
                        >
                            {approveLoading === r.Id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Check size={13} />}
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Apply and manage employee leave requests</p>
                </div>
                <button onClick={() => setApplyModal(true)} className="btn-primary shrink-0">
                    <Plus size={16} /> Apply Leave
                </button>
            </div>

            {/* Table */}
            <div className="card-glass">
                <div className="table-search-bar">
                    <TableSearch
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Search by employee name…"
                    />
                    <span className="badge badge-neutral shrink-0">
                        <Calendar size={12} /> {total} records
                    </span>
                </div>
                <DataTable
                    columns={columns} data={data} noHeader responsive highlightOnHover
                    progressPending={loading} customStyles={tableStyles}
                    progressComponent={<PageLoader />}
                    noDataComponent={<TableEmpty icon={Calendar} title="No leave requests found" subtitle="Apply for a leave first." />}
                />
                <TablePagination
                    total={total} current={page} perPage={perPage}
                    onPageChange={setPage} onPerPageChange={p => { setPerPage(p); setPage(0); }}
                />
            </div>

            {/* ── Apply Leave Modal ── */}
            <Modal isOpen={applyModal} onClose={() => { setApplyModal(false); formik.resetForm(); }} title="Apply for Leave" size="lg">
                <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="input-label">From Date <span className="text-red-500">*</span></label>
                            <input type="date" {...formik.getFieldProps('FromDate')}
                                className={`input-field ${formik.touched.FromDate && formik.errors.FromDate ? 'border-red-400 focus:ring-red-400/40' : ''}`} />
                            {formik.touched.FromDate && formik.errors.FromDate && (
                                <p className="input-error">{formik.errors.FromDate}</p>
                            )}
                        </div>
                        <div>
                            <label className="input-label">To Date <span className="text-red-500">*</span></label>
                            <input type="date" {...formik.getFieldProps('ToDate')}
                                className={`input-field ${formik.touched.ToDate && formik.errors.ToDate ? 'border-red-400 focus:ring-red-400/40' : ''}`} />
                            {formik.touched.ToDate && formik.errors.ToDate && (
                                <p className="input-error">{formik.errors.ToDate}</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Leave Type <span className="text-red-500">*</span></label>
                        <select {...formik.getFieldProps('LeaveTypeId')}
                            className={`input-field ${formik.touched.LeaveTypeId && formik.errors.LeaveTypeId ? 'border-red-400 focus:ring-red-400/40' : ''}`}>
                            <option value="">— Select leave type —</option>
                            {leaveTypes.map(t => <option key={t.LeaveTypeId} value={t.LeaveTypeId}>{t.LeaveType}</option>)}
                        </select>
                        {formik.touched.LeaveTypeId && formik.errors.LeaveTypeId && (
                            <p className="input-error">{formik.errors.LeaveTypeId}</p>
                        )}
                    </div>
                    <div>
                        <label className="input-label">Reason <span className="text-red-500">*</span></label>
                        <input type="text" {...formik.getFieldProps('Reason')} placeholder="Enter reason for leave"
                            className={`input-field ${formik.touched.Reason && formik.errors.Reason ? 'border-red-400 focus:ring-red-400/40' : ''}`} />
                        {formik.touched.Reason && formik.errors.Reason && (
                            <p className="input-error">{formik.errors.Reason}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border mt-2">
                        <button type="button" onClick={() => { setApplyModal(false); formik.resetForm(); }} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={formik.isSubmitting} className="btn-primary">
                            {formik.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {formik.isSubmitting ? 'Submitting…' : 'Submit Leave'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Reject Modal ── */}
            <Modal isOpen={rejectModal} onClose={() => { setRejectModal(false); setRejectReason(''); }} title="Reject Leave Request" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
                        <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                            Please provide a clear reason for rejecting this leave request.
                        </p>
                    </div>
                    <div>
                        <label className="input-label">Rejection Reason <span className="text-red-500">*</span></label>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            rows={3}
                            className="input-field resize-none"
                            placeholder="Enter reason for rejection…"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
                        <button onClick={() => { setRejectModal(false); setRejectReason(''); }} className="btn-secondary">
                            Cancel
                        </button>
                        <button onClick={rejectLeave} disabled={!rejectReason.trim() || rejectLoading} className="btn-danger">
                            {rejectLoading ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                            {rejectLoading ? 'Rejecting…' : 'Reject Leave'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LeaveManagement;
