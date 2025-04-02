
import { useState, useEffect } from 'react';
import { Menu, X, Home, Search, MessageSquare, Leaf, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  const navItems = [
    { id: 'home', name: 'Home', icon: <Home className="h-5 w-5" /> },
    { id: 'identify', name: 'Identify Breed', icon: <Search className="h-5 w-5" /> },
    { id: 'chat', name: 'Chat', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'nutrition', name: 'Nutrition Plan', icon: <Leaf className="h-5 w-5" /> },
    { id: 'about', name: 'About', icon: <Info className="h-5 w-5" /> },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 transition-transform duration-300 shadow-sm border-b border-ghibli-yellow/20",
        !isVisible && "-translate-y-full"
      )}
    >
      <div className="ghibli-container flex items-center justify-between py-3">
        <div className="flex items-center">
          <a href="#" className="flex  items-center gap-2">
            <img src="/images/cow-logo.png" alt="FarmCow Logo" className="h-10 w-10" />
            <span className="text-xl font-medium text-ghibli-brown-dark">AquaBov</span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="flex items-center gap-1.5 text-ghibli-brown hover:text-ghibli-green hover:bg-ghibli-yellow/10 px-3 py-2 rounded-lg"
              onClick={() => scrollToSection(item.id)}
            >
              {item.icon}
              <span>{item.name}</span>
            </Button>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-ghibli-brown-dark" />
          ) : (
            <Menu className="h-6 w-6 text-ghibli-brown-dark" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={cn(
          "md:hidden fixed inset-x-0 bg-white/95 backdrop-blur-sm border-b border-ghibli-yellow/20 transition-all duration-300 ease-in-out z-40",
          isOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <nav className="flex flex-col p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="flex items-center justify-start gap-2 text-ghibli-brown hover:text-ghibli-green hover:bg-ghibli-yellow/10 px-4 py-3 rounded-lg w-full"
              onClick={() => scrollToSection(item.id)}
            >
              {item.icon}
              <span className="text-base">{item.name}</span>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
