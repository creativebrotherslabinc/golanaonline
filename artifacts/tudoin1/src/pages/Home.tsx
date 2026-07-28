import React from 'react';
import { Link } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { AdSense } from '@/components/shared/AdSense';
import { 
  FileText, SplitSquareVertical, Minimize2, FileCode, Type, FileImage, 
  Calculator, Receipt, Landmark, PiggyBank, DollarSign, Briefcase, TrendingUp,
  QrCode, Key, Scale, Calendar, Activity, Dices, CaseSensitive, Hash, Timer,
  AlignLeft, Replace, Lightbulb, FileBadge, Smile, BookOpen,
  Braces, Fingerprint, Scissors, Regex, Palette,
  Image, Video, Music, Diff, Percent, CalendarDays, Film, Mic
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'pdf',
    title: '📄 PDF Tools',
    description: 'Merge, split, and convert PDF files instantly in your browser.',
    tools: [
      { name: 'PDF Merger', path: '/pdf/merger', icon: FileText },
      { name: 'PDF Splitter', path: '/pdf/splitter', icon: SplitSquareVertical },
      { name: 'PDF Compressor', path: '/pdf/compressor', icon: Minimize2 },
      { name: 'PDF to DOCX', path: '/pdf/to-docx', icon: FileCode },
      { name: 'DOCX to PDF', path: '/pdf/docx-to-pdf', icon: FileText },
      { name: 'TXT to PDF', path: '/pdf/txt-to-pdf', icon: Type },
      { name: 'Images to PDF', path: '/pdf/img-to-pdf', icon: FileImage },
      { name: 'PDF to Images', path: '/pdf/to-img', icon: FileImage },
    ]
  },
  {
    id: 'media',
    title: '🖼️ Media Tools',
    description: 'Compress, convert, and edit images, videos, and audio files.',
    tools: [
      { name: 'Image Compressor', path: '/media/img-compressor', icon: Image },
      { name: 'Image Converter', path: '/media/img-converter', icon: Film },
      { name: 'Video Compressor', path: '/media/video-compressor', icon: Video },
      { name: 'Video to Audio', path: '/media/video-to-mp3', icon: Music },
      { name: 'Audio Cutter', path: '/media/audio-cutter', icon: Mic },
    ]
  },
  {
    id: 'calc',
    title: '💰 Calculators',
    description: 'Financial, investment, and everyday mathematical calculators.',
    tools: [
      { name: 'Mortgage Calculator', path: '/calc/mortgage', icon: Landmark },
      { name: 'Loan Calculator', path: '/calc/loan', icon: Receipt },
      { name: 'Interest Calculator', path: '/calc/interest', icon: TrendingUp },
      { name: 'Savings Calculator', path: '/calc/savings', icon: PiggyBank },
      { name: 'Currency Converter', path: '/calc/currency', icon: DollarSign },
      { name: 'Salary Tax Calc', path: '/calc/salary', icon: Briefcase },
      { name: 'ROI Calculator', path: '/calc/roi', icon: Calculator },
      { name: 'Percentage Calculator', path: '/calc/percentage', icon: Percent },
    ]
  },
  {
    id: 'tools',
    title: '🛠️ Everyday Utilities',
    description: 'Handy tools for daily tasks, conversions, and generation.',
    tools: [
      { name: 'QR Code Generator', path: '/tools/qr', icon: QrCode },
      { name: 'Password Generator', path: '/tools/password', icon: Key },
      { name: 'Unit Converter', path: '/tools/unit', icon: Scale },
      { name: 'Age Calculator', path: '/tools/age', icon: Calendar },
      { name: 'Date Difference', path: '/tools/datediff', icon: CalendarDays },
      { name: 'BMI Calculator', path: '/tools/bmi', icon: Activity },
      { name: 'Random Number', path: '/tools/random', icon: Dices },
      { name: 'Text Case Converter', path: '/tools/textcase', icon: CaseSensitive },
      { name: 'Word Counter', path: '/tools/wordcount', icon: Hash },
      { name: 'Timer & Pomodoro', path: '/tools/timer', icon: Timer },
    ]
  },
  {
    id: 'ai',
    title: '🤖 AI Mini Tools',
    description: 'Smart text generation and manipulation using mock AI models.',
    tools: [
      { name: 'Text Summarizer', path: '/ai/summarizer', icon: AlignLeft },
      { name: 'Paraphraser', path: '/ai/paraphraser', icon: Replace },
      { name: 'Name Generator', path: '/ai/namegen', icon: Lightbulb },
      { name: 'Resume Bullets', path: '/ai/resume', icon: FileBadge },
      { name: 'Joke Generator', path: '/ai/jokes', icon: Smile },
      { name: 'Story Generator', path: '/ai/story', icon: BookOpen },
    ]
  },
  {
    id: 'dev',
    title: '🧑‍💻 Developer Tools',
    description: 'Utilities for developers to format, test, and encode data.',
    tools: [
      { name: 'JSON Formatter', path: '/dev/json', icon: Braces },
      { name: 'Base64 Tool', path: '/dev/base64', icon: Fingerprint },
      { name: 'Code Minifier', path: '/dev/minifier', icon: Scissors },
      { name: 'Regex Tester', path: '/dev/regex', icon: Regex },
      { name: 'Color Picker', path: '/dev/color', icon: Palette },
      { name: 'Text Diff Checker', path: '/dev/diff', icon: Diff },
    ]
  }
];

export function Home() {
  React.useEffect(() => {
    document.title = "Go Lana – Free Online Tools | golana.online";
  }, []);

  return (
    <Shell>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background pt-16 pb-12 md:pt-24 md:pb-20 border-b">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-foreground">
            Go Lana <br/>
            <span className="text-primary text-3xl md:text-5xl mt-2 block">Free Online Tools</span>
          </h1>
          <p className="text-sm font-semibold tracking-widest text-primary/70 uppercase mb-4">
            <span className="text-primary">L</span>ibrary of <span className="text-primary">A</span>ll <span className="text-primary">N</span>eeded <span className="text-primary">A</span>pps
          </p>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Your all-in-one browser utility hub. No installations, no tracking, completely free. Everything you need, all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { href: '#pdf',   label: '📄 PDF Tools' },
              { href: '#media', label: '🖼️ Media Tools' },
              { href: '#calc',  label: '💰 Calculators' },
              { href: '#tools', label: '🛠️ Everyday Utilities' },
              { href: '#ai',    label: '🤖 AI Mini Tools' },
              { href: '#dev',   label: '🧑‍💻 Developer Tools' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={e => {
                  e.preventDefault();
                  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white hover:bg-gray-50 text-foreground border shadow-sm px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AdSense slot="top" className="mb-12" />

        <div className="space-y-16">
          {CATEGORIES.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-24">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{category.title}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.tools.map((tool) => (
                  <Link 
                    key={tool.name} 
                    href={tool.path}
                    className="group flex flex-col p-5 bg-card border rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{tool.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 text-center">
          <AdSense slot="bottom" />
        </div>
      </div>
    </Shell>
  );
}
