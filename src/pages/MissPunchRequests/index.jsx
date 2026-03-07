import React, { useState, useEffect } from 'react';
import { Clock, Check, X, CheckCircle, AlertCircle, RefreshCw, Search, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/TableComponents';
import { TablePagination } from '../../components/ui/TableComponents';
import api from '../../utils/api';

const fmt = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return d; }
};

const StatusBadge = ({ status }) => {
    if (status === 'Approved') return <span className="badge badge-success"><Check size={10} />Approved</span>;
    if (status === 'Rejected') return <span className="badge badge-danger"><X size={10} />Rejected</span>;
    return <span className="badge badge-warning"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-slow" />Pending</span>;
};

const MissPunchCard = ({ row, onApprove, onReject }) => {
    const isPending = row.Status === 'Pending';
    const initials = row.EmployeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
    const borderColor = row.Status === 'Approved' ? 'border-emerald-400' : row.Status === 'Rejected' ? 'border-red-400' : 'border-amber-400';

    return (
        <div className={`card border-l-4 ${borderColor} hover:-translate-y-0.5 hover:shadow-card-lg transition-all duration-200`}>
            <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-primary-900 flex items-center justify-center text-white font-bold text-base shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{row.EmployeeName || '—'}</h4>
                            <span className="badge badge-primary mt-0.5">{row.EMPCode}</span>
                        </div>
                    </div>
                    <StatusBadge status={row.Status} />
                </div>

                {/* Locations */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mb-0.5 flex items-center gap-1"><MapPin size={10} />From</p>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">{row.VisitFrom || '—'}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                        <p className="text-[10px] font-bold text-amber-500 uppercase mb-0.5 flex items-center gap-1"><MapPin size={10} />To</p>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">{row.VisitTo || '—'}</p>
                    </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                            <Clock size={14} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Check In</p>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{row.PresentTimeIn ? fmt(row.PresentTimeIn) : '—'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                            <Clock size={14} className="text-primary-600" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Checkout</p>
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{row.ActualCheckOut ? fmt(row.ActualCheckOut) : '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Reason */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-surface">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Reason</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{row.Reason || '—'}</p>
                </div>

                {/* Rejection reason */}
                {row.Status === 'Rejected' && row.RejectionReason && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border-l-4 border-red-400">
                        <p className="text-[10px] font-bold text-red-500 uppercase mb-0.5">Rejection Reason</p>
                        <p className="text-xs text-red-600 dark:text-red-400">{row.RejectionReason}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border">
                    <span className="text-[10px] text-gray-400">{fmt(row.RequestDate || row.createdAt)}</span>
                    {isPending && (
                        <div className="flex gap-1.5">
                            <button onClick={() => onReject(row)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/30">
                                <X size={12} />Reject
                            </button>
                            <button onClick={() => onApprove(row)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm shadow-emerald-500/20">
                                <Check size={12} />Approve
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MissPunchRequests = () => {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(9);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [trigger, setTrigger] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/attendence/get-pending-miss-punch-requests', {
                params: { searchKey: search, pageIndex: page, pageSize: perPage },
            });
            const rows = res.data?.Data ?? res.data?.data?.rows ?? [];
            const count = res.data?.DataCount ?? res.data?.data?.count ?? rows.length;
            setData(rows.map(r => ({ ...r, EmployeeName: r.EmployeeName ?? `${r.FirstName ?? ''} ${r.LastName ?? ''}`.trim() })));
            if (page === 0) setTotal(count);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load miss punch requests');
        }
        setLoading(false);
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await api.post('/v1/admin/attendence/update-miss-punch-status', {
                MissPunchRequestId: selected.MissPunchRequestId,
                Action: 'Approve',
            });
            toast.success('✅ Miss punch approved successfully!');
            setApproveModal(false);
            setTrigger(p => !p);
        } catch (err) {
            toast.error(err.response?.data?.message || '❌ Approval failed. Please try again.');
        }
        setActionLoading(false);
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            toast.warning('⚠️ Please enter a rejection reason');
            return;
        }
        setActionLoading(true);
        try {
            await api.post('/v1/admin/attendence/update-miss-punch-status', {
                MissPunchRequestId: selected.MissPunchRequestId,
                Action: 'Reject',
                RejectionReason: reason.trim(),
            });
            toast.success('Miss punch rejected');
            setRejectModal(false);
            setReason('');
            setTrigger(p => !p);
        } catch (err) {
            toast.error(err.response?.data?.message || '❌ Rejection failed. Please try again.');
        }
        setActionLoading(false);
    };

    useEffect(() => { fetchData(); }, [trigger, search, page, perPage]);

    const stats = [
        { label: 'Total', value: total, cls: 'from-sky-500 to-blue-600' },
        { label: 'Pending', value: data.filter(r => r.Status === 'Pending').length, cls: 'from-amber-500 to-orange-600' },
        { label: 'Approved', value: data.filter(r => r.Status === 'Approved').length, cls: 'from-emerald-500 to-teal-600' },
        { label: 'Rejected', value: data.filter(r => r.Status === 'Rejected').length, cls: 'from-red-500 to-rose-600' },
    ];

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Miss Punch Requests</h1>
                    <p className="page-subtitle">Approve or reject employee miss punch requests</p>
                </div>
                <button onClick={() => setTrigger(p => !p)} className="btn-secondary shrink-0">
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="card p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.cls} flex items-center justify-center shrink-0`}>
                            <Clock size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                            <p className="text-xs text-gray-500 dark:text-dark-textMuted font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative group max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="search" placeholder="Search employee name, emp code…" value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        className="input-field pl-9 h-10 text-sm w-full" />
                </div>
            </div>

            {/* Cards grid */}
            {loading ? <PageLoader /> : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Clock size={56} className="text-gray-300 dark:text-dark-border mb-4" strokeWidth={1.5} />
                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No miss punch requests</h4>
                    <p className="text-sm text-gray-400">All clear! No pending requests.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {data.map((row, i) => (
                            <MissPunchCard key={row.MissPunchRequestId || i} row={row}
                                onApprove={r => { setSelected(r); setApproveModal(true); }}
                                onReject={r => { setSelected(r); setRejectModal(true); }}
                            />
                        ))}
                    </div>
                    <div className="card">
                        <TablePagination
                            total={total} current={page} perPage={perPage}
                            onPageChange={setPage} onPerPageChange={p => { setPerPage(p); setPage(0); }}
                            options={[6, 9, 12, 18, 24]}
                        />
                    </div>
                </>
            )}

            {/* Approve modal */}
            <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Confirm Approval" size="sm">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                        <CheckCircle size={32} className="text-emerald-500" />
                    </div>
                    <h5 className="text-lg font-bold text-gray-900 dark:text-white">Approve Miss Punch?</h5>
                    {selected && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-surface text-left space-y-1">
                            <p className="font-bold text-gray-800 dark:text-gray-200">{selected.EmployeeName} <span className="badge badge-primary ml-1">{selected.EMPCode}</span></p>
                            <p className="text-sm text-gray-500">Checkout: <strong className="text-gray-700 dark:text-gray-200">{fmt(selected.ActualCheckOut)}</strong></p>
                            <p className="text-sm text-gray-500">Reason: <strong className="text-gray-700 dark:text-gray-200">{selected.Reason}</strong></p>
                        </div>
                    )}
                    <div className="flex justify-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
                        <button onClick={() => setApproveModal(false)} disabled={actionLoading} className="btn-secondary">Cancel</button>
                        <button onClick={handleApprove} disabled={actionLoading} className="btn-success">
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {actionLoading ? 'Approving…' : 'Approve'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Reject modal */}
            <Modal isOpen={rejectModal} onClose={() => { setRejectModal(false); setReason(''); }} title="Reject Miss Punch">
                <div className="space-y-4">
                    {selected && (
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-surface">
                            <p className="font-bold text-gray-800 dark:text-gray-200">{selected.EmployeeName} <span className="badge badge-primary ml-1">{selected.EMPCode}</span></p>
                            <p className="text-sm text-gray-500 mt-1">Reason: {selected.Reason}</p>
                        </div>
                    )}
                    <div>
                        <label className="input-label">Rejection Reason <span className="text-red-500">*</span></label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="input-field resize-none" placeholder="Enter reason for rejection…" />
                        {!reason.trim() && reason !== '' && <p className="input-error">Rejection reason is required</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
                        <button onClick={() => { setRejectModal(false); setReason(''); }} disabled={actionLoading} className="btn-secondary">Cancel</button>
                        <button onClick={handleReject} disabled={actionLoading || !reason.trim()} className="btn-danger">
                            {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                            {actionLoading ? 'Rejecting…' : 'Reject'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MissPunchRequests;
