import React from 'react';
import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

const Placeholder = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="card-glass p-8 max-w-lg w-full flex flex-col items-center shadow-lg"
            >
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-6">
                    <Construction className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    We are currently working on giving the {title} page a fresh new look! Come back later.
                </p>

                <div className="mt-8 w-full max-w-sm h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-primary-500 w-1/2 animate-pulse rounded-full" />
                </div>
            </motion.div>
        </div>
    );
};

export default Placeholder;
