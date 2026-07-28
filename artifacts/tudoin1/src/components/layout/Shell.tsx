import React from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Hammer, Wrench, Calculator, FileText, Cpu, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [location] = useLocation();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navGroups = [
    { name: 'PDF Tools', icon: FileText, path: '/pdf/merger' },
    { name: 'Media', icon: Hammer, path: '/media/img-compressor' },
    { name: 'Calculators', icon: Calculator, path: '/calc/mortgage' },
    { name: 'Utilities', icon: Wrench, path: '/tools/qr' },
    { name: 'AI Mini', icon: Cpu, path: '/ai/summarizer' },
    { name: 'Dev Tools', icon: Code, path: '/dev/json' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Hammer className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Go Lana<span className="text-primary">.online</span>
              </span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            {navGroups.map(group => (
              <Link 
                key={group.name} 
                href={group.path}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <group.icon className="w-4 h-4" />
                {group.name}
              </Link>
            ))}
          </nav>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b bg-background">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navGroups.map(group => (
                <Link 
                  key={group.name} 
                  href={group.path}
                  className="text-sm font-medium p-2 hover:bg-muted rounded-md flex items-center gap-2"
                >
                  <group.icon className="w-4 h-4" />
                  {group.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-80">
            <Hammer className="w-5 h-5 text-primary" />
            <span className="font-bold tracking-tight text-lg">golana.online</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} golana.online | Library of All Needed Apps
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Terms</Link>
            <Link href="/" className="hover:text-foreground">Privacy</Link>
            <Link href="/" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
