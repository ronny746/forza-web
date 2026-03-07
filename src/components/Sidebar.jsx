import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, UserCog, UserPlus, LogOut,
    Receipt, Clock, FileCheck, Search,
    Wallet, ClipboardList, ExternalLink, BarChart2,
    CreditCard, FileBarChart, CalendarDays,
    ChevronRight, Activity, Settings, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- Configuration ---
const ALL_NAV = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', section: 'core' },
    { name: 'Visit Plan', icon: MapPin, path: '/visit', section: 'core' },
    { name: 'Attendance', icon: Clock, path: '/attendence', section: 'core' },
    { name: 'Attendance Report', icon: FileBarChart, path: '/report', section: 'core' },
    { name: 'Leave Management', icon: CalendarDays, path: 'http://14.99.179.133/lms', section: 'core', external: true },
    { name: 'Miss Punch Requests', icon: ClipboardList, path: '/misspunch', section: 'core' },
    { name: 'Expense Report', icon: Receipt, path: '/expense', section: 'expense' },
    { name: 'User Details', icon: Users, path: '/user', section: 'admin' },
    { name: 'Register', icon: UserPlus, path: '/register', section: 'admin' },
    { name: 'System Config', icon: UserCog, path: '/user_configuration', section: 'admin' },
    { name: 'Expense Desk (HR)', icon: FileCheck, path: '/expense_hr', section: 'hr' },
    { name: 'Payment Tracking', icon: CreditCard, path: '/expense_payments', section: 'hr' },
    { name: 'Settlement Reports', icon: FileBarChart, path: '/expense_reports', section: 'hr' },
    { name: 'Expense (Finance)', icon: Wallet, path: '/expense_finance', section: 'finance' },
];

const SECTION_LABELS = { core: 'Navigation', expense: 'Expenditure', admin: 'Organization', hr: 'Human Capital', finance: 'Treasury' };

const getVisibleItems = (user) => {
    const d = Number(user?.DesigId || 0);
    const dept = (user?.Department || '').toLowerCase();
    const isAdmin = [1, 5, 9, 12].includes(d) || dept === 'admin' || dept === 'it' || Number(user?.DeptId) === 4;
    const isHR = dept === 'human resource' || dept === 'hr' || Number(user?.DeptId) === 3;
    const isManager = [3, 4, 8, 10, 13].includes(d);

    return ALL_NAV.filter(item => {
        if (isAdmin) return true;
        if (isHR) return ['Dashboard', 'Leave Management', 'Expense Desk (HR)', 'Payment Tracking', 'Settlement Reports'].includes(item.name);
        if (isManager) return !['Expense Desk (HR)', 'Expense (Finance)'].includes(item.name);
        return ['Dashboard', 'Visit Plan', 'Leave Management', 'Expense Report', 'Attendance', 'Attendance Report', 'Miss Punch Requests'].includes(item.name);
    });
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const { user, logout } = useAuth();
    const [search, setSearch] = useState('');

    const onMobileClose = () => { if (window.innerWidth < 1024) setSidebarOpen(false); };
    const visibleItems = getVisibleItems(user).filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    const groups = [];
    const seen = new Set();
    visibleItems.forEach(item => {
        if (!seen.has(item.section)) {
            seen.add(item.section);
            groups.push({ key: item.section, label: SECTION_LABELS[item.section], items: [] });
        }
        groups.find(s => s.key === item.section).items.push(item);
    });

    const initials = (user?.FirstName?.[0] || user?.username?.[0] || 'U').toUpperCase();

    return (
        <>
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-[60] bg-slate-900/50 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-[70] w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 overflow-hidden'}
                `}
            >
                <div className="h-16 flex items-center gap-3 px-6 shrink-0 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-md">
                        <Activity className="text-white" size={16} strokeWidth={3} />
                    </div>
                    <h2 className="font-bold text-slate-800 text-[17px] tracking-tight">ForzaMedi</h2>
                </div>

                <div className="px-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Find module..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-9 pr-3 text-[13px] font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:bg-white"
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-6 scrollbar-thin">
                    {groups.map(group => (
                        <div key={group.key} className="space-y-1">
                            <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                {group.label}
                            </h3>
                            <div className="space-y-0.5">
                                {group.items.map(item => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={onMobileClose}
                                        end={item.path === '/dashboard'}
                                        target={item.external ? '_blank' : undefined}
                                        rel={item.external ? 'noopener noreferrer' : undefined}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
                                            ${isActive
                                                ? 'bg-slate-900 text-white'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <item.icon size={16} className="shrink-0" />
                                        <span>{item.name}</span>
                                        {item.external && <ExternalLink size={10} className="ml-auto opacity-50" />}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <NavLink to="/profile" onClick={onMobileClose} className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 hover:border-primary-200 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-slate-800 truncate leading-none mb-1">{user?.username}</p>
                            <p className="text-[9px] font-medium text-slate-400 truncate uppercase">{user?.Designatation}</p>
                        </div>
                    </NavLink>
                    <button onClick={logout} className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-wider">
                        <LogOut size={13} /> Log Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
