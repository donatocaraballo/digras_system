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
const IconSettings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconEye = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconPrint = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;
const IconChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconChevronUp = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;
const IconLayers = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const IconTruck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const PRODUCTOS_URL = '/api/inventario/productos/';
const EXISTENCIAS_URL = '/api/inventario/existencias/';
const COMPRAS_BASE_URL = '/api/compras/compras/'; 

function InventoryDashboard({ refreshTrigger, onUpdate }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', status: '' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Estados para UI
    const [expandedProductId, setExpandedProductId] = useState(null);
    
    // Estados para Historial de Proveedores
    const [providerModalOpen, setProviderModalOpen] = useState(false);
    const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
    const [providerHistory, setProviderHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ?page_size=1000 para traer todos los registros
                const [stockResponse, productResponse] = await Promise.all([
                    axios.get(`http://127.0.0.1:8000${EXISTENCIAS_URL}?page_size=1000`),
                    axios.get(`http://127.0.0.1:8000${PRODUCTOS_URL}?page_size=1000`)
                ]);

                const stockMap = new Map(stockResponse.data.map(s => [s.id_producto, s]));

                const consolidatedData = productResponse.data.map(p => {
                    const stock = stockMap.get(p.id_producto);
                    return {
                        ...p,
                        current_stock: stock ? stock.cantidad : 0,
                        stock_status: stock ? stock.estado : 'AGOTADO',
                        marca: p.id_marca_nombre || p.marca_nombre || '-', 
                        categoria: p.id_categoria_nombre || p.categoria_nombre || '-'
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

    // --- FUNCIONALIDAD: Exportar Inventario Completo PDF ---
    const exportarInventarioPDF = () => {
        if (filteredProducts.length === 0) return toast.error("No hay productos para exportar.");
        
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Reporte de Inventario General - DIGRAS", 14, 15);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()} | Usuario: ${user.username}`, 14, 22);

        const tableColumn = ["Producto", "SKU", "Marca", "Categoría", "Precio ($)", "Stock", "Estado"];
        const tableRows = [];

        filteredProducts.forEach(p => {
            const productData = [
                p.nombre,
                p.sku,
                p.marca,
                p.categoria,
                p.precio_venta,
                p.current_stock,
                p.stock_status
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

    // --- FUNCIONALIDAD: Exportar Ficha Individual PDF ---
    const exportarFichaProducto = (p) => {
        const doc = new jsPDF();
        
        // Encabezado
        doc.setFillColor(240, 249, 255); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text("Ficha de Producto", 14, 25);
        
        doc.setFontSize(10);
        doc.text("DIGRAS C.A.", 195, 25, { align: "right" });

        // Datos
        autoTable(doc, {
            startY: 50,
            head: [['Campo', 'Detalle']],
            body: [
                ['Nombre', p.nombre],
                ['SKU', p.sku],
                ['Marca', p.marca],
                ['Categoría', p.categoria],
                ['Precio Venta Actual', `$${p.precio_venta}`],
                ['Stock Actual', p.current_stock],
                ['Estado', p.stock_status],
                ['Descripción', p.descripcion || "No especificada"]
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        });

        doc.save(`producto_${p.sku}.pdf`);
    };

    // --- FUNCIONALIDAD: Cargar Historial de Proveedores (CORREGIDA) ---
    const abrirHistorialProveedores = async (producto) => {
        setSelectedProductForHistory(producto);
        setProviderModalOpen(true);
        setLoadingHistory(true);
        setProviderHistory([]);

        try {
            // 🚨 SOLUCIÓN 404: 
            // 1. Obtenemos las últimas 50 compras generales (porque el endpoint de detalles global no existe)
            const responseCompras = await axios.get(`http://127.0.0.1:8000${COMPRAS_BASE_URL}?page_size=50`);
            const ultimasCompras = Array.isArray(responseCompras.data) ? responseCompras.data : responseCompras.data.results || [];

            // 2. Iteramos sobre las compras y buscamos los detalles de cada una (endpoints que SÍ existen)
            // Hacemos peticiones en paralelo para que sea rápido
            const promesasDetalles = ultimasCompras.map(compra => 
                axios.get(`http://127.0.0.1:8000${COMPRAS_BASE_URL}${compra.id_compra}/detalles/`)
                    .then(res => ({
                        compraInfo: compra, 
                        detalles: Array.isArray(res.data) ? res.data : res.data.results || []
                    }))
                    .catch(() => null) // Si una falla, no rompemos todo
            );

            const resultados = await Promise.all(promesasDetalles);

            // 3. Aplanamos y filtramos en el cliente por el ID del producto seleccionado
            const historialEncontrado = [];
            
            resultados.forEach(res => {
                if (res && res.detalles) {
                    res.detalles.forEach(detalle => {
                        // Verificamos si este detalle corresponde al producto seleccionado
                        // Manejo robusto de ID (puede ser objeto o número)
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

            // Ordenar por fecha más reciente
            historialEncontrado.sort((a, b) => new Date(b.fecha_compra) - new Date(a.fecha_compra));

            setProviderHistory(historialEncontrado);

        } catch (err) {
            console.error("Error buscando historial:", err);
            toast.error("No se pudo obtener el historial.");
        } finally {
            setLoadingHistory(false);
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
        const matchStatus = filters.status ? p.stock_status === filters.status : true;
        return matchText && matchMin && matchMax && matchStatus;
    });

    // KPIs
    const totalStock = products.reduce((acc, p) => acc + p.current_stock, 0);
    const valorInventario = products.reduce((acc, p) => acc + (p.current_stock * parseFloat(p.precio_venta)), 0);
    const agotadosCount = products.filter(p => p.stock_status === 'AGOTADO').length;

    // Verificar Rol
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
            
            {/* 1. HEADER & KPIs */}
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

                {/* 🚨 GRILLA RESPONSIVA PARA KPIs */}
                <div className="grid-responsive" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Total Productos</span>
                        <span style={styles.kpiValue}>{products.length}</span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Unidades en Stock</span>
                        <span style={{...styles.kpiValue, color: '#0ea5e9'}}>{totalStock}</span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Valor Estimado</span>
                        <span style={{...styles.kpiValue, color: '#10b981'}}>${valorInventario.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Agotados</span>
                        <span style={{...styles.kpiValue, color: agotadosCount > 0 ? '#ef4444' : '#64748b'}}>{agotadosCount}</span>
                    </div>
                </div>
            </div>

            {/* 2. FILTROS & TABLA */}
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
                                    { value: 'AGOTADO', label: '🔴 Agotado' },
                                    { value: 'BAJA_EXISTENCIA', label: '🟠 Baja existencia' }
                                ]
                            }}
                        />
                    </div>
                    
                    {/* BOTÓN EXPORTAR PDF GLOBAL */}
                    <button onClick={exportarInventarioPDF} style={styles.btnGhost} title="Exportar listado visible a PDF">
                        <IconPrint /> Exportar PDF
                    </button>
                </div>

                {/* 🚨 WRAPPER DE TABLA RESPONSIVA */}
                <div className="table-responsive-wrapper">
                    <table className="table-responsive" style={styles.table}>
                        <thead>
                            <tr style={styles.theadRow}>
                                <th style={styles.th}></th>
                                <th style={styles.th}>Producto</th>
                                <th style={styles.th}>Marca</th>
                                <th style={styles.th}>Categoría</th>
                                <th style={styles.thRight}>Precio Venta</th>
                                <th style={styles.thRight}>Stock</th>
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
                                                <span style={getStatusStyle(p.stock_status)}>
                                                    {p.stock_status.replace('_', ' ')}
                                                </span>
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

                                        {/* DETALLE LIMPIO DEL PRODUCTO */}
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
                                                        
                                                        {/* Información solo real */}
                                                        <div style={{color: '#475569', fontSize: '0.9rem', marginBottom: '15px'}}>
                                                            <strong>Descripción: </strong> {p.descripcion || "Sin descripción."}
                                                        </div>

                                                        {/* Botones de Acción Funcionales */}
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

            {/* MODAL CREACIÓN */}
            <CreateProductForm 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onUpdate={onUpdate}
            /> 

            {/* MODAL HISTORIAL DE PROVEEDORES (NUEVO & FUNCIONAL) */}
            {providerModalOpen && selectedProductForHistory && (
                <div style={styles.modalOverlay} onClick={() => setProviderModalOpen(false)}>
                    {/* 🚨 MODAL RESPONSIVO */}
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
                                /* 🚨 TABLA INTERNA RESPONSIVA */
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
        </div>
    );
}

const getStatusStyle = (status) => {
    const base = { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-block' };
    if (status === 'DISPONIBLE') return { ...base, backgroundColor: '#dcfce7', color: '#166534' };
    if (status === 'AGOTADO') return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
    if (status === 'BAJA_EXISTENCIA') return { ...base, backgroundColor: '#ffedd5', color: '#9a3412' };
    return { ...base, backgroundColor: '#f1f5f9', color: '#475569' };
};

const styles = {
    // page-container controla el layout
    
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
    
    // grid-responsive controla los KPIs
    
    kpiCard: { backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    kpiLabel: { display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' },
    kpiValue: { fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 },
    
    // card-responsive controla el contenido
    
    // toolbar-responsive controla la barra superior
    
    // table-responsive-wrapper controla el scroll de la tabla
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
    
    // Estilos del Panel de Detalle
    detailPanel: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -2px rgba(0,0,0,0.05)' },
    
    actionBtnPrimary: { background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' },
    actionBtnSecondary: { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' },

    // Modal Proveedor
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    // modalContent reemplazado por modal-content-responsive
    modalHeader: { padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },

    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }
};

export default InventoryDashboard;