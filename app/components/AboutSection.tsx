'use client'

import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/app/lib/animations'

export function AboutSection() {
    return (
        <section className="w-full relative z-20 py-16 sm:py-24 md:py-32 flex justify-center bg-transparent shrink-0">
            <div className="max-w-7xl w-full px-4 sm:px-6 md:px-8 lg:px-16 flex">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="flex gap-0 max-w-5xl"
                >
                    {/* Animated left accent bar */}
                    <motion.div
                        variants={{
                            hidden: { scaleY: 0, originY: 0 },
                            visible: { scaleY: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                        }}
                        className="w-[3px] sm:w-[4px] bg-gradient-to-b from-purple-500 via-purple-400 to-purple-600/30 rounded-full mr-4 sm:mr-8 flex-shrink-0 origin-top"
                        style={{ transformOrigin: 'top' }}
                    />

                    <div className="space-y-6 sm:space-y-8">
                        <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight text-glow">
                            About Mentron
                        </motion.h2>
                        <motion.div variants={staggerContainer} className="space-y-4 sm:space-y-6 text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed font-medium text-left">
                            <motion.p variants={fadeInUp}>
                                Mentron is a student-driven innovation platform that connects learners, builders, and creators in one collaborative ecosystem. It enables users to showcase projects, explore opportunities, join internships, and access a student-focused marketplace.
                            </motion.p>
                            <motion.p variants={fadeInUp}>
                                Built to simplify networking, project collaboration, and skill development, Mentron empowers young innovators to turn ideas into real-world impact.
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
