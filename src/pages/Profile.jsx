import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, MapPin, Loader2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
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
        isActive: true
    });

    const [dropdowns, setDropdowns] = useState({
        genders: [],
        designations: [],
        departments: [],
        serviceAreas: []
    });

    useEffect(() => {
        const loadInit = async () => {
            try {
                // Dropdowns
                const ddRes = await api.get('/v1/admin/user_details/get-dropdown-data');
                const d = ddRes.data.data.data;
                setDropdowns({
                    genders: d.genderData || [],
                    designations: d.designationData || [],
                    departments: d.departmentData || [],
                    serviceAreas: d.serviceareaData || []
                });

                // User data
                if (authUser?.appUserId) {
                    const res = await api.get('/v1/admin/user_details/get_user-by-id', {
                        params: { EMPCode: authUser?.appUserId }
                    });
                    const u = res.data.data.data.userData[0];
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
                        isActive: u.IsActive === 1 || u.IsActive === true
                    });
                }
            } catch (err) {
                toast.error('Failed to load profile details');
            } finally {
                setFetching(false);
            }
        };
        loadInit();
    }, [authUser?.appUserId]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submissionData = { ...formData, password: '', confirm_password: '' };
            // URL fix: /update-user instead of /app-update-user
            const res = await api.post('/v1/admin/user_details/update-user', submissionData);
            if (res.data.error) {
                toast.error(res.data.data?.message || 'Update failed');
            } else {
                toast.success('Profile updated successfully');
            }
        } catch (err) {
            toast.error(err.response?.data?.data?.message || 'Update request failed');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-200">
                    {formData.first_name?.[0]}{formData.last_name?.[0]}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    <p className="text-sm text-gray-500">View and manage your personal details</p>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
                <div className="md:col-span-2 space-y-6">
                    <div className="card-glass p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4">
                            <User size={18} className="text-emerald-500 font-bold" />
                            <h2 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">Personal Information</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">First Name</label>
                                <input className="input-field shadow-sm" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Last Name</label>
                                <input className="input-field shadow-sm" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Gender</label>
                                <select className="input-field shadow-sm cursor-pointer" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} required>
                                    <option value="">Select Gender</option>
                                    {dropdowns.genders.map(g => <option key={g.GenId} value={g.GenId}>{g.Gender}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Mobile Number</label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input className="input-field pl-9 shadow-sm" maxLength={10} value={formData.mobile_no} onChange={e => setFormData({ ...formData, mobile_no: e.target.value })} required />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="input-label font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input className="input-field pl-9 shadow-sm" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                        </div>
                    </div>

                    <div className="card-glass p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4">
                            <Briefcase size={18} className="text-primary-500 font-bold" />
                            <h2 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">Professional Context</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Department</label>
                                <select className="input-field shadow-sm cursor-pointer" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required>
                                    <option value="">Select Department</option>
                                    {dropdowns.departments.map(d => <option key={d.DeptId} value={d.DeptId}>{d.Department}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Designation</label>
                                <select className="input-field shadow-sm cursor-pointer" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required>
                                    <option value="">Select Designation</option>
                                    {dropdowns.designations.map(d => <option key={d.DesigId} value={d.DesigId}>{d.Designatation}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Service Area</label>
                                <select className="input-field shadow-sm cursor-pointer" value={formData.service_area} onChange={e => setFormData({ ...formData, service_area: e.target.value })} required>
                                    <option value="">Select Service Area</option>
                                    {dropdowns.serviceAreas.map(s => <option key={s.SAId} value={s.SAId}>{s.ServiceArea}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label font-bold text-gray-700 dark:text-gray-300">Reporting Manager ID</label>
                                <input className="input-field uppercase shadow-sm" value={formData.manager_empcode} onChange={e => setFormData({ ...formData, manager_empcode: e.target.value })} required />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card p-6 border-primary-100 dark:border-primary-900/30">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center text-primary-600">
                                <ShieldCheck size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Security ID</h3>
                                <p className="text-[24px] font-black text-primary-600 tracking-tighter">{formData.emp_code}</p>
                            </div>
                            <div className="p-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl w-full text-left">
                                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1">Account Status</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{formData.isActive ? 'Verified Active' : 'Account Disabled'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit" disabled={loading}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {loading ? 'Propagating Changes...' : 'Save Profile Details'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Profile;
