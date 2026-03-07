/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                // Brand — vibrant indigo
                primary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                // Fallback Dark mode palette (prevents build crash)
                dark: {
                    bg: '#0a0a0c',
                    card: '#111116',
                    surface: '#18181f',
                    border: '#22222a',
                    text: '#e2e2e9',
                    textMuted: '#94a3b8',
                },
                canvas: {
                    DEFAULT: '#f8fbfe',
                    card: '#ffffff',
                },
            },
            boxShadow: {
                'card': '0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.05)',
                'card-lg': '0 8px 30px rgba(0,0,0,.08)',
                'sidebar': '4px 0 24px rgba(0,0,0,.05)',
                'glow': '0 0 20px rgba(79,61,232,.15)',
                'btn': '0 3px 8px rgba(79,61,232,.25)',
            },
            animation: {
                'fade-in': 'fadeIn  0.35s cubic-bezier(0.16,1,0.3,1) both',
                'slide-up': 'slideUp 0.4s  cubic-bezier(0.16,1,0.3,1) both',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
                slideUp: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
        },
    },
    plugins: [],
}
