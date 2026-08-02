import React, { useState, useEffect } from 'react';
import appConfig from './config/appConfig.json';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation Menu Tabs: 'catalog' | 'cierre'
  const [activeTab, setActiveTab] = useState('catalog');

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
    Precio: '40.00',
    Nuevo: 'Si',
    Tendencia: 'Si',
    numorden: '',
    imgReel0: '',
    imgReel1: '',
    imgReel2: '',
    imgReel3: '',
    imgReel4: '',
    imgReel5: '',
    imgReel6: ''
  });

  // Delete Confirmation Modal State
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Order Closing Countdown Config State (Cierre de Pedidos)
  const [cierreConfig, setCierreConfig] = useState({
    diaInicio: 'Lunes',
    horaInicio: '08:00',
    diaFin: 'Viernes',
    horaFin: '23:59',
    titulo: 'Cierre de Pedidos Semanal',
    activo: true
  });
  const [cierreSaving, setCierreSaving] = useState(false);

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
        setCierreConfig(data);
      }
    } catch (err) {
      console.warn('Could not fetch cierre config:', err);
    }
  };

  useEffect(() => {
    fetchProducts(false);
    fetchCierreConfig();
  }, []);

  // Compute dynamic list of categories from existing products + defaults
  const dynamicCategories = Array.from(new Set([
    'Athleisure',
    'Casual',
    'Streetwear',
    'Urbano',
    ...products.map(p => p.Categoria).filter(Boolean)
  ]));

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

  // Open modal to create a new product
  const handleOpenAddModal = () => {
    const nextOrder = calculateNextNumOrden();
    setEditingProduct(null);
    setFormData({
      Nombre: '',
      Categoria: dynamicCategories[0] || 'Athleisure',
      Color: 'Negro',
      Precio: '40.00',
      Nuevo: 'Si',
      Tendencia: 'Si',
      numorden: String(nextOrder),
      imgReel0: 'https://i.pinimg.com/736x/c7/6f/45/c76f457d508db1209af9b3acd94ec4cf.jpg',
      imgReel1: 'https://i.pinimg.com/736x/06/7e/22/067e22fe3a6f98d10fcd00ec1bbf781a.jpg',
      imgReel2: 'https://i.pinimg.com/736x/5b/97/97/5b97970d05090ee0ac89fbb558cd95b3.jpg',
      imgReel3: 'https://i.pinimg.com/736x/d8/cb/99/d8cb9960ae0a3243ba1e4a5f3b73fc54.jpg',
      imgReel4: 'https://i.pinimg.com/736x/2e/53/72/2e5372c2f4e0a7900e7a7529644cf407.jpg',
      imgReel5: 'https://i.pinimg.com/736x/5b/97/97/5b97970d05090ee0ac89fbb558cd95b3.jpg',
      imgReel6: 'https://i.pinimg.com/736x/a4/f8/27/a4f8273affdf1638ad583e0b340764cf.jpg'
    });
    setIsModalOpen(true);
  };

  // Open modal to edit an existing product
  const handleOpenEditModal = (product, index) => {
    setEditingProduct(product);
    const orderValue = product.numorden !== undefined && product.numorden !== null && product.numorden !== '' 
      ? product.numorden 
      : (product.numOrden !== undefined ? product.numOrden : (index + 1));

    setFormData({
      Nombre: product.Nombre || '',
      Categoria: product.Categoria || 'Casual',
      Color: product.Color || '',
      Precio: String(product.Precio || '0.00'),
      Nuevo: product.Nuevo === true || product.Nuevo === 'Si' || product.Nuevo === 'true' ? 'Si' : 'No',
      Tendencia: product.Tendencia === true || product.Tendencia === 'Si' || product.Tendencia === 'true' ? 'Si' : 'No',
      numorden: String(orderValue),
      imgReel0: product.imgReel0 || '',
      imgReel1: product.imgReel1 || '',
      imgReel2: product.imgReel2 || '',
      imgReel3: product.imgReel3 || '',
      imgReel4: product.imgReel4 || '',
      imgReel5: product.imgReel5 || '',
      imgReel6: product.imgReel6 || ''
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

  // Save Order Closing Schedule Configuration
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
      setCierreConfig(updated);
      showToast('¡Horario de cierre de pedidos actualizado!');
    } catch (err) {
      console.error('Cierre save error:', err);
      showToast('Error al guardar configuración de cierre', 'error');
    } finally {
      setCierreSaving(false);
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
    <div className="admin-app">
      {/* Top Navbar Header with Navigation Tabs Menu */}
      <header className="admin-header">
        <div className="brand-wrapper">
          <img 
            src="https://i.pinimg.com/736x/89/3e/a5/893ea5e4b77f98d75225c5d012431718.jpg" 
            alt="ByAngels Logo" 
            className="brand-logo"
          />
          <div className="brand-title-group">
            <h1>ByAngels Admin</h1>
            <p>Panel de Gestión Integral</p>
          </div>
        </div>

        {/* Navigation Menu Tabs */}
        <div className="nav-tabs-wrapper">
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <i className="fa-solid fa-shirt"></i> Catálogo
          </button>
          <button 
            type="button"
            className={`nav-tab-btn ${activeTab === 'cierre' ? 'active' : ''}`}
            onClick={() => setActiveTab('cierre')}
          >
            <i className="fa-solid fa-stopwatch"></i> Cierre de Pedidos
          </button>
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
        </div>
      </header>

      {/* VIEW 1: CATALOGUE MANAGEMENT */}
      {activeTab === 'catalog' && (
        <>
          {/* Dashboard Metrics Grid */}
          <div className="metrics-grid">
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
              {/* Dynamic Categories Dropdown */}
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
                              <span style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>
                                S/. {p.Precio}
                              </span>
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

      {/* VIEW 2: ORDER CLOSING COUNTDOWN CONFIGURATION */}
      {activeTab === 'cierre' && (
        <div className="table-card" style={{ padding: '32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--accent-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-stopwatch"></i> Configuración de Cierre de Pedidos & Cronómetro
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
              Define el ciclo semanal de recepción de pedidos. La tienda web mostrará automáticamente un reloj con la cuenta regresiva en vivo según estos días y horas.
            </p>

            <form onSubmit={handleSaveCierreConfig} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="form-group">
                <label>Título del Cronómetro en la Web</label>
                <input 
                  type="text" 
                  value={cierreConfig.titulo || ''}
                  onChange={(e) => setCierreConfig({ ...cierreConfig, titulo: e.target.value })}
                  placeholder="Ej: Cierre de Pedidos Semanal"
                />
              </div>

              <div className="form-grid">
                {/* Dia de Inicio */}
                <div className="form-group">
                  <label>Día de Inicio de Recepción</label>
                  <select
                    value={cierreConfig.diaInicio || 'Lunes'}
                    onChange={(e) => setCierreConfig({ ...cierreConfig, diaInicio: e.target.value })}
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

                {/* Hora de Inicio */}
                <div className="form-group">
                  <label>Hora de Inicio (24h)</label>
                  <input 
                    type="time" 
                    value={cierreConfig.horaInicio || '08:00'}
                    onChange={(e) => setCierreConfig({ ...cierreConfig, horaInicio: e.target.value })}
                  />
                </div>

                {/* Dia de Cierre/Entrega */}
                <div className="form-group">
                  <label>Día de Cierre de Pedidos / Entrega</label>
                  <select
                    value={cierreConfig.diaFin || 'Viernes'}
                    onChange={(e) => setCierreConfig({ ...cierreConfig, diaFin: e.target.value })}
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

                {/* Hora de Cierre */}
                <div className="form-group">
                  <label>Hora de Cierre (24h)</label>
                  <input 
                    type="time" 
                    value={cierreConfig.horaFin || '23:59'}
                    onChange={(e) => setCierreConfig({ ...cierreConfig, horaFin: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
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

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={cierreSaving}>
                  {cierreSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                  Guardar Configuración de Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

                  {/* Color */}
                  <div className="form-group">
                    <label>Color</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Negro, Crema, Plomo"
                      value={formData.Color}
                      onChange={(e) => setFormData({ ...formData, Color: e.target.value })}
                    />
                  </div>

                  {/* Precio */}
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

                {/* Images Reel URLs 0 to 6 with Real-Time Preview */}
                <h3 className="images-section-title">🖼️ Imágenes del Reel (imgReel0 a imgReel6)</h3>
                <div className="image-inputs-grid">
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
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
