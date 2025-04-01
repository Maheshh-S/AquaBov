import { useState, useEffect } from 'react';
import { ArrowDown, ChevronLast } from 'lucide-react';
import { Button } from "@/components/ui/button";
import CowImage from '/images/pngegg.png';

const Hero = () => {
  const [animationStep, setAnimationStep] = useState(0);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  
  const scrollToIdentify = () => {
    const element = document.getElementById('identify');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const renderCowAnimation = () => {
    return (
      <div className="absolute right-10 bottom-24 md:right-24 xl:right-32 hidden md:block">
        <div className={`transition-all duration-1000 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] transform ${
          animationStep === 0 ? 'translate-y-0 scale-100 rotate-0' : 
          animationStep === 1 ? 'translate-y-4 scale-110 rotate-3' : 
          animationStep === 2 ? 'translate-y-0 scale-100 rotate-0' : 
          'translate-y-3 scale-105 -rotate-3'
        }`}>
          <div className="relative w-80 h-80 md:w-96 md:h-96 xl:w-[28rem] xl:h-[28rem]">
            {/* Grass shadow effect */}
            <div className="absolute -bottom-4 -left-4 right-4 h-20 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-full blur-sm"></div>
            
            {/* Main cow image with enhanced animations */}
            <img 
              src={CowImage} 
              alt="Happy Cow" 
              className="w-full h-full object-contain drop-shadow-2xl transition-all duration-700"
              // style={{
              //   filter: 'brightness(1.05) contrast(1.1) saturate(1.1)',
              //   transform: animationStep % 2 === 0 ? 'scaleX(1)' : 'scaleX(-1)'
              // }}
            />
            
            {/* Moo bubble */}
            <div className={`absolute top-8 left-8 transform -translate-y-full transition-all duration-500 ${
              animationStep === 2 ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
            }`}>
              <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-ghibli-brown-dark font-medium flex items-center animate-float-slow">
                <span className="mr-2">Moo!</span>
                <div className="w-3 h-3 bg-ghibli-green rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section 
      id="home" 
      className="relative min-h-screen pt-16 pb-12 flex items-center overflow-hidden bg-gradient-to-b from-ghibli-blue/10 via-white to-ghibli-yellow/10"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/cow-pattern.svg')] opacity-[0.03]"></div>
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-ghibli-blue/15 to-transparent"></div>
        
        {/* Floating elements */}
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-ghibli-brown/10 rounded-full animate-float"
            style={{
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 15 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.2 + Math.random() * 0.3
            }}
          />
        ))}
      </div>
      
      {/* Cow animation */}
      {renderCowAnimation()}
      
      <div className="ghibli-container relative z-10">
        <div className="max-w-2xl mx-auto md:mx-0">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-10 shadow-2xl border border-white/80 transform transition-all duration-500 hover:shadow-3xl hover:bg-white/90">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ghibli-brown-dark mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-ghibli-green to-ghibli-brown-dark">
                Your Cattle Care Companion
              </span>
            </h1>
            
            <p className="mt-4 text-lg md:text-xl text-ghibli-brown leading-relaxed">
              Upload a photo to instantly identify your cow's breed and get personalized nutrition plans. 
              Join our farming community for expert breeding insights and cattle care advice.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button 
                className="ghibli-btn bg-ghibli-green hover:bg-ghibli-green-dark text-lg py-6 px-8 transform transition-all duration-300 hover:scale-[1.03] shadow-lg hover:shadow-ghibli-green/40 flex items-center group hover:rotate-1"
                onClick={scrollToIdentify}
              >
                <span className="relative overflow-hidden">
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    Get Started
                  </span>
                </span>
                <ChevronLast className="h-5 w-5 ml-2 transition-all duration-300 group-hover:translate-x-2" />
              </Button>
              
              <Button 
                variant="outline"
                className="bg-white/90 border-ghibli-yellow-dark text-ghibli-brown-dark hover:bg-white text-lg py-6 px-8 transform transition-all duration-300 hover:scale-[1.03] shadow-lg hover:shadow-ghibli-yellow/30 hover:-rotate-1"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce-slow">
        <Button 
          variant="ghost" 
          className="rounded-full bg-white/80 hover:bg-white backdrop-blur-sm p-3 transition-all duration-300 hover:shadow-lg border border-white/50 hover:border-white/70"
          onClick={() => document.getElementById('identify')?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="Scroll down"
        >
          <ArrowDown className="h-6 w-6 text-ghibli-brown-dark" />
        </Button>
      </div>
    </section>
  );
};

export default Hero;