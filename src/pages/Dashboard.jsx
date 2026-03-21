import React, { useEffect, useState } from 'react';
import {
    Users, Calendar, DollarSign, Clock, CheckCircle,
    XCircle, TrendingUp, Activity, FileText, ArrowRight,
    MapPin, Wallet, BookOpen, ShieldCheck, PieChart,
    ChevronRight, Briefcase, Zap, Receipt, FileBarChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';

// --- Premium Card Components ---
const ActionCard = ({ title, icon: Icon, desc, link }) => {
    return (
        <motion.a
            whileHover={{ y: -2 }}
            href={link}
            className="card p-5 group transition-all hover:bg-slate-50 flex flex-col items-center text-center"
        >
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Icon size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">{title}</h4>
            <p className="text-[11px] text-slate-500 font-medium">{desc}</p>
        </motion.a>
    );
};

const MetricCard = ({ label, value, icon: Icon, color }) => {
    return (
        <div className="card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                <Icon size={22} />
            </div>
            <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [dashboardData, setDashboardData] = useState({
        total_visits: 0,
        planned_visits: 0,
        unplanned_visits: 0
    });

    const [expenseData, setExpenseData] = useState({
        totalData: 0,
        progressData: 0,
        approveData: 0,
        rejectData: 0
    });

    const [attendanceData, setAttendanceData] = useState({
        totalVisits: 0,
        totalExpenses: 0,
        totalAttendenceLogs: 0
    });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [dashRes, expenseRes, todayLogRes] = await Promise.all([
                    api.get('/v1/admin/dashboard/get-dashboard').catch(() => ({ data: {} })),
                    api.get('/v1/admin/dashboard/get-expense-analytic-data').catch(() => ({ data: {} })),
                    api.get('/v1/admin/dashboard/get-today-log-data').catch(() => ({ data: {} }))
                ]);

                if (dashRes?.data) setDashboardData(dashRes.data);
                if (expenseRes?.data) setExpenseData(expenseRes.data);
                if (todayLogRes?.data) setAttendanceData(todayLogRes.data);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const firstName = user?.FirstName || user?.username || 'Team Member';
    const initials = (user?.FirstName?.[0] || user?.username?.[0] || 'U').toUpperCase();

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-[6px] border-slate-50 shadow-inner" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-[6px] border-primary-900 border-t-transparent animate-spin" />
                </div>
                <p className="font-display font-black text-[10px] text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Global Assets</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome back, <span className="text-slate-600">{firstName}</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Here is a summary of the activity for {moment().format('MMMM Do, YYYY')}.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-semibold text-slate-600">
                        {moment().format('dddd')}
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="Total Visits" value={dashboardData.total_visits} icon={MapPin} />
                <MetricCard label="Total Claims" value={Number(expenseData.progressData || 0) + Number(expenseData.approveData || 0)} icon={Receipt} />
                <MetricCard label="Pending (₹)" value={Number(expenseData.progressData || 0).toLocaleString()} icon={Clock} />
                <MetricCard label="Approved (₹)" value={Number(expenseData.approveData || 0).toLocaleString()} icon={ShieldCheck} />
            </div>

            {/* Operations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                <ActionCard title="Attendance" desc="Clock-in/out" link="/attendance" icon={Activity} />
                <ActionCard title="Visits" desc="Planned assignments" link="/visits" icon={Briefcase} />
                <ActionCard title="Expenses" desc="Reimbursement claims" link="/my-expenses" icon={Wallet} />
                <ActionCard title="Reports" desc="Detailed analytics" link="/reports" icon={FileBarChart} />
            </div>

            {/* Distribution Card */}
            <div className="card p-8 group">
                <div className="mb-8 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <PieChart className="text-slate-400" size={20} />
                        Visit Distribution
                    </h3>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="relative w-48 h-48 shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                            {dashboardData.total_visits > 0 && (
                                <>
                                    <circle
                                        cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent"
                                        strokeDasharray={`${(dashboardData.unplanned_visits / dashboardData.total_visits) * 263.8} 263.8`}
                                        className="text-amber-400"
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent"
                                        strokeDasharray={`${(dashboardData.planned_visits / dashboardData.total_visits) * 263.8} 263.8`}
                                        strokeDashoffset={`-${(dashboardData.unplanned_visits / dashboardData.total_visits) * 263.8}`}
                                        className="text-primary-900"
                                        strokeLinecap="round"
                                    />
                                </>
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-900">{dashboardData.total_visits}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-3 h-3 rounded-full bg-slate-900" />
                                <span className="text-sm font-bold text-slate-800">Planned Visits</span>
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{dashboardData.planned_visits}</span>
                        </div>
                        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <span className="text-sm font-bold text-slate-800">Unplanned Visits</span>
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{dashboardData.unplanned_visits}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Area Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">System Health</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-bold text-slate-700">All data synchronized</span>
                        </div>
                    </div>
                    <ShieldCheck className="text-slate-200" size={32} />
                </div>
                <div className="card p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Logs Today</p>
                        <span className="text-2xl font-bold text-slate-900">{attendanceData.totalAttendenceLogs}</span>
                    </div>
                    <FileText className="text-slate-200" size={32} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
