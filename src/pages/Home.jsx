import React, { useState, useEffect } from 'react';
import { getAllProducts, getBanners } from '../firebase/db';
import ProductCard from '../components/ProductCard';
import BannerSlider from '../components/BannerSlider';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This fetches the data from Firebase the moment the page loads
    const fetchData = async () => {
      const fetchedProducts = await getAllProducts();
      const fetchedBanners = await getBanners();
      setProducts(fetchedProducts);
      setBanners(fetchedBanners);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Show a professional loading screen while fetching from the database
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <h3 style={{ color: '#A7EBF2' }}>Loading WB Store...</h3>
      </div>
    );
  }

  return (
    <div>
      {/* 1. The Auto-Sliding Banners */}
      <BannerSlider banners={banners} />

      {/* 2. The Product Grid */}
      <h2 style={{ color: 'white', marginBottom: '20px', borderBottom: '2px solid #26658C', paddingBottom: '10px' }}>
        Latest Arrivals
      </h2>
      
      {/* This grid automatically resizes for phones vs tablets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Home;
