import React from 'react';

const Loader = ({ show, message = "Generating Report...", subMessage = "Please wait while we prepare your document", percentage = 0 }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 text-center scale-100 transition-transform duration-300">
                {/* High-End Circular Spinner */}
                <div className="relative w-24 h-24 mb-6">
                    {/* Inner Glow/Shadow */}
                    <div className="absolute inset-0 rounded-full border-4 border-slate-50 shadow-inner" />
                    
                    {/* Spinning Arc */}
                    <svg className="w-full h-full rotate-[-90deg]">
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset={percentage > 0 ? (251.2 - (251.2 * percentage) / 100) : 180}
                            className={`text-blue-600 transition-all duration-500 ${percentage === 0 ? 'animate-spin' : ''}`}
                            strokeLinecap="round"
                            style={{ transformOrigin: 'center' }}
                        />
                    </svg>

                    {/* Center Dot or Percentage */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {percentage > 0 ? (
                            <span className="text-sm font-black text-blue-600">{Math.round(percentage)}%</span>
                        ) : (
                            <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-pulse" />
                        )}
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

                {/* Progress Bar for more visibility */}
                <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden relative">
                    {percentage > 0 ? (
                        <div 
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    ) : (
                        <div className="h-full w-full bg-slate-100 animate-pulse" />
                    )}
                </div>
                
                <div className="mt-6 flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 tracking-tighter uppercase w-full justify-center">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   {percentage > 0 ? `Syncing Image Data... ${Math.round(percentage)}%` : "Establishing Secure Handshake..."}
                </div>
            </div>
        </div>
    );
};

export default Loader;
