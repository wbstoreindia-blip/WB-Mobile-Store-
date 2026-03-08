import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getProductsByCategory, getAllProducts } from '../firebase/db';
import ProductCard from '../components/ProductCard';

const Category = () => {
  const { id } = useParams(); // Reads "android", "accessories", or "search" from the URL
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q'); // Gets the search word from the Navbar
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      let fetched = [];
      
      if (id === 'search' && searchQuery) {
        // If it's a search, we pull everything and filter it by name
        const all = await getAllProducts();
        fetched = all.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      } else {
        // If it's a normal category, ask Firebase for just that category
        fetched = await getProductsByCategory(id);
      }
      
      setProducts(fetched);
      setLoading(false);
    };
    
    fetchCategoryProducts();
  }, [id, searchQuery]); // Re-run if they search for something new

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#A7EBF2' }}>Loading...</div>;

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '20px', textTransform: 'capitalize', borderBottom: '2px solid #26658C', paddingBottom: '10px' }}>
        {id === 'search' ? `Search Results for "${searchQuery}"` : `${id} Products`}
      </h2>
      
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#023859', borderRadius: '12px' }}>
          <h3 style={{ color: '#A7EBF2' }}>No products found</h3>
          <p style={{ color: '#ccc', marginTop: '10px' }}>Try searching for a different term or checking another category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Category;
