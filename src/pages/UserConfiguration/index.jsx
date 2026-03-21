import React, { useState, useEffect } from 'react';
import { Layers, Briefcase, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { PageLoader } from '../../components/ui/TableComponents';
import Modal from '../../components/ui/Modal';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all duration-200 ${active
        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
        : 'border-transparent text-gray-500 dark:text-dark-textMuted hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-200'
        }`}>
        <Icon size={16} />{label}
    </button>
);

const ConfigTable = ({ title, icon: Icon, items = [], idKey, nameKey, colorCls, onAdd, onDelete }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorCls}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h3>
                    <p className="text-xs text-gray-400 dark:text-dark-textMuted">{items.length} items</p>
                </div>
            </div>
            <button onClick={onAdd} className="btn-primary text-xs py-2 px-3">
                <Plus size={14} /> Add New
            </button>
        </div>

        <div className="card overflow-hidden border-none shadow-premium">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                            <th className="px-6 py-4 text-left text-[10px] font-extrabold text-white uppercase tracking-[0.15em] w-24">ID</th>
                            <th className="px-6 py-4 text-left text-[10px] font-extrabold text-white uppercase tracking-[0.15em]">Name</th>
                            <th className="px-6 py-4 text-center text-[10px] font-extrabold text-white uppercase tracking-[0.15em] w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-50 dark:divide-dark-border">
                        {!items || items.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-20 text-center text-gray-400 dark:text-dark-textMuted">
                                    <Icon size={48} className="mx-auto mb-4 opacity-20" strokeWidth={1.5} />
                                    <p className="text-sm font-semibold">No {title.toLowerCase()} found</p>
                                </td>
                            </tr>
                        ) : items.map((item, i) => (
                            <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-dark-surface transition-all duration-200">
                                <td className="px-6 py-5">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300 text-[13px] font-bold group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                        {item[idKey]}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 rounded-full bg-primary-500/0 group-hover:bg-primary-500 transition-all duration-300" />
                                        <span className="text-[15px] font-semibold text-gray-800 dark:text-gray-200">{item[nameKey]}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onDelete(item[idKey], item[nameKey])} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const UserConfiguration = () => {
    const [activeTab, setActiveTab] = useState('department');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/user_details/get-dropdown-data');
            setData(res.data.data.data);
        } catch (err) {
            toast.error('Failed to load configuration data');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return toast.error('Name is required');
        
        setSubmitting(true);
        try {
            const endpoint = activeTab === 'department' ? '/v1/admin/user_details/add-department' : '/v1/admin/user_details/add-designation';
            const payload = activeTab === 'department' ? { Department: newItemName } : { Designation: newItemName };
            
            const res = await api.post(endpoint, payload);
            if (res.data.error) {
                toast.error(res.data.data?.message || 'Failed to add');
            } else {
                toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} added successfully`);
                setShowAddModal(false);
                setNewItemName('');
                loadData();
            }
        } catch (err) {
            toast.error(err.response?.data?.data?.message || 'Error adding item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        
        setSubmitting(true);
        try {
            const endpoint = activeTab === 'department' ? '/v1/admin/user_details/delete-department' : '/v1/admin/user_details/delete-designation';
            const idKey = activeTab === 'department' ? 'DeptId' : 'DesigId';
            
            const res = await api.post(endpoint, { [idKey]: itemToDelete.id });
            if (res.data.error) {
                toast.error(res.data.data?.message || 'Failed to delete');
            } else {
                toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} deactivated successfully`);
                setShowDeleteModal(false);
                setItemToDelete(null);
                loadData();
            }
        } catch (err) {
            toast.error(err.response?.data?.data?.message || 'Error deleting item');
        } finally {
            setSubmitting(false);
        }
    };

    const openDeleteModal = (id, name) => {
        setItemToDelete({ id, name });
        setShowDeleteModal(true);
    };

    return (
        <div className="space-y-6 animate-slide-up">
            <div>
                <h1 className="page-title text-2xl font-black">User Configuration</h1>
                <p className="page-subtitle text-gray-500">Manage structure, departments, and designations</p>
            </div>

            <div className="card-glass overflow-hidden">
                <div className="flex border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card px-4">
                    <TabButton active={activeTab === 'department'} onClick={() => setActiveTab('department')} icon={Layers} label="Departments" />
                    <TabButton active={activeTab === 'designation'} onClick={() => setActiveTab('designation')} icon={Briefcase} label="Designations" />
                </div>

                <div className="p-6">
                    {loading ? <PageLoader /> : (
                        <>
                            {activeTab === 'department' && (
                                <ConfigTable
                                    title="Department Management" icon={Layers}
                                    items={data?.departmentData} idKey="DeptId" nameKey="Department"
                                    colorCls="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                    onAdd={() => setShowAddModal(true)}
                                    onDelete={openDeleteModal}
                                />
                            )}
                            {activeTab === 'designation' && (
                                <ConfigTable
                                    title="Designation Management" icon={Briefcase}
                                    items={data?.designationData} idKey="DesigId" nameKey="Designatation"
                                    colorCls="bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                                    onAdd={() => setShowAddModal(true)}
                                    onDelete={openDeleteModal}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title={`Add New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                size="md"
            >
                <form onSubmit={handleAdd} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="input-label font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">
                            {activeTab} Name
                        </label>
                        <input
                            className="input-field"
                            placeholder={`Enter ${activeTab} name...`}
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary px-6">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn-primary min-w-[100px]">
                            {submitting ? 'Adding...' : 'Add Now'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Deactivate Item"
                size="md"
            >
                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">
                        <AlertTriangle size={24} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Are you sure?</p>
                            <p className="text-xs opacity-80">This will deactivate <span className="font-black">"{itemToDelete?.name}"</span>. It will no longer be available for new assignments.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-secondary px-6">No, Keep it</button>
                        <button 
                            type="button" 
                            onClick={handleDelete} 
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center min-w-[120px]"
                        >
                            {submitting ? 'Processing...' : 'Yes, Deactivate'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserConfiguration;
