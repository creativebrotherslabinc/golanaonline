import React, { useEffect } from 'react';
import { AdSense } from './AdSense';
import { ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

interface ToolLayoutProps {
  title: string;
  description: string;
  category: string;
  categoryPath: string;
  children: React.ReactNode;
}

export function ToolLayout({ title, description, category, categoryPath, children }: ToolLayoutProps) {
  useEffect(() => {
    document.title = `${title} - tudoin1.com`;
  }, [title]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={categoryPath} className="hover:text-foreground transition-colors">{category}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">{title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
      </div>

      <div className="mb-8">
        <AdSense slot="top" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full bg-card rounded-xl border shadow-sm p-4 md:p-8">
          {children}
        </div>
        
        <div className="w-full lg:w-[300px] shrink-0 sticky top-24 hidden lg:block">
          <AdSense slot="sidebar" />
        </div>
      </div>

      <div className="mt-12">
        <AdSense slot="bottom" />
      </div>
    </div>
  );
}
