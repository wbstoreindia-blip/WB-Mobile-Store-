


import React, { useState } from 'react';
import { addProduct } from '../firebase/db';
import { Upload, Image as ImageIcon, Check, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Replace this with your actual Cloudinary Cloud Name
  const CLOUDINARY_CLOUD_NAME = "dyt6fwvw0"; 
  const CLOUDINARY_UPLOAD_PRESET = "Wb_mobile_products";

  const [formData, setFormData] = useState({
    name: '', brand: '', price: '', oldPrice: '', category: 'android', description: ''
  });
  
  // Array to hold the 5 image files before upload
  const [imageFiles, setImageFiles] = useState([]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    // Convert FileList to Array and limit to 5 images
    const files = Array.from(e.target.files).slice(0, 5);
    setImageFiles(files);
  };

  const uploadImagesToCloudinary = async () => {
    const uploadedUrls = [];
    
    for (const file of imageFiles) {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: uploadData,
        });
        const data = await response.json();
        uploadedUrls.push(data.secure_url);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      alert("Please select at least 1 image!");
      return;
    }

    setLoading(true);
    setSuccessMsg('');

    // 1. Upload images to Cloudinary first
    const imageUrls = await uploadImagesToCloudinary();

    // 2. Format the product data
    const newProduct = {
      ...formData,
      price: Number(formData.price),
      oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
      images: imageUrls,
      discount: formData.oldPrice ? Math.round(((formData.oldPrice - formData.price) / formData.oldPrice) * 100) : 0
    };

    // 3. Save to Firebase Database
    const result = await addProduct(newProduct);

    if (result.success) {
      setSuccessMsg(`Product added successfully! ID: ${result.id}`);
      setFormData({ name: '', brand: '', price: '', oldPrice: '', category: 'android', description: '' });
      setImageFiles([]);
    } else {
      alert("Database Error: " + result.error);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: 'white', marginBottom: '20px', borderBottom: '2px solid #54ACBF', paddingBottom: '10px' }}>
        Admin Panel - Upload Product
      </h2>

      {successMsg && (
        <div style={{ background: 'rgba(84, 172, 191, 0.2)', border: '1px solid #54ACBF', color: '#A7EBF2', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Check size={20} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="luna-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Basic Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Product Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} style={inputStyle} placeholder="e.g. iPhone 15 Pro" />
          </div>
          <div>
            <label style={labelStyle}>Brand</label>
            <input type="text" name="brand" required value={formData.brand} onChange={handleInputChange} style={inputStyle} placeholder="e.g. Apple" />
          </div>
        </div>

        {/* Pricing & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Selling Price (₹)</label>
            <input type="number" name="price" required value={formData.price} onChange={handleInputChange} style={inputStyle} placeholder="89999" />
          </div>
          <div>
            <label style={labelStyle}>Old Price (₹) - Optional</label>
            <input type="number" name="oldPrice" value={formData.oldPrice} onChange={handleInputChange} style={inputStyle} placeholder="99999" />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select name="category" value={formData.category} onChange={handleInputChange} style={inputStyle}>
              <option value="android">Android Phone</option>
              <option value="ios">Apple iOS</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Product Description</label>
          <textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange} style={{...inputStyle, resize: 'vertical'}} placeholder="Enter specifications..." />
        </div>

        {/* 5-Image Cloudinary Uploader */}
        <div style={{ background: '#011C40', padding: '20px', borderRadius: '8px', border: '1px dashed #54ACBF' }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <ImageIcon size={20} /> Upload up to 5 Images
          </label>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageSelect}
            style={{ color: '#ccc', width: '100%' }}
          />
          <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '10px' }}>
            {imageFiles.length} file(s) selected (Max 5).
          </p>
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '15px', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}>
          {loading ? <><Loader2 size={20} className="animate-spin" /> Uploading to Database...</> : <><Upload size={20} /> Publish Product</>}
        </button>
      </form>
    </div>
  );
};

// Reusable styles
const labelStyle = { display: 'block', color: '#A7EBF2', marginBottom: '8px', fontSize: '0.9rem' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #26658C', background: '#011C40', color: 'white', outline: 'none' };

export default AdminDashboard;
