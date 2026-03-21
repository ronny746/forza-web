import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Loader = ({ show, message = "Generating Report...", subMessage = "Please wait while we prepare your document" }) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 text-center"
                    >
                        {/* High-End Circular Spinner */}
                        <div className="relative w-24 h-24 mb-6">
                            {/* Inner Glow/Shadow */}
                            <div className="absolute inset-0 rounded-full border-4 border-slate-50 shadow-inner" />
                            
                            {/* Spinning Arc */}
                            <svg className="w-full h-full rotate-[-90deg]">
                                <motion.circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray="251.2"
                                    initial={{ strokeDashoffset: 251.2 }}
                                    animate={{ 
                                        strokeDashoffset: [251.2, 50, 251.2],
                                        rotate: [0, 360]
                                    }}
                                    transition={{ 
                                        duration: 2, 
                                        repeat: Infinity, 
                                        ease: "easeInOut" 
                                    }}
                                    className="text-primary-600"
                                    strokeLinecap="round"
                                />
                            </svg>

                            {/* Center Dot */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div 
                                    animate={{ scale: [0.8, 1.2, 0.8] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-3 h-3 bg-primary-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
                                />
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                            {message}
                        </h3>
                        {subMessage && (
                            <p className="text-slate-400 font-bold mt-2 text-[11px] leading-relaxed uppercase tracking-wider">
                                {subMessage}
                            </p>
                        )}
                        
                        <div className="mt-6 flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 tracking-tighter uppercase">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           Secure Backend Sync Active
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Loader;
