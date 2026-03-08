import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#011C40', borderTop: '2px solid #26658C', padding: '40px 20px 20px', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
        
        {/* Brand Section */}
        <div>
          <h2 style={{ color: '#A7EBF2', marginBottom: '15px' }}>WB STORE</h2>
          <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Your premium destination for the latest smartphones, gadgets, and accessories. Experience quality and innovation with every purchase.
          </p>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <a href="#" style={{ color: '#A7EBF2' }}><Facebook size={20} /></a>
            <a href="#" style={{ color: '#A7EBF2' }}><Instagram size={20} /></a>
            <a href="#" style={{ color: '#A7EBF2' }}><Twitter size={20} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.1rem' }}>Quick Links</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link to="/" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Home</Link></li>
            <li><Link to="/category/android" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Android Phones</Link></li>
            <li><Link to="/category/accessories" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Accessories</Link></li>
            <li><Link to="/cart" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>Shopping Cart</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.1rem' }}>Contact Us</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', fontSize: '0.9rem' }}>
              <MapPin size={18} style={{ color: '#A7EBF2' }} />
              Lucknow, Uttar Pradesh, India
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', fontSize: '0.9rem' }}>
              <Phone size={18} style={{ color: '#A7EBF2' }} />
              +91 1234567890
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', fontSize: '0.9rem' }}>
              <Mail size={18} style={{ color: '#A7EBF2' }} />
              wbstore.india@gmail.com
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div style={{ maxWidth: '1200px', margin: '40px auto 0', paddingTop: '20px', borderTop: '1px solid rgba(167, 235, 242, 0.1)', textAlign: 'center' }}>
        <p style={{ color: '#888', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} WB Mobile Store. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
