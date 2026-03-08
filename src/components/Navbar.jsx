import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/search?q=${searchQuery}`);
      setSearchQuery('');
    }
  };

  return (
    <nav style={{ backgroundColor: '#011C40', borderBottom: '1px solid #26658C', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Mobile Menu Toggle */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', color: '#A7EBF2', display: 'block', padding: '5px' }}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', color: '#A7EBF2', fontSize: '1.2rem', fontWeight: 'bold', marginLeft: '10px' }}>
          WB STORE
        </Link>

        {/* Search Bar (Desktop/Tablet) */}
        <form onSubmit={handleSearch} style={{ flex: 1, margin: '0 20px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search phones..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 40px 8px 15px', borderRadius: '20px', border: '1px solid #26658C', background: '#023859', color: 'white', outline: 'none' }}
          />
          <Search size={18} style={{ position: 'absolute', right: '12px', color: '#A7EBF2' }} />
        </form>

        {/* Icons */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link to="/cart" style={{ color: '#A7EBF2', position: 'relative' }}>
            <ShoppingCart size={24} />
            {/* Cart Badge - We will wire this to CartContext later */}
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#54ACBF', color: '#011C40', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
              0
            </span>
          </Link>
          <Link to="/login" style={{ color: '#A7EBF2' }}>
            <User size={24} />
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      {isMenuOpen && (
        <div style={{ backgroundColor: '#023859', padding: '20px', position: 'absolute', width: '100%', top: '100%', left: 0, borderBottom: '2px solid #54ACBF' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <li><Link to="/" onClick={() => setIsMenuOpen(false)} style={{ color: 'white', textDecoration: 'none' }}>Home</Link></li>
            <li><Link to="/category/android" onClick={() => setIsMenuOpen(false)} style={{ color: 'white', textDecoration: 'none' }}>Android Phones</Link></li>
            <li><Link to="/category/accessories" onClick={() => setIsMenuOpen(false)} style={{ color: 'white', textDecoration: 'none' }}>Accessories</Link></li>
            <li><Link to="/admin-panel-secret" onClick={() => setIsMenuOpen(false)} style={{ color: '#A7EBF2', textDecoration: 'none', fontWeight: 'bold' }}>Admin Panel</Link></li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
