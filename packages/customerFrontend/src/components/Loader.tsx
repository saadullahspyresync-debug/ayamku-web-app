import React from "react";
import { Loader2, ChefHat, Utensils, Coffee } from "lucide-react";

const themeColor = "rgb(229 62 62)";

const ModernLoader = ({ message = "Preparing your experience..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full animate-pulse" style={{ background: themeColor }}></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full animate-pulse" style={{ background: themeColor, animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full animate-pulse" style={{ background: themeColor, animationDelay: '0.5s' }}></div>
      </div>

      <div className="relative z-10 text-center px-4">
        {/* Main loader container */}
        <div className="relative inline-block">
          {/* Rotating outer ring */}
          <div 
            className="w-32 h-32 rounded-full border-4 border-transparent animate-spin"
            style={{ 
              borderTopColor: themeColor,
              borderRightColor: themeColor,
              animationDuration: '1.5s'
            }}
          ></div>

          {/* Rotating inner ring (opposite direction) */}
          <div 
            className="absolute inset-3 rounded-full border-4 border-transparent animate-spin-reverse"
            style={{ 
              borderBottomColor: themeColor,
              borderLeftColor: themeColor,
              animationDuration: '1.2s'
            }}
          ></div>

          {/* Center icon with pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Pulsing background */}
              <div 
                className="absolute inset-0 w-16 h-16 rounded-full blur-xl animate-pulse opacity-60"
                style={{ backgroundColor: themeColor }}
              ></div>
              
              {/* Icon container */}
              <div 
                className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                style={{ backgroundColor: themeColor }}
              >
                <ChefHat className="w-8 h-8 text-white animate-bounce" style={{ animationDuration: '1.5s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Floating food icons */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 pointer-events-none">
          <Utensils 
            className="absolute top-0 left-8 w-6 h-6 animate-float opacity-40"
            style={{ color: themeColor, animationDelay: '0s' }}
          />
          <Coffee 
            className="absolute top-12 right-8 w-6 h-6 animate-float opacity-40"
            style={{ color: themeColor, animationDelay: '0.7s' }}
          />
          <Utensils 
            className="absolute bottom-12 left-4 w-5 h-5 animate-float opacity-30"
            style={{ color: themeColor, animationDelay: '1.4s' }}
          />
        </div>

        {/* Loading text */}
        <div className="mt-12 space-y-3">
          <h3 
            className="text-2xl font-black tracking-tight"
            style={{ color: themeColor }}
          >
            {message}
          </h3>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ 
                backgroundColor: themeColor,
                animationDelay: '0s',
                animationDuration: '1s'
              }}
            ></div>
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ 
                backgroundColor: themeColor,
                animationDelay: '0.2s',
                animationDuration: '1s'
              }}
            ></div>
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ 
                backgroundColor: themeColor,
                animationDelay: '0.4s',
                animationDuration: '1s'
              }}
            ></div>
          </div>

          {/* Progress bar */}
          <div className="w-64 mx-auto h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full animate-progress"
              style={{ backgroundColor: themeColor }}
            ></div>
          </div>

          <p className="text-sm text-gray-500 font-medium">
            Fetching fresh content for you...
          </p>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-spin-reverse {
          animation: spin-reverse linear infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.6;
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ModernLoader;