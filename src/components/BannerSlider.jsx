import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BannerSlider = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play logic: Moves to the next slide every 5 seconds
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, banners]);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? banners.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === banners.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div style={{ width: '100%', position: 'relative', height: '220px', overflow: 'hidden', borderRadius: '16px', marginBottom: '30px' }}>
      
      {/* Banner Image */}
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundImage: `url(${banners[currentIndex].imageUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          transition: 'all 0.5s ease-in-out'
        }}
      >
        {/* Dark Overlay for Text Readability */}
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(1, 28, 64, 0.8), transparent)', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ color: '#A7EBF2', fontSize: '1.5rem', marginBottom: '10px' }}>{banners[currentIndex].title}</h2>
          <p style={{ color: 'white', fontSize: '0.9rem' }}>{banners[currentIndex].subtitle}</p>
        </div>
      </div>

      {/* Navigation Arrows (Hidden on very small screens, visible on hover/tablet) */}
      <button onClick={prevSlide} style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', background: 'rgba(1, 28, 64, 0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}>
        <ChevronLeft size={24} />
      </button>
      <button onClick={nextSlide} style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'rgba(1, 28, 64, 0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}>
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div style={{ position: 'absolute', bottom: '15px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {banners.map((_, index) => (
          <div 
            key={index} 
            onClick={() => setCurrentIndex(index)}
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: currentIndex === index ? '#A7EBF2' : 'rgba(255,255,255,0.3)', 
              cursor: 'pointer' 
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
