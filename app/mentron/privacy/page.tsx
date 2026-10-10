import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Mentron',
  description: 'Privacy Policy for the Mentron academic platform by ISTE SCTCE.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#030305] text-[#ededed] selection:bg-purple-500/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-10 sm:mb-12">
          <Link 
            href="/"
            className="text-xs sm:text-sm font-bold text-cyan-400 tracking-widest hover:text-cyan-300 transition-colors uppercase"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-6 text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="mt-3 text-gray-400 text-xs sm:text-sm font-medium">Last Updated: April 24, 2026</p>
        </div>

        <div className="space-y-8 sm:space-y-10 text-gray-300 leading-relaxed text-sm sm:text-base">
          <section className="glass-card !p-6 sm:!p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight flex items-center">
              <span className="w-6 sm:w-8 h-px bg-cyan-400 mr-3 sm:mr-4"></span>
              Introduction
            </h2>
            <p className="text-gray-300">
              Mentron (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an academic platform developed by ISTE SCTCE. 
              We respect your privacy and are committed to protecting the personal data you share with us. 
              This policy explains how we collect, use, and safeguard your information when you use our web and mobile applications.
            </p>
          </section>

          <section className="glass-card !p-6 sm:!p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight flex items-center">
              <span className="w-6 sm:w-8 h-px bg-purple-400 mr-3 sm:mr-4"></span>
              Data We Collect
            </h2>
            <p className="mb-4 text-gray-300">We collect information that you provide directly to us during account registration and profile management:</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-3">
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><span className="text-white font-semibold">Identification:</span> Full Name, Roll Number, and ISTE Membership ID.</li>
                <li><span className="text-white font-semibold">Academic Info:</span> Department, Year of Study, and Semester.</li>
                <li><span className="text-white font-semibold">Contact:</span> Institutional Email address.</li>
                <li><span className="text-white font-semibold">Usage Data:</span> Interaction logs with notes, projects, and events.</li>
              </ul>
            </div>
          </section>

          <section className="glass-card !p-6 sm:!p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight flex items-center">
              <span className="w-6 sm:w-8 h-px bg-cyan-400 mr-3 sm:mr-4"></span>
              How We Use Your Data
            </h2>
            <p className="text-gray-300">Your information is used strictly for academic and organizational purposes within ISTE SCTCE:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>To verify your identity and eligibility for restricted academic resources.</li>
              <li>To manage your participation in club events and projects.</li>
              <li>To provide a personalized academic dashboard and XP tracking.</li>
              <li>To ensure the security of our platform and prevent unauthorized access.</li>
            </ul>
          </section>

          <section className="glass-card !p-6 sm:!p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight flex items-center">
              <span className="w-6 sm:w-8 h-px bg-purple-400 mr-3 sm:mr-4"></span>
              Data Storage & Security
            </h2>
            <p className="mb-4 text-gray-300">
              We utilize industry-standard cloud providers to ensure your data is secure:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><span className="text-white font-semibold">Authentication & Database:</span> Powered by Supabase (PostgreSQL).</li>
              <li><span className="text-white font-semibold">File Storage:</span> Academic notes and assets are stored securely on Cloudflare R2.</li>
              <li><span className="text-white font-semibold">Encryption:</span> All data in transit is encrypted via HTTPS/TLS.</li>
            </ul>
          </section>

          <section className="glass-card !p-6 sm:!p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight flex items-center">
              <span className="w-6 sm:w-8 h-px bg-cyan-400 mr-3 sm:mr-4"></span>
              Third-Party Services
            </h2>
            <p className="text-gray-300">
              Our mobile application is distributed via the Google Play Store and may use third-party tools (like Firebase or Supabase Auth) 
              that collect information used to identify you. Please refer to their respective privacy policies for more details.
            </p>
          </section>

          <section className="glass-card !p-6 sm:!p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight flex items-center">
              <span className="w-6 sm:w-8 h-px bg-purple-400 mr-3 sm:mr-4"></span>
              Contact Us
            </h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact the ISTE SCTCE technical team at 
              <a href="mailto:istesctce@gmail.com" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 ml-1">istesctce@gmail.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center text-xs sm:text-sm text-gray-500 font-medium">
          &copy; 2026 ISTE SCTCE. All rights reserved.
        </div>
      </div>
    </div>
  );
}
