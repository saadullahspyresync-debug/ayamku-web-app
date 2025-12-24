import React from 'react';
import { ChefHat, Utensils, Coffee, Pizza, Sandwich, IceCream } from 'lucide-react';

const themeColor = "rgb(229 62 62)";

const BranchSelectionBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-gray-50 via-red-50/30 to-orange-50/20">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse" 
           style={{ background: themeColor }}></div>
      <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] rounded-full blur-3xl opacity-15 animate-pulse" 
           style={{ background: themeColor, animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10 animate-pulse" 
           style={{ background: themeColor, animationDelay: '2s' }}></div>

      {/* Floating food icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left area */}
        <ChefHat 
          className="absolute top-[15%] left-[10%] w-12 h-12 opacity-10 animate-float"
          style={{ color: themeColor, animationDelay: '0s' }}
        />
        <Pizza 
          className="absolute top-[25%] left-[5%] w-16 h-16 opacity-8 animate-float"
          style={{ color: themeColor, animationDelay: '0.5s' }}
        />
        
        {/* Top right area */}
        <Utensils 
          className="absolute top-[20%] right-[15%] w-10 h-10 opacity-10 animate-float"
          style={{ color: themeColor, animationDelay: '1s' }}
        />
        <Coffee 
          className="absolute top-[10%] right-[8%] w-14 h-14 opacity-8 animate-float"
          style={{ color: themeColor, animationDelay: '1.5s' }}
        />
        
        {/* Bottom left area */}
        <Sandwich 
          className="absolute bottom-[20%] left-[12%] w-14 h-14 opacity-10 animate-float"
          style={{ color: themeColor, animationDelay: '2s' }}
        />
        <IceCream 
          className="absolute bottom-[10%] left-[20%] w-12 h-12 opacity-8 animate-float"
          style={{ color: themeColor, animationDelay: '2.5s' }}
        />
        
        {/* Bottom right area */}
        <Pizza 
          className="absolute bottom-[25%] right-[10%] w-16 h-16 opacity-10 animate-float"
          style={{ color: themeColor, animationDelay: '3s' }}
        />
        <Utensils 
          className="absolute bottom-[15%] right-[20%] w-10 h-10 opacity-8 animate-float"
          style={{ color: themeColor, animationDelay: '3.5s' }}
        />

        {/* Center scattered */}
        <Coffee 
          className="absolute top-[40%] left-[25%] w-8 h-8 opacity-5 animate-float"
          style={{ color: themeColor, animationDelay: '4s' }}
        />
        <ChefHat 
          className="absolute top-[60%] right-[30%] w-10 h-10 opacity-6 animate-float"
          style={{ color: themeColor, animationDelay: '4.5s' }}
        />
      </div>

      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, ${themeColor} 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}></div>

      {/* Diagonal stripes */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, ${themeColor} 0px, ${themeColor} 2px, transparent 2px, transparent 40px)`
      }}></div>

      {/* Center spotlight effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-white/40"></div>

      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-particle"
            style={{
              background: themeColor,
              opacity: 0.15,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(5deg);
          }
          50% {
            transform: translateY(-10px) rotate(-5deg);
          }
          75% {
            transform: translateY(-25px) rotate(3deg);
          }
        }

        .animate-float {
          animation: float 15s ease-in-out infinite;
        }

        @keyframes particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.15;
          }
          90% {
            opacity: 0.15;
          }
          100% {
            transform: translate(100px, -100px) scale(0);
            opacity: 0;
          }
        }

        .animate-particle {
          animation: particle linear infinite;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default BranchSelectionBackground;