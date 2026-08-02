import React, { useState, useEffect } from 'react';
import appConfig from './config/appConfig.json';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation Menu Tabs: 'catalog' | 'cierre' | 'descuentos'
  const [activeTab, setActiveTab] = useState('catalog');

  // Mobile Sidebar Navigation State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mobile Collapsible Stats State (starts FALSE = hidden by default on mobile)
  const [showStatsMobile, setShowStatsMobile] = useState(false);

  // Search and Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal state (Add / Edit Product)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Product Form State
  const [formData, setFormData] = useState({
    Nombre: '',
    Categoria: 'Athleisure',
    Color: '',
    Precio: '',
    precioDolares: '',
    Nuevo: 'Si',
    Tendencia: 'Si',
    numorden: '',
    imgReel0: '',
    imgReel1: '',
    imgReel2: '',
    imgReel3: '',
    imgReel4: '',
    imgReel5: '',
    imgReel6: '',
    imgReel7: '',
    urlVideoPasarela: ''
  });

  // Delete Confirmation Modal State
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Order Closing Countdown Config State (2 Entregas / Cierres semanales)
  const [cierreConfig, setCierreConfig] = useState({
    diaInicio1: 'Lunes',
    horaInicio1: '08:00',
    diaFin1: 'Miércoles',
    horaFin1: '23:59',

    diaInicio2: 'Jueves',
    horaInicio2: '08:00',
    diaFin2: 'Sábado',
    horaFin2: '23:59',

    titulo: 'Cierre de Pedidos',
    activo: true
  });
  const [cierreSaving, setCierreSaving] = useState(false);

  // Price-Range Volume Discount Rules State (starts with 1 empty range)
  const [descuentosRules, setDescuentosRules] = useState([
    {
      id: 'rango_1',
      nombre: '',
      rangoInicio: '',
      rangoFin: '',
      activo: true,
      escalones: []
    }
  ]);
  const [descuentosSaving, setDescuentosSaving] = useState(false);

  // News / Notice Image Reels State (Pinterest & Google Drive URLs)
  const [noticesList, setNoticesList] = useState([]);
  const [noticesSaving, setNoticesSaving] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL || appConfig.apiUrl || 'http://localhost:5000';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper to sort product list cleanly by numorden ascending
  const sortProductsList = (list) => {
    if (!list || !Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const numA = Number(a.numorden !== undefined ? a.numorden : a.numOrden);
      const numB = Number(b.numorden !== undefined ? b.numorden : b.numOrden);
      const orderA = (!isNaN(numA) && numA !== null && numA !== '') ? numA : Infinity;
      const orderB = (!isNaN(numB) && numB !== null && numB !== '') ? numB : Infinity;
      return orderA - orderB;
    });
  };

  // Fetch products from API or localStorage cache
  const fetchProducts = async (forceRefresh = false) => {
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem('byangels_admin_products');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('⚡ Using cached admin catalog from localStorage');
            setProducts(sortProductsList(parsed));
            setLoading(false);
            return;
          }
        }
      } catch (cacheErr) {
        console.warn('⚠️ Error reading admin cache:', cacheErr);
      }
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/shopreel`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      
      const sorted = sortProductsList(data);
      setProducts(sorted);

      try {
        localStorage.setItem('byangels_admin_products', JSON.stringify(sorted));
      } catch (saveErr) {}

      if (forceRefresh) {
        showToast('Catálogo actualizado desde la base de datos');
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
      try {
        const cachedData = localStorage.getItem('byangels_admin_products');
        if (cachedData) {
          setProducts(sortProductsList(JSON.parse(cachedData)));
          showToast('Servidor API fuera de línea. Mostrando datos guardados localmente.', 'error');
          setLoading(false);
          return;
        }
      } catch (e) {}

      setError('No se pudo conectar con el servidor API. Verifica la conexión.');
      showToast('Error cargando catálogo desde la API', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Order Closing Schedule configuration
  const fetchCierreConfig = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/cierre`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCierreConfig(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Could not fetch cierre config:', err);
    }
  };

  // Fetch Price-Range Volume Discount Rules
  const fetchDescuentosConfig = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/descuentos`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDescuentosRules(data);
          try {
            localStorage.setItem('byangels_descuentos_rules', JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Could not fetch descuentos config:', err);
    }
  };

  // Fetch News/Notices image reel URLs
  const fetchNoticeConfig = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/notice`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const noticeData = await res.json();
        const extractedUrls = [];
        if (Array.isArray(noticeData) && noticeData.length > 0) {
          noticeData.forEach(doc => {
            Object.keys(doc).forEach(key => {
              if (key.startsWith('urlN') && doc[key]) {
                extractedUrls.push({
                  key,
                  url: doc[key]
                });
              }
            });
          });
          extractedUrls.sort((a, b) => {
            const numA = parseInt(a.key.replace('urlN', ''), 10) || 0;
            const numB = parseInt(b.key.replace('urlN', ''), 10) || 0;
            return numA - numB;
          });
        }
        const urls = extractedUrls.map(item => item.url);
        setNoticesList(urls);
      }
    } catch (err) {
      console.warn('Could not fetch notice config:', err);
    }
  };

  useEffect(() => {
    fetchProducts(false);
    fetchCierreConfig();
    fetchDescuentosConfig();
    fetchNoticeConfig();
  }, []);

  // Helper to normalize category names cleanly (e.g. "streetwear" -> "Streetwear")
  const formatCategoryName = (cat) => {
    if (!cat || typeof cat !== 'string') return '';
    const trimmed = cat.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  // Compute unique normalized categories (case-insensitive deduplication)
  const dynamicCategories = Array.from(
    new Set(
      ['Athleisure', 'Casual', 'Streetwear', 'Urbano', ...products.map(p => formatCategoryName(p.Categoria))]
        .filter(Boolean)
    )
  );

  // Custom Created Colors State (Persisted in localStorage)
  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem('byangels_custom_colors');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [newColorInput, setNewColorInput] = useState('');

  // Compute dynamic list of colors deduplicated from existing products + customColors + default popular colors
  const defaultColorsList = ['Negro', 'Blanco', 'Beige', 'Rosado', 'Rojo', 'Azul', 'Verde', 'Gris', 'Marfil', 'Lila', 'Marrón', 'Amarillo', 'Nude'];
  const dynamicColors = Array.from(
    new Set(
      [
        ...defaultColorsList,
        ...customColors,
        ...products.map(p => p.Color ? p.Color.trim() : '')
      ].filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  // Helper to save a newly created color via dedicated Sub-Modal
  const handleSaveNewColorModal = (e) => {
    if (e) e.preventDefault();
    if (!newColorInput || typeof newColorInput !== 'string') return;
    const trimmed = newColorInput.trim();
    if (!trimmed) return;

    // Capitalize first letter cleanly
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    if (!customColors.includes(formatted)) {
      const updated = [...customColors, formatted];
      setCustomColors(updated);
      try {
        localStorage.setItem('byangels_custom_colors', JSON.stringify(updated));
      } catch (err) {}
    }

    setFormData(prev => ({ ...prev, Color: formatted }));
    setIsColorModalOpen(false);
    setNewColorInput('');
    showToast(`Color "${formatted}" registrado y seleccionado exitosamente.`);
  };

  // Compute next auto-increment numorden value for new products
  const calculateNextNumOrden = () => {
    if (!products || products.length === 0) return 1;
    let max = 0;
    products.forEach(p => {
      const val = Number(p.numorden !== undefined ? p.numorden : p.numOrden);
      if (!isNaN(val) && val > max) {
        max = val;
      }
    });
    return max + 1;
  };

  // Open modal to create a new product (starts with EMPTY image fields)
  const handleOpenAddModal = () => {
    const nextOrder = calculateNextNumOrden();
    setEditingProduct(null);
    setIsColorModalOpen(false);
    setNewColorInput('');
    setFormData({
      Nombre: '',
      Categoria: dynamicCategories[0] || 'Athleisure',
      Color: dynamicColors[0] || 'Negro',
      Precio: '',
      precioDolares: '',
      Nuevo: 'Si',
      Tendencia: 'Si',
      numorden: String(nextOrder),
      imgReel0: '',
      imgReel1: '',
      imgReel2: '',
      imgReel3: '',
      imgReel4: '',
      imgReel5: '',
      imgReel6: '',
      imgReel7: '',
      urlVideoPasarela: ''
    });
    setIsModalOpen(true);
  };

  // Open modal to edit an existing product
  const handleOpenEditModal = (product, index) => {
    setEditingProduct(product);
    setIsColorModalOpen(false);
    setNewColorInput('');
    const orderValue = product.numorden !== undefined && product.numorden !== null && product.numorden !== '' 
      ? product.numorden 
      : (product.numOrden !== undefined ? product.numOrden : (index + 1));

    setFormData({
      Nombre: product.Nombre || '',
      Categoria: product.Categoria || 'Casual',
      Color: product.Color || '',
      Precio: String(product.Precio || '0.00'),
      precioDolares: String(product.precioDolares || product.PrecioDolares || ''),
      Nuevo: product.Nuevo === true || product.Nuevo === 'Si' || product.Nuevo === 'true' ? 'Si' : 'No',
      Tendencia: product.Tendencia === true || product.Tendencia === 'Si' || product.Tendencia === 'true' ? 'Si' : 'No',
      numorden: String(orderValue),
      imgReel0: product.imgReel0 || '',
      imgReel1: product.imgReel1 || '',
      imgReel2: product.imgReel2 || '',
      imgReel3: product.imgReel3 || '',
      imgReel4: product.imgReel4 || '',
      imgReel5: product.imgReel5 || '',
      imgReel6: product.imgReel6 || '',
      imgReel7: product.imgReel7 || '',
      urlVideoPasarela: product.urlVideoPasarela || product.urlVideo || ''
    });
    setIsModalOpen(true);
  };

  // Handle Form Submission (Save New or Update Product)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.Nombre.trim()) {
      showToast('Por favor ingresa el nombre del producto', 'error');
      return;
    }

    try {
      if (editingProduct) {
        const res = await fetch(`${apiBaseUrl}/api/shopreel/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Error al actualizar');
        showToast('¡Producto actualizado con éxito!');
      } else {
        const res = await fetch(`${apiBaseUrl}/api/shopreel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Error al crear');
        showToast('¡Producto agregado al catálogo!');
      }

      setIsModalOpen(false);
      fetchProducts(true);
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Error al guardar el producto en la API', 'error');
    }
  };

  // Save Order Closing Schedule Configuration (2 Entregas)
  const handleSaveCierreConfig = async (e) => {
    e.preventDefault();
    setCierreSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/cierre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cierreConfig)
      });
      if (!res.ok) throw new Error('Error al guardar horario');
      const updated = await res.json();
      setCierreConfig(prev => ({ ...prev, ...updated }));
      
      try {
        localStorage.setItem('byangels_cierre_config', JSON.stringify(updated));
      } catch (saveErr) {}

      showToast('¡Horario de las 2 entregas de pedidos actualizado!');
    } catch (err) {
      console.error('Cierre save error:', err);
      showToast('Error al guardar configuración de cierres', 'error');
    } finally {
      setCierreSaving(false);
    }
  };

  // DISCOUNT RULES MANAGEMENT HANDLERS (Empty by default for user customization)
  const handleAddRange = () => {
    const newId = `rango_${Date.now()}`;
    const newRange = {
      id: newId,
      nombre: '',
      rangoInicio: '',
      rangoFin: '',
      activo: true,
      escalones: []
    };
    setDescuentosRules([...descuentosRules, newRange]);
  };

  const handleDeleteRange = (rangeId) => {
    setDescuentosRules(descuentosRules.filter(r => r.id !== rangeId));
  };

  const handleUpdateRangeField = (rangeId, field, value) => {
    setDescuentosRules(descuentosRules.map(r => {
      if (r.id === rangeId) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleAddTier = (rangeId) => {
    setDescuentosRules(descuentosRules.map(r => {
      if (r.id === rangeId) {
        return {
          ...r,
          escalones: [...r.escalones, { cantidadMinima: '', precioOferta: '' }]
        };
      }
      return r;
    }));
  };

  const handleUpdateTierField = (rangeId, tierIndex, field, value) => {
    setDescuentosRules(descuentosRules.map(r => {
      if (r.id === rangeId) {
        const newTiers = [...r.escalones];
        newTiers[tierIndex] = { ...newTiers[tierIndex], [field]: value };
        return { ...r, escalones: newTiers };
      }
      return r;
    }));
  };

  const handleDeleteTier = (rangeId, tierIndex) => {
    setDescuentosRules(descuentosRules.map(r => {
      if (r.id === rangeId) {
        return {
          ...r,
          escalones: r.escalones.filter((_, idx) => idx !== tierIndex)
        };
      }
      return r;
    }));
  };

  // Save Discount Rules to API
  const handleSaveDescuentos = async (e) => {
    e.preventDefault();
    setDescuentosSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/descuentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(descuentosRules)
      });
      if (!res.ok) throw new Error('Error al guardar reglas de descuentos');
      const updated = await res.json();
      setDescuentosRules(updated);
      
      try {
        localStorage.setItem('byangels_descuentos_rules', JSON.stringify(updated));
      } catch (saveErr) {}

      showToast('¡Reglas de descuentos por rango y volumen guardadas con éxito!');
    } catch (err) {
      console.error('Descuentos save error:', err);
      showToast('Error al guardar reglas de descuentos', 'error');
    } finally {
      setDescuentosSaving(false);
    }
  };

  // Google Drive & Pinterest Image URL converter helper
  const parseNewsImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    let trimmed = url.trim();
    if (!trimmed) return '';

    // Convert Google Drive sharing links to direct viewable image URLs
    if (trimmed.includes('drive.google.com')) {
      let fileId = '';
      const matchD = trimmed.match(/\/file\/d\/([^\/]+)/);
      if (matchD && matchD[1]) {
        fileId = matchD[1];
      } else {
        const matchId = trimmed.match(/[?&]id=([^&]+)/);
        if (matchId && matchId[1]) {
          fileId = matchId[1];
        }
      }
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }

    return trimmed;
  };

  const getUrlTypeBadge = (url) => {
    if (!url) return null;
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
      return { label: '📁 Google Drive', color: '#4285f4' };
    }
    if (url.includes('pinimg.com') || url.includes('pinterest.com')) {
      return { label: '📌 Pinterest', color: '#e60023' };
    }
    return { label: '🔗 Enlace Directo', color: '#d4af37' };
  };

  const handleAddNoticeUrl = () => {
    setNoticesList(prev => [...prev, '']);
  };

  const handleDeleteNoticeUrl = (idx) => {
    setNoticesList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateNoticeUrl = (idx, value) => {
    const converted = parseNewsImageUrl(value);
    setNoticesList(prev => {
      const updated = [...prev];
      updated[idx] = converted;
      return updated;
    });
  };

  const handleSaveNoticias = async (e) => {
    e.preventDefault();
    setNoticesSaving(true);
    try {
      const cleanUrls = noticesList.map(parseNewsImageUrl).filter(Boolean);
      const res = await fetch(`${apiBaseUrl}/api/notice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanUrls)
      });
      if (!res.ok) throw new Error('Error al guardar noticias');
      showToast('¡Noticias y anuncios promocionales guardados con éxito!');
      fetchNoticeConfig();
    } catch (err) {
      console.error('Noticias save error:', err);
      showToast('Error al guardar noticias en la API', 'error');
    } finally {
      setNoticesSaving(false);
    }
  };

  // Delete product confirmation
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/shopreel/${deletingProduct.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar');
      showToast('Producto eliminado correctamente');
      setDeletingProduct(null);
      fetchProducts(true);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error al eliminar el producto', 'error');
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || (p.Nombre && p.Nombre.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    const matchesCategory = !categoryFilter || (p.Categoria && p.Categoria.toLowerCase() === categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="admin-layout">
      {/* Mobile Top Navigation Header (Visible on Mobile/Tablet screens < 992px) */}
      <header className="admin-mobile-top-bar">
        <button 
          type="button" 
          className="mobile-hamburger-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
        <div className="mobile-brand-title">
          <img 
            src="https://i.pinimg.com/736x/89/3e/a5/893ea5e4b77f98d75225c5d012431718.jpg" 
            alt="ByAngels Logo" 
            className="mobile-brand-logo"
          />
          <span>ByAngels Admin</span>
        </div>
        {activeTab === 'catalog' ? (
          <button 
            type="button" 
            className="mobile-action-add-btn" 
            onClick={handleOpenAddModal}
            title="Agregar Producto"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        ) : (
          <div style={{ width: '38px' }} />
        )}
      </header>

      {/* Backdrop overlay for mobile menu drawer */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-mobile-overlay active"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation Menu */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-brand">
            <img 
              src="https://i.pinimg.com/736x/89/3e/a5/893ea5e4b77f98d75225c5d012431718.jpg" 
              alt="ByAngels Logo" 
              className="sidebar-brand-logo"
            />
            <div className="sidebar-brand-titles">
              <h1>ByAngels</h1>
              <p>Panel Administrativo</p>
            </div>
            <button 
              type="button"
              className="sidebar-close-btn-mobile"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <nav className="sidebar-menu">
            <span className="sidebar-menu-label">Navegación</span>

            <button 
              type="button" 
              className={`sidebar-link ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => { setActiveTab('catalog'); setIsMobileMenuOpen(false); }}
            >
              <i className="fa-solid fa-shirt"></i>
              <span>Catálogo de Productos</span>
            </button>

            <button 
              type="button" 
              className={`sidebar-link ${activeTab === 'cierre' ? 'active' : ''}`}
              onClick={() => { setActiveTab('cierre'); setIsMobileMenuOpen(false); }}
            >
              <i className="fa-solid fa-stopwatch"></i>
              <span>Cierre de Pedidos</span>
            </button>

            <button 
              type="button" 
              className={`sidebar-link ${activeTab === 'descuentos' ? 'active' : ''}`}
              onClick={() => { setActiveTab('descuentos'); setIsMobileMenuOpen(false); }}
            >
              <i className="fa-solid fa-tags"></i>
              <span>Reglas de Descuentos</span>
            </button>

            <button 
              type="button" 
              className={`sidebar-link ${activeTab === 'noticias' ? 'active' : ''}`}
              onClick={() => { setActiveTab('noticias'); setIsMobileMenuOpen(false); }}
            >
              <i className="fa-solid fa-newspaper"></i>
              <span>Gestor de Noticias</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-badge">
            <div className="sidebar-user-avatar">BA</div>
            <div className="sidebar-user-info">
              <span>ByAngels Admin</span>
              <small>Sistema Conectado</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="admin-main-content">
        {/* Top Header Bar inside Main Workspace */}
        <header className="main-header-bar">
          <div className="page-title-group">
            <h2>
              {activeTab === 'catalog' && 'Catálogo de Productos'}
              {activeTab === 'cierre' && 'Cierre de Pedidos & Cronómetro'}
              {activeTab === 'descuentos' && 'Reglas de Descuentos por Rango de Precio'}
              {activeTab === 'noticias' && 'Gestor de Noticias y Anuncios (Pinterest & Google Drive)'}
            </h2>
            <p>
              {activeTab === 'catalog' && 'Gestiona la lista de prendas, imágenes, precios y estado'}
              {activeTab === 'cierre' && 'Configura las 2 fechas/entregas semanales de pedidos para la tienda web'}
              {activeTab === 'descuentos' && 'Configura rangos de precio base y descuentos por cantidad comprada'}
              {activeTab === 'noticias' && 'Agrega enlaces de imágenes desde Pinterest o Google Drive para los anuncios que se mostrarán en la web'}
            </p>
          </div>

          <div className="header-actions">
            {activeTab === 'catalog' && (
              <>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => fetchProducts(true)}
                  title="Actualizar datos desde la Base de Datos"
                >
                  <i className="fa-solid fa-rotate"></i> Actualizar
                </button>
                <button type="button" className="btn-primary" onClick={handleOpenAddModal}>
                  <i className="fa-solid fa-plus"></i> Agregar Producto
                </button>
              </>
            )}
            {activeTab === 'descuentos' && (
              <button type="button" className="btn-primary" onClick={handleAddRange}>
                <i className="fa-solid fa-plus"></i> Agregar Nuevo Rango
              </button>
            )}
            {activeTab === 'noticias' && (
              <button type="button" className="btn-primary" onClick={handleAddNoticeUrl}>
                <i className="fa-solid fa-plus"></i> Agregar Noticia
              </button>
            )}
          </div>
        </header>

        {/* VIEW 1: CATALOGUE MANAGEMENT */}
        {activeTab === 'catalog' && (
          <>
            {/* Mobile Collapsible Stats Toggle Button (Hidden on Desktop) */}
            <div className="mobile-stats-toggle-bar">
              <button 
                type="button" 
                className="btn-toggle-stats-mobile"
                onClick={() => setShowStatsMobile(!showStatsMobile)}
              >
                <span>📊 {showStatsMobile ? 'Ocultar Resumen y Totales' : `Ver Resumen y Totales (${products.length} prendas)`}</span>
                <i className={`fa-solid ${showStatsMobile ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
            </div>

            {/* Dashboard Metrics Grid (Collapsible on Mobile, always open on Desktop) */}
            <div className={`metrics-grid ${showStatsMobile ? 'show-mobile' : ''}`}>
              <div className="metric-card">
                <div className="metric-icon-box gold">
                  <i className="fa-solid fa-shirt"></i>
                </div>
                <div className="metric-info">
                  <label>Total Prendas</label>
                  <h2>{products.length}</h2>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box green">
                  <i className="fa-solid fa-sparkles"></i>
                </div>
                <div className="metric-info">
                  <label>Nuevos Ingresos</label>
                  <h2>{products.filter(p => p.Nuevo === true || p.Nuevo === 'Si' || p.Nuevo === 'true').length}</h2>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box pink">
                  <i className="fa-solid fa-fire"></i>
                </div>
                <div className="metric-info">
                  <label>Tendencia</label>
                  <h2>{products.filter(p => p.Tendencia === true || p.Tendencia === 'Si' || p.Tendencia === 'true').length}</h2>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box cyan">
                  <i className="fa-solid fa-tags"></i>
                </div>
                <div className="metric-info">
                  <label>Categorías</label>
                  <h2>{dynamicCategories.length}</h2>
                </div>
              </div>
            </div>

            {/* Control Bar: Search & Dynamic Category Filter */}
            <div className="controls-bar">
              <div className="search-box">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Buscar prenda por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <select 
                  className="select-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Todas las Categorías ({products.length})</option>
                  {dynamicCategories.map(cat => {
                    const count = products.filter(p => p.Categoria && p.Categoria.toLowerCase() === cat.toLowerCase()).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Products Data Table Section with Independent Container Scroll */}
            <div className="table-card">
              {loading ? (
                <div style={{ padding: '40px', textTransform: 'uppercase', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
                  <p style={{ marginTop: '12px' }}>Cargando catálogo...</p>
                </div>
              ) : error ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-red)' }}>
                  <i className="fa-solid fa-triangle-exclamation fa-2x"></i>
                  <p style={{ marginTop: '12px' }}>{error}</p>
                  <button type="button" className="btn-secondary" onClick={() => fetchProducts(true)} style={{ marginTop: '16px' }}>
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>N° Orden</th>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Color</th>
                        <th>Precio</th>
                        <th>Nuevo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                            No se encontraron prendas registradas.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p, index) => {
                          const isNew = p.Nuevo === true || p.Nuevo === 'Si' || p.Nuevo === 'true';
                          const orderDisplay = (p.numorden !== undefined && p.numorden !== null && p.numorden !== '')
                            ? p.numorden
                            : (p.numOrden !== undefined && p.numOrden !== null && p.numOrden !== '' ? p.numOrden : (index + 1));
                          return (
                            <tr key={p.id || index}>
                              <td>
                                <span className="numorden-badge">#{orderDisplay}</span>
                              </td>
                              <td>
                                <div className="product-thumb-container">
                                  <img 
                                    src={p.imgReel0 || 'https://via.placeholder.com/80'} 
                                    alt={p.Nombre} 
                                    className="table-thumb"
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'; }}
                                  />
                                </div>
                              </td>
                              <td>
                                <strong>{p.Nombre}</strong>
                              </td>
                              <td>{p.Categoria || 'Casual'}</td>
                              <td>{p.Color || '-'}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>
                                    S/. {p.Precio}
                                  </span>
                                  {p.precioDolares ? (
                                    <span style={{ color: '#00e676', fontSize: '0.8rem', fontWeight: '500' }}>
                                      $ {p.precioDolares} USD
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                      $ {(Number(p.Precio) / 3.7).toFixed(2)} USD
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`badge-status ${isNew ? 'yes' : 'no'}`}>
                                  {isNew ? 'Sí' : 'No'}
                                </span>
                              </td>
                              <td>
                                <div className="actions-cell">
                                  <button 
                                    type="button" 
                                    className="btn-icon edit" 
                                    title="Editar Producto"
                                    onClick={() => handleOpenEditModal(p, index)}
                                  >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn-icon delete" 
                                    title="Eliminar Producto"
                                    onClick={() => setDeletingProduct(p)}
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: ORDER CLOSING COUNTDOWN CONFIGURATION (2 CYCLES PER WEEK) */}
        {activeTab === 'cierre' && (
          <div className="table-card" style={{ padding: '28px', overflowY: 'auto' }}>
            <div className="cierre-config-container">
              <form onSubmit={handleSaveCierreConfig} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>Título del Cronómetro en la Web</label>
                  <input 
                    type="text" 
                    value={cierreConfig.titulo || ''}
                    onChange={(e) => setCierreConfig({ ...cierreConfig, titulo: e.target.value })}
                    placeholder="Ej: Cierre de Pedidos"
                  />
                </div>

                {/* CICLO 1: PRIMERA ENTREGA */}
                <div className="cycle-card">
                  <h3 className="cycle-card-title">
                    <i className="fa-solid fa-calendar-check"></i> Ciclo 1: Primera Entrega Semanal
                  </h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Día de Inicio 1</label>
                      <select
                        value={cierreConfig.diaInicio1 || 'Lunes'}
                        onChange={(e) => setCierreConfig({ ...cierreConfig, diaInicio1: e.target.value })}
                      >
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                        <option value="Sábado">Sábado</option>
                        <option value="Domingo">Domingo</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Hora de Inicio 1 (24h)</label>
                      <input 
                        type="time" 
                        value={cierreConfig.horaInicio1 || '08:00'}
                        onChange={(e) => setCierreConfig({ ...cierreConfig, horaInicio1: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Día de Cierre / Entrega 1</label>
                      <select
                        value={cierreConfig.diaFin1 || 'Miércoles'}
                        onChange={(e) => setCierreConfig({ ...cierreConfig, diaFin1: e.target.value })}
                      >
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                        <option value="Sábado">Sábado</option>
                        <option value="Domingo">Domingo</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Hora de Cierre 1 (24h)</label>
                      <input 
                        type="time" 
                        value={cierreConfig.horaFin1 || '23:59'}
                        onChange={(e) => setCierreConfig({ ...cierreConfig, horaFin1: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* CICLO 2: SEGUNDA ENTREGA */}
                <div className="cycle-card">
                  <h3 className="cycle-card-title" style={{ color: 'var(--accent-pink)' }}>
                    <i className="fa-solid fa-calendar-star"></i> Ciclo 2: Segunda Entrega Semanal
                  </h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Día de Inicio 2</label>
                      <select
                        value={cierreConfig.diaInicio2 || 'Jueves'}
                        onChange={(e) => setCierreConfig({ ...cierreConfig, diaInicio2: e.target.value })}
                      >
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                        <option value="Sábado">Sábado</option>
                        <option value="Domingo">Domingo</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Hora de Inicio 2 (24h)</label>
                      <input 
                        type="time" 
                        value={cierreConfig.horaInicio2 || '08:00'}
                        onChange={(e) => setCierreConfig({ ...cierreConfig, horaInicio2: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Día de Cierre / Entrega 2</label>
                      <select
                        value={cierreConfig.diaFin2 || 'Sábado'}
                        onChange={(e) => setCierreConfig({ ...cierreConfig, diaFin2: e.target.value })}
                      >
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                        <option value="Sábado">Sábado</option>
                        <option value="Domingo">Domingo</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Hora de Cierre 2 (24h)</label>
                      <input 
                        type="time" 
                        value={cierreConfig.horaFin2 || '23:59'}
                        onChange={(e) => setCierreConfig({ ...cierreConfig, horaFin2: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="cierre-activo-check"
                    checked={cierreConfig.activo !== false}
                    onChange={(e) => setCierreConfig({ ...cierreConfig, activo: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label htmlFor="cierre-activo-check" style={{ cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}>
                    Mostrar cronómetro de cierre de pedidos en la tienda web
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" disabled={cierreSaving}>
                    {cierreSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                    Guardar Configuración de Cierres (2 Entregas)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 3: PRICE-RANGE VOLUME DISCOUNT RULES MANAGER */}
        {activeTab === 'descuentos' && (
          <div className="table-card" style={{ padding: '28px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
              <form onSubmit={handleSaveDescuentos}>
                {descuentosRules.map((rango, rIdx) => (
                  <div className="discount-range-card" key={rango.id || rIdx}>
                    <div className="discount-range-header">
                      <div className="discount-range-title">
                        <i className="fa-solid fa-tags"></i>
                        <span>{rango.nombre || `Rango ${rIdx + 1}`}</span>
                      </div>
                      <button 
                        type="button" 
                        className="btn-icon delete" 
                        onClick={() => handleDeleteRange(rango.id)}
                        title="Eliminar este rango de precios"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>

                    <div className="form-grid" style={{ marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>Nombre Identificador del Rango</label>
                        <input 
                          type="text" 
                          value={rango.nombre || ''}
                          onChange={(e) => handleUpdateRangeField(rango.id, 'nombre', e.target.value)}
                          placeholder="Ej: Rango 37 - 40 S/."
                        />
                      </div>

                      <div className="form-group">
                        <label>Precio Base Mínimo (S/.)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={rango.rangoInicio ?? ''}
                          onChange={(e) => handleUpdateRangeField(rango.id, 'rangoInicio', e.target.value)}
                          placeholder="Ej: 37.00"
                        />
                      </div>

                      <div className="form-group">
                        <label>Precio Base Máximo (S/.)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={rango.rangoFin ?? ''}
                          onChange={(e) => handleUpdateRangeField(rango.id, 'rangoFin', e.target.value)}
                          placeholder="Ej: 40.00"
                        />
                      </div>
                    </div>

                    {/* Quantity Tiers inside Range */}
                    <div className="tiers-table-container">
                      <label style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                        📊 Escalones de Descuento por Cantidad de Prendas en este Rango:
                      </label>

                      {rango.escalones.length === 0 ? (
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', margin: '8px 0' }}>
                          No hay escalones agregados aún. Haz clic en "+ Agregar Escalón de Descuento" para definir ofertas por cantidad.
                        </p>
                      ) : (
                        rango.escalones.map((tier, tIdx) => {
                          const maxP = Number(rango.rangoFin) || 0;
                          const offerP = Number(tier.precioOferta) || 0;
                          const savingsPercent = (maxP > 0 && offerP > 0 && maxP > offerP) 
                            ? Math.round(((maxP - offerP) / maxP) * 100)
                            : 0;

                          return (
                            <div className="tier-row" key={tIdx}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>A partir de (Prendas):</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  placeholder="Ej: 3"
                                  value={tier.cantidadMinima ?? ''}
                                  onChange={(e) => handleUpdateTierField(rango.id, tIdx, 'cantidadMinima', e.target.value)}
                                  style={{ width: '100%' }}
                                />
                              </div>

                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Precio Oferta c/u (S/.):</label>
                                <input 
                                  type="number" 
                                  step="0.10"
                                  placeholder="Ej: 33.30"
                                  value={tier.precioOferta ?? ''}
                                  onChange={(e) => handleUpdateTierField(rango.id, tIdx, 'precioOferta', e.target.value)}
                                  style={{ width: '100%' }}
                                />
                              </div>

                              <div style={{ minWidth: '100px', textAlign: 'center', paddingTop: '16px' }}>
                                {savingsPercent > 0 && (
                                  <span className="badge-status yes" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)' }}>
                                    -{savingsPercent}% Dcto
                                  </span>
                                )}
                              </div>

                              <div style={{ paddingTop: '16px' }}>
                                <button 
                                  type="button" 
                                  className="btn-icon delete"
                                  onClick={() => handleDeleteTier(rango.id, tIdx)}
                                  title="Eliminar escalón"
                                >
                                  <i className="fa-solid fa-minus"></i>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      <button 
                        type="button" 
                        className="btn-add-tier" 
                        onClick={() => handleAddTier(rango.id)}
                      >
                        <i className="fa-solid fa-plus"></i> Agregar Escalón de Descuento
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" className="btn-secondary" onClick={handleAddRange}>
                    <i className="fa-solid fa-folder-plus"></i> Agregar Otro Rango de Precios
                  </button>

                  <button type="submit" className="btn-primary" disabled={descuentosSaving}>
                    {descuentosSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                    Guardar Reglas de Descuentos
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 4: NEWS & REELS PROMOTIONS MANAGER (PINTEREST & GOOGLE DRIVE) */}
        {activeTab === 'noticias' && (
          <div className="view-container news-manager-container">
            <div className="cierre-config-card news-config-card-sticky">
              {/* STICKY TOP HEADER */}
              <div className="news-manager-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fa-solid fa-newspaper" style={{ fontSize: '1.6rem', color: 'var(--accent-gold)' }}></i>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Anuncios y Noticias Promocionales</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Configura la lista de imágenes para los reels de anuncios en el modal de noticias de la web.
                    </p>
                  </div>
                </div>

                <div className="info-banner" style={{ background: 'rgba(66, 133, 244, 0.12)', border: '1px solid rgba(66, 133, 244, 0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: '12px' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#8ab4f8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-lightbulb" style={{ fontSize: '1.1rem', color: '#fbbc04' }}></i>
                    <span>
                      <strong>Soporte para Pinterest y Google Drive:</strong> Enlaces de <strong>Pinterest</strong> (<code>https://i.pinimg.com/...</code>) o <strong>Google Drive</strong> (<code>https://drive.google.com/file/d/.../view</code>) se convertirá a imagen directa.
                    </span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveNoticias} className="news-manager-form">
                {/* MIDDLE SCROLLABLE LIST OF CARDS */}
                <div className="news-cards-scroll-area">
                  {noticesList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-glass)' }}>
                      <i className="fa-solid fa-images" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '12px' }}></i>
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>No hay anuncios ni noticias registrados aún.</p>
                      <button type="button" className="btn-secondary" onClick={handleAddNoticeUrl} style={{ marginTop: '14px' }}>
                        <i className="fa-solid fa-plus"></i> Agregar Primera Noticia
                      </button>
                    </div>
                  ) : (
                    noticesList.map((url, idx) => {
                      const badge = getUrlTypeBadge(url);
                      return (
                        <div key={idx} className="news-input-card">
                          <img 
                            src={url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300'} 
                            alt={`Noticia ${idx + 1}`} 
                            className="news-thumb-preview"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300';
                            }}
                          />

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                                Noticia / Reel #{idx + 1}
                              </span>
                              {badge && (
                                <span className="url-type-badge" style={{ background: badge.color }}>
                                  {badge.label}
                                </span>
                              )}
                            </div>

                            <input 
                              type="url" 
                              value={url}
                              onChange={(e) => handleUpdateNoticeUrl(idx, e.target.value)}
                              placeholder="Pega el enlace de la imagen (Pinterest, Google Drive o Enlace Directo)"
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid var(--border-glass)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem'
                              }}
                            />
                          </div>

                          <button 
                            type="button" 
                            className="btn-icon delete"
                            onClick={() => handleDeleteNoticeUrl(idx)}
                            title="Eliminar noticia"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* STICKY BOTTOM ACTION BAR */}
                <div className="news-manager-sticky-footer">
                  <button type="button" className="btn-secondary" onClick={handleAddNoticeUrl}>
                    <i className="fa-solid fa-plus"></i> Agregar Otra Imagen de Noticia
                  </button>

                  <button type="submit" className="btn-primary" disabled={noticesSaving}>
                    {noticesSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                    Guardar Noticias
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal Add / Edit Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? '✏️ Editar Producto' : '✨ Agregar Nuevo Producto'}</h2>
              <button type="button" className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* numorden (Auto-increment, Visible, Non-editable Read-Only) */}
                  <div className="form-group">
                    <label>
                      Número de Orden <span style={{ color: 'var(--accent-gold)' }}>(Auto-incrementable)</span>
                    </label>
                    <input 
                      type="text" 
                      value={`#${formData.numorden}`} 
                      disabled 
                      readOnly 
                    />
                  </div>

                  {/* Nombre */}
                  <div className="form-group">
                    <label>Nombre de Prenda <span className="required">*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: Modelo NYC manhattan"
                      value={formData.Nombre}
                      onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                    />
                  </div>

                  {/* Categoria Dropdown with dynamic options */}
                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      value={formData.Categoria}
                      onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })}
                    >
                      {dynamicCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color Selector with Dedicated Pop-up Sub-Modal */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ margin: 0 }}>Color de Prenda <span className="required">*</span></label>
                      <button 
                        type="button"
                        onClick={() => { setNewColorInput(''); setIsColorModalOpen(true); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-gold)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fa-solid fa-palette"></i> + Crear Color
                      </button>
                    </div>

                    <select
                      value={formData.Color}
                      onChange={(e) => {
                        if (e.target.value === '__CREATE_NEW__') {
                          setNewColorInput('');
                          setIsColorModalOpen(true);
                        } else {
                          setFormData({ ...formData, Color: e.target.value });
                        }
                      }}
                      required
                    >
                      <option value="">-- Selecciona un Color --</option>
                      {dynamicColors.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__CREATE_NEW__" style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                        🎨 + Crear Color...
                      </option>
                    </select>
                  </div>

                  {/* Precio Soles */}
                  <div className="form-group">
                    <label>Precio (S/.) <span className="required">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="40.00"
                      value={formData.Precio}
                      onChange={(e) => setFormData({ ...formData, Precio: e.target.value })}
                    />
                  </div>

                  {/* Precio USD Dolares */}
                  <div className="form-group">
                    <label>Precio ($ USD)</label>
                    <input 
                      type="text" 
                      placeholder="11.00"
                      value={formData.precioDolares}
                      onChange={(e) => setFormData({ ...formData, precioDolares: e.target.value })}
                    />
                  </div>

                  {/* Nuevo */}
                  <div className="form-group">
                    <label>Nuevo Ingreso</label>
                    <select
                      value={formData.Nuevo}
                      onChange={(e) => setFormData({ ...formData, Nuevo: e.target.value })}
                    >
                      <option value="Si">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Video URL Pasarela */}
                <h3 className="images-section-title" style={{ marginTop: '20px' }}>🎬 Video de Pasarela (YouTube / Reel / MP4)</h3>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>URL del Video de la Pasarela (Google Drive / Pinterest / YouTube / MP4)</label>
                  <input 
                    type="url" 
                    placeholder="Ej: https://drive.google.com/file/d/.../view o YouTube / Pinterest / MP4"
                    value={formData.urlVideoPasarela}
                    onChange={(e) => setFormData({ ...formData, urlVideoPasarela: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px', display: 'block', lineHeight: 1.4 }}>
                    💡 <strong>Para Google Drive:</strong> Asegúrate de que los permisos del archivo estén configurados como <u>"Cualquier persona con el enlace"</u> (Público) en Google Drive para que se pueda incrustar sin pedir inicio de sesión.
                  </small>
                </div>

                {/* Images Reel URLs 0 to 7 with Real-Time Preview */}
                <h3 className="images-section-title">🖼️ Imágenes del Reel (imgReel0 a imgReel7)</h3>
                <div className="image-inputs-grid">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                    const keyName = `imgReel${idx}`;
                    const imgUrl = formData[keyName];
                    return (
                      <div className="image-input-card" key={keyName}>
                        <img 
                          src={imgUrl || 'https://via.placeholder.com/80'} 
                          alt={`Preview ${keyName}`} 
                          className="image-input-preview"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'; }}
                        />
                        <div className="form-group">
                          <label>{keyName}</label>
                          <input 
                            type="text" 
                            placeholder={`https://i.pinimg.com/... (${keyName})`}
                            value={imgUrl}
                            onChange={(e) => setFormData({ ...formData, [keyName]: e.target.value })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i> {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Dedicated Pop-up to Add a New Color */}
      {isColorModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 12000 }} onClick={() => setIsColorModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '420px', animation: 'fadeIn 0.25s ease' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎨 Crear Color
              </h2>
              <button type="button" className="btn-close-modal" onClick={() => setIsColorModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewColorModal}>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 0, marginBottom: '16px' }}>
                  Ingresa el nombre del nuevo color para agregarlo al catálogo. Estará disponible de inmediato para esta y futuras prendas.
                </p>

                <div className="form-group">
                  <label>Nombre del Color <span className="required">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Verde Esmeralda, Palo Rosa, Lila"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsColorModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i> Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-overlay" onClick={() => setDeletingProduct(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <h3>¿Eliminar Producto?</h3>
            <p>¿Estás seguro de eliminar <strong>"{deletingProduct.Nombre}"</strong>? Esta acción borrará la prenda del catálogo.</p>
            <div className="confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeletingProduct(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={handleConfirmDelete}>
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
