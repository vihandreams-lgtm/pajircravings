import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Grid, 
  MessageSquare, 
  Layout, 
  Image as ImageIcon,
  LogOut, 
  ShieldCheck, 
  Lock, 
  ArrowLeft,
  Save,
  UtensilsCrossed,
  ChefHat
} from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc 
} from 'firebase/firestore';

interface KitchenManagerProps {
  onBackToStorefront: () => void;
}

export default function KitchenManager({ onBackToStorefront }: KitchenManagerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'reviews' | 'homepage'>('menu');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');

  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [siteAssets, setSiteAssets] = useState<{ heroUrl: string }>({ heroUrl: '' });

  const [toast, setToast] = useState<string | null>(null);

  const [newTreat, setNewTreat] = useState({
    name: '',
    price: '',
    description: '',
    discount_percent: 0,
    available: true,
    image_url: '',
    is_chefs_special: false
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  const [newReview, setNewReview] = useState({
    customer_name: '',
    location: '',
    quote: '',
    verified: true
  });

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const compressAndConvertImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const webpDataUrl = canvas.toDataURL('image/webp', 0.75);
          resolve(webpDataUrl);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setTimeout(() => {
        setUser(currentUser);
        setLoading(false);
      }, 1500);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubItems = onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCats = onSnapshot(collection(db, 'menu_categories'), (snapshot) => {
      const fetchedCats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(fetchedCats);
      if (fetchedCats.length > 0 && !selectedCategorySlug) {
        setSelectedCategorySlug((fetchedCats[0] as any).slug);
      }
    });

    const unsubReviews = onSnapshot(collection(db, 'testimonials'), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAssets = onSnapshot(collection(db, 'site_assets'), (snapshot) => {
      const assets: any = {};
      snapshot.docs.forEach(d => { assets[d.id] = d.data().url; });
      setSiteAssets({
        heroUrl: assets['hero'] || ''
      });
    });

    return () => {
      unsubItems();
      unsubCats();
      unsubReviews();
      unsubAssets();
    };
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleAddTreat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreat.name || !newTreat.price || !selectedCategorySlug) return;

    try {
      const docData = {
        name: newTreat.name,
        price: Number(newTreat.price),
        description: newTreat.description,
        category: selectedCategorySlug,
        discount_percent: Number(newTreat.discount_percent) || 0,
        available: newTreat.available,
        is_chefs_special: newTreat.is_chefs_special,
        image_url: newTreat.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600',
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'menu_items'), docData);
      setNewTreat({ name: '', price: '', description: '', discount_percent: 0, available: true, image_url: '', is_chefs_special: false });
      showToastMsg(`Successfully added ${docData.name}!`);
    } catch (err: any) {
      alert("Error adding treat: " + err.message);
    }
  };

  const handleUpdateTreat = async (id: string, updatedFields: any) => {
    try {
      await updateDoc(doc(db, 'menu_items', id), updatedFields);
      showToastMsg("Treat updated successfully!");
    } catch (err: any) {
      alert("Error updating treat: " + err.message);
    }
  };

  const handleDeleteTreat = async (id: string) => {
    if (confirm("Delete this treat?")) {
      try {
        await deleteDoc(doc(db, 'menu_items', id));
        showToastMsg("Treat deleted.");
      } catch (err: any) {
        alert("Error deleting treat: " + err.message);
      }
    }
  };

  const handleCategoryNameChange = (val: string) => {
    setNewCatName(val);
    const slug = val.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    setNewCatSlug(slug);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;

    try {
      const newCat = {
        slug: newCatSlug,
        label: newCatName.trim(),
        sort_order: categories.length + 1,
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'menu_categories'), newCat);
      if (!selectedCategorySlug) setSelectedCategorySlug(newCat.slug);
      
      setNewCatName('');
      setNewCatSlug('');
      showToastMsg(`Category "${newCat.label}" added successfully!`);
    } catch (err: any) {
      alert("Error adding category: " + err.message);
    }
  };

  const handleUpdateCategory = async (id: string, label: string) => {
    try {
      await updateDoc(doc(db, 'menu_categories', id), { label });
      showToastMsg("Category updated!");
    } catch (err: any) {
      alert("Error updating category: " + err.message);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    const isUsed = items.some(item => item.category === cat.slug);
    if (isUsed) {
      alert("Safe deletion lock: Cannot delete this category because there are active treats assigned to it!");
      return;
    }

    if (confirm(`Delete category "${cat.label}"?`)) {
      try {
        await deleteDoc(doc(db, 'menu_categories', cat.id));
        showToastMsg("Category deleted.");
      } catch (err: any) {
        alert("Error deleting category: " + err.message);
      }
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.customer_name || !newReview.quote) return;

    try {
      const reviewData = {
        customer_name: newReview.customer_name,
        location: newReview.location || 'Kampala',
        quote: newReview.quote,
        verified: newReview.verified,
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'testimonials'), reviewData);
      setNewReview({ customer_name: '', location: '', quote: '', verified: true });
      showToastMsg("WhatsApp review added!");
    } catch (err: any) {
      alert("Error adding review: " + err.message);
    }
  };

  const handleUpdateReview = async (id: string, updatedFields: any) => {
    try {
      await updateDoc(doc(db, 'testimonials', id), updatedFields);
      showToastMsg("Review saved!");
    } catch (err: any) {
      alert("Error updating review: " + err.message);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm("Delete this review?")) {
      try {
        await deleteDoc(doc(db, 'testimonials', id));
        showToastMsg("Review deleted.");
      } catch (err: any) {
        alert("Error deleting review: " + err.message);
      }
    }
  };

  const handleSaveAsset = async (key: string, url: string) => {
    try {
      await setDoc(doc(db, 'site_assets', key), { url, updated_at: new Date().toISOString() });
      showToastMsg(`${key === 'hero' ? 'Hero photo' : 'Section banner'} updated successfully!`);
    } catch (err: any) {
      alert("Error saving asset: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#1E1719] flex flex-col items-center justify-center text-white">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-[#FF5A79]/10 border border-[#FF5A79]/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,90,121,0.2)]">
            <ChefHat className="w-10 h-10 text-[#FF5A79]" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-white">PAJIR KITCHEN</h1>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.3em] mb-6">Manager Portal</p>
          
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden relative mb-6">
            <motion.div
              initial={{ x: '-100%"' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="absolute inset-0 bg-[#FF5A79]"
            />
          </div>
          
          <p className="text-xs text-gray-500 font-medium">Securing connection...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1E1719] text-gray-200 font-sans flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#FF5A79] text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(255,90,121,0.4)]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-white">Pajir Kitchen Manager</h1>
            <p className="text-xs text-gray-400 mt-2">Sign in with your administrator account</p>
          </div>

          {authError && (
            <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-medium border border-red-500/20">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-4 bg-black/30 rounded-2xl border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5A79]/50 focus:ring-1 focus:ring-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-inner"
                placeholder="admin@pajircravings.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-4 bg-black/30 rounded-2xl border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5A79]/50 focus:ring-1 focus:ring-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-[#FF5A79] text-white font-bold text-sm rounded-full shadow-[0_10px_20px_rgba(255,90,121,0.2)] hover:bg-[#E04B66] transition-all cursor-pointer active:scale-95"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs">
            <button onClick={onBackToStorefront} className="text-[#FF5A79] font-medium flex items-center space-x-1 hover:underline">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeCategoryObj = categories.find((c: any) => c.slug === selectedCategorySlug);
  const currentCategoryItems = items.filter(i => i.category === selectedCategorySlug);

  return (
    <div className="min-h-screen bg-[#1E1719] text-gray-200 font-sans pb-20 relative">
      
      {/* Background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF5A79] opacity-10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#FF5A79] opacity-5 blur-[150px] rounded-full" />
      </div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl border border-white/20 flex items-center space-x-2 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-[#FF5A79]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header - Fixed for Mobile Layout */}
      <header className="bg-[#1E1719]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-[80px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#FF5A79] shadow-[0_0_15px_rgba(255,90,121,0.2)]">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight truncate">Pajir Kitchen Manager</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1 truncate">Logged in as {user.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 w-full sm:w-auto">
            <button 
              onClick={onBackToStorefront}
              className="px-4 sm:px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-bold transition-all cursor-pointer border border-white/10 flex-1 sm:flex-none text-center"
            >
              View Storefront
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="p-2.5 sm:p-3 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-all cursor-pointer border border-red-500/20 shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/5 backdrop-blur-2xl text-white p-6 sm:p-8 rounded-[2rem] shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A79] block mb-2 relative z-10">TOTAL ITEMS</span>
            <div className="font-serif text-5xl font-bold mb-1 relative z-10">{items.length}</div>
            <span className="text-xs text-gray-400 font-medium relative z-10">{items.filter(i => i.available).length} ready to serve</span>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl text-white p-6 sm:p-8 rounded-[2rem] shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A79] block mb-2 relative z-10">ACTIVE CATEGORIES</span>
            <div className="font-serif text-5xl font-bold mb-1 relative z-10">{categories.length}</div>
            <span className="text-xs text-gray-400 font-medium relative z-10">Shown as homepage tabs</span>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl text-white p-6 sm:p-8 rounded-[2rem] shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A79] block mb-2 relative z-10">RECENT REVIEWS</span>
            <div className="font-serif text-5xl font-bold mb-1 relative z-10">{reviews.length}</div>
            <span className="text-xs text-gray-400 font-medium relative z-10">From the WhatsApp wall</span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center space-x-3 border-b border-white/10 pb-6 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'menu', label: 'Menu', icon: Grid },
            { id: 'categories', label: 'Categories', icon: Layout },
            { id: 'reviews', label: 'Reviews', icon: MessageSquare },
            { id: 'homepage', label: 'Homepage', icon: ImageIcon }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-5 sm:px-6 py-3 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 border ${
                  isActive ? 'bg-[#FF5A79] text-white border-transparent shadow-[0_0_15px_rgba(255,90,121,0.4)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= 1. MENU PANEL ================= */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-3 items-center">
              {categories.map((cat: any) => {
                const count = items.filter(i => i.category === cat.slug).length;
                const isSelected = selectedCategorySlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center space-x-2 border shadow-sm ${
                      isSelected 
                        ? 'bg-[#FF5A79] text-white border-transparent shadow-[0_0_15px_rgba(255,90,121,0.4)]' 
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-black/20 text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ADD NEW TREAT FORM */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-5 sm:p-8 border border-[#FF5A79]/30 shadow-[0_20px_50px_rgba(255,90,121,0.1)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF5A79]"></div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#FF5A79] shrink-0" />
                <span>Add a new treat to {activeCategoryObj?.label || 'Selected Category'}</span>
              </h3>

              <form onSubmit={handleAddTreat} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Name</label>
                  <input 
                    type="text"
                    value={newTreat.name}
                    onChange={e => setNewTreat({ ...newTreat, name: e.target.value })}
                    placeholder="e.g. 5L Mango Jerican"
                    required
                    className="w-full p-3.5 bg-black/30 rounded-2xl border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5A79]/50 focus:ring-1 focus:ring-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Price UGX</label>
                  <input 
                    type="number"
                    value={newTreat.price}
                    onChange={e => setNewTreat({ ...newTreat, price: e.target.value })}
                    placeholder="25000"
                    required
                    className="w-full p-3.5 bg-black/30 rounded-2xl border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5A79]/50 focus:ring-1 focus:ring-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                  <input 
                    type="text"
                    value={newTreat.description}
                    onChange={e => setNewTreat({ ...newTreat, description: e.target.value })}
                    placeholder="Freshly pressed, 100% natural."
                    className="w-full p-3.5 bg-black/30 rounded-2xl border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5A79]/50 focus:ring-1 focus:ring-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-inner"
                  />
                </div>

                <div className="flex flex-col space-y-2 pb-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newTreat.available} 
                      onChange={e => setNewTreat({ ...newTreat, available: e.target.checked })}
                      className="w-5 h-5 accent-[#FF5A79] cursor-pointer rounded"
                    />
                    <span className="text-sm font-bold text-white">Available</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newTreat.is_chefs_special} 
                      onChange={e => setNewTreat({ ...newTreat, is_chefs_special: e.target.checked })}
                      className="w-5 h-5 accent-[#FACC15] cursor-pointer rounded"
                    />
                    <span className="text-sm font-bold text-[#FACC15]">Chef's Special</span>
                  </label>
                </div>

                <div>
                  <button 
                    type="submit" 
                    className="w-full bg-[#FF5A79] hover:bg-[#E04B66] text-white font-bold text-sm py-3.5 rounded-2xl shadow-[0_10px_20px_rgba(255,90,121,0.2)] transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1 border border-[#FF7B93]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Treat</span>
                  </button>
                </div>
              </form>
            </div>

            {/* EXISTING TREATS LIST */}
            <div className="pt-6">
              <div className="flex items-center space-x-3 mb-6">
                <UtensilsCrossed className="w-5 h-5 text-[#FF5A79] shrink-0" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white truncate">Currently Serving ({currentCategoryItems.length})</h3>
                <div className="flex-1 h-px bg-white/10 ml-2 sm:ml-4"></div>
              </div>

              <div className="space-y-5">
                {currentCategoryItems.length === 0 ? (
                  <div className="text-center py-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 border-dashed shadow-lg">
                    <p className="text-gray-500 text-sm">No treats added to this category yet.</p>
                  </div>
                ) : (
                  currentCategoryItems.map((item) => (
                    <div key={item.id} className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-5 sm:p-6 border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.4)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      
                      {/* Photo Box */}
                      <div className="lg:col-span-3 flex flex-col items-center justify-center p-5 bg-black/20 rounded-3xl border border-white/5 relative shadow-inner">
                        <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-2xl mb-4 shadow-lg border border-white/10" />
                        <div className="flex flex-col items-center space-y-2">
                          <label className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-4 py-2 rounded-full cursor-pointer transition-all active:scale-95 shadow-sm border border-white/10">
                            Change photo
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const compressed = await compressAndConvertImage(file);
                                  handleUpdateTreat(item.id, { image_url: compressed });
                                }
                              }}
                            />
                          </label>
                          {item.image_url && (
                            <button 
                              onClick={() => handleUpdateTreat(item.id, { image_url: '' })}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold underline transition-colors"
                            >
                              Remove photo
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editable Fields */}
                      <div className="lg:col-span-9 space-y-5 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                          <div className="sm:col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Treat Name</label>
                            <input 
                              type="text" 
                              defaultValue={item.name} 
                              onBlur={(e) => handleUpdateTreat(item.id, { name: e.target.value })}
                              className="w-full p-3 bg-black/30 rounded-xl border border-white/10 text-sm font-semibold text-white focus:outline-none focus:border-[#FF5A79]/50 shadow-inner"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Price UGX</label>
                            <input 
                              type="number" 
                              defaultValue={item.price} 
                              onBlur={(e) => handleUpdateTreat(item.id, { price: Number(e.target.value) })}
                              className="w-full p-3 bg-black/30 rounded-xl border border-white/10 text-sm font-semibold text-white focus:outline-none focus:border-[#FF5A79]/50 shadow-inner"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Discount %</label>
                            <input 
                              type="number" 
                              defaultValue={item.discount_percent || 0} 
                              onBlur={(e) => handleUpdateTreat(item.id, { discount_percent: Number(e.target.value) })}
                              className="w-full p-3 bg-black/30 rounded-xl border border-white/10 text-sm font-semibold text-white focus:outline-none focus:border-[#FF5A79]/50 shadow-inner"
                            />
                          </div>

                          <div className="flex flex-col space-y-2 pt-2 sm:pt-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={item.available} 
                                onChange={(e) => handleUpdateTreat(item.id, { available: e.target.checked })}
                                className="w-5 h-5 accent-[#FF5A79] cursor-pointer rounded"
                              />
                              <span className="text-sm font-bold text-white">Available</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={item.is_chefs_special || false} 
                                onChange={(e) => handleUpdateTreat(item.id, { is_chefs_special: e.target.checked })}
                                className="w-5 h-5 accent-[#FACC15] cursor-pointer rounded"
                              />
                              <span className="text-sm font-bold text-[#FACC15]">Chef's Special</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                          <textarea 
                            defaultValue={item.description} 
                            onBlur={(e) => handleUpdateTreat(item.id, { description: e.target.value })}
                            className="w-full p-3 bg-black/30 rounded-xl border border-white/10 text-sm text-gray-300 h-20 resize-none focus:outline-none focus:border-[#FF5A79]/50 shadow-inner"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-white/10 gap-4">
                          <span className="text-xs text-gray-400 font-medium">
                            Customer pays {Number(item.price).toLocaleString()} UGX
                          </span>

                          <div className="flex items-center space-x-3 w-full sm:w-auto">
                            <button 
                              onClick={() => showToastMsg("Changes saved!")}
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center space-x-1 border border-white/10"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteTreat(item.id)}
                              className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center space-x-1 border border-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= 2. CATEGORIES PANEL ================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-5 sm:p-8 border border-white/20 shadow-xl">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-2">Menu categories</h3>
              <p className="text-sm text-gray-400 mb-6">These are the tabs customers see on the homepage, in this order.</p>

              <form onSubmit={handleAddCategory} className="bg-black/30 p-5 sm:p-6 rounded-3xl border border-white/10 mb-8 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end shadow-inner">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Category Name</label>
                  <input 
                    type="text"
                    value={newCatName}
                    onChange={e => handleCategoryNameChange(e.target.value)}
                    placeholder="e.g. Fresh Juices & Smoothies"
                    required
                    className="w-full p-3.5 bg-white/5 rounded-xl border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-sm"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Menu Code (Slug)</label>
                  <input 
                    type="text"
                    value={newCatSlug}
                    onChange={e => setNewCatSlug(e.target.value)}
                    placeholder="fresh-juices-smoothies"
                    required
                    className="w-full p-3.5 bg-white/5 rounded-xl border border-white/10 text-sm font-mono text-gray-400 focus:outline-none focus:border-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button type="submit" className="w-full bg-[#FF5A79] hover:bg-[#E04B66] text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1">
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {categories.map((cat: any) => {
                  const treatCount = items.filter(i => i.category === cat.slug).length;
                  return (
                    <div key={cat.id} className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-4">
                      <div className="flex-1 w-full">
                        <input 
                          type="text" 
                          defaultValue={cat.label}
                          onBlur={(e) => handleUpdateCategory(cat.id, e.target.value)}
                          className="w-full p-3 bg-black/30 rounded-xl border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-[#FF5A79]/50 shadow-inner mb-2 sm:mb-0"
                        />
                        <span className="text-[10px] text-gray-500 font-mono block">slug: {cat.slug}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <span className="bg-black/20 text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap border border-white/10 w-full sm:w-auto text-center mb-1 sm:mb-0">
                          {cat.slug} · {treatCount} treats
                        </span>
                        <button 
                          onClick={() => showToastMsg("Category saved!")}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/10 text-center"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer border border-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. REVIEWS PANEL ================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-5 sm:p-8 border border-white/20 shadow-xl">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-2">Straight from our WhatsApp</h3>
              <p className="text-sm text-gray-400 mb-6">Reviews rotate on the homepage. The checkmark shows the blue tick badge.</p>

              <form onSubmit={handleAddReview} className="bg-black/30 p-5 sm:p-6 rounded-3xl border border-white/10 mb-8 space-y-5 shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Name</label>
                    <input 
                      type="text"
                      value={newReview.customer_name}
                      onChange={e => setNewReview({ ...newReview, customer_name: e.target.value })}
                      placeholder="e.g. Sarah"
                      required
                      className="w-full p-3.5 bg-white/5 rounded-xl border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Location</label>
                    <input 
                      type="text"
                      value={newReview.location}
                      onChange={e => setNewReview({ ...newReview, location: e.target.value })}
                      placeholder="e.g. Kira"
                      className="w-full p-3.5 bg-white/5 rounded-xl border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Review Quote</label>
                  <textarea 
                    value={newReview.quote}
                    onChange={e => setNewReview({ ...newReview, quote: e.target.value })}
                    placeholder="What did they say? e.g. 'I love the juice well balanced and flavored.'"
                    required
                    className="w-full p-3.5 bg-white/5 rounded-xl border border-white/10 text-sm text-white h-24 resize-none focus:outline-none focus:border-[#FF5A79]/50 transition-all placeholder-gray-600 shadow-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      id="revCheck"
                      checked={newReview.verified}
                      onChange={e => setNewReview({ ...newReview, verified: e.target.checked })}
                      className="w-5 h-5 accent-[#FF5A79] cursor-pointer rounded"
                    />
                    <label htmlFor="revCheck" className="text-sm font-bold text-white">Show checkmark badge</label>
                  </div>

                  <button type="submit" className="w-full sm:w-auto bg-[#FF5A79] hover:bg-[#E04B66] text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add review</span>
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Name</label>
                        <input 
                          type="text" 
                          defaultValue={rev.customer_name} 
                          onBlur={(e) => handleUpdateReview(rev.id, { customer_name: e.target.value })}
                          className="w-full p-3 bg-black/30 rounded-xl border border-white/10 text-sm font-semibold text-white focus:outline-none focus:border-[#FF5A79]/50 shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Location</label>
                        <input 
                          type="text" 
                          defaultValue={rev.location} 
                          onBlur={(e) => handleUpdateReview(rev.id, { location: e.target.value })}
                          className="w-full p-3 bg-black/30 rounded-xl border border-white/10 text-sm font-semibold text-white focus:outline-none focus:border-[#FF5A79]/50 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Review Quote</label>
                      <textarea 
                        defaultValue={rev.quote} 
                        onBlur={(e) => handleUpdateReview(rev.id, { quote: e.target.value })}
                        className="w-full p-3 bg-black/30 rounded-xl border border-white/10 text-sm text-gray-300 h-20 resize-none focus:outline-none focus:border-[#FF5A79]/50 shadow-inner"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-white/10 gap-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          defaultChecked={rev.verified} 
                          onChange={(e) => handleUpdateReview(rev.id, { verified: e.target.checked })}
                          className="w-5 h-5 accent-[#FF5A79] cursor-pointer rounded"
                        />
                        <span className="text-sm font-bold text-white">Checkmark</span>
                      </div>

                      <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <button 
                          onClick={() => showToastMsg("Review saved!")}
                          className="flex-1 sm:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/10"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer border border-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ================= 4. HOMEPAGE PANEL ================= */}
        {activeTab === 'homepage' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-5 sm:p-8 border border-white/20 shadow-xl space-y-8">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-2">Hero photo</h3>
                <p className="text-sm text-gray-400 mb-6">The picture beside the big headline at the very top.</p>
                
                <div className="p-6 sm:p-8 bg-black/20 rounded-3xl border border-dashed border-white/20 flex flex-col items-center justify-center shadow-inner">
                  {siteAssets.heroUrl && (
                    <img src={siteAssets.heroUrl} alt="Current Hero" className="w-full max-w-sm h-40 object-cover rounded-2xl mb-4 shadow-lg border border-white/10" />
                  )}
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <label className="w-full sm:w-auto bg-[#FF5A79] hover:bg-[#E04B66] text-white text-sm font-bold px-8 py-3 rounded-full cursor-pointer transition-all active:scale-95 shadow-md text-center">
                      {siteAssets.heroUrl ? 'Change photo' : 'Choose photo'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const compressed = await compressAndConvertImage(file);
                            handleSaveAsset('hero', compressed);
                          }
                        }}
                      />
                    </label>
                    {siteAssets.heroUrl && (
                      <button 
                        onClick={() => handleSaveAsset('hero', '')}
                        className="w-full sm:w-auto bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 text-sm font-bold px-6 py-3 rounded-full transition-all active:scale-95 border border-white/10"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}