'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

let toastFn: (message: string, type?: ToastType) => void;

export const toast = (message: string, type: ToastType = 'success') => {
    if (toastFn) toastFn(message, type);
};

export function Toaster() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    useEffect(() => {
        toastFn = addToast;
    }, [addToast]);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none md:w-auto">
            <AnimatePresence>
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="pointer-events-auto"
                    >
                        <div className={`
                            flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl
                            ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                t.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'}
                        `}>
                            {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
                            {t.type === 'info' && <Info className="w-5 h-5" />}

                            <p className="text-sm font-medium flex-1">{t.message}</p>

                            <button
                                onClick={() => removeToast(t.id)}
                                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 opacity-70" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
