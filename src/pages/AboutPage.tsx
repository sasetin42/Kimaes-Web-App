import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Heart,
  Target,
  Eye,
  CheckCircle2,
  Users,
  Award,
  Utensils,
  TrendingUp,
  Clock,
  Briefcase,
  Store,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import aboutBanner from '@/assets/about-banner.jpg';
import logoBadge from '@/assets/logo-badge.png';
import bilaoSpread from '@/assets/bilao-spread.jpg';

export default function AboutPage() {
  const coreValues = [
    {
      title: 'QUALITY',
      desc: 'We prepare and present food with consistent care.',
      icon: '✨',
      badge: 'Care & Standard',
    },
    {
      title: 'AFFORDABILITY',
      desc: 'We create practical choices for different customer needs and budgets.',
      icon: '🏷️',
      badge: 'Value for Money',
    },
    {
      title: 'HOSPITALITY',
      desc: 'We treat every order as part of a meaningful customer moment.',
      icon: '🤝',
      badge: 'Filipino Warmth',
    },
    {
      title: 'RELIABILITY',
      desc: 'We communicate clearly and work to deliver what customers expect.',
      icon: '🎯',
      badge: 'Trust & On-Time',
    },
    {
      title: 'CULTURAL PRIDE',
      desc: 'We celebrate Filipino flavors, sharing traditions, and togetherness.',
      icon: '🇵🇭',
      badge: 'Bayanihan & Tradition',
    },
    {
      title: 'CONTINUOUS IMPROVEMENT',
      desc: 'We listen, learn, and strengthen our food and service over time.',
      icon: '📈',
      badge: 'Growth & Excellence',
    },
  ];

  const relevancePillars = [
    {
      title: 'Affordable Choices',
      desc: 'Available for both individual solo meals and festive group sharing.',
      icon: Utensils,
    },
    {
      title: 'Flexible Ordering',
      desc: 'Designed for ordinary everyday cravings as well as planned major celebrations.',
      icon: Clock,
    },
    {
      title: 'Convenient Presentation',
      desc: 'Familiar Filipino dishes served ready-to-table in party bilaos or convenient food trays.',
      icon: Award,
    },
    {
      title: 'Filipino Hospitality',
      desc: 'A warm, approachable brand rooted in genuine care and community trust.',
      icon: Heart,
    },
  ];

  const menuOfferings = [
    {
      category: 'Kakanin (Traditional Delicacies)',
      dishes: ['Maja Blanca', 'Biko', 'Puto', 'Kutsinta', 'Pitchi-Pitchi'],
      tag: 'Sweet Endings & Merienda',
    },
    {
      category: 'Signature Pasta & Noodles',
      dishes: ['Special Spaghetti', 'Palabok', 'Pancit Malabon', 'Bihon Guisado', 'Canton', 'Pancit Mix', 'Creamy Carbonara'],
      tag: 'Festive Favorites',
    },
    {
      category: 'Pork Classics',
      dishes: ['Pork Menudo', 'Pork Caldereta', 'Bicol Express', 'Sweet & Sour Pork', 'Crispy Lumpiang Shanghai'],
      tag: 'Savory Mains',
    },
    {
      category: 'Chicken Specialties',
      dishes: ['Chicken Curry', 'Classic Fried Chicken', 'Buffalo Chicken Wings', 'Chicken Cordon Bleu', 'Chicken Afritada'],
      tag: 'Crowd Pleasers',
    },
    {
      category: 'Seafood, Beef & Vegetables',
      dishes: ['Buttered Garlic Shrimp', 'Special Chopsuey', 'Beef Caldereta', 'Beef with Mushroom', 'Beef with Broccoli'],
      tag: 'Premium Trays',
    },
  ];

  const targetSegments = [
    {
      title: 'Families & Households',
      desc: 'Looking for affordable, comforting food for everyday meals, weekends, and intimate gatherings.',
    },
    {
      title: 'Busy Professionals',
      desc: 'Households that need convenient, delicious ready-to-serve dishes without the cooking prep.',
    },
    {
      title: 'Solo Cravings',
      desc: 'Customers wanting individual portions of their favorite Filipino classics on any ordinary day.',
    },
    {
      title: 'Celebrations & Milestones',
      desc: 'Groups celebrating birthdays, anniversaries, graduations, baptisms, and reunions.',
    },
    {
      title: 'Offices & Corporate Teams',
      desc: 'Organizations arranging meetings, team lunches, seminars, and company milestones.',
    },
    {
      title: 'Event Planners & Coordinators',
      desc: 'Coordinators who require dependable, delicious, and standardized food packages for clients.',
    },
  ];

  const leadershipTeam = [
    {
      name: 'Marvin Kim D. Morales',
      role: 'CEO / President',
      phone: '0991 598 4112',
      email: 'kimaespartybilao@gmail.com',
      desc: 'Oversees strategic growth, brand vision, operations development, and customer satisfaction across all business divisions.',
    },
    {
      name: 'Hannah Mae D. Morales',
      role: 'CEO / Vice President',
      phone: '0991 598 4112',
      email: 'deverahannamae@gmail.com',
      desc: 'Directs kitchen standards, menu culinary quality, team training, product presentation, and authentic family recipe continuity.',
    },
    {
      name: 'Vic De Guzman',
      role: 'Business Consultant',
      phone: '0961 772 2601',
      email: 'deguzmanvic@yahoo.com',
      desc: 'Advises on corporate expansion, franchise frameworks, investor relations, and scalable organizational processes.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1">
        {/* Hero Section */}
        <div className="hero-gradient py-16 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 woven-bg opacity-20" />
          <div className="relative container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary-foreground font-bold px-4 py-1.5 rounded-full text-xs mb-4">
              <Sparkles size={14} className="text-primary" />
              <span>Since 2020 • Dasmariñas, Cavite, Philippines</span>
            </div>
            <h1
              className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight"
              style={{ fontFamily: 'Nunito' }}
            >
              Kimae's Party Bilao
            </h1>
            <p className="text-primary text-xl md:text-2xl font-black uppercase tracking-wider mb-4" style={{ fontFamily: 'Nunito' }}>
              Your Partner for Every Occasion
            </p>
            <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              We make satisfying Filipino food more accessible — whether you need one dish for a sudden craving or a complete bilao package for an unforgettable celebration.
            </p>
          </div>
        </div>

        {/* Short Introduction & Brand Promise */}
        <section className="py-16 border-b border-border bg-card">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-primary font-bold text-xs uppercase tracking-wider">Who We Are</span>
                <h2 className="text-3xl md:text-4xl font-black text-secondary mt-1 mb-6" style={{ fontFamily: 'Nunito' }}>
                  Good Food. Happy Family. Ready to Share.
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
                  <p>
                    <strong className="text-foreground">Kimae's Party Bilao</strong> is a Filipino food business that offers affordable solo dishes and convenient food packages for families, friends, workplaces, and communities.
                  </p>
                  <p>
                    Our menu is crafted for both planned occasions and everyday moments — from birthdays and reunions to surprise visitors, spontaneous celebrations, office meetings, weekend family bonding, and simple cravings at home.
                  </p>
                  <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 text-foreground">
                    <p className="font-bold text-secondary text-sm md:text-base italic">
                      "Our Brand Promise: We aim to make every order easy, satisfying, and ready to share. By combining familiar Filipino flavors, practical serving options, and dependable customer care, Kimae's helps customers enjoy more time with the people who matter and less time worrying about food preparation."
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <img
                  src={aboutBanner}
                  alt="Kimae's Food Spread"
                  className="rounded-3xl shadow-xl w-full h-[380px] object-cover border-4 border-white"
                />
                <div className="absolute -bottom-6 -left-6 bg-secondary text-secondary-foreground p-5 rounded-2xl shadow-xl hidden sm:flex items-center gap-4 border border-secondary-foreground/20">
                  <div className="w-12 h-12 rounded-full bg-primary text-secondary flex items-center justify-center font-black text-lg">
                    #1
                  </div>
                  <div>
                    <p className="font-bold text-sm">Swak sa Sarap!</p>
                    <p className="text-xs text-primary font-semibold">Pinoy Handang Maasahan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story & Next Chapter */}
        <section className="py-16 bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-primary font-bold text-xs uppercase tracking-wider">Our Journey</span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-1 mb-4" style={{ fontFamily: 'Nunito' }}>
                From a Home Kitchen to a Growing Food Business
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                How passion, customer trust, and authentic Filipino recipes shaped our story from day one.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6">
                    <Heart size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-secondary mb-4" style={{ fontFamily: 'Nunito' }}>
                    Humble Beginnings (2020)
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    Kimae's Party Bilao began with a simple dream: to serve delicious, quality Filipino food from the comfort of our own home. In the beginning, the two of us managed everything—from preparing and cooking each dish to packing orders, assisting customers, and ensuring every meal met the standards we wanted our brand to represent.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    Through the trust and continued support of our customers, our small home-based business steadily grew. As demand increased, we saw the opportunity to bring Kimae's Party Bilao to more people, inspiring us to open our first physical store and establish a stronger presence in the community.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Today, Kimae's Party Bilao continues to move forward. We have expanded our product offerings, strengthened our operations, built a dedicated team, and developed systems designed to support sustainable growth.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs font-bold text-amber-700">
                  <CheckCircle2 size={16} /> From home kitchen to community staple
                </div>
              </div>

              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 text-secondary flex items-center justify-center mb-6">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-secondary mb-4" style={{ fontFamily: 'Nunito' }}>
                    Our Next Chapter
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    Our goal is to transform Kimae's Party Bilao from a home-based business and single physical store into a scalable food brand with multiple branches nationwide.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    As we prepare for expansion, we are looking for investors and franchise partners who believe in our potential and want to be part of our growth. Our foundation is built not only on good food but also on customer trust, valuable experience, reliable systems, and lessons learned from starting small.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    From two people cooking at home to building a physical store, Kimae's Party Bilao continues its journey toward becoming a recognized Filipino brand while staying true to its core purpose: <strong className="text-foreground">Good Food. Happy Family. Your Partner for Every Occasion.</strong>
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs font-bold text-primary">
                  <Store size={16} /> Expanding across Cavite and nationwide
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-secondary text-secondary-foreground relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-primary font-bold text-xs uppercase tracking-wider">Purpose & Destination</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-1" style={{ fontFamily: 'Nunito' }}>
                Our Mission & Vision
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mission */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-secondary flex items-center justify-center font-black">
                  <Target size={28} />
                </div>
                <h3 className="text-2xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                  Our Mission
                </h3>
                <p className="text-secondary-foreground/80 leading-relaxed text-sm md:text-base">
                  "Our mission is to become the go-to name for Filipino party food enhancing the tradition of bilao with quality, care and cultural pride. We are committed to delivering joyful and satisfying experiences in every gathering by continuously improving our service, expanding our reach and honoring the taste of Filipino celebration."
                </p>
              </div>

              {/* Vision */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-secondary flex items-center justify-center font-black">
                  <Eye size={28} />
                </div>
                <h3 className="text-2xl font-black text-primary" style={{ fontFamily: 'Nunito' }}>
                  Our Vision
                </h3>
                <p className="text-secondary-foreground/80 leading-relaxed text-sm md:text-base">
                  "To become the most trusted and accessible Filipino party food brand nationwide. Known for bringing joy to every celebration through delicious bilao offering, excellent customer service, and a strong commitment to Filipino tradition. We envision Kimae's in every province, every milestone and every table from online orders to franchise branches across the country."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-card border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-primary font-bold text-xs uppercase tracking-wider">The Kimae Way</span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-1 mb-3" style={{ fontFamily: 'Nunito' }}>
                Our 6 Core Values
              </h2>
              <p className="text-muted-foreground text-sm">
                These principles guide every recipe we cook, every customer interaction, and every decision we make.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreValues.map((v) => (
                <div
                  key={v.title}
                  className="p-6 rounded-2xl border border-border bg-background hover:border-primary transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{v.icon}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        {v.badge}
                      </span>
                    </div>
                    <h3 className="font-black text-lg text-secondary mb-2" style={{ fontFamily: 'Nunito' }}>
                      {v.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Makes Kimae's Relevant */}
        <section className="py-16 bg-muted/20 border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-primary font-bold text-xs uppercase tracking-wider">Made For Any Moment</span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-1 mb-3" style={{ fontFamily: 'Nunito' }}>
                What Makes Kimae's Relevant
              </h2>
              <p className="text-muted-foreground text-sm">
                Filipino gatherings can happen anytime. Some are carefully planned, while others begin with a message, a craving, or an unexpected reason to celebrate. Kimae's responds with flexible choices that fit different needs, group sizes, and budgets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relevancePillars.map((p, idx) => (
                <div key={idx} className="bg-card p-6 rounded-2xl border border-border text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
                    <p.icon size={22} />
                  </div>
                  <h4 className="font-bold text-base text-foreground mb-2" style={{ fontFamily: 'Nunito' }}>
                    {p.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Offer (Bilao or Tray) */}
        <section className="py-16 bg-card border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-primary font-bold text-xs uppercase tracking-wider">Flexible Food Choices</span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-1 mb-3" style={{ fontFamily: 'Nunito' }}>
                What We Offer (Available for Bilao or Tray)
              </h2>
              <p className="text-muted-foreground text-sm">
                Whether you need individual solo dishes for a quick craving or complete bundled party bilao packages for crowds of all sizes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {menuOfferings.map((cat, i) => (
                <div key={i} className="p-6 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {cat.tag}
                    </span>
                    <span className="text-xs font-black text-secondary">Bilao / Tray</span>
                  </div>
                  <h3 className="font-black text-lg text-secondary" style={{ fontFamily: 'Nunito' }}>
                    {cat.category}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.dishes.map((dish, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-semibold text-foreground shadow-2xs"
                      >
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
                Browse Full Menu & Pricing <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Customers & Market */}
        <section className="py-16 bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-primary font-bold text-xs uppercase tracking-wider">Customers & Market</span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-1 mb-3" style={{ fontFamily: 'Nunito' }}>
                Serving Every Table & Milestone
              </h2>
              <p className="text-muted-foreground text-sm">
                Kimae's Party Bilao serves value-conscious Filipinos who want delicious, convenient, and shareable food.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {targetSegments.map((seg, sIdx) => (
                <div key={sIdx} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                  <h4 className="font-bold text-base text-foreground mb-2" style={{ fontFamily: 'Nunito' }}>
                    {seg.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{seg.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The People Behind Kimae's Party Bilao */}
        <section className="py-16 bg-card border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-primary font-bold text-xs uppercase tracking-wider">Leadership & Vision</span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary mt-1 mb-3" style={{ fontFamily: 'Nunito' }}>
                The People Behind Kimae's Party Bilao
              </h2>
              <p className="text-muted-foreground text-sm">
                Kimae's is guided by a team focused on responsible growth, customer satisfaction, and the long-term development of the brand.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {leadershipTeam.map((leader, lIdx) => (
                <div
                  key={lIdx}
                  className="p-6 rounded-3xl border border-border bg-muted/20 hover:border-primary transition-all flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-secondary text-primary flex items-center justify-center font-black text-xl mb-4 shadow-md">
                      {leader.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-secondary" style={{ fontFamily: 'Nunito' }}>
                        {leader.name}
                      </h3>
                      <p className="text-xs font-bold text-primary uppercase tracking-wide">
                        {leader.role}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                      {leader.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border space-y-1.5 text-xs">
                    <a
                      href={`tel:${leader.phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone size={13} className="text-primary flex-shrink-0" />
                      <span>{leader.phone}</span>
                    </a>
                    <a
                      href={`mailto:${leader.email}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors truncate"
                    >
                      <Mail size={13} className="text-primary flex-shrink-0" />
                      <span className="truncate">{leader.email}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Business Location & Franchise CTA */}
        <section className="py-16 bg-muted/40">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="bg-secondary text-secondary-foreground rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-3xl">
                <span className="text-primary font-bold text-xs uppercase tracking-wider block mb-2">
                  Partner with Kimae's
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Nunito' }}>
                  Branch Opportunities & Franchise Development
                </h2>
                <p className="text-secondary-foreground/80 text-sm md:text-base leading-relaxed mb-6">
                  We welcome inquiries about orders, corporate partnerships, events, branch opportunities, and future franchise development across the Philippines. Connect with our leadership team today.
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl">
                    <MapPin size={16} className="text-primary" />
                    <span>BLK 31 LOT 14 PUROK 3, Victoria Reyes, Dasmariñas, Cavite</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl">
                    <Phone size={16} className="text-primary" />
                    <span>0991 598 4112 / 0961 772 2601</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/contact" className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-3">
                    Contact Our Team <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/menu"
                    className="px-6 py-3 rounded-xl border border-white/20 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    View Menu Catalog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
