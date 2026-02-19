'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

export function ConcentricCircles() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Parallax effect on scroll
    const y1 = useSpring(useTransform(scrollY, [0, 500], [0, 100]), { stiffness: 100, damping: 30 });
    const y2 = useSpring(useTransform(scrollY, [0, 500], [0, 60]), { stiffness: 100, damping: 30 });

    return (
        <div ref={containerRef} className="absolute inset-x-0 top-[42%] -translate-y-1/2 flex items-center justify-center pointer-events-none z-0">
            {/* Inner Circle */}
            <motion.div
                style={{ y: y1 }}
                animate={{
                    rotate: 360,
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border border-blue-500/10 bg-blue-500/5 backdrop-blur-[2px] shadow-[0_0_50px_rgba(59,130,246,0.1)]"
            />

            {/* Outer Circle */}
            <motion.div
                style={{ y: y2 }}
                animate={{
                    rotate: -360,
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                    scale: { duration: 12, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute w-[450px] h-[450px] md:w-[750px] md:h-[750px] rounded-full border border-teal-500/10 bg-teal-500/5 backdrop-blur-[1px] shadow-[0_0_80px_rgba(20,184,166,0.05)]"
            />

            {/* Decorative Dots/Accents */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-[350px] h-[350px] md:w-[600px] md:h-[600px] rounded-full"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full blur-[1px] opacity-40" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-teal-400 rounded-full blur-[1px] opacity-40" />
            </motion.div>
        </div>
    );
}
