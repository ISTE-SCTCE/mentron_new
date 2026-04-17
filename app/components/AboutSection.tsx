export function AboutSection() {
    return (
        <section className="w-full relative z-20 py-24 md:py-32 flex justify-center bg-transparent shrink-0">
            <div className="max-w-7xl w-full px-4 md:px-8 lg:px-16 flex">
                <div className="border-l-4 border-blue-500 pl-8 space-y-8 max-w-5xl translate-x-4 md:translate-x-0">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight text-glow">
                        About Mentron
                    </h2>
                    <div className="space-y-6 text-gray-200 text-lg md:text-xl leading-relaxed font-medium text-justify md:text-left">
                        <p>
                            Mentron is a student-driven innovation platform that connects learners, builders, and creators in one collaborative ecosystem. It enables users to showcase projects, explore opportunities, join internships, and access a student-focused marketplace.
                        </p>
                        <p>
                            Built to simplify networking, project collaboration, and skill development, Mentron empowers young innovators to turn ideas into real-world impact.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
