import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  ShoppingBag, 
  MapPin, 
  Search, 
  Gift, 
  MessageCircle, 
  CheckCheck, 
  Plus, 
  Minus, 
  X,
  Sparkles,
  Phone,
  Music,
  CheckCircle2,
  UtensilsCrossed,
  BookOpen,
  ChefHat,
  Coffee,
  Citrus,
  IceCream,
  Menu, 
  ChevronRight,
  Heart
} from 'lucide-react';
import { db } from './firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import KitchenManager from './components/KitchenManager';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  discountPercent: number;
  imageUrl: string;
  available: boolean;
  isChefsSpecial?: boolean;
  createdAt?: string;
}

interface Category {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
}

interface Review {
  id: string;
  customerName: string;
  location: string;
  quote: string;
  verified: boolean;
  createdAt?: string;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface SiteAssets {
  heroUrl: string;
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname === '/admin');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => setIsAdminRoute(window.location.pathname === '/admin');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [stampsCount, setStampsCount] = useState(7);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [siteAssets, setSiteAssets] = useState<SiteAssets>({ heroUrl: '' });
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  const TEST_WHATSAPP_NUMBER = '256774501297';

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Loading Screen Logic
  useEffect(() => {
    if (!isMenuLoading && !isReviewsLoading) {
      const timer = setTimeout(() => setIsAppLoading(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [isMenuLoading, isReviewsLoading]);

  // Perfect Smooth Scroll
  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 150); 
  };

  // --- Firestore Listeners ---
  useEffect(() => {
    const unsubItems = onSnapshot(
      collection(db, 'menu_items'),
      (snap) => {
        const list: MenuItem[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              name: data.name ?? '',
              price: Number(data.price) || 0,
              description: data.description ?? '',
              category: data.category ?? '',
              discountPercent: Number(data.discount_percent) || 0,
              imageUrl: data.image_url ?? '',
              available: data.available === true,
              isChefsSpecial: data.is_chefs_special === true,
              createdAt: data.created_at ?? '',
            };
          })
          .filter((i) => i.available)
          .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
        setMenuItems(list);
        setIsMenuLoading(false);
      },
      (err) => {
        console.error('menu_items snapshot error:', err);
        setIsMenuLoading(false);
      }
    );

    const unsubCats = onSnapshot(collection(db, 'menu_categories'), (snap) => {
      const list: Category[] = snap.docs
        .map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            slug: data.slug ?? '',
            label: data.label ?? '',
            sortOrder: Number(data.sort_order) || 0,
          };
        })
        .filter((c) => c.slug)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setCategories(list);
    });

    const unsubReviews = onSnapshot(
      collection(db, 'testimonials'),
      (snap) => {
        const list: Review[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              customerName: data.customer_name ?? '',
              location: data.location ?? '',
              quote: data.quote ?? '',
              verified: data.verified === true,
              createdAt: data.created_at ?? '',
            };
          })
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        setTestimonials(list);
        setIsReviewsLoading(false);
      },
      (err) => {
        console.error('testimonials snapshot error:', err);
        setIsReviewsLoading(false);
      }
    );

    const unsubAssets = onSnapshot(collection(db, 'site_assets'), (snap) => {
      const assets: Record<string, string> = {};
      snap.docs.forEach((d) => {
        assets[d.id] = (d.data() as any).url || '';
      });
      setSiteAssets({
        heroUrl: assets['hero'] || '',
      });
    });

    return () => {
      unsubItems();
      unsubCats();
      unsubReviews();
      unsubAssets();
    };
  }, []);

  // Carousel
  useEffect(() => {
    if (testimonials.length === 0) return;
    const interval = setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    if (activeCategory !== 'all' && !categories.some((c) => c.slug === activeCategory)) {
      setActiveCategory('all');
    }
  }, [categories, activeCategory]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    showToast(`${item.name} added to cart!`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.item.id === id) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalCartItems = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const subtotal = cart.reduce((sum, ci) => {
    const effectivePrice = ci.item.discountPercent
      ? ci.item.price * (1 - ci.item.discountPercent / 100)
      : ci.item.price;
    return sum + effectivePrice * ci.quantity;
  }, 0);

  const generateWhatsAppLink = (items: CartItem[], location: string, instructions: string) => {
    let text = `Hello Pajir Cravings! 👋 I would like to place an order:\n\n`;
    text += `*ORDER SUMMARY:*\n`;
    items.forEach((ci) => {
      const unitPrice = ci.item.discountPercent
        ? ci.item.price * (1 - ci.item.discountPercent / 100)
        : ci.item.price;
      text += `• ${ci.quantity}x ${ci.item.name} — ${(unitPrice * ci.quantity).toLocaleString()} UGX\n`;
    });
    text += `\n*Total:* ${subtotal.toLocaleString()} UGX\n\n`;
    text += `*Delivery Location:*\n${location.trim() || 'Not specified'}\n\n`;
    text += `*Special Instructions:*\n${instructions.trim() || 'None'}\n\n`;
    text += `Is this available for delivery right now?`;
    return `https://wa.me/${TEST_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const quickOrderLink = (item: MenuItem) => {
    const effectivePrice = item.discountPercent
      ? item.price * (1 - item.discountPercent / 100)
      : item.price;
    const text = `Hello Pajir Cravings! 👋 I would like to place a quick order:\n\n*ORDER SUMMARY:*\n• 1x ${item.name} — ${effectivePrice.toLocaleString()} UGX\n\n*Total:* ${effectivePrice.toLocaleString()} UGX\n\n*Delivery Location:*\nNot specified\n\n*Special Instructions:*\nNone\n\nIs this available for delivery right now?`;
    return `https://wa.me/${TEST_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const cleanSearchTerm = searchQuery.toLowerCase().trim();
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    if (!cleanSearchTerm) return matchesCategory;
    const itemName = item.name.toLowerCase();
    const itemDesc = item.description.toLowerCase();
    const matchesSearch = itemName.includes(cleanSearchTerm) || itemDesc.includes(cleanSearchTerm);
    return matchesCategory && matchesSearch;
  });

  if (isAdminRoute) {
    return (
      <KitchenManager 
        onBackToStorefront={() => {
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
        }} 
      />
    );
  }

  const displayCategories: Category[] = [
    { id: 'all', slug: 'all', label: 'All Treats', sortOrder: -1 },
    ...categories,
  ];

  const safeReviewIndex = testimonials.length > 0 ? Math.min(activeReviewIndex, testimonials.length - 1) : 0;

  return (
    <div className="min-h-screen text-gray-200 font-sans antialiased selection:bg-[#FF5A79] selection:text-white relative bg-[#1A1113]">
      
      {/* Cinematic Loading Screen */}
      <AnimatePresence>
        {isAppLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[100] bg-[#1A1113] flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-center flex flex-col items-center"
            >
              <ChefHat className="w-20 h-20 text-[#FF5A79] mb-6" />
              <h1 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight mb-4 text-white">PAJIR CRAVINGS</h1>
              
              <div className="w-72 h-1 bg-white/10 rounded-full overflow-hidden relative mb-6">
                <motion.div
                  initial={{ x: '-100%"' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute inset-0 bg-[#FF5A79]"
                />
              </div>
              
              <p className="font-script text-4xl text-[#FACC15] mt-2 drop-shadow-md">Precision in every taste</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <ChefHat className="absolute top-[5%] left-[5%] w-[600px] h-[600px] text-[#FF5A79] opacity-15 blur-[120px] transform -rotate-12" />
        <Citrus className="absolute top-[30%] right-[5%] w-[700px] h-[700px] text-[#FF5A79] opacity-10 blur-[150px] transform rotate-45" />
        <Coffee className="absolute top-[60%] left-[10%] w-[600px] h-[600px] text-[#FF5A79] opacity-15 blur-[120px] transform -rotate-12" />
        <IceCream className="absolute top-[80%] right-[10%] w-[700px] h-[700px] text-[#FF5A79] opacity-10 blur-[150px] transform rotate-12" />
      </div>

      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-[#FF5A79] z-50 origin-left shadow-[0_0_15px_rgba(255,90,121,0.6)]"
        style={{ scaleX }}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#2A1D21] text-white px-6 py-3 rounded-full shadow-2xl border border-[#FF5A79]/30 flex items-center space-x-2 text-sm font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#FF5A79] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.8)] bg-[#1A1113]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#FF5A79] shadow-[0_0_15px_rgba(255,90,121,0.3)] group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M18.5 6C18.22 3.71 16.29 2 14 2c-1.5 0-2.81.71-3.66 1.81A4.986 4.986 0 0 0 6 6c-2.21 0-4 1.79-4 4 0 1.86 1.28 3.41 3 3.86V20c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-6.14c1.72-.45 3-2 3-3.86 0-2.21-1.79-4-3.5-4zM7 20v-4h10v4H7z"/>
              </svg>
            </div>
            <div>
              <span className="font-serif text-2xl font-bold text-white tracking-tight group-hover:text-[#FF5A79] transition-colors block leading-none">
                Pajir Cravings
              </span>
              <span className="font-script text-sm text-[#FF5A79] block mt-1">Precision in every taste</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => scrollToSection('about')} className="text-xs font-bold uppercase tracking-widest text-white/70 hover:text-[#FF5A79] transition-colors">About Us</button>
            <button onClick={() => scrollToSection('menu')} className="text-xs font-bold uppercase tracking-widest text-white/70 hover:text-[#FF5A79] transition-colors">Menu</button>
            <button onClick={() => scrollToSection('feedback')} className="text-xs font-bold uppercase tracking-widest text-white/70 hover:text-[#FF5A79] transition-colors">Feedback</button>
            <button onClick={() => scrollToSection('contact')} className="text-xs font-bold uppercase tracking-widest text-white/70 hover:text-[#FF5A79] transition-colors">Contact</button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 ml-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white transition-all shadow-sm hover:shadow-[0_0_15px_rgba(255,90,121,0.4)] active:scale-95 group"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              {totalCartItems > 0 && (
                <motion.span 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#FF5A79] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                >
                  {totalCartItems}
                </motion.span>
              )}
            </button>
          </div>

          {/* Mobile Nav Toggle & Cart */}
          <div className="flex md:hidden items-center space-x-3">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-white/5 rounded-full border border-white/10 text-white active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF5A79] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{totalCartItems}</span>
              )}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2.5 bg-white/5 rounded-full border border-white/10 text-white">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[#1A1113]/95 backdrop-blur-2xl border-b border-white/10 overflow-hidden"
            >
              <div className="px-4 py-6 flex flex-col space-y-3">
                <button onClick={() => scrollToSection('about')} className="flex items-center justify-between text-white font-bold text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span>About Us</span>
                  <ChevronRight className="w-4 h-4 text-[#FF5A79]" />
                </button>
                <button onClick={() => scrollToSection('menu')} className="flex items-center justify-between text-white font-bold text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span>Explore Menu</span>
                  <ChevronRight className="w-4 h-4 text-[#FF5A79]" />
                </button>
                <button onClick={() => scrollToSection('feedback')} className="flex items-center justify-between text-white font-bold text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span>Client Feedback</span>
                  <ChevronRight className="w-4 h-4 text-[#FF5A79]" />
                </button>
                <button onClick={() => scrollToSection('contact')} className="flex items-center justify-between text-white font-bold text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span>Contact Us</span>
                  <ChevronRight className="w-4 h-4 text-[#FF5A79]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#FF5A79]/10 backdrop-blur-md border border-[#FF5A79]/20 text-[#FF5A79] font-semibold text-xs mb-6 shadow-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span className="tracking-wide">Kira, Uganda</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 drop-shadow-lg">
            Precision in <br/>
            <span className="font-script text-[#FF5A79] font-normal text-6xl sm:text-7xl lg:text-8xl drop-shadow-xl">Every</span> Taste
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-lg mb-8 leading-relaxed font-medium">
            Made with Love. Served with Joy. From freshly pressed natural juices and oven-warm pastries to hearty continental meals — crafted to perfection.
          </p>

          <div className="flex items-center space-x-4">
            <button onClick={() => scrollToSection('menu')} className="bg-[#FF5A79] hover:bg-[#E04B66] text-white font-bold px-8 py-4 rounded-full transition-all shadow-[0_10px_20px_rgba(255,90,121,0.3)] hover:shadow-[0_15px_30px_rgba(255,90,121,0.5)] hover:-translate-y-0.5 active:translate-y-0 text-sm">
              Explore Menu
            </button>
          </div>
          
          <div className="mt-8 flex items-center space-x-2 text-xs font-semibold text-gray-500">
            <BookOpen className="w-4 h-4 text-[#FF5A79]" />
            <span>Godtrepreneur • John 3:3</span>
          </div>
        </motion.div>

        {/* HERO IMAGE WITH INFINITE FLOATING ANIMATION */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20 transform lg:rotate-2 transition-all duration-700 hover:rotate-0 group backdrop-blur-xl"
          >
            <img 
              src={siteAssets.heroUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop"} 
              alt="Pajir Cravings" 
              className="w-full h-[400px] sm:h-[500px] object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1113] via-transparent to-transparent pointer-events-none opacity-80" />
          </motion.div>
          
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="absolute -bottom-4 -left-4 sm:bottom-6 sm:left-6 bg-[#2A1D21]/80 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center space-x-2 text-white font-bold text-xs">
            <Sparkles className="w-4 h-4 text-[#FF5A79]" />
            <span>100% Natural Ingredients</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Elegant Section Divider (About Us) */}
      <div className="flex items-center justify-center py-8 space-x-4 opacity-80 relative z-10">
        <div className="h-px w-16 sm:w-32 bg-gradient-to-r from-transparent to-[#FF5A79]"></div>
        <div className="text-[#FF5A79] font-script text-3xl sm:text-4xl px-4 whitespace-nowrap drop-shadow-md">About Us</div>
        <div className="h-px w-16 sm:w-32 bg-gradient-to-l from-transparent to-[#FF5A79]"></div>
      </div>

      {/* ABOUT US SECTION */}
      <section id="about" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-24">
        <div className="text-left">
          <div className="flex items-center justify-start space-x-3 mb-6">
            <Heart className="w-8 h-8 text-[#FF5A79] opacity-90" />
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white">Our Story</h2>
          </div>
          
          <p className="text-gray-300 leading-relaxed text-base sm:text-lg mb-6 max-w-3xl">
            Pajir Cravings is more than just a kitchen; it's a calling. Born out of a passion for bringing people together over exceptional food, we specialize in freshly baked pastries, 100% natural cold-pressed juices, and hearty, meticulously crafted continental meals.
          </p>
          <p className="text-gray-300 leading-relaxed text-base sm:text-lg mb-8 max-w-3xl">
            We are a proud <strong className="text-[#FF5A79]">Godtrepreneur</strong> — running this business hand in hand with the One who gave us the vision. Every juice is pressed, every cookie is baked, and every meal is plated with love, joy, and precision.
          </p>
          
          <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#FACC15]/10 border border-[#FACC15]/20 text-[#FACC15] font-bold text-xs tracking-wider uppercase">
            <BookOpen className="w-4 h-4" />
            <span>John 3:3</span>
          </div>
        </div>
      </section>

      {/* Elegant Section Divider (Menu) */}
      <div className="flex items-center justify-center py-8 space-x-4 opacity-80 relative z-10">
        <div className="h-px w-16 sm:w-32 bg-gradient-to-r from-transparent to-[#FF5A79]"></div>
        <div className="text-[#FF5A79] font-script text-3xl sm:text-4xl px-4 whitespace-nowrap drop-shadow-md">Our Menu</div>
        <div className="h-px w-16 sm:w-32 bg-gradient-to-l from-transparent to-[#FF5A79]"></div>
      </div>

      {/* Menu Section */}
      <section id="menu" className="relative z-10 py-10 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              {/* REPLACED TEXT */}
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3">Find Your Craving</h2>
              <p className="text-gray-400 text-sm max-w-xl leading-relaxed flex flex-col space-y-1">
                <span>Search for your favorite treats, juices, or meals below.</span>
                <span className="flex items-center gap-1 text-[#FF5A79] font-medium mt-1">
                  <MessageCircle className="w-3.5 h-3.5" /> Orders are placed directly via WhatsApp.
                </span>
              </p>
            </div>
            
            <div className="relative group w-full md:w-80">
              {/* Larger search icon */}
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF5A79] transition-colors" />
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cravings..."
                className="w-full pl-12 pr-10 py-3.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-[#FF5A79]/50 text-white shadow-sm placeholder:text-gray-500 text-sm font-medium transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="relative mb-12">
            <div className="flex items-center overflow-x-auto space-x-2 px-1 py-1 max-w-full justify-start" style={{ scrollbarWidth: 'none' }}>
              {displayCategories.map((cat) => {
                const isActive = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
                    className={`relative shrink-0 px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap border ${
                      isActive ? 'text-white border-transparent shadow-md' : 'text-gray-400 bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isActive && <motion.div layoutId="activeCategoryTab" className="absolute inset-0 bg-[#FF5A79] rounded-full shadow-[0_0_15px_rgba(255,90,121,0.4)]" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                    <span className="relative z-10">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Grid - Using grid-flow-row-dense to prevent empty spaces */}
          {isMenuLoading && menuItems.length === 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1, 2, 3].map((n) => (
                 <div key={n} className="bg-white/5 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-sm border border-white/10 animate-pulse">
                   <div className="h-64 bg-white/5" />
                   <div className="p-6 space-y-4"><div className="h-6 bg-white/10 rounded w-2/3" /><div className="h-10 bg-white/10 rounded-full w-full mt-6" /></div>
                 </div>
               ))}
             </div>
          ) : filteredItems.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-12 text-center max-w-md mx-auto border border-white/10 shadow-sm">
              <div className="w-16 h-16 bg-white/5 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4"><UtensilsCrossed className="w-8 h-8" /></div>
              <h3 className="font-serif text-2xl font-bold text-white mb-2">Nothing Baking Here</h3>
              <p className="text-gray-400 text-sm mb-6">We couldn't find anything matching "{searchQuery || activeCategory}".</p>
              <button onClick={() => { setActiveCategory('all'); setSearchQuery(''); }} className="bg-[#FF5A79] text-white text-sm font-bold px-8 py-3 rounded-full hover:bg-[#E04B66] transition-all shadow-md">Show All</button>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(380px,auto)] grid-flow-row-dense">
              <AnimatePresence>
                {filteredItems.map((item) => {
                  const effectivePrice = item.discountPercent ? item.price * (1 - item.discountPercent / 100) : item.price;
                  
                  if (item.isChefsSpecial) {
                    return (
                      <motion.div 
                        layout key={item.id} initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} transition={{ duration: 0.4 }}
                        // Kept the original size: 2 columns on desktop
                        className="md:col-span-2 lg:col-span-2 relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] group flex flex-col justify-end min-h-[380px] border border-white/20"
                      >
                        <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1113] via-[#1A1113]/60 to-transparent opacity-90" />
                        
                        <div className="relative z-10 p-8 sm:p-10 text-white">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="bg-[#FACC15] text-black text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider shadow-sm">Chef's Special</span>
                            {item.discountPercent > 0 && <span className="bg-[#FF5A79] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">{item.discountPercent}% OFF</span>}
                          </div>
                          <h3 className="font-serif text-3xl sm:text-4xl font-bold mb-3">{item.name}</h3>
                          <p className="text-gray-300 text-sm mb-6 max-w-md line-clamp-2 leading-relaxed">{item.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-sans font-bold text-3xl text-[#FF5A79]">{effectivePrice.toLocaleString()} <span className="text-sm">UGX</span></span>
                              {item.discountPercent > 0 && <span className="text-sm text-gray-500 line-through ml-2">{item.price.toLocaleString()}</span>}
                            </div>
                            <div className="flex items-center space-x-3">
                              <button onClick={() => addToCart(item)} className="bg-[#FF5A79] text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-[#E04B66] transition-all shadow-xl active:scale-95">
                                Add to Cart
                              </button>
                              <a href={quickOrderLink(item)} target="_blank" rel="noreferrer" className="border-2 border-[#FF5A79] text-[#FF5A79] hover:bg-[#FF5A79] hover:text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-xl active:scale-95 flex items-center space-x-2">
                                <MessageCircle className="w-4 h-4" />
                                <span>Quick Order</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Standard Floating Glass Cards
                  return (
                    <motion.div 
                      layout key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }}
                      className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(255,90,121,0.15)] transition-all duration-500 border border-white/10 hover:border-[#FF5A79]/30 flex flex-col group relative"
                    >
                      <div className="relative h-48 overflow-hidden rounded-[1.5rem] bg-white/5 mb-4">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
                        {item.discountPercent > 0 && <span className="absolute top-3 left-3 bg-[#FF5A79] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">{item.discountPercent}% OFF</span>}
                      </div>

                      <div className="px-2 pb-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif text-lg font-bold text-white mb-1 leading-tight">{item.name}</h3>
                          <p className="text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-baseline space-x-2 mb-4">
                            <span className="font-sans font-bold text-xl text-[#FF5A79]">{effectivePrice.toLocaleString()} <span className="text-[10px]">UGX</span></span>
                            {item.discountPercent > 0 && <span className="text-xs text-gray-500 line-through">{item.price.toLocaleString()}</span>}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => addToCart(item)} className="bg-[#FF5A79] hover:bg-[#E04B66] text-white text-[11px] font-bold py-2.5 rounded-full transition-all shadow-md active:scale-95">
                              Add to Cart
                            </button>
                            <a href={quickOrderLink(item)} target="_blank" rel="noreferrer" className="border border-[#FF5A79] text-[#FF5A79] hover:bg-[#FF5A79] hover:text-white text-[11px] font-bold py-2.5 rounded-full transition-all flex items-center justify-center space-x-1 shadow-sm active:scale-95">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Quick Order</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Elegant Section Divider */}
      <div className="flex items-center justify-center py-8 space-x-4 opacity-80 relative z-10">
        <div className="h-px w-16 sm:w-32 bg-gradient-to-r from-transparent to-[#FF5A79]"></div>
        <div className="text-[#FF5A79] font-script text-3xl sm:text-4xl px-4 whitespace-nowrap drop-shadow-md">Exclusive Rewards</div>
        <div className="h-px w-16 sm:w-32 bg-gradient-to-l from-transparent to-[#FF5A79]"></div>
      </div>

      {/* Loyalty Section */}
      <section id="loyalty" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-12 scroll-mt-24">
        <div className="bg-[#2A1D21]/60 backdrop-blur-2xl text-white rounded-[2.5rem] p-8 sm:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden border border-white/10">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF5A79] rounded-full blur-[150px] opacity-20 pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#FF5A79] rounded-full blur-[150px] opacity-10 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-md">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FACC15] mb-4">
                <Gift className="w-4 h-4" /><span>Exclusive Rewards</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-4 text-white leading-tight">Buy 10 Times <br/><span className="font-script text-[#FF5A79] text-4xl sm:text-6xl font-normal">Get 1 Free</span></h2>
              <p className="text-gray-400 text-sm leading-relaxed">Tap the stamps below to see your progress. Thank you for choosing Pajir Cravings!</p>
            </div>
            
            <div className="flex-shrink-0">
              <div className="grid grid-cols-5 gap-3 sm:gap-4 mb-6">
                {Array.from({ length: 10 }).map((_, i) => {
                  const stampNumber = i + 1;
                  const isStamped = stampNumber <= stampsCount;
                  const isGift = stampNumber === 10;
                  return (
                    <button
                      key={stampNumber} onClick={() => setStampsCount(stampNumber)}
                      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 transform active:scale-90 ${
                        isStamped ? 'bg-[#FF5A79] text-white shadow-[0_0_20px_rgba(255,90,121,0.6)] scale-105 border-2 border-white/20' : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {isGift ? <Gift className={`w-6 h-6 ${isStamped ? 'text-white' : 'text-gray-500'}`} /> : stampNumber}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-[#FACC15] font-semibold tracking-widest uppercase">
                {10 - stampsCount === 0 ? '🎉 Gift Unlocked!' : `${10 - stampsCount} Orders Remaining`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Elegant Section Divider */}
      <div className="flex items-center justify-center py-8 space-x-4 opacity-80 relative z-10">
        <div className="h-px w-16 sm:w-32 bg-gradient-to-r from-transparent to-[#FF5A79]"></div>
        <div className="text-[#FF5A79] font-script text-3xl sm:text-4xl px-4 whitespace-nowrap drop-shadow-md">Client Feedback</div>
        <div className="h-px w-16 sm:w-32 bg-gradient-to-l from-transparent to-[#FF5A79]"></div>
      </div>

      {/* Testimonials / Feedback Section */}
      <section id="feedback" className="relative z-10 py-10 overflow-hidden scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          
          <div className="relative max-w-xl mx-auto min-h-[140px] flex items-center justify-center">
            {isReviewsLoading ? (
              <div className="absolute w-full bg-[#2A1D21]/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/10 animate-pulse"><div className="h-5 bg-white/5 rounded w-full mb-3" /><div className="h-5 bg-white/5 rounded w-4/5 mb-3" /><div className="h-4 bg-white/5 rounded w-1/3 mt-6 mx-auto" /></div>
            ) : testimonials.length === 0 ? (
              <div className="absolute w-full bg-[#2A1D21]/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/10 text-center"><p className="text-sm text-gray-400 font-medium">No reviews yet — be the first to order!</p></div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonials[safeReviewIndex].id} initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute w-full bg-[#2A1D21]/80 backdrop-blur-2xl rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#FF5A79]/20 flex flex-col justify-center"
                >
                  <MessageCircle className="w-5 h-5 text-[#FF5A79] mx-auto mb-2 opacity-80" />
                  <p className="text-sm text-gray-200 font-medium mb-3 leading-relaxed italic">"{testimonials[safeReviewIndex].quote}"</p>
                  <div className="flex items-center justify-center space-x-2 text-[10px] font-bold text-gray-400">
                    <span>— {testimonials[safeReviewIndex].customerName}, {testimonials[safeReviewIndex].location}</span>
                    {testimonials[safeReviewIndex].verified && <CheckCheck className="w-3 h-3 text-[#FF5A79]" />}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {!isReviewsLoading && testimonials.length > 0 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveReviewIndex(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === safeReviewIndex ? 'w-6 bg-[#FF5A79]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer / Contact Section */}
      <footer id="contact" className="relative z-10 bg-[#130B0D]/90 backdrop-blur-2xl text-white pt-20 pb-10 border-t border-white/10 overflow-hidden scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 items-start relative z-10">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#FF5A79]">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M18.5 6C18.22 3.71 16.29 2 14 2c-1.5 0-2.81.71-3.66 1.81A4.986 4.986 0 0 0 6 6c-2.21 0-4 1.79-4 4 0 1.86 1.28 3.41 3 3.86V20c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-6.14c1.72-.45 3-2 3-3.86 0-2.21-1.79-4-3.5-4zM7 20v-4h10v4H7z"/></svg>
              </div>
              <div>
                <h3 className="font-serif text-3xl font-bold tracking-tight text-white leading-none">Pajir Cravings</h3>
                <span className="font-script text-xl text-[#FF5A79] mt-1 block">Precision in every taste.</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-6">Made with Love. Served with Joy. Crafting premium local treats, natural juices, and hearty meals in Kira, Uganda.</p>
            <div className="inline-flex items-center space-x-2 text-xs text-[#FACC15] bg-[#FACC15]/5 px-4 py-2 rounded-full border border-[#FACC15]/20 backdrop-blur-md">
              <BookOpen className="w-4 h-4" />
              <span className="font-semibold tracking-wide uppercase">Godtrepreneur • John 3:3</span>
            </div>
          </div>

          <div className="space-y-5 text-sm text-gray-400">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Us</h4>
            <div className="flex items-center space-x-3 hover:text-[#FF5A79] transition-colors cursor-pointer"><MapPin className="w-4 h-4 text-[#FF5A79]" /><span>Kira, Uganda</span></div>
            <div className="flex items-center space-x-3 hover:text-[#FF5A79] transition-colors cursor-pointer"><Phone className="w-4 h-4 text-[#FF5A79]" /><span>+256 774 501 297</span></div>
            
            {/* TikTok Link */}
            <a href="https://www.tiktok.com/@pajirkitchenandoven" target="_blank" rel="noreferrer" className="flex items-center space-x-3 hover:text-[#FF5A79] transition-colors cursor-pointer">
              <Music className="w-4 h-4 text-[#FF5A79]" />
              <span>TikTok: @pajirkitchenandoven</span>
            </a>
            
            {/* Instagram Link */}
            <a href="https://www.instagram.com/pajirkitchenandoven/" target="_blank" rel="noreferrer" className="flex items-center space-x-3 hover:text-[#FF5A79] transition-colors cursor-pointer">
              <svg className="w-4 h-4 fill-current text-[#FF5A79]" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span>Instagram: @pajirkitchenandoven</span>
            </a>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Opening Hours</h4>
            <div className="flex justify-between text-sm mb-2 text-gray-400"><span>Mon - Sat</span><span className="text-[#FF5A79] font-bold">24 Hours</span></div>
            <div className="flex justify-between text-sm text-gray-400"><span>Sunday</span><span>Closed</span></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-16 border-t border-white/5 text-center text-[10px] text-gray-600 tracking-widest uppercase">
          © 2026 Pajir Cravings • All Rights Reserved
        </div>
      </footer>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-[#1A1113]/40 backdrop-blur-md z-50" />
            
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 p-6 flex flex-col shadow-2xl border-l border-white/10 overflow-hidden bg-[#1A1113]/90 backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 shrink-0">
                <h2 className="font-serif text-2xl font-bold text-white flex items-center space-x-2"><ShoppingBag className="w-5 h-5 text-[#FF5A79]" /><span>Your Order</span></h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-6" style={{ scrollbarWidth: 'none' }}>
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"><ShoppingBag className="w-10 h-10 text-gray-500" /></div>
                    <p className="text-gray-400 font-medium text-sm">Your cart is empty — go grab a treat!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(({ item, quantity }) => {
                      const unitPrice = item.discountPercent ? item.price * (1 - item.discountPercent / 100) : item.price;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4">
                            <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white/10" />
                            <div>
                              <h4 className="font-serif font-bold text-sm text-white mb-1 pr-2">{item.name}</h4>
                              <p className="text-xs text-[#FF5A79] font-semibold">{(unitPrice * quantity).toLocaleString()} UGX</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className="text-sm font-bold text-white">{quantity}</span>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#FF5A79] hover:text-black transition-colors shadow-sm"><Minus className="w-3 h-3" /></button>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#FF5A79] hover:text-black transition-colors shadow-sm"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Delivery Location</label>
                    <input type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} placeholder="e.g. Kira Town, near the market" className="w-full p-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 focus:outline-none focus:border-[#FF5A79]/50 focus:ring-1 focus:ring-[#FF5A79]/50 text-sm text-white placeholder-gray-600 shadow-sm font-medium transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Special Instructions</label>
                    <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="e.g. Less sugar please (or type 'none')" className="w-full p-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 focus:outline-none focus:border-[#FF5A79]/50 focus:ring-1 focus:ring-[#FF5A79]/50 h-20 resize-none text-sm text-white placeholder-gray-600 shadow-sm font-medium transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 shrink-0 mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif font-bold text-lg text-white">Subtotal</span>
                  <span className="font-sans font-bold text-2xl text-[#FF5A79]">{subtotal.toLocaleString()} <span className="text-sm">UGX</span></span>
                </div>
                <a
                  href={cart.length > 0 ? generateWhatsAppLink(cart, deliveryLocation, specialInstructions) : '#'}
                  target="_blank" rel="noreferrer" onClick={(e) => { if (cart.length === 0) e.preventDefault(); }}
                  className={`w-full py-4 rounded-full font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${cart.length > 0 ? 'bg-[#25D366] hover:bg-[#20bd5a] text-white hover:-translate-y-0.5 active:translate-y-0' : 'bg-white/5 text-gray-500 cursor-not-allowed shadow-none'}`}
                >
                  <MessageCircle className="w-5 h-5" /><span>Checkout via WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp */}
      <a href={`https://wa.me/${TEST_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 bg-[#FF5A79] hover:bg-[#E04B66] text-white p-4 rounded-full shadow-[0_10px_25px_rgba(255,90,121,0.5)] z-40 transition-all hover:scale-110 active:scale-95 flex items-center justify-center group border border-white/20">
        <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
      </a>
    </div>
  );
}