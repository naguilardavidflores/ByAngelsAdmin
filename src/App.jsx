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

  // Welcome Screen Video/Image Config State
  const [inicioUrl, setInicioUrl] = useState('');
  const [inicioLoading, setInicioLoading] = useState(false);
  const [inicioSaving, setInicioSaving] = useState(false);
  const [extractedInicioVideo, setExtractedInicioVideo] = useState('');

  // Music Manager State (Background playlist tracks)
  const [musicsList, setMusicsList] = useState([]);
  const [musicsLoading, setMusicsLoading] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [editingMusic, setEditingMusic] = useState(null);
  const [musicFormData, setMusicFormData] = useState({ title: '', artist: 'ByAngels Boutique', url: '' });
  const [deletingMusic, setDeletingMusic] = useState(null);

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

  // Fetch Welcome Screen Video URL configuration
  const fetchInicioConfig = async () => {
    setInicioLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/inicio`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const doc = data[0];
          const url = doc.UrlInicio || doc.url || doc.imagen || doc.imageUrl || doc.img || doc.urlN0 || '';
          setInicioUrl(url);
        }
      }
    } catch (err) {
      console.warn('Could not fetch inicio config:', err);
    } finally {
      setInicioLoading(false);
    }
  };

  const handleSaveInicio = async (e) => {
    if (e) e.preventDefault();
    setInicioSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/inicio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UrlInicio: inicioUrl })
      });
      if (!res.ok) throw new Error('Error al guardar video de inicio');
      showToast('¡Video/Imagen de pantalla de bienvenida guardado con éxito!');
      fetchInicioConfig();
    } catch (err) {
      console.error('Inicio save error:', err);
      showToast('Error al guardar URL del video de bienvenida', 'error');
    } finally {
      setInicioSaving(false);
    }
  };

  // Auto-extract Pinterest MP4/HLS stream for admin preview box
  useEffect(() => {
    if (!inicioUrl) {
      setExtractedInicioVideo('');
      return;
    }

    if (inicioUrl.includes('pinterest.com/pin/') || inicioUrl.includes('pin.it/')) {
      const extract = async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/pinterest-video?url=${encodeURIComponent(inicioUrl)}`, {
            headers: {
              'Bypass-Tunnel-Reminder': 'true',
              'ngrok-skip-browser-warning': 'true'
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.videoUrl) {
              setExtractedInicioVideo(data.videoUrl);
            }
          }
        } catch (e) {
          console.warn('Could not extract Pinterest video in admin:', e);
        }
      };
      extract();
    } else {
      setExtractedInicioVideo('');
    }
  }, [inicioUrl, apiBaseUrl]);

  // Fetch Background Music playlist config
  const fetchMusicsConfig = async (forceRefresh = false) => {
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem('byangels_admin_musics');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMusicsList(parsed);
            return;
          }
        }
      } catch (e) {}
    }

    setMusicsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/Musics`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = Array.isArray(data) ? data.map(song => ({
          id: song.id,
          title: song.title || song.NombreMusic || 'Canción sin título',
          artist: song.artist || 'ByAngels Boutique',
          url: song.url || song.urlMusic || ''
        })) : [];
        setMusicsList(mapped);
        try {
          localStorage.setItem('byangels_admin_musics', JSON.stringify(mapped));
        } catch (e) {}
        if (forceRefresh) {
          showToast('Lista de canciones actualizada');
        }
      }
    } catch (err) {
      console.warn('Could not fetch musics config:', err);
    } finally {
      setMusicsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(false);
    fetchCierreConfig();
    fetchDescuentosConfig();
    fetchNoticeConfig();
    fetchMusicsConfig();
    fetchInicioConfig();
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

  // Custom Created & Deleted Colors State (Persisted in localStorage)
  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem('byangels_custom_colors');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [deletedColors, setDeletedColors] = useState(() => {
    try {
      const saved = localStorage.getItem('byangels_deleted_colors');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [newColorInput, setNewColorInput] = useState('');
  const [editingColorName, setEditingColorName] = useState(null);
  const [editColorInputValue, setEditColorInputValue] = useState('');

  // Compute dynamic list of colors deduplicated from existing products + customColors + default popular colors - deletedColors
  const defaultColorsList = ['Negro', 'Blanco', 'Beige', 'Rosado', 'Rojo', 'Azul', 'Verde', 'Gris', 'Marfil', 'Lila', 'Marrón', 'Amarillo', 'Nude'];
  const dynamicColors = Array.from(
    new Set(
      [
        ...defaultColorsList,
        ...customColors,
        ...products.map(p => p.Color ? p.Color.trim() : '')
      ]
        .filter(Boolean)
        .filter(c => !deletedColors.includes(c))
    )
  ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  // Helper to save a newly created color via dedicated Sub-Modal
  const handleSaveNewColorModal = (e) => {
    if (e) e.preventDefault();
    if (!newColorInput || typeof newColorInput !== 'string') return;
    const trimmed = newColorInput.trim();
    if (!trimmed) return;

    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    // Remove from deletedColors if previously deleted
    const updatedDeleted = deletedColors.filter(c => c !== formatted);
    setDeletedColors(updatedDeleted);
    try {
      localStorage.setItem('byangels_deleted_colors', JSON.stringify(updatedDeleted));
    } catch (err) {}

    if (!customColors.includes(formatted)) {
      const updated = [...customColors, formatted];
      setCustomColors(updated);
      try {
        localStorage.setItem('byangels_custom_colors', JSON.stringify(updated));
      } catch (err) {}
    }

    setFormData(prev => ({ ...prev, Color: formatted }));
    setNewColorInput('');
    showToast(`Color "${formatted}" creado y seleccionado.`);
  };

  // Helper to start editing a color
  const handleStartEditColor = (colorName) => {
    setEditingColorName(colorName);
    setEditColorInputValue(colorName);
  };

  // Helper to save edited color
  const handleSaveEditColor = (oldName) => {
    if (!editColorInputValue || !editColorInputValue.trim()) return;
    const newName = editColorInputValue.trim().charAt(0).toUpperCase() + editColorInputValue.trim().slice(1);
    if (newName === oldName) {
      setEditingColorName(null);
      return;
    }

    // Update customColors
    const updatedCustom = customColors.map(c => c === oldName ? newName : c);
    if (!updatedCustom.includes(newName)) updatedCustom.push(newName);
    setCustomColors(updatedCustom);
    try {
      localStorage.setItem('byangels_custom_colors', JSON.stringify(updatedCustom));
    } catch (err) {}

    // Add oldName to deletedColors so it no longer appears
    if (!deletedColors.includes(oldName)) {
      const updatedDeleted = [...deletedColors, oldName];
      setDeletedColors(updatedDeleted);
      try {
        localStorage.setItem('byangels_deleted_colors', JSON.stringify(updatedDeleted));
      } catch (err) {}
    }

    // If currently selected form color is oldName, update it
    if (formData.Color === oldName) {
      setFormData(prev => ({ ...prev, Color: newName }));
    }

    setEditingColorName(null);
    showToast(`Color renombrado a "${newName}".`);
  };

  // Helper to delete a color
  const handleDeleteColor = (colorName) => {
    const updatedCustom = customColors.filter(c => c !== colorName);
    setCustomColors(updatedCustom);
    try {
      localStorage.setItem('byangels_custom_colors', JSON.stringify(updatedCustom));
    } catch (err) {}

    if (!deletedColors.includes(colorName)) {
      const updatedDeleted = [...deletedColors, colorName];
      setDeletedColors(updatedDeleted);
      try {
        localStorage.setItem('byangels_deleted_colors', JSON.stringify(updatedDeleted));
      } catch (err) {}
    }

    if (formData.Color === colorName) {
      setFormData(prev => ({ ...prev, Color: dynamicColors.find(c => c !== colorName) || '' }));
    }

    showToast(`Color "${colorName}" eliminado.`);
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

  // MUSIC PLAYLIST MANAGEMENT HANDLERS
  const handleOpenAddMusicModal = () => {
    setEditingMusic(null);
    setMusicFormData({
      title: '',
      artist: 'ByAngels Boutique',
      url: ''
    });
    setIsMusicModalOpen(true);
  };

  const handleOpenEditMusicModal = (song) => {
    setEditingMusic(song);
    setMusicFormData({
      title: song.title || song.NombreMusic || '',
      artist: song.artist || 'ByAngels Boutique',
      url: song.url || song.urlMusic || ''
    });
    setIsMusicModalOpen(true);
  };

  const handleSubmitMusicForm = async (e) => {
    e.preventDefault();
    if (!musicFormData.title.trim()) {
      showToast('Por favor ingresa el nombre de la canción', 'error');
      return;
    }
    if (!musicFormData.url.trim()) {
      showToast('Por favor ingresa el enlace (URL MP3) de la canción', 'error');
      return;
    }

    try {
      if (editingMusic) {
        const res = await fetch(`${apiBaseUrl}/api/Musics/${editingMusic.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(musicFormData)
        });
        if (!res.ok) throw new Error('Error al actualizar canción');
        showToast('¡Canción actualizada con éxito!');
      } else {
        const res = await fetch(`${apiBaseUrl}/api/Musics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(musicFormData)
        });
        if (!res.ok) throw new Error('Error al crear canción');
        showToast('¡Nueva canción agregada a la playlist!');
      }

      setIsMusicModalOpen(false);
      fetchMusicsConfig(true);
    } catch (err) {
      console.error('Music save error:', err);
      // Fallback local state save
      const newTrack = {
        id: editingMusic ? editingMusic.id : 'song_' + Date.now(),
        ...musicFormData
      };
      let updatedList = [...musicsList];
      if (editingMusic) {
        updatedList = updatedList.map(s => s.id === editingMusic.id ? newTrack : s);
      } else {
        updatedList.push(newTrack);
      }
      setMusicsList(updatedList);
      try {
        localStorage.setItem('byangels_admin_musics', JSON.stringify(updatedList));
      } catch (e) {}
      setIsMusicModalOpen(false);
      showToast(editingMusic ? 'Canción actualizada (local)' : 'Canción agregada (local)');
    }
  };

  const handleConfirmDeleteMusic = async () => {
    if (!deletingMusic) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/Musics/${deletingMusic.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar canción');
      showToast('Canción eliminada correctamente');
      setDeletingMusic(null);
      fetchMusicsConfig(true);
    } catch (err) {
      console.error('Delete music error:', err);
      const updatedList = musicsList.filter(s => s.id !== deletingMusic.id);
      setMusicsList(updatedList);
      try {
        localStorage.setItem('byangels_admin_musics', JSON.stringify(updatedList));
      } catch (e) {}
      setDeletingMusic(null);
      showToast('Canción eliminada (local)');
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

            <button 
              type="button" 
              className={`sidebar-link ${activeTab === 'inicio' ? 'active' : ''}`}
              onClick={() => { setActiveTab('inicio'); setIsMobileMenuOpen(false); }}
            >
              <i className="fa-solid fa-circle-play"></i>
              <span>Video de Bienvenida</span>
            </button>

            <button 
              type="button" 
              className={`sidebar-link ${activeTab === 'musica' ? 'active' : ''}`}
              onClick={() => { setActiveTab('musica'); setIsMobileMenuOpen(false); }}
            >
              <i className="fa-solid fa-music"></i>
              <span>Música de Fondo</span>
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
              {activeTab === 'inicio' && 'Video de Pantalla de Bienvenida (Inicio)'}
              {activeTab === 'musica' && 'Gestor de Música de Fondo'}
            </h2>
            <p>
              {activeTab === 'catalog' && 'Gestiona la lista de prendas, imágenes, precios y estado'}
              {activeTab === 'cierre' && 'Configura las 2 fechas/entregas semanales de pedidos para la tienda web'}
              {activeTab === 'descuentos' && 'Configura rangos de precio base y descuentos por cantidad comprada'}
              {activeTab === 'noticias' && 'Agrega enlaces de imágenes desde Pinterest o Google Drive para los anuncios que se mostrarán en la web'}
              {activeTab === 'inicio' && 'Configura la URL del video o imagen que aparece al abrir la tienda web en la pantalla de entrada'}
              {activeTab === 'musica' && 'Agrega, edita o elimina la lista de canciones de fondo que escuchan los clientes en la tienda web'}
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
            {activeTab === 'inicio' && (
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => fetchInicioConfig()}
                title="Actualizar datos de inicio"
              >
                <i className="fa-solid fa-rotate"></i> Actualizar
              </button>
            )}
            {activeTab === 'musica' && (
              <>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => fetchMusicsConfig(true)}
                  title="Actualizar lista de canciones"
                >
                  <i className="fa-solid fa-rotate"></i> Actualizar
                </button>
                <button type="button" className="btn-primary" onClick={handleOpenAddMusicModal}>
                  <i className="fa-solid fa-plus"></i> Agregar Canción
                </button>
              </>
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

        {/* VIEW 5: BACKGROUND MUSIC PLAYLIST MANAGER */}
        {activeTab === 'musica' && (
          <div className="view-container news-manager-container">
            <div className="cierre-config-card news-config-card-sticky">
              <div className="news-manager-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fa-solid fa-music" style={{ fontSize: '1.6rem', color: 'var(--accent-gold)' }}></i>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Lista de Canciones de Fondo</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Administra las canciones que escuchan los clientes mientras navegan en la boutique web.
                    </p>
                  </div>
                </div>

                <div className="info-banner" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: '12px' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-circle-info" style={{ fontSize: '1.1rem' }}></i>
                    <span>
                      Soporta enlaces de audio directos (MP3, SoundHelix) y enlaces de <strong>GitHub Raw</strong>.
                    </span>
                  </p>
                </div>
              </div>

              <div className="news-cards-scroll-area" style={{ marginTop: '16px' }}>
                {musicsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-gold)' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '12px' }}></i>
                    <p>Cargando lista de canciones...</p>
                  </div>
                ) : musicsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-glass)' }}>
                    <i className="fa-solid fa-music" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '12px' }}></i>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>No hay canciones registradas en la playlist.</p>
                    <button type="button" className="btn-secondary" onClick={handleOpenAddMusicModal} style={{ marginTop: '14px' }}>
                      <i className="fa-solid fa-plus"></i> Agregar Primera Canción
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {musicsList.map((song, idx) => (
                      <div key={song.id || idx} className="admin-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '1.1rem' }}>
                              🎵
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--text-main)' }}>{song.title || song.NombreMusic}</h4>
                              <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{song.artist || 'ByAngels Boutique'}</small>
                            </div>
                          </div>
                          <span className="url-type-badge" style={{ background: 'var(--accent-purple)', color: '#fff', fontSize: '0.7rem', padding: '3px 8px' }}>
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Audio Preview Player */}
                        {song.url && (
                          <audio 
                            controls 
                            src={song.url} 
                            style={{ width: '100%', height: '36px', marginTop: '4px' }}
                          />
                        )}

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                          <i className="fa-solid fa-link" style={{ marginRight: '6px' }}></i> {song.url}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                            onClick={() => handleOpenEditMusicModal(song)}
                          >
                            <i className="fa-solid fa-pen"></i> Editar
                          </button>
                          <button 
                            type="button" 
                            className="btn-icon delete" 
                            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                            onClick={() => setDeletingMusic(song)}
                            title="Eliminar canción"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="news-manager-sticky-footer">
                <button type="button" className="btn-primary" onClick={handleOpenAddMusicModal}>
                  <i className="fa-solid fa-plus"></i> Agregar Nueva Canción
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Screen Video (Inicio) Manager View */}
        {activeTab === 'inicio' && (
          <div className="tab-content-container">
            <div className="admin-card news-manager-container">
              <div className="news-manager-header">
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <i className="fa-solid fa-circle-play" style={{ color: 'var(--accent-gold)' }}></i>
                    Video de Bienvenida (Pantalla de Inicio Web)
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Configura la URL del video o imagen de fondo que se reproduce al abrir la boutique web (Welcome Screen).
                  </p>
                </div>

                <div className="news-info-pill">
                  <i className="fa-solid fa-lightbulb" style={{ color: 'var(--accent-gold)' }}></i>
                  <span>
                    Admite enlaces directos a <strong>MP4</strong>, enlaces de <strong>Pinterest Video</strong>, <strong>Google Drive</strong>, transmisiones <strong>HLS (.m3u8)</strong> o imágenes de alta resolución.
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveInicio} style={{ marginTop: '20px' }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
                    URL del Video / Multimedia de Inicio <span className="required">*</span>
                  </label>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="url" 
                      required
                      placeholder="Ej: https://v1.pinimg.com/videos/mc/720p/...mp4 o Google Drive link"
                      value={inicioUrl}
                      onChange={(e) => setInicioUrl(e.target.value)}
                      style={{ flex: 1, padding: '12px 14px', fontSize: '0.92rem' }}
                    />
                    {inicioUrl && (
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => setInicioUrl('')}
                        title="Limpiar campo"
                        style={{ padding: '0 16px' }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  {/* URL Type Badge */}
                  {inicioUrl && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="url-type-badge" style={{ 
                        background: getUrlTypeBadge(inicioUrl)?.color || 'var(--accent-gold)', 
                        color: '#000', 
                        fontWeight: 'bold',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem'
                      }}>
                        {getUrlTypeBadge(inicioUrl)?.label || 'Multimedia URL'}
                      </span>

                      <small style={{ color: 'var(--text-muted)' }}>
                        {/\.(mp4|webm|mov|m3u8)($|\?)/i.test(inicioUrl) || inicioUrl.includes('/video/') || inicioUrl.includes('v.pinimg.com') || inicioUrl.includes('pinterest.com/pin/')
                          ? '🎬 Video de Pinterest / MP4 detectado'
                          : '🖼️ Formato Imagen detectado'}
                      </small>
                    </div>
                  )}
                </div>

                {/* Live Preview Box */}
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px dashed var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <i className="fa-solid fa-eye" style={{ marginRight: '6px' }}></i> Vista Previa en Vivo (Solo Video, Sin Links)
                  </h4>

                  {inicioLoading ? (
                    <div style={{ padding: '40px', color: 'var(--accent-gold)' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '8px' }}></i>
                      <p>Cargando multimedia...</p>
                    </div>
                  ) : !inicioUrl ? (
                    <div style={{ padding: '30px', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-video-slash" style={{ fontSize: '2.5rem', marginBottom: '10px' }}></i>
                      <p style={{ margin: 0 }}>Ingresa una URL arriba para previsualizar el video de bienvenida.</p>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '400px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--accent-gold)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', position: 'relative' }}>
                      {extractedInicioVideo || /\.(mp4|webm|mov|m3u8)($|\?)/i.test(inicioUrl) || inicioUrl.includes('/video/') || inicioUrl.includes('v.pinimg.com') || inicioUrl.includes('pinterest.com/pin/') ? (
                        <video 
                          controls 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                          src={extractedInicioVideo || inicioUrl} 
                          style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block', pointerEvents: 'auto' }}
                          onError={(e) => {
                            console.warn("Preview video error:", e);
                          }}
                        />
                      ) : (
                        <img 
                          src={inicioUrl} 
                          alt="Vista previa inicio" 
                          style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="news-manager-sticky-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={inicioSaving}
                    style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                  >
                    {inicioSaving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i> Guardar Cambios
                      </>
                    )}
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

      {/* Sub-Modal: Dedicated Pop-up to Add, Edit, and Delete Colors */}
      {isColorModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 12000 }} onClick={() => setIsColorModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.25s ease' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎨 Gestionar y Crear Colores
              </h2>
              <button type="button" className="btn-close-modal" onClick={() => setIsColorModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
              {/* Create New Color Section */}
              <form onSubmit={handleSaveNewColorModal} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '8px', display: 'block' }}>
                  ➕ Agregar un Nuevo Color:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Ej: Verde Esmeralda, Palo Rosa, Lila"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '0 16px', height: '42px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    <i className="fa-solid fa-plus"></i> Crear
                  </button>
                </div>
              </form>

              {/* Existing Colors List with Edit & Delete Actions */}
              <div>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'block' }}>
                  🎨 Colores Registrados ({dynamicColors.length}):
                </label>

                {dynamicColors.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No hay colores registrados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
                    {dynamicColors.map((col) => {
                      const isEditingThis = editingColorName === col;
                      const isSelectedInForm = formData.Color === col;

                      return (
                        <div 
                          key={col} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: isSelectedInForm ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelectedInForm ? '1px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          {!isEditingThis ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.92rem', color: isSelectedInForm ? 'var(--accent-gold)' : 'var(--text-main)' }}>
                                  {col}
                                </span>
                                {isSelectedInForm && (
                                  <span className="url-type-badge" style={{ background: 'var(--accent-gold)', color: '#000', fontSize: '0.7rem', padding: '2px 6px' }}>
                                    Seleccionado
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button 
                                  type="button" 
                                  className="btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, Color: col }));
                                    showToast(`Color "${col}" seleccionado.`);
                                  }}
                                  title="Seleccionar este color"
                                >
                                  Seleccionar
                                </button>
                                <button 
                                  type="button" 
                                  className="btn-icon" 
                                  style={{ padding: '6px 10px', fontSize: '0.82rem', color: 'var(--accent-gold)' }}
                                  onClick={() => handleStartEditColor(col)}
                                  title="Editar nombre del color"
                                >
                                  <i className="fa-solid fa-pen"></i>
                                </button>
                                <button 
                                  type="button" 
                                  className="btn-icon delete" 
                                  style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                                  onClick={() => handleDeleteColor(col)}
                                  title="Eliminar color"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            </>
                          ) : (
                            /* Inline Color Editing Row */
                            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                              <input 
                                type="text" 
                                value={editColorInputValue}
                                onChange={(e) => setEditColorInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditColor(col);
                                  }
                                }}
                                autoFocus
                                style={{ flex: 1, padding: '6px 10px', fontSize: '0.88rem' }}
                              />
                              <button 
                                type="button" 
                                className="btn-primary"
                                style={{ padding: '0 12px', fontSize: '0.8rem' }}
                                onClick={() => handleSaveEditColor(col)}
                              >
                                <i className="fa-solid fa-check"></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn-secondary"
                                style={{ padding: '0 10px', fontSize: '0.8rem' }}
                                onClick={() => setEditingColorName(null)}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsColorModalOpen(false)}>
                Cerrar
              </button>
            </div>
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

      {/* Modal Add / Edit Music Track */}
      {isMusicModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMusicModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMusic ? '✏️ Editar Canción' : '🎵 Agregar Canción a la Lista'}</h2>
              <button type="button" className="btn-close-modal" onClick={() => setIsMusicModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMusicForm}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Nombre / Título de la Canción <span className="required">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej: Mientestanbonito Sin Voz, Lofi Chill"
                    value={musicFormData.title}
                    onChange={(e) => setMusicFormData({ ...musicFormData, title: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Artista / Álbum</label>
                  <input 
                    type="text" 
                    placeholder="Ej: ByAngels Boutique"
                    value={musicFormData.artist}
                    onChange={(e) => setMusicFormData({ ...musicFormData, artist: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Enlace MP3 / URL del Audio <span className="required">*</span></label>
                  <input 
                    type="url" 
                    required
                    placeholder="Ej: https://raw.githubusercontent.com/.../musica.mp3"
                    value={musicFormData.url}
                    onChange={(e) => setMusicFormData({ ...musicFormData, url: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                    💡 Puedes usar enlaces de audio directo MP3, SoundHelix o GitHub Raw.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsMusicModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i> {editingMusic ? 'Guardar Cambios' : 'Agregar Canción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Music Confirmation Modal */}
      {deletingMusic && (
        <div className="modal-overlay" onClick={() => setDeletingMusic(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <h3>¿Eliminar Canción?</h3>
            <p>¿Estás seguro de eliminar la canción <strong>"{deletingMusic.title || deletingMusic.NombreMusic}"</strong> de la lista de reproducciones?</p>
            <div className="confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeletingMusic(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={handleConfirmDeleteMusic}>
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
