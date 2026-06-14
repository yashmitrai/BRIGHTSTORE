import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { Plus, Edit3, Trash2, Tag, Search, ShoppingBag, UploadCloud, X, ArrowLeft, ArrowRight } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  images?: string[];
  stock: number;
  sku: string;
}

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Form States
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState('10');
  const [sku, setSku] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (fileList: FileList) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;
    if (images.length + filesToUpload.length > 5) {
      alert("You can upload a maximum of 5 images per product.");
      return;
    }

    const formData = new FormData();
    filesToUpload.forEach((file) => {
      formData.append('images', file);
    });

    setUploadingImage(true);
    try {
      const response = await api.post('/images/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImages([...images, ...response.data.urls]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async (index: number) => {
    const urlToRemove = images[index];
    try {
      await api.post('/images/delete', { url: urlToRemove });
    } catch (err) {
      console.error("Failed to delete image from storage server", err);
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    if (direction === 'left' && index > 0) {
      const temp = newImages[index];
      newImages[index] = newImages[index - 1];
      newImages[index - 1] = temp;
    } else if (direction === 'right' && index < images.length - 1) {
      const temp = newImages[index];
      newImages[index] = newImages[index + 1];
      newImages[index + 1] = temp;
    }
    setImages(newImages);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching inventory products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('Groceries');
    setImageUrl('');
    setImages([]);
    setStock('10');
    setSku('');
    setFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(String(product.price));
    setCategory(product.category);
    setImageUrl(product.imageUrl || '');
    setImages(product.images || (product.imageUrl ? [product.imageUrl] : []));
    setStock(String(product.stock));
    setSku(product.sku || '');
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) return;

    setSaving(true);
    const productData = {
      name,
      description,
      price: Number(price),
      category,
      imageUrl: images[0] || imageUrl || '',
      images,
      stock: Number(stock),
      sku,
    };

    try {
      if (editingProduct) {
        // Edit product
        const response = await api.put(`/products/${editingProduct._id}`, productData);
        setProducts(products.map((p) => (p._id === editingProduct._id ? response.data : p)));
      } else {
        // Add new product
        const response = await api.post('/products', productData);
        setProducts([...products, response.data]);
      }
      setFormOpen(false);
    } catch (err) {
      console.error('Error saving product', err);
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (error) {
      console.error('Error deleting product', error);
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Product Inventory
          </h2>
          
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-9 py-1.5 text-xs w-48 sm:w-64"
              />
            </div>
            
            <button
              onClick={handleOpenAdd}
              className="btn-primary text-xs shrink-0 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-sm text-slate-705 dark:text-slate-350">Inventory catalog empty</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Start seeding items to your store shelf so local customers can place request bids.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div key={p._id} className="card-premium flex flex-col justify-between hover:shadow-premium-md overflow-hidden relative">
                <div>
                  <div className="h-36 bg-slate-100 dark:bg-slate-850 -mx-6 -mt-6 mb-4 overflow-hidden relative border-b border-slate-100 dark:border-slate-800">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/80 dark:bg-white/80 text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-wider">
                      {p.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{p.name}</h3>
                    <p className="text-[11px] text-slate-455 mt-1 line-clamp-2 leading-relaxed min-h-8">{p.description}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-3 mt-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Price</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">₹{p.price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">In Stock</span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{p.stock} units</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors"
                      title="Edit Item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Product Modal Overlay */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium-lg overflow-hidden animate-slide-up">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">
                  {editingProduct ? 'Edit Product Item' : 'Add New Inventory Item'}
                </h3>
                <button
                  onClick={() => setFormOpen(false)}
                  className="text-slate-400 hover:text-slate-750"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-premium"
                    placeholder="Fresh Cavendish Bananas (Pack of 6)"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Product Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="input-premium"
                    placeholder="Description or notes about quality, freshness, quantity details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Price (INR)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input-premium font-mono"
                      placeholder="45"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Stock Count
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="input-premium font-mono"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-premium"
                    >
                      <option value="Groceries">Groceries</option>
                      <option value="Vegetables">Vegetables</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Household">Household</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider mb-2">
                      SKU Code
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="input-premium font-mono"
                      placeholder="FRU-BAN-001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Product Images (up to 5)
                  </label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 hover:bg-slate-50/30'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload-multiple"
                    />
                    <label htmlFor="file-upload-multiple" className="cursor-pointer">
                      <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-650 dark:text-slate-350 block">
                        Drag & drop images, or <span className="text-blue-500 hover:underline">browse</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Support for JPG, PNG, WebP (Max 5)
                      </span>
                    </label>
                  </div>

                  {uploadingImage && (
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-blue-500">
                      <Spinner size="sm" />
                      <span>Uploading files to server...</span>
                    </div>
                  )}

                  {images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {images.map((url, idx) => (
                        <div
                          key={url}
                          className="relative group border border-slate-205 dark:border-slate-800 rounded-lg overflow-hidden h-14 bg-slate-50 dark:bg-slate-900"
                        >
                          <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-slate-950/80 text-[8px] text-center font-bold text-white uppercase py-0.5">
                              Main
                            </span>
                          )}

                          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, 'left')}
                                className="p-0.5 rounded bg-white text-slate-900 hover:bg-slate-100"
                                title="Move Left"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="p-0.5 rounded bg-red-600 text-white hover:bg-red-500"
                              title="Delete Image"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>

                            {idx < images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, 'right')}
                                className="p-0.5 rounded bg-white text-slate-900 hover:bg-slate-100"
                                title="Move Right"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <input
                    type="url"
                    value={images[0] || imageUrl || ''}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      if (images.length === 0) {
                        setImages([newUrl]);
                      } else {
                        const newImages = [...images];
                        newImages[0] = newUrl;
                        setImages(newImages);
                      }
                    }}
                    className="input-premium mt-3 text-xs"
                    placeholder="Or paste main image URL directly (optional)"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-accent flex-1 text-xs"
                  >
                    {saving ? <Spinner size="sm" color="white" /> : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;
