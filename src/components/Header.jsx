import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell, Search, ChevronDown, LogOut, User } from 'lucide-react';
import logo from '../assets/logo.jpeg';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
    const { user, logout } = useAuth();
    const [dropOpen, setDropOpen] = useState(false);

    const displayName = user?.username || user?.FirstName || 'User';
    const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const roleLabel = user?.Designatation || 'Employee';

    return (
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between
                           px-6 gap-4 bg-white border-b border-slate-200 shrink-0 select-none">

            {/* Left Control Area */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500
                               hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Right Profile Area */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex items-center relative group">
                    <Search size={14} className="absolute left-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-900 transition-all w-40 hover:w-48"
                    />
                </div>

                <button className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                    <Bell size={18} />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setDropOpen(v => !v)}
                        className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-all"
                    >
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials}
                        </div>
                        <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {dropOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 z-20 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden py-1 animate-fade-in">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{roleLabel}</p>
                                </div>
                                <div className="py-1">
                                    <button onClick={() => setDropOpen(false)} className="flex items-center gap-3 w-full px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
                                        <User size={14} /> Profile
                                    </button>
                                    <button onClick={() => setDropOpen(v => { setDropOpen(false); logout(); })} className="flex items-center gap-3 w-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-all border-t border-slate-100 mt-1">
                                        <LogOut size={14} /> Log Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
