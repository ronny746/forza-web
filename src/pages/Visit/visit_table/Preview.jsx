import React, { useState } from 'react';
import { Eye, Calendar, MapPin, FileText, Plus, Trash2, Pencil, Check, X, AlertCircle } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { toast } from 'react-toastify';
import moment from 'moment';

const Preview = ({ visitData, setVisitData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingIdx, setEditingIdx] = useState(null);
    const [editingRow, setEditingRow] = useState(null);

    const startEdit = (idx, row) => {
        setEditingIdx(idx);
        setEditingRow({ ...row });
    };

    const cancelEdit = () => {
        setEditingIdx(null);
        setEditingRow(null);
    };

    const saveEdit = (idx) => {
        const updated = [...visitData];
        updated[idx] = editingRow;
        setVisitData(updated);
        cancelEdit();
    };

    const deleteRow = (idx) => {
        if (window.confirm('Remove this visit from the plan?')) {
            const updated = visitData.filter((_, i) => i !== idx);
            setVisitData(updated);
            toast.info('Visit removed');
        }
    };

    const addRow = () => {
        const newVisit = {
            VisitDate: moment().format('DD-MM-YYYY'),
            VisitFrom: '',
            VisitTo: '',
            VisitPurpose: ''
        };
        setVisitData([...visitData, newVisit]);
        startEdit(visitData.length, newVisit);
    };

    const isPast = (date) => {
        return moment(date, 'DD-MM-YYYY').isBefore(moment().startOf('day'));
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="btn-primary bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center gap-2"
            >
                <Eye size={16} />
                Preview & Edit Visits
            </button>

            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Manage Visit Plan"
                    size="5xl"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex gap-4">
                            <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 font-bold text-primary-700 dark:text-primary-400 text-xs">
                                <Calendar className="mr-1.5 h-4 w-4" /> TOTAL VISITS: {visitData?.length || 0}
                            </span>
                        </div>
                        <button
                            onClick={addRow}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-100"
                        >
                            <Plus size={16} /> Add Manual Visit
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-dark-border">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-dark-surface/50">
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Visit From</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Visit To</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Purpose</th>
                                        <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                                    {!visitData || visitData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center opacity-30">
                                                    <FileText size={48} className="mb-4" />
                                                    <p className="font-black uppercase tracking-widest text-sm text-gray-400">No visits in plan</p>
                                                    <p className="text-xs mt-1">Upload an excel or add manually</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        visitData.map((item, index) => {
                                            const isEditing = editingIdx === index;
                                            const pastDate = isPast(item.VisitDate);

                                            return (
                                                <tr key={index} className={`group hover:bg-gray-50 dark:hover:bg-dark-bg/40 transition-colors duration-150 ${pastDate ? 'bg-red-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        {isEditing ? (
                                                            <div className="relative">
                                                                <input
                                                                    type="date"
                                                                    className="w-full p-2 text-xs font-bold border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                                    defaultValue={moment(editingRow.VisitDate, 'DD-MM-YYYY').format('YYYY-MM-DD')}
                                                                    onChange={(e) => setEditingRow({ ...editingRow, VisitDate: moment(e.target.value).format('DD-MM-YYYY') })}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={14} className={pastDate ? 'text-red-500' : 'text-primary-500'} />
                                                                <span className={`text-xs font-bold ${pastDate ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                    {item.VisitDate}
                                                                    {pastDate && <span className="block text-[8px] text-red-400 uppercase">(Past Date)</span>}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                className="w-full p-2 text-xs font-bold border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                                value={editingRow.VisitFrom}
                                                                onChange={(e) => setEditingRow({ ...editingRow, VisitFrom: e.target.value })}
                                                                placeholder="Start Location"
                                                            />
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-lg">
                                                                {item.VisitFrom || 'N/A'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                className="w-full p-2 text-xs font-bold border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                                value={editingRow.VisitTo}
                                                                onChange={(e) => setEditingRow({ ...editingRow, VisitTo: e.target.value })}
                                                                placeholder="Destination"
                                                            />
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 rounded-lg">
                                                                {item.VisitTo || 'N/A'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 min-w-[200px]">
                                                        {isEditing ? (
                                                            <textarea
                                                                className="w-full p-2 text-xs font-bold border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                                                rows={1}
                                                                value={editingRow.VisitPurpose}
                                                                onChange={(e) => setEditingRow({ ...editingRow, VisitPurpose: e.target.value })}
                                                                placeholder="Reason for visit..."
                                                            />
                                                        ) : (
                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 italic">
                                                                "{item.VisitPurpose || 'No purpose mentioned'}"
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {isEditing ? (
                                                                <>
                                                                    <button onClick={() => saveEdit(index)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors" title="Save Changes">
                                                                        <Check size={14} />
                                                                    </button>
                                                                    <button onClick={cancelEdit} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors" title="Cancel">
                                                                        <X size={14} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => startEdit(index, item)} className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Edit row">
                                                                        <Pencil size={14} />
                                                                    </button>
                                                                    <button onClick={() => deleteRow(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete row">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-primary-50/50 rounded-2xl border border-primary-100 flex items-start gap-3">
                        <AlertCircle className="text-primary-500 shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="text-xs font-black text-primary-900 uppercase tracking-widest mb-1">Upload Check</p>
                            <p className="text-[11px] text-primary-700 leading-relaxed font-medium">
                                Red rows indicate **Past Dates** which may cause validation errors during upload. Please ensure all visit dates are today or in the future before closing this editor and clicking **Upload Visit Plan**.
                            </p>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default Preview;
