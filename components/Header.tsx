import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const [showImg, setShowImg] = useState(true);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-pan-black/80 backdrop-blur-sm z-40 h-16">
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="w-9 h-9"></div>
        <div className="absolute left-1/2 -translate-x-1/2">
            <Link to="/" aria-label="Pan home" className="inline-flex items-center justify-center">
                {showImg ? (
                  <img
                    src="/logo.svg"
                    onError={() => setShowImg(false)}
                    alt="Pan logo"
                    className="h-7 w-auto dark:invert"
                  />
                ) : (
                  <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-pan-white">Pan<span className="text-gray-400 dark:text-pan-gray">.</span></span>
                )}
            </Link>
        </div>
        {/* Profile icon removed to avoid redundancy with BottomNav */}
        <div className="w-9 h-9"></div>
      </div>
    </header>
  );
};

export default Header;