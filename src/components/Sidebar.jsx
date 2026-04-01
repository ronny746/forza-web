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
    { name: 'Visit Plans', icon: MapPin, path: '/visits', section: 'core' },
    { name: 'Attendance', icon: Clock, path: '/attendance', section: 'core' },
    { name: 'Reports', icon: FileBarChart, path: '/reports', section: 'core' },
    { name: 'Leave Management', icon: CalendarDays, path: 'http://14.99.179.133/lms', section: 'core', external: true },
    { name: 'Correction Requests', icon: ClipboardList, path: '/correction-requests', section: 'core' },
    { name: 'My Expenses', icon: Receipt, path: '/my-expenses', section: 'expense' },
    { name: 'User Directory', icon: Users, path: '/users', section: 'admin' },
    { name: 'User Registration', icon: UserPlus, path: '/registration', section: 'admin' },
    { name: 'System Settings', icon: UserCog, path: '/settings', section: 'admin' },
    { name: 'HR Expenses', icon: FileCheck, path: '/hr-expenses', section: 'hr' },
    { name: 'Payment History', icon: CreditCard, path: '/payments', section: 'hr' },
    { name: 'Settlement Reports', icon: FileBarChart, path: '/settlements', section: 'hr' },
];

const SECTION_LABELS = { core: 'Navigation', expense: 'Personal', admin: 'Administration', hr: 'HR Desk' };

const getVisibleItems = (user) => {
    const desig = (user?.Designatation || '').toLowerCase();
    const dept = (user?.Department || '').toLowerCase();
    const desigId = Number(user?.DesigId || 0);
    const deptId = Number(user?.DeptId || 0);

    // Admin IDs: usually 1, 5, 12, etc. (Adjust based on user feedback or project defaults)
    const isAdmin = desig.includes('admin') || [1, 5, 12].includes(desigId) || dept === 'admin' || deptId === 4;
    const isHR = dept.includes('hr') || dept.includes('human resource') || deptId === 3;

    return ALL_NAV.filter(item => {
        // Admin sees everything
        if (isAdmin) return true;

        // HR sees Core + HR specific items
        if (isHR) {
            return item.section === 'core' || item.section === 'hr' || item.name === 'Dashboard';
        }

        // Normal users see Core + personal Expense Report
        return item.section === 'core' || item.section === 'expense';
    });
};

import logo from '../assets/logo.jpeg';

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
                <div className="h-20 flex items-center gap-2.5 px-4 shrink-0 border-b border-slate-100 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <img src={logo} alt="Forza Freedom" className="h-10 w-auto object-contain shrink-0" />
                    <div className="flex flex-col">
                        <h2 className="font-extrabold text-slate-900 text-[15px] tracking-tight uppercase">Forza Freedom</h2>
                    </div>
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
