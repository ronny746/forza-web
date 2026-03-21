import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Users, Download, Pencil, MapPin, Briefcase, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import { useTableStyles } from '../../utils/tableStyles';
import { TableSearch, TablePagination, TableEmpty, PageLoader } from '../../components/ui/TableComponents';

const UserManagement = () => {
    const tableStyles = useTableStyles();
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [editData, setEditData] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        gender: '',
        designation: '',
        service_area: '',
        manager_empcode: '',
        email: '',
        mobile_no: '',
        emp_code: '',
        department: '',
        password: '',
        confirm_password: '',
        isActive: true
    });

    const [dropdowns, setDropdowns] = useState({
        genders: [],
        designations: [],
        departments: [],
        serviceAreas: []
    });

    const fetchDropdownData = async () => {
        try {
            const res = await api.get('/v1/admin/user_details/get-dropdown-data');
            const d = res.data.data.data;
            setDropdowns({
                genders: d.genderData || [],
                designations: d.designationData || [],
                departments: d.departmentData || [],
                serviceAreas: d.serviceareaData || []
            });
        } catch { }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/dashboard/get-user-details', {
                params: { searchKey: search, pageIndex: page, pageSize: perPage },
            });
            setData(res.data.data.rows || []);
            if (page === 0) setTotal(res.data.data.count || 0);
        } catch { }
        setLoading(false);
    };

    const openEdit = async (empCode) => {
        try {
            const res = await api.get('/v1/admin/user_details/get_user-by-id', { params: { EMPCode: empCode } });
            const u = res.data.data.data.userData[0];
            setEditData(u);
            setFormData({
                first_name: u.FirstName || '',
                last_name: u.LastName || '',
                gender: u.GenId || '',
                designation: u.DesigId || '',
                service_area: u.SAId || '',
                manager_empcode: u.MgrEmployeeID || '',
                email: u.Email || '',
                mobile_no: u.MobileNo || '',
                emp_code: u.EMPCode || '',
                department: u.DeptId || '',
                password: '', // Should be empty by default on edit
                confirm_password: '',
                isActive: u.IsActive === 1 || u.IsActive === true
            });
            setEditModal(true);
        } catch { toast.error('Failed to load user details'); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirm_password) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            const submissionData = { ...formData };
            if (!formData.password) {
                delete submissionData.password;
                delete submissionData.confirm_password;
            }
            const res = await api.post('/v1/admin/user_details/update-user', submissionData);
            if (res.data.error) {
                toast.error(res.data.data?.message || 'Update failed');
            } else {
                toast.success('User updated successfully');
                setEditModal(false);
                fetchUsers();
            }
        } catch (err) {
            toast.error(err.response?.data?.data?.message || 'Internal server error');
        } finally {
            setLoading(false);
        }
    };

    const exportXlsx = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const first = data[0];
        const allSame = data.every(r => r.EMPCode === first?.EMPCode);
        const namePart = (first && allSame) ? `${first.FirstName}_${first.LastName}`.replace(/\s+/g, '_') : 'Global';
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        XLSX.writeFile(wb, `User_Details_${namePart}.xlsx`);
    };

    useEffect(() => {
        fetchDropdownData();
        fetchUsers();
    }, [search, page, perPage]);

    const columns = [
        {
            name: '#', width: '56px', center: true,
            cell: (_, i) => <span className="text-sm font-semibold text-primary-500">{page * perPage + i + 1}</span>,
        },
        {
            name: 'Employee', minWidth: '220px', selector: r => r.FirstName, sortable: true,
            cell: r => (
                <div className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(r.FirstName?.[0] || '?')}{(r.LastName?.[0] || '')}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{r.FirstName} {r.LastName}</p>
                        <p className="text-xs text-gray-400 dark:text-dark-textMuted truncate">{r.Email || '—'}</p>
                    </div>
                </div>
            ),
        },
        {
            name: 'Emp Code', selector: r => r.EMPCode, sortable: true, minWidth: '120px',
            cell: r => <span className="badge badge-primary">{r.EMPCode}</span>,
        },
        {
            name: 'Designation', selector: r => r.Designatation, sortable: true, minWidth: '150px',
            cell: r => (
                <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Briefcase size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{r.Designatation || '—'}</span>
                </span>
            ),
        },
        {
            name: 'Manager', selector: r => r.ManagerName, sortable: true, minWidth: '160px',
            cell: r => (
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.ManagerName || '—'}</p>
                    {r.ManagerEmpCode && <p className="text-xs text-gray-400">{r.ManagerEmpCode}</p>}
                </div>
            ),
        },
        {
            name: 'Service Area', selector: r => r.ServiceArea, sortable: true, minWidth: '140px',
            cell: r => r.ServiceArea
                ? <span className="flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-full px-2.5 py-1"><MapPin size={10} />{r.ServiceArea}</span>
                : <span className="text-gray-400 text-sm">—</span>,
        },
        {
            name: 'Status', center: true, minWidth: '110px',
            cell: r => (r.IsActive === 1 || r.IsActive === true)
                ? <span className="badge badge-success"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow" />Active</span>
                : <span className="badge badge-danger"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Inactive</span>,
        },
        {
            name: 'Action', center: true, width: '90px',
            cell: r => (
                <button onClick={() => openEdit(r.EMPCode)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    <Pencil size={12} /> Edit
                </button>
            ),
        },
    ];

    const activeCount = data.filter(u => u.IsActive === 1 || u.IsActive === true).length;
    const inactiveCount = Math.max(0, total - activeCount);

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">View and manage all employee accounts</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <Link to="/register" className="btn-primary">
                        <UserPlus size={16} /> Add New User
                    </Link>
                    <button onClick={exportXlsx} className="btn-success">
                        <Download size={16} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: total, cls: 'from-slate-700 to-slate-900' },
                    { label: 'Active', value: activeCount, cls: 'from-emerald-600 to-emerald-700' },
                    { label: 'Inactive', value: inactiveCount, cls: 'from-slate-300 to-slate-400' },
                    { label: 'On Page', value: data.length, cls: 'from-slate-500 to-slate-600' },
                ].map(s => (
                    <div key={s.label} className="card p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.cls} flex items-center justify-center shrink-0`}>
                            <Users size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                            <p className="text-xs text-gray-500 dark:text-dark-textMuted font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card-glass">
                <div className="table-search-bar">
                    <TableSearch
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Search by name, email, emp code…"
                    />
                    <span className="badge badge-neutral shrink-0">
                        <Users size={12} /> {total} total
                    </span>
                </div>

                <DataTable
                    columns={columns} data={data} noHeader responsive
                    highlightOnHover progressPending={loading} customStyles={tableStyles}
                    progressComponent={<PageLoader />}
                    noDataComponent={<TableEmpty icon={Users} title="No users found" subtitle="Try a different search term." />}
                />

                <TablePagination
                    total={total} current={page} perPage={perPage}
                    onPageChange={setPage} onPerPageChange={p => { setPerPage(p); setPage(0); }}
                />
            </div>

            {editModal && editData && (
                <Modal
                    isOpen={editModal}
                    onClose={() => setEditModal(false)}
                    title={`Edit User: ${editData.FirstName} ${editData.LastName}`}
                    size="2xl"
                >
                    <form onSubmit={handleUpdate} className="space-y-6 pb-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">First Name</label>
                                <input
                                    className="input-field shadow-sm hover:border-primary-400 focus:ring-2 focus:ring-primary-500/10"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Last Name</label>
                                <input
                                    className="input-field shadow-sm hover:border-primary-400 focus:ring-2 focus:ring-primary-500/10"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                                <input
                                    className="input-field shadow-sm hover:border-primary-400 focus:ring-2 focus:ring-primary-500/10"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Mobile Number</label>
                                <input
                                    className="input-field shadow-sm hover:border-primary-400 focus:ring-2 focus:ring-primary-500/10"
                                    maxLength={10}
                                    value={formData.mobile_no}
                                    onChange={e => setFormData({ ...formData, mobile_no: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300 opacity-60 uppercase tracking-wider text-[10px]">Employee ID (Fixed)</label>
                                <input
                                    className="input-field bg-gray-50 dark:bg-dark-bg cursor-not-allowed border-gray-100 font-mono text-sm"
                                    value={formData.emp_code} readOnly
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Reporting Manager ID</label>
                                <input
                                    className="input-field uppercase shadow-sm hover:border-primary-400 focus:ring-2 focus:ring-primary-500/10"
                                    value={formData.manager_empcode}
                                    onChange={e => setFormData({ ...formData, manager_empcode: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Gender</label>
                                <select
                                    className="input-field shadow-sm cursor-pointer"
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    {dropdowns.genders.map(g => (
                                        <option key={g.GenId} value={g.GenId}>{g.Gender}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Department</label>
                                <select
                                    className="input-field shadow-sm cursor-pointer"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {dropdowns.departments.map(d => (
                                        <option key={d.DeptId} value={d.DeptId}>{d.Department}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Current Designation</label>
                                <select
                                    className="input-field shadow-sm cursor-pointer"
                                    value={formData.designation}
                                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                    required
                                >
                                    <option value="">Select Designation</option>
                                    {dropdowns.designations.map(d => (
                                        <option key={d.DesigId} value={d.DesigId}>{d.Designatation}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Assigned Service Area</label>
                                <select
                                    className="input-field shadow-sm cursor-pointer"
                                    value={formData.service_area}
                                    onChange={e => setFormData({ ...formData, service_area: e.target.value })}
                                    required
                                >
                                    <option value="">Select Service Area</option>
                                    {dropdowns.serviceAreas.map(s => (
                                        <option key={s.SAId} value={s.SAId}>{s.ServiceArea}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">New Password (Leave blank to keep current)</label>
                                <input
                                    className="input-field shadow-sm hover:border-primary-400 focus:ring-2 focus:ring-primary-500/10"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Confirm Password</label>
                                <input
                                    className="input-field shadow-sm hover:border-primary-400 focus:ring-2 focus:ring-primary-500/10"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={formData.confirm_password}
                                    onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-4 p-4 rounded-2xl border border-gray-200 dark:border-dark-border bg-gradient-to-br from-white to-gray-50 dark:from-dark-card dark:to-dark-surface flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Account Status</p>
                                    <p className="text-xs text-gray-500">{formData.isActive ? 'Access is active' : 'User is currently blocked'}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${formData.isActive ? 'bg-emerald-500 focus:ring-emerald-400' : 'bg-gray-300 dark:bg-dark-surfaceMuted focus:ring-gray-400'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${formData.isActive ? 'translate-x-[22px]' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 dark:border-dark-border pt-6">
                            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary px-8 py-2.5 rounded-xl font-bold">Discard</button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />}
                                Update Profile
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default UserManagement;
