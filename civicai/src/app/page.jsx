'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Camera, 
  Cpu, 
  MapPin, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const features = [
    {
      icon: <Camera className="w-6 h-6 text-indigo-400" />,
      title: "Snap & Report",
      description: "Take a photo of any issue—from potholes to broken streetlights. Upload in seconds, and let the AI do the rest."
    },
    {
      icon: <Cpu className="w-6 h-6 text-indigo-400" />,
      title: "AI Vision Diagnostics",
      description: "Our vision model automatically detects the hazard type, logs severity, estimates dimensions, and drafts descriptions."
    },
    {
      icon: <MapPin className="w-6 h-6 text-indigo-400" />,
      title: "Hyperlocal Mapping",
      description: "Every issue is pinned on an interactive coordinates map so municipal work crews and neighbors know exactly where they are."
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-400" />,
      title: "Crowdsourced Verifications",
      description: "Neighbors upvote and verify active issues. Highly verified issues are auto-escalated for immediate city dispatch."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Capture the Hazard",
      desc: "Snap a photo of the public damage using your smartphone. No complex forms required."
    },
    {
      num: "02",
      title: "AI Diagnostic Scan",
      desc: "CivicAI analyzes the image, detects the issue category, gauges severity, and schedules a ticket."
    },
    {
      num: "03",
      title: "Community Upvote",
      desc: "Local residents verify the issue, increasing visibility and priority for public dispatch."
    },
    {
      num: "04",
      title: "Municipal Fix",
      desc: "City works team receives precise coordinates, logs progress updates, and submits resolution photos."
    }
  ];

  const stats = [
    { val: "14,820+", label: "Issues Resolved" },
    { val: "42 Mins", label: "Average Response Time" },
    { val: "97.4%", label: "AI Classification Accuracy" },
    { val: "50k+", label: "Vigilant Citizens Registered" }
  ];

  const testimonials = [
    {
      quote: "CivicAI changed how our neighborhood interacts with City Hall. A pothole that remained unfilled for months was patched in 48 hours after launching a verified report.",
      author: "Robert K. Vance",
      role: "Oak Hills Neighborhood Assoc.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert"
    },
    {
      quote: "As a city inspector, the detailed reports and exact coordinates save us hours of dispatch assessment. The AI vision preview categorizes everything accurately.",
      author: "Director Evelyn Mercer",
      role: "Metro City Public Works Dept.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn"
    }
  ];

  const faqs = [
    {
      q: "How does the AI analyze my uploaded photo?",
      a: "CivicAI uses a fine-tuned vision language model. When you upload a photo, the system processes it to identify specific structures (e.g. concrete decay, asphalt cracking, lighting malfunctions). It estimates the hazard severity based on size, location relative to pathways, and general public danger."
    },
    {
      q: "Do I need to sign up to report an issue?",
      a: "You can browse the map and view reports anonymously, but to submit a new report, verify active concerns, or post updates, we require a quick, passwordless signup to prevent duplicate or spam submissions."
    },
    {
      q: "How does the verification system work?",
      a: "To ensure that reports are accurate and active, other residents in the community can 'upvote' or 'verify' an issue. When an issue reaches 5 verifications, its status updates to 'Community Verified', notifying city maintenance partners immediately."
    },
    {
      q: "Can this system integrate with municipal software?",
      a: "Yes! CivicAI is architected with modern JSON-REST interfaces, allowing easy webhooks and integrations into typical city service logs, Salesforce City Cloud, and utility dispatch dashboards."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#030303]">
      {/* Background Glowing Gradients */}
      <div className="glow-spot top-[-100px] left-[5%]" />
      <div className="glow-spot top-[500px] right-[5%]" />
      <div className="glow-spot bottom-[-200px] left-[20%]" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 border-b border-white/5 grid-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <Badge variant="glass" className="py-1 px-3 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 font-semibold gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Theme: Community Hero - Hyperlocal Problem Solver</span>
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            See it. Snap it. <span className="text-gradient-purple font-black">Solve it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed mb-10"
          >
            CivicAI empowers communities to identify and repair infrastructure bottlenecks. Log hazards, verify neighborhood issues, and track resolutions in real-time with AI diagnostics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full" rightIcon={<ArrowRight className="w-4.5 h-4.5" />}>
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/report" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full bg-white/5">
                Report a Concern
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Statistics Bar */}
      <section className="py-12 border-b border-white/5 bg-[#050508]/80 backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{stat.val}</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-b border-white/5 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Everything you need to improve your block</p>
            <p className="text-base text-gray-400 mt-4 max-w-xl mx-auto">Equipping citizens with high-fidelity telemetry to fix public infrastructure issues faster.</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feat, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card hoverable className="h-full border border-white/5">
                  <CardContent className="pt-2 flex flex-col gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      {feat.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{feat.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works (AI Diagnostics Flow) */}
      <section id="how-it-works" className="py-20 border-b border-white/5 bg-[#050508]/40 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">AI Workflow</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">The Resolution Pipeline</p>
            <p className="text-base text-gray-400 mt-4 max-w-xl mx-auto">From initial photo capture to final public works clearance, powered by community verification.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="absolute top-[28px] left-[15%] right-[15%] h-[1px] bg-white/5 hidden md:block z-0" />
            
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center relative z-10 group">
                <div className="h-14 w-14 rounded-full bg-[#0a0a0f] border border-white/10 group-hover:border-indigo-500 flex items-center justify-center font-bold text-lg text-indigo-400 transition-all duration-300 shadow-md">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-white mt-5 mb-2">{step.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-b border-white/5 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Endorsements</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Trusted by Communities</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((test, idx) => (
              <Card key={idx} hoverable className="bg-[#0b0b0e]/70 border border-white/5">
                <CardContent className="pt-2 flex flex-col justify-between h-full gap-6">
                  <p className="text-sm italic text-gray-300 leading-relaxed">"{test.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                      <img src={test.avatar} alt={test.author} className="w-full h-full" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{test.author}</h4>
                      <p className="text-[10px] text-gray-500 font-semibold">{test.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 border-b border-white/5 bg-[#050508]/40 relative z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <HelpCircle className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
            <p className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="glass-panel rounded-xl overflow-hidden border border-white/5 transition-all">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4.5 text-left flex justify-between items-center hover:bg-white/5 transition-colors gap-4"
                  >
                    <span className="text-sm font-bold text-white">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs text-gray-400 leading-relaxed border-t border-white/5 bg-[#030303]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 text-center relative z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Be a Community Hero</h2>
          <p className="text-base text-gray-400 max-w-md mb-8 leading-relaxed">Join forces with neighbors to flag, verify, and resolve structural roadblocks. Shape a safer locality today.</p>
          <Link href="/signup">
            <Button size="lg" rightIcon={<ArrowRight className="w-4.5 h-4.5 animate-pulse" />}>
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#030303] text-gray-500 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" />
            <span className="font-bold text-white">CivicAI</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
