import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

const Cart = () => {
  const { cart, cartTotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#023859', borderRadius: '16px', marginTop: '40px' }}>
        <ShoppingBag size={64} style={{ color: '#26658C', marginBottom: '20px' }} />
        <h2 style={{ color: 'white', marginBottom: '10px' }}>Your Cart is Empty</h2>
        <p style={{ color: '#ccc', marginBottom: '30px' }}>Looks like you haven't added any premium gadgets yet.</p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '20px', borderBottom: '2px solid #26658C', paddingBottom: '10px' }}>
        Shopping Cart
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {cart.map(item => (
            <div key={item.id} className="luna-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
              
              <div style={{ width: '80px', height: '80px', background: '#011C40', borderRadius: '8px', padding: '5px', flexShrink: 0 }}>
                <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#A7EBF2', fontSize: '1rem', marginBottom: '5px' }}>{item.name}</h3>
                <p style={{ color: 'white', fontWeight: 'bold' }}>₹{item.price.toLocaleString('en-IN')}</p>
                
                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#011C40', borderRadius: '8px', overflow: 'hidden' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#A7EBF2', padding: '5px 10px', cursor: 'pointer' }}><Minus size={16} /></button>
                    <span style={{ color: 'white', padding: '0 10px', fontSize: '0.9rem' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#A7EBF2', padding: '5px 10px', cursor: 'pointer' }}><Plus size={16} /></button>
                  </div>
                  
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Total & Checkout Button */}
        <div className="luna-card" style={{ marginTop: '20px', borderTop: '2px solid #54ACBF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ color: '#ccc', fontSize: '1.1rem' }}>Total Amount:</span>
            <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          
          <button 
            onClick={() => navigate('/checkout')} 
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '15px' }}
          >
            Proceed to Checkout <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
