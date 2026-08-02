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
        setCierreConfig(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Could not fetch cierre config:', err);
    }
  };

  useEffect(() => {
    fetchProducts(false);
    fetchCierreConfig();
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
    setFormData({
      Nombre: '',
      Categoria: dynamicCategories[0] || 'Athleisure',
      Color: '',
      Precio: '',
      Nuevo: 'Si',
      Tendencia: 'Si',
      numorden: String(nextOrder),
      imgReel0: '',
      imgReel1: '',
      imgReel2: '',
      imgReel3: '',
      imgReel4: '',
      imgReel5: '',
      imgReel6: ''
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
      {/* Left Sidebar Navigation Menu */}
      <aside className="admin-sidebar">
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
          </div>

          <nav className="sidebar-menu">
            <span className="sidebar-menu-label">Navegación</span>

            <button 
              type="button" 
              className={`sidebar-link ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              <i className="fa-solid fa-shirt"></i>
              <span>Catálogo de Productos</span>
            </button>

            <button 
              type="button" 
              className={`sidebar-link ${activeTab === 'cierre' ? 'active' : ''}`}
              onClick={() => setActiveTab('cierre')}
            >
              <i className="fa-solid fa-stopwatch"></i>
              <span>Cierre de Pedidos</span>
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
            <h2>{activeTab === 'catalog' ? 'Catálogo de Productos' : 'Cierre de Pedidos & Cronómetro'}</h2>
            <p>
              {activeTab === 'catalog' 
                ? 'Gestiona la lista de prendas, imágenes, precios y estado' 
                : 'Configura las 2 fechas/entregas semanales de pedidos para la tienda web'}
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
                    placeholder="Ej: Cierre de Pedidos Semanal"
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
