import { Heart, Leaf,Bot, Home, MessageSquare } from 'lucide-react';
import { Link } from 'react-scroll';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'identify', icon: Bot, label: 'Identify' },
    { id: 'nutrition', icon: Leaf, label: 'Nutrition' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' }
  ];

  return (
    <footer className="py-8 bg-ghibli-brown-dark text-white text-sm">
      <div className="ghibli-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand Column */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center mb-2">
              <Bot className="h-5 w-5 mr-2 text-ghibli-yellow" />
              <span className="font-medium">AquaBov</span>
            </div>
            <div className="flex items-center text-white/70">
              <Heart className="h-3 w-3 mr-1 text-red-400 fill-red-400" />
              <span>For sustainable farming</span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.id}
                smooth={true}
                duration={300}
                offset={-70}
                className="flex items-center text-white/80 hover:text-white cursor-pointer py-1"
              >
                <item.icon className="h-4 w-4 mr-2" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Copyright Column */}
          <div className="flex flex-col items-center md:items-end justify-center text-white/60 text-xs">
            <div>&copy; {currentYear} AquaBov</div>
            <div>All rights reserved</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;