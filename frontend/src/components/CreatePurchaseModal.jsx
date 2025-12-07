// frontend/src/components/CreatePurchaseModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CreateProveedorModal from './CreateProveedorModal'; 
import CreateProductModal from './CreateProductModal';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

// --- ICONOS SVG INLINE ---
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconTag = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;

// Rutas API
const COMPRAS_URL = '/api/compras/compras/';
const PRODUCTOS_URL = '/api/inventario/productos/';
const PROVEEDORES_URL = '/api/compras/proveedores/';

function CreatePurchaseModal({ isOpen, onClose, onUpdate, userId }) {
    // Estados
    const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProviderId, setSelectedProviderId] = useState(''); 
    const [productsList, setProductsList] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [detalles, setDetalles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [optionsKey, setOptionsKey] = useState(0); 
    const [activeDetailIndex, setActiveDetailIndex] = useState(null);

    // Carga de datos
    const fetchCatalogData = useCallback(async () => {
        try {
            const [productsRes, providersRes] = await Promise.all([
                axios.get(PRODUCTOS_URL),
                axios.get(PROVEEDORES_URL)
            ]);
            setProductsList(productsRes.data);
            setProveedores(providersRes.data);
            
            if (providersRes.data.length > 0 && !selectedProviderId) {
                setSelectedProviderId(parseInt(providersRes.data[0].id_proveedor)); 
            }
        } catch (error) {
            console.error("Error catalogo:", error);
            toast.error("Error de conexión al cargar catálogo.");
        }
    }, [optionsKey, selectedProviderId]);

    useEffect(() => {
        if (isOpen) {
            fetchCatalogData();
            if (detalles.length === 0) handleAddDetail();
        }
    }, [isOpen, fetchCatalogData]);

    // Handlers
    const handleProductCreated = (newId) => {
        setOptionsKey(prev => prev + 1); 
        if (activeDetailIndex !== null) handleDetailChange(activeDetailIndex, 'id_producto', newId);
        setIsProductModalOpen(false);
        toast.success("Producto creado exitosamente");
    };

    const handleProveedorCreated = (newId) => {
        setOptionsKey(prev => prev + 1); 
        setSelectedProviderId(newId); 
        setIsProveedorModalOpen(false);
        toast.success("Proveedor registrado");
    };

    const handleDetailChange = (index, field, value) => {
        const newDetalles = [...detalles];
        newDetalles[index][field] = value;
        const detalle = newDetalles[index];

        if (field === 'id_producto' && value) {
             const prod = productsList.find(p => p.id_producto === value);
             if (prod) detalle.precio_unitario = parseFloat(prod.precio_venta);
        }

        const cantidad = parseFloat(detalle.cantidad || 0);
        const precio = parseFloat(detalle.precio_unitario || 0);
        detalle.subtotal = cantidad * precio; 
        setDetalles(newDetalles);
    };

    const handleAddDetail = () => {
        setDetalles([...detalles, {
            id_producto: "", 
            cantidad: 1,
            precio_unitario: 0,
            subtotal: 0,
        }]);
    };

    const handleRemoveDetail = (index) => {
        const newDetalles = [...detalles];
        newDetalles.splice(index, 1);
        setDetalles(newDetalles);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (detalles.length === 0 || !selectedProviderId) {
             toast.error("Complete los campos requeridos.");
             return;
        }

        const productIds = detalles.map(d => d.id_producto);
        if (productIds.some(id => !id)) return toast.error("Hay líneas vacías sin producto.");
        
        const uniqueIds = new Set(productIds);
        if (uniqueIds.size !== productIds.length) return toast.error("No puede duplicar productos. Sume la cantidad en una sola línea.");
        
        setIsSubmitting(true);
        const loadingToast = toast.loading("Procesando Orden...");

        try {
            const finalPrice = detalles.reduce((sum, d) => sum + d.subtotal, 0);
            const purchaseData = {
                id_proveedor: parseInt(selectedProviderId),
                fecha_pedido: fechaPedido,
                id_usuario: userId, 
                precio_final: finalPrice, 
                detalles: detalles.map(d => ({
                    id_producto: d.id_producto,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    subtotal: d.subtotal,
                })),
            };

            await axios.post(COMPRAS_URL, purchaseData);
            
            toast.dismiss(loadingToast);
            toast.success(`Orden de Compra creada!`);
            
            setDetalles([]); 
            onUpdate();
            setTimeout(onClose, 1000); 
            
        } catch (error) {
            toast.dismiss(loadingToast);
            const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            toast.error('Error: ' + errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    const finalPrice = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);

    return (
        <div style={styles.overlay}>
            <Toaster position="top-center" />
            <div style={styles.modal}>
                
                {/* HEADER */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Nueva Orden de Compra</h2>
                        <p style={styles.subtitle}>Gestión de abastecimiento e inventario.</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><IconClose/></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContent}>
                    
                    {/* SECCIÓN 1: DATOS GENERALES */}
                    <div style={styles.sectionCard}>
                        <div style={styles.gridHeader}>
                            <div style={{flex: 2}}>
                                <label style={styles.label}>Proveedor</label>
                                <div style={styles.inputGroup}>
                                    <select 
                                        value={selectedProviderId} 
                                        onChange={(e) => setSelectedProviderId(parseInt(e.target.value))} 
                                        required 
                                        style={styles.select}
                                    >
                                        {proveedores.map(p => (
                                            <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => setIsProveedorModalOpen(true)} style={styles.miniBtn} title="Crear Proveedor">
                                        <IconPlus />
                                    </button>
                                </div>
                            </div>

                            <div style={{flex: 1}}>
                                <label style={styles.label}>Fecha Pedido</label>
                                <input type="date" value={fechaPedido} onChange={(e) => setFechaPedido(e.target.value)} required style={styles.input} />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: DETALLES */}
                    <div style={styles.detailsContainer}>
                        <div style={styles.detailsHeader}>
                            <h4 style={{margin:0, color:'#444'}}>Productos ({detalles.length})</h4>
                            <button type="button" onClick={handleAddDetail} style={styles.addBtn} disabled={productsList.length === 0}>
                                <IconPlus /> Agregar Línea
                            </button>
                        </div>

                        {detalles.length === 0 && (
                            <div style={styles.emptyState}>No hay productos agregados. Pulse "Agregar Línea".</div>
                        )}

                        {detalles.map((detalle, index) => {
                            const selectedProductObj = productsList.find(p => p.id_producto === detalle.id_producto);

                            return (
                                <div key={index} style={styles.detailRow}>
                                    <div style={styles.lineNumber}>{index + 1}</div>
                                    
                                    <div style={{flex: 3}}>
                                        <label style={styles.miniLabel}>Producto</label>
                                        <div style={styles.inputGroup}>
                                            <select 
                                                value={detalle.id_producto} 
                                                onChange={(e) => handleDetailChange(index, 'id_producto', e.target.value ? Number(e.target.value) : "")} 
                                                required 
                                                style={styles.select}
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {productsList.map(p => {
                                                    const isSelectedElsewhere = detalles.some((d, i) => String(d.id_producto) === String(p.id_producto) && i !== index);
                                                    
                                                    // 🏷️ AQUÍ AGREGAMOS LA MARCA AL TEXTO DE LA OPCIÓN
                                                    const brandLabel = p.id_marca_nombre ? ` — ${p.id_marca_nombre}` : '';
                                                    
                                                    return (
                                                        <option key={p.id_producto} value={p.id_producto} disabled={isSelectedElsewhere} style={isSelectedElsewhere ? {color:'#bbb'} : {}}>
                                                            {p.nombre}{brandLabel} ({p.sku}) {isSelectedElsewhere ? '(Agregado)' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <button 
                                                type="button" 
                                                onClick={() => { setActiveDetailIndex(index); setIsProductModalOpen(true); }} 
                                                style={styles.miniBtnSec} 
                                                title="Nuevo Producto"
                                            >
                                                <IconPlus />
                                            </button>
                                        </div>
                                        
                                        {/* 🏷️ AQUÍ MOSTRAMOS LA MARCA EN EL BADGE VISUAL */}
                                        {selectedProductObj && (
                                            <div style={styles.skuBadge}>
                                                <IconTag />
                                                <strong>SKU:</strong> {selectedProductObj.sku}
                                                
                                                {/* Separador */}
                                                <span style={styles.badgeSeparator}>|</span>
                                                
                                                {/* Marca Resaltada */}
                                                <strong style={{color: '#0f172a'}}>
                                                    {selectedProductObj.id_marca_nombre || 'Sin Marca'}
                                                </strong>

                                                {selectedProductObj.id_categoria_nombre && (
                                                    <>
                                                        <span style={styles.badgeSeparator}>|</span>
                                                        <span style={{color: '#64748b'}}>{selectedProductObj.id_categoria_nombre}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{flex: 1}}>
                                        <label style={styles.miniLabel}>Cant.</label>
                                        <input type="number" min="1" value={detalle.cantidad} onChange={(e) => handleDetailChange(index, 'cantidad', e.target.value)} required style={styles.inputCenter} />
                                    </div>

                                    <div style={{flex: 1.2}}>
                                        <label style={styles.miniLabel}>Costo Unit.</label>
                                        <input type="number" step="0.01" value={detalle.precio_unitario} onChange={(e) => handleDetailChange(index, 'precio_unitario', e.target.value)} required style={styles.inputRight} />
                                    </div>

                                    <div style={{flex: 1.2, textAlign: 'right'}}>
                                        <label style={styles.miniLabel}>Subtotal</label>
                                        <div style={styles.subtotalText}>${(detalle.subtotal || 0).toFixed(2)}</div>
                                    </div>

                                    <button type="button" onClick={() => handleRemoveDetail(index)} style={styles.removeBtn}>
                                        <IconTrash />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* FOOTER */}
                    <div style={styles.footer}>
                        <div style={styles.totalSection}>
                            <span style={{color: '#666', fontSize: '0.9em'}}>Total de la Orden:</span>
                            <span style={styles.totalAmount}>${finalPrice.toFixed(2)}</span>
                        </div>
                        
                        <div style={styles.actionButtons}>
                            <button type="button" onClick={onClose} style={styles.btnCancel} disabled={isSubmitting}>Cancelar</button>
                            <button type="submit" style={styles.btnSubmit} disabled={isSubmitting || detalles.length === 0}>
                                {isSubmitting ? 'Procesando...' : 'Crear Orden'}
                            </button>
                        </div>
                    </div>

                </form>
            </div>

            {/* MODALES HIJOS */}
            <CreateProveedorModal isOpen={isProveedorModalOpen} onClose={() => setIsProveedorModalOpen(false)} onProveedorCreated={handleProveedorCreated} />
            <CreateProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onProductCreated={handleProductCreated} />
        </div>
    );
}

// --- ESTILOS MODERNOS ---
const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000,
        animation: 'fadeIn 0.2s ease-out'
    },
    modal: {
        backgroundColor: '#ffffff', width: '950px', maxHeight: '90vh', // Un poco más ancho para caber todo
        borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid #f1f5f9'
    },
    header: {
        padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        backgroundColor: '#f8fafc'
    },
    title: { margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' },
    subtitle: { margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' },
    closeBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#94a3b8', padding: '4px', borderRadius: '50%',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center'
    },
    formContent: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    
    // Sección Inputs
    sectionCard: { padding: '20px 24px', backgroundColor: '#fff' },
    gridHeader: { display: 'flex', gap: '24px' },
    
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box' },
    inputGroup: { display: 'flex', gap: '8px' },
    
    miniBtn: { padding: '0 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    miniBtnSec: { padding: '0 10px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' },

    // Detalles
    detailsContainer: { flex: 1, overflowY: 'auto', padding: '0 24px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' },
    detailsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10 },
    addBtn: { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
    
    detailRow: { 
        display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#fff', 
        padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', 
        border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        transition: 'transform 0.1s'
    },
    skuBadge: {
        fontSize: '0.75rem', color: '#475569', marginTop: '6px', 
        display: 'flex', alignItems: 'center', fontFamily: 'monospace',
        backgroundColor: '#f1f5f9', width: 'fit-content', padding: '4px 10px', borderRadius: '6px',
        border: '1px solid #e2e8f0'
    },
    badgeSeparator: { margin: '0 8px', color: '#cbd5e1' },
    
    lineNumber: { fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', width: '20px', paddingTop: '12px' },
    miniLabel: { fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px', display: 'block' },
    inputCenter: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.9rem', boxSizing: 'border-box' },
    inputRight: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '0.9rem', boxSizing: 'border-box' },
    subtotalText: { fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', padding: '8px 0' },
    removeBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', opacity: 0.7, marginTop: '5px' },
    emptyState: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' },

    // Footer
    footer: { padding: '20px 24px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    totalSection: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    totalAmount: { fontSize: '1.5rem', fontWeight: '800', color: '#059669', lineHeight: 1 },
    actionButtons: { display: 'flex', gap: '12px' },
    btnCancel: { padding: '10px 20px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    btnSubmit: { padding: '10px 24px', border: 'none', backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
};

export default CreatePurchaseModal;