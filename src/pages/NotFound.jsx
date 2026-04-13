import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Icon from '../components/AppIcon';

const NotFound = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div 
          className="absolute top-[20%] left-[15%] animate-bounce duration-[3000ms]"
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
        >
          <Icon name="GraduationCap" size={48} className="text-primary" />
        </div>
        <div 
          className="absolute top-[60%] left-[10%] animate-bounce duration-[4000ms] delay-500"
          style={{ transform: `translate(${mousePos.x * -0.8}px, ${mousePos.y * -0.8}px)` }}
        >
          <Icon name="Book" size={32} className="text-secondary" />
        </div>
        <div 
          className="absolute top-[15%] right-[20%] animate-bounce duration-[3500ms] delay-200"
          style={{ transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)` }}
        >
          <Icon name="Target" size={40} className="text-primary" />
        </div>
        <div 
          className="absolute bottom-[20%] right-[15%] animate-bounce duration-[4500ms] delay-1000"
          style={{ transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)` }}
        >
          <Icon name="Compass" size={56} className="text-secondary" />
        </div>
      </div>

      <div className="text-center z-10 relative">
        <div className="relative inline-block mb-12">
          {/* Main 404 Text */}
          <h1 
            className="text-[12rem] sm:text-[16rem] font-heading font-black leading-none tracking-tighter select-none transition-transform duration-300 ease-out"
            style={{ 
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
              background: 'linear-gradient(to bottom, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 20px 30px rgba(var(--primary-rgb), 0.2))'
            }}
          >
            404
          </h1>
          
          {/* Floating Message Badge */}
          <div className="absolute -bottom-4 right-0 sm:-right-8 bg-card border border-border px-4 py-2 rounded-xl shadow-xl rotate-12 animate-in zoom-in duration-700 delay-500">
            <span className="text-sm font-bold text-foreground">You seem lost...</span>
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          <h2 className="text-3xl font-heading font-bold text-foreground">
            Oops! This admission is closed.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The page you're searching for has moved or graduated. Let's redirect your career path back home.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              variant="primary"
              size="lg"
              iconName="ArrowLeft"
              iconPosition="left"
              onClick={() => window.history?.back()}
              className="px-8"
            >
              Go Back
            </Button>

            <Button
              variant="outline"
              size="lg"
              iconName="Home"
              iconPosition="left"
              onClick={handleGoHome}
              className="px-8"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-30">
        <div className="flex items-center space-x-2 text-sm text-foreground/50 tracking-widest uppercase">
          <div className="h-px w-12 bg-border" />
          <span>Educational Explorer</span>
          <div className="h-px w-12 bg-border" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
