import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

import loginBg from '../assets/login_bg.png';

const Login = () => {
    const [mobileNo, setMobileNo] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [touched, setTouched] = useState({ mobile: false, password: false });
    const { login, demoLogin } = useAuth();
    const navigate = useNavigate();

    const mobileError = touched.mobile && (!mobileNo ? 'Mobile number is required' : mobileNo.length < 10 ? 'Enter a valid 10-digit mobile number' : '');
    const passwordError = touched.password && (!password ? 'Password is required' : password.length < 4 ? 'Password must be at least 4 characters' : '');

    const handleLogin = async (e) => {
        e.preventDefault();
        setTouched({ mobile: true, password: true });
        setError('');
        if (!mobileNo || !password) {
            setError('Please fill in all required fields.');
            return;
        }
        if (mobileNo.length < 10) {
            setError('Please enter a valid mobile number.');
            return;
        }
        if (password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/v1/agent/auth/login', { MobileNo: mobileNo, password });
            const token = response.data?.data?.jwtToken;
            if (token) { await login(token); navigate('/dashboard'); }
            else setError('Login failed: Invalid response from server. Please try again.');
        } catch (err) {
            const msg = err.response?.data?.message;
            if (err.response?.status === 401 || err.response?.status === 400) {
                setError('Incorrect mobile number or password. Please try again.');
            } else if (err.response?.status === 403) {
                setError('Your account has been deactivated. Contact your administrator.');
            } else if (!err.response) {
                setError('Cannot connect to server. Please check your internet connection.');
            } else {
                setError(msg || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        demoLogin();
        setTimeout(() => {
            navigate('/dashboard');
        }, 100);
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg transition-colors duration-300">

            {/* ── Left panel — branding (hidden on mobile) ── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col items-start justify-between p-12">

                {/* Background Image with Animation */}
                <div className="absolute inset-0 z-0 scale-110 animate-[pulse-slow_20s_ease-in-out_infinite]">
                    <img
                        src={loginBg}
                        alt="Medical Tech Background"
                        className="w-full h-full object-cover blur-[2px] opacity-40 dark:opacity-30"
                    />
                </div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 z-1 bg-gradient-to-br from-primary-800/95 via-primary-900/90 to-primary-950/95" />

                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-white/5 pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-lg shadow-black/10">
                        <span className="text-white font-black text-xl italic">F</span>
                    </div>
                    <div>
                        <p className="text-white font-bold text-xl tracking-tight leading-none uppercase">ForzaMedi</p>
                        <p className="text-primary-100/80 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">WSN Portal</p>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10 space-y-8 max-w-lg">
                    <div className="space-y-4 p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
                        <h1 className="text-4xl xl:text-6xl font-black text-white leading-[1.1]">
                            Manage your<br />
                            <span className="text-primary-200">team smarter.</span>
                        </h1>
                        <p className="text-primary-50/90 text-lg leading-relaxed font-medium">
                            A unified platform for real-time attendance, visits, expenses, and automated field reports.
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2.5">
                        {['Visit Plans', 'Leave Mgmt', 'Expense Claims', 'Miss Punch', 'Team Insights'].map(f => (
                            <span key={f} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-lg text-white text-[13px] font-semibold border border-white/20 hover:bg-white/20 transition-all cursor-default">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />{f}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Bottom tagline */}
                <div className="relative z-10 flex items-center gap-3 px-4 py-2 rounded-full bg-black/20 backdrop-blur border border-white/5 text-primary-100 text-sm font-medium">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    Secure • Reliable • Built for scale
                </div>
            </div>


            {/* ── Right panel — login form ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 min-h-screen">

                {/* Mobile logo */}
                <div className="flex lg:hidden items-center gap-3 mb-10">
                    <div className="w-9 h-9 rounded-xl bg-primary-900 flex items-center justify-center">
                        <span className="text-white font-black text-base">F</span>
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-lg leading-none">ForzaMedi</p>
                        <p className="text-xs text-gray-400 font-medium">WSN Portal</p>
                    </div>
                </div>

                {/* Form card */}
                <div className="w-full max-w-[400px]">
                    {/* Heading */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-gray-500 dark:text-dark-textMuted text-sm">Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5" noValidate>
                        {/* Error banner */}
                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 animate-slide-up">
                                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">!</span>
                                </div>
                                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Mobile number */}
                        <div className="space-y-1.5">
                            <label className="input-label">Mobile Number</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone className={`h-4 w-4 transition-colors ${mobileError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary-500'}`} />
                                </div>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={15}
                                    placeholder="Enter your mobile number"
                                    value={mobileNo}
                                    onChange={e => { setMobileNo(e.target.value.replace(/[^0-9+]/g, '')); setError(''); }}
                                    onBlur={() => setTouched(p => ({ ...p, mobile: true }))}
                                    className={`input-field pl-11 h-12 ${mobileError ? 'border-red-400 focus:ring-red-400/40 focus:border-red-400' : ''}`}
                                    autoComplete="tel"
                                />
                            </div>
                            {mobileError && (
                                <p className="input-error flex items-center gap-1 mt-1"><AlertCircle size={12} />{mobileError}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="input-label">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className={`h-4 w-4 transition-colors ${passwordError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary-500'}`} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    onBlur={() => setTouched(p => ({ ...p, password: true }))}
                                    className={`input-field pl-11 pr-12 h-12 ${passwordError ? 'border-red-400 focus:ring-red-400/40 focus:border-red-400' : ''}`}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="input-error flex items-center gap-1 mt-1"><AlertCircle size={12} />{passwordError}</p>
                            )}
                        </div>

                        {/* Remember + Forgot */}
                        <div className="flex items-center justify-between text-sm pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-primary-600" />
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Remember me</span>
                            </label>
                            <button type="button" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-sm">
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit */}
                        <div className="space-y-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 btn-primary justify-center text-base rounded-xl shadow-lg shadow-primary-500/25"
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Signing In…</>
                                ) : (
                                    <>Sign In <ArrowRight size={18} /></>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full h-px bg-gray-200 dark:bg-dark-border" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 text-xs text-gray-400 bg-gray-50 dark:bg-dark-bg">
                                Don't have access?
                            </span>
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-500 dark:text-dark-textMuted">
                        Contact your{' '}
                        <a href="#" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                            system administrator
                        </a>{' '}
                        to get an account.
                    </p>

                    {/* Footer note */}
                    <p className="mt-10 text-center text-xs text-gray-400 dark:text-dark-textMuted">
                        © 2024 ForzaMedi. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
