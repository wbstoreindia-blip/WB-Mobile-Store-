import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../firebase/db';
import { CheckCircle } from 'lucide-react';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'Cash on Delivery' // Defaulting to COD for now
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const orderData = {
      customerInfo: formData,
      items: cart,
      totalAmount: cartTotal,
      status: 'Pending',
    };

    const result = await createOrder(orderData);

    if (result.success) {
      setSuccess(true);
      clearCart();
      setLoading(false);
      // Return to home after 3 seconds
      setTimeout(() => navigate('/'), 3000);
    } else {
      alert("Error placing order. Please try again.");
      setLoading(false);
    }
  };

  if (cart.length === 0 && !success) {
    navigate('/cart');
    return null;
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#023859', borderRadius: '16px', marginTop: '40px' }}>
        <CheckCircle size={80} style={{ color: '#54ACBF', marginBottom: '20px', margin: '0 auto' }} />
        <h2 style={{ color: 'white', marginBottom: '10px' }}>Order Placed Successfully!</h2>
        <p style={{ color: '#ccc' }}>Thank you for shopping at WB Store. We will contact you shortly.</p>
        <p style={{ color: '#A7EBF2', marginTop: '20px', fontSize: '0.9rem' }}>Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '20px', borderBottom: '2px solid #26658C', paddingBottom: '10px' }}>
        Checkout
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="luna-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ color: '#A7EBF2', fontSize: '1.1rem', marginBottom: '10px' }}>Shipping Details</h3>
          
          <input type="text" name="name" placeholder="Full Name" required value={formData.name} onChange={handleChange} style={inputStyle} />
          <input type="tel" name="phone" placeholder="Phone Number" required value={formData.phone} onChange={handleChange} style={inputStyle} />
          <textarea name="address" placeholder="Complete Address" required rows="3" value={formData.address} onChange={handleChange} style={{...inputStyle, resize: 'none'}} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" name="city" placeholder="City" required value={formData.city} onChange={handleChange} style={{...inputStyle, flex: 1}} />
            <input type="text" name="pincode" placeholder="Pincode" required value={formData.pincode} onChange={handleChange} style={{...inputStyle, width: '120px'}} />
          </div>
        </div>

        <div className="luna-card">
          <h3 style={{ color: '#A7EBF2', fontSize: '1.1rem', marginBottom: '15px' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', marginBottom: '10px' }}>
            <span>Items ({cart.length}):</span>
            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', marginBottom: '15px', borderBottom: '1px solid #26658C', paddingBottom: '15px' }}>
            <span>Shipping:</span>
            <span style={{ color: '#54ACBF' }}>Free</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '1.3rem', fontWeight: 'bold' }}>
            <span>Total:</span>
            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '15px', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Processing...' : 'Place Order (Cash on Delivery)'}
        </button>
      </form>
    </div>
  );
};

// Reusable input style for the form
const inputStyle = {
  width: '100%',
  padding: '12px 15px',
  borderRadius: '8px',
  border: '1px solid #26658C',
  background: '#011C40',
  color: 'white',
  outline: 'none',
  fontFamily: 'inherit'
};

export default Checkout;
