import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../firebase/db';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart(); // Connects to your Cart engine
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      const data = await getProductById(id);
      if (data) {
        setProduct(data);
        setMainImage(data.images[0]); // Default the big view to the first image
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#A7EBF2' }}>Loading product details...</div>;
  if (!product) return <div style={{ textAlign: 'center', padding: '50px', color: '#ff4d4d' }}>Error: Product not found!</div>;

  return (
    <div style={{ background: '#023859', borderRadius: '16px', padding: '20px' }}>
      
      {/* Back Button */}
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#A7EBF2', display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem' }}>
        <ArrowLeft size={20} style={{ marginRight: '5px' }} /> Back
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Top Half: The 5-Image Gallery System */}
        <div style={{ width: '100%' }}>
          {/* Main Big Image */}
          <div style={{ background: '#011C40', borderRadius: '12px', padding: '10px', marginBottom: '15px', height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={mainImage} alt={product.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
          
          {/* Thumbnails Row */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {product.images?.map((img, index) => (
              <div 
                key={index} 
                onClick={() => setMainImage(img)}
                style={{ 
                  minWidth: '70px', height: '70px', borderRadius: '8px', background: '#011C40', cursor: 'pointer', 
                  border: mainImage === img ? '2px solid #A7EBF2' : '2px solid transparent', 
                  padding: '5px', transition: '0.2s' 
                }}
              >
                <img src={img} alt={`View ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Half: Details & Cart */}
        <div style={{ width: '100%' }}>
          <h1 style={{ color: '#A7EBF2', fontSize: '1.6rem', marginBottom: '5px' }}>{product.name}</h1>
          <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '20px' }}>Brand: <span style={{ color: 'white', fontWeight: 'bold' }}>{product.brand}</span></p>
          
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white', marginBottom: '25px', display: 'flex', alignItems: 'center' }}>
            ₹{product.price?.toLocaleString('en-IN')}
            {product.oldPrice && (
              <span style={{ fontSize: '1.2rem', color: '#888', textDecoration: 'line-through', marginLeft: '15px' }}>
                ₹{product.oldPrice?.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div style={{ background: '#011C40', padding: '15px', borderRadius: '12px', marginBottom: '30px' }}>
            <h3 style={{ color: '#A7EBF2', marginBottom: '10px', fontSize: '1.1rem' }}>Product Description</h3>
            <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{product.description}</p>
          </div>

          <button 
            onClick={() => {
              addToCart(product);
              // Simple visual feedback for the user
              alert(`${product.name} added to cart!`);
            }}
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '15px' }}
          >
            <ShoppingCart size={22} /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
