import React, { useState, useEffect } from 'react';
import {
    UserPlus, Mail, Phone, Lock, Hash,
    Briefcase, TreePine, MapPin, ChevronLeft,
    CheckCircle2, AlertCircle, Eye, EyeOff,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dropdownLoading, setDropdownLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form state
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
        password: '',
        confirm_password: '',
        department: '',
    });

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        genders: [],
        designations: [],
        departments: [],
        serviceAreas: []
    });

    useEffect(() => {
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const res = await api.get('/v1/admin/user_details/get-dropdown-data');
            const data = res.data.data.data;
            setDropdowns({
                genders: data.genderData || [],
                designations: data.designationData || [],
                departments: data.departmentData || [],
                serviceAreas: data.serviceareaData || []
            });
        } catch (err) {
            toast.error('Failed to load configuration data');
        } finally {
            setDropdownLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (formData.password !== formData.confirm_password) {
            return toast.error('Passwords do not match');
        }

        if (formData.mobile_no.length !== 10) {
            return toast.error('Mobile number must be 10 digits');
        }

        setLoading(true);
        try {
            const res = await api.post('/v1/admin/user_details/add-user', formData);
            if (res.data.error) {
                toast.error(res.data.data?.message || 'Failed to create user');
            } else {
                toast.success('User created successfully');
                navigate('/user');
            }
        } catch (err) {
            const msg = err.response?.data?.data?.message || 'Internal server error';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (dropdownLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate('/user')}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors mb-2"
                    >
                        <ChevronLeft size={16} /> Back to Users
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                            <UserPlus className="text-primary-600 w-6 h-6" />
                        </div>
                        Register New Employee
                    </h1>
                    <p className="text-gray-500 dark:text-dark-textMuted mt-1">Configure security and professional credentials for new staff.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Section 1: Personal & Professional */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card-glass p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            <h2 className="font-bold text-gray-900 dark:text-white">Basic Information</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="input-label">First Name <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Hash size={16} className="text-gray-400 group-focus-within:text-primary-500" />
                                    </div>
                                    <input
                                        type="text" name="first_name" required
                                        value={formData.first_name} onChange={handleChange}
                                        placeholder="John" className="input-field pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label">Last Name</label>
                                <input
                                    type="text" name="last_name"
                                    value={formData.last_name} onChange={handleChange}
                                    placeholder="Doe" className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label">Gender <span className="text-red-500">*</span></label>
                                <select
                                    name="gender" required value={formData.gender} onChange={handleChange}
                                    className="input-field cursor-pointer"
                                >
                                    <option value="">Select Gender</option>
                                    {dropdowns.genders.map(g => (
                                        <option key={g.GenId} value={g.GenId}>{g.Gender}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label">Designation <span className="text-red-500">*</span></label>
                                <select
                                    name="designation" required value={formData.designation} onChange={handleChange}
                                    className="input-field cursor-pointer"
                                >
                                    <option value="">Select Designation</option>
                                    {dropdowns.designations.map(d => (
                                        <option key={d.DesigId} value={d.DesigId}>{d.Designatation}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label">Department <span className="text-red-500">*</span></label>
                                <select
                                    name="department" required value={formData.department} onChange={handleChange}
                                    className="input-field cursor-pointer"
                                >
                                    <option value="">Select Department</option>
                                    {dropdowns.departments.map(d => (
                                        <option key={d.DeptId} value={d.DeptId}>{d.Department}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label">Service Area <span className="text-red-500">*</span></label>
                                <select
                                    name="service_area" required value={formData.service_area} onChange={handleChange}
                                    className="input-field cursor-pointer"
                                >
                                    <option value="">Select Area</option>
                                    {dropdowns.serviceAreas.map(s => (
                                        <option key={s.SAId} value={s.SAId}>{s.ServiceArea}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card-glass p-6 space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4">
                            <Briefcase size={18} className="text-primary-500" />
                            <h2 className="font-bold text-gray-900 dark:text-white">Employment IDs</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="input-label">Employee Code <span className="text-red-500">*</span></label>
                                <input
                                    type="text" name="emp_code" required
                                    value={formData.emp_code} onChange={handleChange}
                                    placeholder="FMI-0000" className="input-field uppercase"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label">Manager Code <span className="text-red-500">*</span></label>
                                <input
                                    type="text" name="manager_empcode" required
                                    value={formData.manager_empcode} onChange={handleChange}
                                    placeholder="FMI-XXXX" className="input-field uppercase"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Contact & Security */}
                <div className="space-y-6">
                    <div className="card p-6 space-y-6 border-primary-100 dark:border-primary-900/30">
                        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4">
                            <Mail size={18} className="text-primary-500" />
                            <h2 className="font-bold text-gray-900 dark:text-white">Contact Info</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="input-label">Email <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-gray-400 group-focus-within:text-primary-500" />
                                    </div>
                                    <input
                                        type="email" name="email" required
                                        value={formData.email} onChange={handleChange}
                                        placeholder="employee@forza.com" className="input-field pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label">Mobile Number <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Phone size={16} className="text-gray-400 group-focus-within:text-primary-500" />
                                    </div>
                                    <input
                                        type="tel" name="mobile_no" required maxLength={10}
                                        value={formData.mobile_no} onChange={handleChange}
                                        placeholder="10 digit number" className="input-field pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 space-y-6 border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4">
                            <Lock size={18} className="text-amber-500" />
                            <h2 className="font-bold text-gray-900 dark:text-white">Security</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="input-label">Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"} name="password" required
                                        value={formData.password} onChange={handleChange}
                                        placeholder="••••••••" className="input-field"
                                    />
                                    <button
                                        type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="input-label">Confirm Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"} name="confirm_password" required
                                        value={formData.confirm_password} onChange={handleChange}
                                        placeholder="••••••••" className="input-field"
                                    />
                                    <button
                                        type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg flex gap-3 text-amber-700 dark:text-amber-400">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p className="text-[11px] leading-relaxed font-medium">
                                    User will be able to log in immediately after registration with these credentials.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit" disabled={loading}
                            className={`w-full btn-primary py-4 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Register Employee
                                </>
                            )}
                        </button>
                        <button
                            type="button" onClick={() => navigate('/user')}
                            className="w-full mt-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-dark-textMuted py-2 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Register;
