// frontend/src/components/RegisterPaymentModal.jsx

import React, { useState, useEffect } from 'react';
import api from '../api/api'; 
import toast, { Toaster } from 'react-hot-toast';

const COMPRAS_URL = '/compras/compras/';
const API_TASA_LOCAL = '/base/tasa-dolar/';

// --- ICONOS SVG ---
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

const METODOS_PAGO = [
    { value: 'TRANSFERENCIA_BS', label: 'Transferencia (Bs)', currency: 'VES' },
    { value: 'PAGO_MOVIL', label: 'Pago Móvil', currency: 'VES' },
    { value: 'EFECTIVO_BS', label: 'Efectivo (Bs)', currency: 'VES' },
    { value: 'TRANSFERENCIA_USD', label: 'Transf. Internacional ($)', currency: 'USD' },
    { value: 'EFECTIVO_USD', label: 'Efectivo ($)', currency: 'USD' },
    { value: 'ZELLE', label: 'Zelle ($)', currency: 'USD' },
];

function RegisterPaymentModal({ compra, onClose, onSuccess }) {
    const [historial, setHistorial] = useState([]);
    const [saldoOriginal, setSaldoOriginal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tasaBCV, setTasaBCV] = useState(null);
    const [loadingTasa, setLoadingTasa] = useState(true);

    const [metodo, setMetodo] = useState(METODOS_PAGO[0].value);
    const [montoInput, setMontoInput] = useState('');
    const [tasaInput, setTasaInput] = useState('');
    const [referencia, setReferencia] = useState('');
    const [pagosACargar, setPagosACargar] = useState([]);

    const currentMethodInfo = METODOS_PAGO.find(m => m.value === metodo);
    const isBolivares = currentMethodInfo?.currency === 'VES';

    const totalEnListaUSD = pagosACargar.reduce((acc, p) => acc + p.monto_usd, 0);
    const saldoRestanteUSD = Math.max(0, saldoOriginal - totalEnListaUSD);
    const saldoRestanteLocal = isBolivares && tasaInput && parseFloat(tasaInput) > 0 ? (saldoRestanteUSD * parseFloat(tasaInput)) : 0;

    const getValorEnUSD = (montoLocal, tasa) => {
        const monto = parseFloat(montoLocal);
        if (!monto) return 0;
        if (!isBolivares) return monto;
        const tasaFinal = parseFloat(tasa);
        if (!tasaFinal || tasaFinal === 0) return 0;
        return monto / tasaFinal;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resCompra = await api.get(`${COMPRAS_URL}${compra.id_compra}/`);
                setHistorial(resCompra.data.pagos || []);
                setSaldoOriginal(parseFloat(resCompra.data.saldo_pendiente || 0));
            } catch (err) {
                toast.error("Error al cargar datos de la compra.");
            } finally {
                setLoading(false);
            }
        };

        const fetchTasa = async () => {
            try {
                setLoadingTasa(true);
                const response = await api.get(`http://127.0.0.1:8000/api${API_TASA_LOCAL}`);
                const tasa = response.data.promedio || response.data.price; 
                if (tasa) {
                    setTasaBCV(tasa);
                    setTasaInput(tasa);
                }
            } catch (e) {
                toast('Usando tasa manual', { icon: '⚠️' });
                setTasaBCV(null);
            } finally {
                setLoadingTasa(false);
            }
        };

        fetchData();
        fetchTasa();
    }, [compra]);

    const handleFillRestante = () => {
        if (saldoRestanteLocal > 0) setMontoInput(saldoRestanteLocal.toFixed(2));
        else if (!isBolivares && saldoRestanteUSD > 0) setMontoInput(saldoRestanteUSD.toFixed(2));
    };

    const handleAddPago = () => {
        const valorLocal = parseFloat(montoInput);
        const tasa = parseFloat(tasaInput);
        if (!valorLocal || valorLocal <= 0) return toast.error("Ingrese un monto válido.");
        if (isBolivares && (!tasa || tasa <= 0)) return toast.error("Ingrese una tasa válida.");

        const valorUSD = getValorEnUSD(valorLocal, tasa);
        if (valorUSD > (saldoRestanteUSD + 0.05)) return toast.error(`Excede el saldo restante ($${saldoRestanteUSD.toFixed(2)}).`);

        setPagosACargar([...pagosACargar, {
            metodo_pago: metodo,
            label_metodo: currentMethodInfo.label,
            monto_local: valorLocal,
            tasa_cambio: isBolivares ? tasa : 1,
            moneda: isBolivares ? 'VES' : 'USD',
            monto_usd: valorUSD,
            referencia: referencia
        }]);

        setMontoInput('');
        setReferencia('');
        toast.success("Agregado a la lista", { duration: 2000, icon: '⬇️' });
    };

    const handleRemovePago = (index) => {
        const newPagos = [...pagosACargar];
        newPagos.splice(index, 1);
        setPagosACargar(newPagos);
        toast.success("Pago eliminado", { icon: '🗑️' });
    };

    const handleFinalSubmit = async () => {
        const loadingToast = toast.loading("Procesando pagos...");
        try {
            const payload = {
                pagos: pagosACargar.map(p => ({
                    metodo_pago: p.metodo_pago,
                    monto_local: p.monto_local,
                    tasa_cambio: p.tasa_cambio,
                    moneda: p.moneda,
                    referencia: p.referencia
                }))
            };
            
            await api.post(`${COMPRAS_URL}${compra.id_compra}/registrar_pago/`, payload);
            toast.dismiss(loadingToast); 
            toast.success("¡Pagos registrados correctamente!", { duration: 4000 });
            setTimeout(() => { onSuccess(); onClose(); }, 2000);
        } catch (err) {
            toast.dismiss(loadingToast);
            const msg = err.response?.data?.error || "Error al procesar.";
            toast.error(`Error: ${msg}`, { duration: 5000 }); 
        }
    };

    if (loading) return null;

    return (
        <div style={styles.overlay}>
            <Toaster position="top-center" />
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>Registrar Pago</h3>
                        <p style={styles.subtitle}>Compra #{compra.id_compra} • {compra.id_proveedor_nombre}</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                </div>
                
                <div style={styles.contentScroll}>
                    <div style={styles.cardsContainer}>
                        <div style={styles.cardInfo}><span style={styles.cardLabel}>Deuda Total</span><span style={styles.cardValue}>${saldoOriginal.toFixed(2)}</span></div>
                        <div style={styles.cardInfo}><span style={styles.cardLabel}>En Cola</span><span style={{...styles.cardValue, color: '#f59e0b'}}>${totalEnListaUSD.toFixed(2)}</span></div>
                        <div style={styles.cardInfo}><span style={styles.cardLabel}>Restante</span><span style={{...styles.cardValue, color: saldoRestanteUSD < 0.01 ? '#10b981' : '#ef4444'}}>${saldoRestanteUSD.toFixed(2)}</span></div>
                    </div>

                    <div style={styles.tasaBar}><span>🏦 <strong>Tasa BCV:</strong> {loadingTasa ? "..." : (tasaBCV ? `Bs. ${tasaBCV}` : "Manual")}</span></div>

                    {saldoRestanteUSD > 0.001 ? (
                        <div style={styles.formSection}>
                            <div style={styles.row}>
                                <div style={{flex: 2}}><label style={styles.label}>Método</label><select value={metodo} onChange={e=>setMetodo(e.target.value)} style={styles.select}>{METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
                                {isBolivares && (<div style={{flex: 1}}><label style={styles.label}>Tasa</label><input type="number" step="0.01" value={tasaInput} onChange={e=>setTasaInput(e.target.value)} style={styles.input} /></div>)}
                            </div>
                            <div style={styles.row}>
                                <div style={{flex: 1}}><label style={styles.label}>Monto ({isBolivares ? 'Bs' : '$'})</label><input type="number" step="0.01" value={montoInput} onChange={e=>setMontoInput(e.target.value)} style={styles.input} placeholder="0.00" /></div>
                                <div style={{flex: 1}}><label style={styles.label}>Referencia #</label><input type="text" value={referencia} onChange={e=>setReferencia(e.target.value)} style={styles.input} placeholder="Opcional" /></div>
                            </div>
                            <div style={styles.helperRow}>
                                <span style={{fontSize: '0.8rem', color: '#64748b'}}>{isBolivares && (!tasaInput || parseFloat(tasaInput) <= 0) ? (<span style={{color: '#f59e0b'}}>⚠️ Ingrese tasa para calcular</span>) : (<>Equivale a: <strong>${getValorEnUSD(montoInput, tasaInput).toFixed(2)}</strong></>)}</span>
                                <div style={{display:'flex', gap: 10}}>
                                    {(!isBolivares || (tasaInput && parseFloat(tasaInput) > 0)) && (<button type="button" onClick={handleFillRestante} style={styles.btnLink}>Pagar Todo</button>)}
                                    <button onClick={handleAddPago} style={styles.btnAdd} disabled={saldoRestanteUSD <= 0.00}>Agregar Pago</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.successBox}>✅ <strong>¡Orden Completada!</strong> No queda deuda pendiente.</div>
                    )}

                    {pagosACargar.length > 0 && (
                        <div style={styles.cartSection}>
                            <h4 style={styles.sectionTitle}>Pagos por procesar</h4>
                            <table style={styles.table}><tbody>{pagosACargar.map((p, i) => (<tr key={i} style={{background: '#f0f9ff'}}><td style={styles.td}>{p.label_metodo}</td><td style={styles.td}>{p.monto_local} {p.moneda}</td><td style={styles.td}>{p.tasa_cambio > 1 ? `@${p.tasa_cambio}` : ''}</td><td style={{...styles.td, fontWeight:'bold'}}>${p.monto_usd.toFixed(2)}</td><td style={{textAlign: 'right', paddingRight: 10}}><button onClick={()=>handleRemovePago(i)} style={styles.removeBtn}><IconTrash /></button></td></tr>))}</tbody></table>
                            <div style={{marginTop: 15, textAlign: 'right'}}><button onClick={handleFinalSubmit} style={styles.btnSubmit}>CONFIRMAR PAGOS</button></div>
                        </div>
                    )}

                    <h4 style={styles.sectionTitle}>Historial Registrado</h4>
                    <div style={styles.tableContainer}><table style={styles.table}><thead><tr style={styles.theadRow}><th style={styles.th}>Fecha</th><th style={styles.th}>Método</th><th style={{...styles.th, textAlign: 'right'}}>Local</th><th style={{...styles.th, textAlign: 'right'}}>USD</th></tr></thead><tbody>{historial.length > 0 ? (historial.map((p) => (<tr key={p.id_pago} style={styles.tr}><td style={styles.td}>{p.fecha_pago}</td><td style={styles.td}>{p.metodo_pago.replace(/_/g, ' ')}{p.referencia && <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>{p.referencia}</div>}</td><td style={{...styles.td, textAlign: 'right'}}>{p.moneda === 'VES' ? `Bs ${parseFloat(p.monto_local).toFixed(2)}` : '-'}</td><td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#059669'}}>${p.monto}</td></tr>))) : (<tr><td colSpan="4" style={{padding: 20, textAlign: 'center', color: '#94a3b8'}}>Sin pagos previos</td></tr>)}</tbody></table></div>
                </div>
            </div>
        </div>
    );
}

// 🚨 CORRECCIÓN: Z-Index 20000 para tapar el Navbar (9999)
const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20000 },
    modal: { background: '#fff', width: '650px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
    header: { padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
    title: { margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' },
    subtitle: { margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' },
    closeBtn: { background:'none', border:'none', cursor:'pointer', color:'#94a3b8' },
    contentScroll: { padding: '24px', overflowY: 'auto', flex: 1 },
    cardsContainer: { display: 'flex', gap: 12, marginBottom: 20 },
    cardInfo: { flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, textAlign: 'center', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' },
    cardLabel: { display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: '600' },
    cardValue: { fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' },
    tasaBar: { background: '#eff6ff', color: '#1e40af', padding: '10px 16px', borderRadius: 8, fontSize: '0.9rem', marginBottom: 20, border: '1px solid #dbeafe' },
    formSection: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 20, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' },
    row: { display: 'flex', gap: 16, marginBottom: 12 },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: 6 },
    input: { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing:'border-box', outline: 'none' },
    select: { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff', boxSizing:'border-box' },
    helperRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    btnLink: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
    btnAdd: { background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
    successBox: { background: '#ecfdf5', color: '#065f46', padding: 16, borderRadius: 10, textAlign: 'center', marginBottom: 20, border: '1px solid #a7f3d0' },
    sectionTitle: { fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10, marginTop: 0 },
    cartSection: { marginBottom: 24, borderTop: '1px dashed #cbd5e1', paddingTop: 16 },
    tableContainer: { border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
    theadRow: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '10px 16px', color: '#334155' },
    removeBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 },
    btnSubmit: { background: '#16a34a', color: '#fff', width: '100%', border: 'none', padding: '12px', borderRadius: 8, fontWeight: '700', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)' }
};

export default RegisterPaymentModal;