// frontend/src/pages/InventoryDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import CreateProductForm from '../components/CreateProductForm'; 
import AdvancedSearchBar from '../components/AdvancedSearchBar';
import TableSkeleton from '../components/TableSkeleton';
import { useAuth } from '../AuthContext'; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from 'react-hot-toast';

// --- ICONOS SVG ---
const IconBox = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconSettings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconEye = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconPrint = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;
const IconChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconChevronUp = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;
const IconLayers = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const IconTruck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconReturn = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>;

const PRODUCTOS_URL = '/api/inventario/productos/';
const LOTES_URL = '/api/inventario/lotes/'; 
const COMPRAS_BASE_URL = '/api/compras/compras/'; 
const DEVOLUCIONES_URL = '/api/base/devoluciones/'; 

function InventoryDashboard({ refreshTrigger, onUpdate }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', status: '' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const [expandedProductId, setExpandedProductId] = useState(null);
    
    // Historial Proveedores
    const [providerModalOpen, setProviderModalOpen] = useState(false);
    const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
    const [providerHistory, setProviderHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // 🚨 Historial Devoluciones
    const [showReturnsModal, setShowReturnsModal] = useState(false);
    const [returnsList, setReturnsList] = useState([]);
    const [loadingReturns, setLoadingReturns] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productResponse, lotesResponse] = await Promise.all([
                    axios.get(`http://127.0.0.1:8000${PRODUCTOS_URL}?page_size=1000`),
                    axios.get(`http://127.0.0.1:8000${LOTES_URL}?page_size=1000`)
                ]);

                // Lógica de cálculo de stock basado en lotes
                const lotes = Array.isArray(lotesResponse.data) ? lotesResponse.data : lotesResponse.data.results || [];
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0); 
                
                const limite = new Date();
                limite.setDate(hoy.getDate() + 30);
                limite.setHours(23, 59, 59, 999);

                const stockDisponibleMap = new Map();
                const productosConRiesgo = new Set();

                lotes.forEach(l => {
                    const pid = typeof l.id_producto === 'object' ? l.id_producto.id_producto : l.id_producto;
                    const cantidad = parseFloat(l.cantidad) || 0;

                    if (cantidad > 0) {
                        let esVencido = false;
                        if (l.fecha_vencimiento) {
                            const d = new Date(l.fecha_vencimiento + 'T00:00:00');
                            if (d < hoy) esVencido = true;
                            else if (d <= limite) productosConRiesgo.add(pid);
                        }

                        if (!esVencido) {
                            const actual = stockDisponibleMap.get(pid) || 0;
                            stockDisponibleMap.set(pid, actual + cantidad);
                        }
                    }
                });

                const consolidatedData = productResponse.data.map(p => {
                    const stockReal = stockDisponibleMap.get(p.id_producto) || 0;
                    
                    let estadoCalculado = 'DISPONIBLE';
                    if (stockReal === 0) estadoCalculado = 'AGOTADO';
                    else if (stockReal <= 10) estadoCalculado = 'POR_AGOTARSE';

                    return {
                        ...p,
                        current_stock: stockReal,
                        stock_status: estadoCalculado,
                        marca: p.id_marca_nombre || p.marca_nombre || '-', 
                        categoria: p.id_categoria_nombre || p.categoria_nombre || '-',
                        por_vencer: productosConRiesgo.has(p.id_producto)
                    };
                });
                
                setProducts(consolidatedData);
            } catch (err) {
                setError(`Error de conexión: ${err.message}.`);
                console.error("Fallo inventario:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    const handleFilterChange = (key, value) => {
        if (key === 'CLEAR') {
            setSearchTerm('');
            setFilters({ minPrice: '', maxPrice: '', status: '' });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const exportarInventarioPDF = () => {
        if (filteredProducts.length === 0) return toast.error("No hay productos para exportar.");
        
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Reporte de Inventario General - DIGRAS", 14, 15);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString()} | Usuario: ${user.username}`, 14, 22);

        const tableColumn = ["Producto", "SKU", "Marca", "Categoría", "Precio ($)", "Stock Disp.", "Estado"];
        const tableRows = [];

        filteredProducts.forEach(p => {
            let estadoTexto = p.stock_status.replace('_', ' ');
            if (p.por_vencer) estadoTexto += " (Vence Pronto)";

            const productData = [
                p.nombre,
                p.sku,
                p.marca,
                p.categoria,
                p.precio_venta,
                p.current_stock,
                estadoTexto
            ];
            tableRows.push(productData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] }
        });

        doc.save("inventario_general.pdf");
    };

    const exportarFichaProducto = (p) => {
        const doc = new jsPDF();
        doc.setFillColor(240, 249, 255); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text("Ficha de Producto", 14, 25);
        doc.setFontSize(10);
        doc.text("DIGRAS C.A.", 195, 25, { align: "right" });

        autoTable(doc, {
            startY: 50,
            head: [['Campo', 'Detalle']],
            body: [
                ['Nombre', p.nombre],
                ['SKU', p.sku],
                ['Marca', p.marca],
                ['Categoría', p.categoria],
                ['Precio Venta Actual', `$${p.precio_venta}`],
                ['Stock Disponible', p.current_stock],
                ['Estado', p.stock_status.replace('_', ' ')],
                ['Alerta Vencimiento', p.por_vencer ? "SÍ - Revisar Lotes (Próximos 30 días)" : "No"],
                ['Descripción', p.descripcion || "No especificada"]
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        });

        doc.save(`producto_${p.sku}.pdf`);
    };

    const abrirHistorialProveedores = async (producto) => {
        setSelectedProductForHistory(producto);
        setProviderModalOpen(true);
        setLoadingHistory(true);
        setProviderHistory([]);

        try {
            const responseCompras = await axios.get(`http://127.0.0.1:8000${COMPRAS_BASE_URL}?page_size=50`);
            const ultimasCompras = Array.isArray(responseCompras.data) ? responseCompras.data : responseCompras.data.results || [];

            const promesasDetalles = ultimasCompras.map(compra => 
                axios.get(`http://127.0.0.1:8000${COMPRAS_BASE_URL}${compra.id_compra}/detalles/`)
                    .then(res => ({
                        compraInfo: compra, 
                        detalles: Array.isArray(res.data) ? res.data : res.data.results || []
                    }))
                    .catch(() => null)
            );

            const resultados = await Promise.all(promesasDetalles);
            const historialEncontrado = [];
            
            resultados.forEach(res => {
                if (res && res.detalles) {
                    res.detalles.forEach(detalle => {
                        const idProdEnDetalle = typeof detalle.id_producto === 'object' ? detalle.id_producto.id_producto : detalle.id_producto;
                        if (idProdEnDetalle === producto.id_producto) {
                            historialEncontrado.push({
                                ...detalle,
                                fecha_compra: res.compraInfo.fecha_compra || res.compraInfo.fecha_pedido,
                                proveedor_nombre: res.compraInfo.proveedor_nombre || res.compraInfo.id_proveedor_nombre,
                                id_compra_ref: res.compraInfo.id_compra
                            });
                        }
                    });
                }
            });

            historialEncontrado.sort((a, b) => new Date(b.fecha_compra) - new Date(a.fecha_compra));
            setProviderHistory(historialEncontrado);

        } catch (err) {
            console.error("Error buscando historial:", err);
            toast.error("No se pudo obtener el historial.");
        } finally {
            setLoadingHistory(false);
        }
    };

    // 🚨 FUNCIONALIDAD: ABRIR HISTORIAL DE DEVOLUCIONES
    const abrirHistorialDevoluciones = async () => {
        setShowReturnsModal(true);
        setLoadingReturns(true);
        try {
            const res = await axios.get(`http://127.0.0.1:8000${DEVOLUCIONES_URL}`);
            const data = Array.isArray(res.data) ? res.data : res.data.results || [];
            setReturnsList(data);
        } catch (error) {
            console.error("Error cargando devoluciones:", error);
            toast.error("No se pudo cargar el historial de devoluciones.");
            setReturnsList([]); 
        } finally {
            setLoadingReturns(false);
        }
    };

    const toggleRow = (id) => {
        if (expandedProductId === id) setExpandedProductId(null);
        else setExpandedProductId(id);
    };

    const filteredProducts = products.filter(p => {
        const matchText = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const price = parseFloat(p.precio_venta);
        const matchMin = filters.minPrice ? price >= parseFloat(filters.minPrice) : true;
        const matchMax = filters.maxPrice ? price <= parseFloat(filters.maxPrice) : true;
        
        let matchStatus = true;
        if (filters.status) {
            if (filters.status === 'POR_VENCER') {
                matchStatus = p.por_vencer === true;
            } else {
                matchStatus = p.stock_status === filters.status;
            }
        }
        
        return matchText && matchMin && matchMax && matchStatus;
    });

    const totalStock = products.reduce((acc, p) => acc + p.current_stock, 0);
    
    const agotadosCount = products.filter(p => p.stock_status === 'AGOTADO').length;
    const porAgotarseCount = products.filter(p => p.stock_status === 'POR_AGOTARSE').length;
    const porVencerCount = products.filter(p => p.por_vencer).length;

    const puedeGestionar = 
    user?.is_superuser || 
    user?.tipo?.toUpperCase() === 'ADMINISTRADOR' || 
    user?.tipo?.toUpperCase() === 'GERENTE';

    if (loading) return (
        <div className="page-container">
            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={styles.iconCircle}><IconBox /></div>
                    <div><h2 style={styles.title}>Inventario General</h2><p style={styles.subtitle}>Cargando datos...</p></div>
                </div>
            </div>
            <TableSkeleton rows={8} columns={7} />
        </div>
    );

    if (error) return <div style={{padding:40, textAlign:'center', color:'#ef4444'}}>🛑 {error}</div>;

    return (
        <div className="page-container">
            <Toaster position="top-center" />
            
            <div style={styles.topSection}>
                <div style={styles.header}>
                    <div style={styles.titleGroup}>
                        <div style={styles.iconCircle}><IconBox /></div>
                        <div>
                            <h2 style={styles.title}>Inventario General</h2>
                            <p style={styles.subtitle}>Vista consolidada de existencias y precios</p>
                        </div>
                    </div>
                    
                    {puedeGestionar && (
                        <button onClick={() => setIsCreateModalOpen(true)} style={styles.createBtn}>
                            <IconSettings /> Gestión de Productos
                        </button>
                    )}
                </div>

                <div className="grid-responsive" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Total Productos</span>
                        <span style={styles.kpiValue}>{products.length}</span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Unidades Disponibles</span>
                        <span style={{...styles.kpiValue, color: '#0ea5e9'}}>{totalStock}</span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Riesgo Vencimiento</span>
                        <span style={{...styles.kpiValue, color: porVencerCount > 0 ? '#eab308' : '#10b981'}}>
                            {porVencerCount}
                        </span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Alertas de Stock</span>
                        <div style={{display: 'flex', gap: '15px', alignItems: 'baseline', marginTop: '5px'}}>
                            <div>
                                <span style={{fontSize: '1.4rem', fontWeight: '800', color: '#ef4444', lineHeight: 1}}>{agotadosCount}</span>
                                <span style={{fontSize: '0.75rem', color: '#64748b', marginLeft: '4px', fontWeight: 600}}>Agot.</span>
                            </div>
                            <div style={{borderLeft: '1px solid #cbd5e1', height: '24px'}}></div>
                            <div>
                                <span style={{fontSize: '1.4rem', fontWeight: '800', color: '#f59e0b', lineHeight: 1}}>{porAgotarseCount}</span>
                                <span style={{fontSize: '0.75rem', color: '#64748b', marginLeft: '4px', fontWeight: 600}}>Bajos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-responsive">
                <div className="toolbar-responsive">
                    <div style={{flex: 1}}>
                        <AdvancedSearchBar 
                            searchTerm={searchTerm} onSearchChange={setSearchTerm}
                            filters={filters} onFilterChange={handleFilterChange}
                            config={{
                                searchPlaceholder: "🔍 Buscar por Nombre o SKU...", showPriceRange: true,
                                statusOptions: [
                                    { value: 'DISPONIBLE', label: '🟢 Disponible' },
                                    { value: 'POR_AGOTARSE', label: '⚠️ Por Agotarse' },
                                    { value: 'AGOTADO', label: '🔴 Agotado' },
                                    { value: 'POR_VENCER', label: '🗓️ Por Vencer (30 días)' }
                                ]
                            }}
                        />
                    </div>
                    
                    {/* 🚨 BOTÓN NUEVO PARA VER DEVOLUCIONES */}
                    <button onClick={abrirHistorialDevoluciones} style={styles.btnGhost} title="Ver historial de devoluciones">
                        <IconReturn /> Devoluciones
                    </button>

                    <button onClick={exportarInventarioPDF} style={styles.btnGhost} title="Exportar listado visible a PDF">
                        <IconPrint /> Exportar PDF
                    </button>
                </div>

                <div className="table-responsive-wrapper">
                    <table className="table-responsive" style={styles.table}>
                        <thead>
                            <tr style={styles.theadRow}>
                                <th style={styles.th}></th>
                                <th style={styles.th}>Producto</th>
                                <th style={styles.th}>Marca</th>
                                <th style={styles.th}>Categoría</th>
                                <th style={styles.thRight}>Precio Venta</th>
                                <th style={styles.thRight}>Stock Disp.</th>
                                <th style={styles.th}>Estado</th>
                                <th style={styles.thAction}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => {
                                const isExpanded = expandedProductId === p.id_producto;
                                return (
                                    <React.Fragment key={p.id_producto}>
                                        <tr 
                                            onClick={() => toggleRow(p.id_producto)} 
                                            style={{
                                                ...styles.tr,
                                                backgroundColor: isExpanded ? '#f8fafc' : 'white',
                                                cursor: 'pointer',
                                                borderLeft: isExpanded ? '4px solid #2563eb' : '4px solid transparent'
                                            }}
                                        >
                                            <td style={{...styles.td, width: '40px', textAlign: 'center', color: '#64748b'}}>
                                                {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.prodName}>{p.nombre}</div>
                                                <div style={styles.prodSku}>SKU: {p.sku}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.brandText}>{p.marca}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.categoryBadge}>{p.categoria}</span>
                                            </td>
                                            <td style={styles.tdRight}>${p.precio_venta}</td>
                                            <td style={{ ...styles.tdRight, fontWeight: '700', color: p.current_stock > 0 ? '#0f172a' : '#94a3b8' }}>
                                                {p.current_stock}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                                                    <span style={getStatusStyle(p.stock_status)}>
                                                        {p.stock_status.replace('_', ' ')}
                                                    </span>
                                                    {p.por_vencer && (
                                                        <span style={{fontSize:'0.7rem', color:'#854d0e', backgroundColor:'#fef9c3', padding:'2px 6px', borderRadius:'4px', border:'1px solid #facc15', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px'}}>
                                                            ⚠️ Por Vencer
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={styles.tdAction}>
                                                <Link 
                                                    to={`/inventario/lotes/${p.id_producto}`} 
                                                    style={styles.linkBtn}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <IconEye /> Ver Lotes
                                                </Link>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr style={{backgroundColor: '#f8fafc'}}>
                                                <td colSpan="8" style={{padding: '0 20px 20px 20px', borderBottom: '1px solid #e2e8f0'}}>
                                                    <div style={styles.detailPanel}>
                                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                                                            <h4 style={{margin:0, color:'#334155'}}>Detalles Rápidos</h4>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); exportarFichaProducto(p); }} 
                                                                style={styles.btnSmall}
                                                            >
                                                                <IconDownload /> Ficha PDF
                                                            </button>
                                                        </div>
                                                        
                                                        <div style={{color: '#475569', fontSize: '0.9rem', marginBottom: '15px'}}>
                                                            <strong>Descripción: </strong> {p.descripcion || "Sin descripción."}
                                                        </div>

                                                        <div style={{display:'flex', gap: 15, flexWrap: 'wrap'}}>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/inventario/lotes/${p.id_producto}`); }}
                                                                style={styles.actionBtnPrimary}
                                                            >
                                                                <IconLayers /> Ver Lotes ({p.current_stock} unds)
                                                            </button>
                                                            
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    abrirHistorialProveedores(p);
                                                                }}
                                                                style={styles.actionBtnSecondary}
                                                            >
                                                                <IconTruck /> Historial de Proveedores
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr><td colSpan="8" style={styles.empty}>No se encontraron productos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateProductForm 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onUpdate={onUpdate}
            /> 

            {providerModalOpen && selectedProductForHistory && (
                <div style={styles.modalOverlay} onClick={() => setProviderModalOpen(false)}>
                    <div className="modal-content-responsive" style={{maxWidth: '600px'}} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{margin:0, color:'#0f172a'}}>Historial de Compras</h3>
                            <button onClick={() => setProviderModalOpen(false)} style={styles.closeBtn}><IconX /></button>
                        </div>
                        <div style={{padding: '10px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', color: '#64748b', fontSize: '0.9rem'}}>
                            Producto: <strong>{selectedProductForHistory.nombre}</strong>
                        </div>
                        
                        <div style={{maxHeight: '60vh', overflowY: 'auto', padding: '20px'}}>
                            {loadingHistory ? (
                                <div style={{textAlign:'center', color: '#64748b'}}>
                                    Buscando en las últimas 50 compras...
                                </div>
                            ) : providerHistory.length === 0 ? (
                                <div style={{textAlign:'center', color:'#64748b', fontStyle:'italic'}}>
                                    No se han encontrado registros recientes para este producto.
                                </div>
                            ) : (
                                <div className="table-responsive-wrapper">
                                    <table className="table-responsive" style={{width:'100%', fontSize:'0.85rem', borderCollapse:'collapse'}}>
                                        <thead>
                                            <tr style={{background:'#f1f5f9', textAlign:'left', color: '#475569'}}>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0'}}>Fecha</th>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0'}}>Proveedor</th>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0', textAlign: 'center'}}>Cant.</th>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0', textAlign: 'right'}}>Costo U.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {providerHistory.map((hist, idx) => {
                                                const fecha = hist.fecha_compra ? hist.fecha_compra.toString().substring(0,10) : 'N/A';
                                                const proveedor = hist.proveedor_nombre || "Desconocido";
                                                
                                                return (
                                                    <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                                                        <td style={{padding:8}}>{fecha}</td>
                                                        <td style={{padding:8, fontWeight: '600'}}>{proveedor}</td>
                                                        <td style={{padding:8, textAlign: 'center'}}>{hist.cantidad}</td>
                                                        <td style={{padding:8, textAlign: 'right'}}>${hist.precio_unitario}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div style={{padding: '15px', textAlign: 'right', borderTop: '1px solid #e2e8f0'}}>
                            <button onClick={() => setProviderModalOpen(false)} style={styles.btnGhost}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🚨 MODAL HISTORIAL DE DEVOLUCIONES (MODIFICADO) */}
            {showReturnsModal && (
                <div style={styles.modalOverlay} onClick={() => setShowReturnsModal(false)}>
                    <div className="modal-content-responsive" style={{maxWidth: '700px'}} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{margin:0, color:'#0f172a'}}>Historial de Devoluciones (Stock Reingresado)</h3>
                            <button onClick={() => setShowReturnsModal(false)} style={styles.closeBtn}><IconX /></button>
                        </div>
                        
                        <div style={{maxHeight: '60vh', overflowY: 'auto', padding: '20px'}}>
                            {loadingReturns ? (
                                <div style={{textAlign:'center', color: '#64748b'}}>Cargando historial...</div>
                            ) : returnsList.length === 0 ? (
                                <div style={{textAlign:'center', color:'#64748b', fontStyle:'italic'}}>
                                    No hay devoluciones registradas en el sistema.
                                </div>
                            ) : (
                                <div className="table-responsive-wrapper">
                                    <table className="table-responsive" style={{width:'100%', fontSize:'0.85rem', borderCollapse:'collapse'}}>
                                        <thead>
                                            <tr style={{background:'#f1f5f9', textAlign:'left', color: '#475569'}}>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0'}}>Orden</th>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0'}}>Cliente</th>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0'}}>Producto</th>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0', textAlign:'center'}}>Cant.</th>
                                                <th style={{padding:8, borderBottom: '1px solid #e2e8f0'}}>Motivo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returnsList.map((ret, idx) => (
                                                <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                                                    <td style={{padding:8, fontWeight:'600'}}>#{ret.orden_id}</td>
                                                    <td style={{padding:8, color:'#334155'}}>{ret.cliente}</td>
                                                    <td style={{padding:8}}>{ret.producto_nombre}</td>
                                                    <td style={{padding:8, textAlign:'center', fontWeight:'700', color:'#dc2626'}}>{ret.cantidad}</td>
                                                    <td style={{padding:8, color:'#64748b', fontStyle:'italic'}}>{ret.motivo || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div style={{padding: '15px', textAlign: 'right', borderTop: '1px solid #e2e8f0'}}>
                            <button onClick={() => setShowReturnsModal(false)} style={styles.btnGhost}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const getStatusStyle = (status) => {
    const base = { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-block' };
    if (status === 'DISPONIBLE') return { ...base, backgroundColor: '#dcfce7', color: '#166534' };
    if (status === 'AGOTADO') return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
    if (status === 'POR_AGOTARSE') return { ...base, backgroundColor: '#ffedd5', color: '#9a3412' }; 
    return { ...base, backgroundColor: '#f1f5f9', color: '#475569' };
};

const styles = {
    topSection: { marginBottom: '32px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
    iconCircle: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0f9ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
    createBtn: {
        backgroundColor: '#0f172a', color: 'white', border: 'none',
        padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.1s ease',
        whiteSpace: 'nowrap'
    },
    
    kpiCard: { backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    kpiLabel: { display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' },
    kpiValue: { fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 },
    
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '800px' },
    theadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    thRight: { padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    thAction: { padding: '16px 24px', textAlign: 'center', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
    td: { padding: '16px 24px', verticalAlign: 'middle', color: '#334155' },
    tdRight: { padding: '16px 24px', verticalAlign: 'middle', textAlign: 'right', color: '#334155', fontFamily: 'monospace', fontSize: '0.95rem' },
    tdAction: { padding: '16px 24px', verticalAlign: 'middle', textAlign: 'center' },
    prodName: { fontWeight: '600', color: '#0f172a', marginBottom: '2px' },
    prodSku: { fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' },
    categoryBadge: { display: 'inline-block', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#475569', fontWeight: '600' },
    brandText: { fontSize: '0.85rem', color: '#475569', fontWeight: '500' },
    
    linkBtn: { 
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: '#3b82f6', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem',
        padding: '6px 12px', borderRadius: '6px', backgroundColor: '#eff6ff',
        transition: 'background 0.2s', whiteSpace: 'nowrap'
    },
    btnGhost: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem", height: '42px', whiteSpace: 'nowrap' },
    btnSmall: { display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' },
    
    detailPanel: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -2px rgba(0,0,0,0.05)' },
    
    actionBtnPrimary: { background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' },
    actionBtnSecondary: { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' },

    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modalHeader: { padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },

    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }
};

export default InventoryDashboard;