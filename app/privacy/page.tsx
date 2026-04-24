import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Mentron',
  description: 'Privacy Policy for the Mentron academic platform by ISTE SCTCE.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#030305] text-white selection:bg-purple-500/30">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <Link 
            href="/"
            className="text-sm font-bold text-cyan-400 tracking-widest hover:text-cyan-300 transition-colors"
          >
            ← BACK TO HOME
          </Link>
          <h1 className="mt-8 text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="mt-4 text-zinc-500 font-medium">Last Updated: April 24, 2026</p>
        </div>

        <div className="space-y-12 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center">
              <span className="w-8 h-px bg-cyan-500 mr-4"></span>
              Introduction
            </h2>
            <p>
              Mentron (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an academic platform developed by ISTE SCTCE. 
              We respect your privacy and are committed to protecting the personal data you share with us. 
              This policy explains how we collect, use, and safeguard your information when you use our web and mobile applications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center">
              <span className="w-8 h-px bg-cyan-500 mr-4"></span>
              Data We Collect
            </h2>
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
              <p>We collect information that you provide directly to us during account registration and profile management:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-zinc-400">
                <li><span className="text-white font-medium">Identification:</span> Full Name, Roll Number, and ISTE Membership ID.</li>
                <li><span className="text-white font-medium">Academic Info:</span> Department, Year of Study, and Semester.</li>
                <li><span className="text-white font-medium">Contact:</span> Institutional Email address.</li>
                <li><span className="text-white font-medium">Usage Data:</span> Interaction logs with notes, projects, and events.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center">
              <span className="w-8 h-px bg-cyan-500 mr-4"></span>
              How We Use Your Data
            </h2>
            <p>Your information is used strictly for academic and organizational purposes within ISTE SCTCE:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>To verify your identity and eligibility for restricted academic resources.</li>
              <li>To manage your participation in club events and projects.</li>
              <li>To provide a personalized academic dashboard and XP tracking.</li>
              <li>To ensure the security of our platform and prevent unauthorized access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center">
              <span className="w-8 h-px bg-cyan-500 mr-4"></span>
              Data Storage & Security
            </h2>
            <p>
              We utilize industry-standard cloud providers to ensure your data is secure:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4 text-zinc-400">
              <li><span className="text-white font-medium">Authentication & Database:</span> Powered by Supabase (PostgreSQL).</li>
              <li><span className="text-white font-medium">File Storage:</span> Academic notes and assets are stored securely on Cloudflare R2.</li>
              <li><span className="text-white font-medium">Encryption:</span> All data in transit is encrypted via HTTPS/TLS.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center">
              <span className="w-8 h-px bg-cyan-500 mr-4"></span>
              Third-Party Services
            </h2>
            <p>
              Our mobile application is distributed via the Google Play Store and may use third-party tools (like Firebase or Supabase Auth) 
              that collect information used to identify you. Please refer to their respective privacy policies for more details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center">
              <span className="w-8 h-px bg-cyan-500 mr-4"></span>
              Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact the ISTE SCTCE technical team at 
              <a href="mailto:iste@sctce.ac.in" className="text-cyan-400 hover:underline ml-1">iste@sctce.ac.in</a>.
            </p>
          </section>
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 text-center text-sm text-zinc-500 font-medium">
          &copy; 2026 ISTE SCTCE. All rights reserved.
        </div>
      </div>
    </div>
  );
}
