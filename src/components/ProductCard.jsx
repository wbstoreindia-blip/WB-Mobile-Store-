import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';

const ProductCard = ({ product }) => {
  // Format price to Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="luna-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Product Image Area */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', overflow: 'hidden', borderRadius: '12px', background: '#011C40' }}>
        <img 
          src={product.images[0]} 
          alt={product.name} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
        {product.discount > 0 && (
          <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#54ACBF', color: '#011C40', padding: '2px 8px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            {product.discount}% OFF
          </span>
        )}
      </div>

      {/* Product Info */}
      <div style={{ marginTop: '15px', flex: 1 }}>
        <h3 style={{ fontSize: '1rem', color: '#A7EBF2', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {product.name}
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '10px' }}>
          {product.brand}
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && (
            <span style={{ fontSize: '0.9rem', color: '#888', textDecoration: 'line-through' }}>
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <Link 
          to={`/product/${product.id}`} 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', border: '1px solid #A7EBF2', color: '#A7EBF2', textDecoration: 'none' }}
        >
          <Eye size={18} style={{ marginRight: '5px' }} />
          View
        </Link>
        <button 
          style={{ background: '#A7EBF2', color: '#011C40', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ShoppingCart size={18} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
