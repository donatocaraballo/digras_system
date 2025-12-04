// frontend/src/components/RegisterPaymentModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const COMPRAS_URL = '/api/compras/compras/';
// API local (Proxy)
const API_TASA_LOCAL = '/base/tasa-dolar/';

const METODOS_PAGO = [
    { value: 'TRANSFERENCIA_BS', label: 'Transferencia (Bs)', currency: 'VES' },
    { value: 'PAGO_MOVIL', label: 'Pago Móvil', currency: 'VES' },
    { value: 'EFECTIVO_BS', label: 'Efectivo (Bs)', currency: 'VES' },
    { value: 'TRANSFERENCIA_USD', label: 'Transf. Internacional ($)', currency: 'USD' },
    { value: 'EFECTIVO_USD', label: 'Efectivo ($)', currency: 'USD' },
    { value: 'ZELLE', label: 'Zelle ($)', currency: 'USD' },
];

function RegisterPaymentModal({ compra, onClose, onSuccess }) {
    // Estados de Datos
    const [historial, setHistorial] = useState([]);
    const [saldoOriginal, setSaldoOriginal] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Estado de la Tasa
    const [tasaBCV, setTasaBCV] = useState(null);
    const [loadingTasa, setLoadingTasa] = useState(true);

    // Formulario
    const [metodo, setMetodo] = useState(METODOS_PAGO[0].value);
    const [montoInput, setMontoInput] = useState('');
    const [tasaInput, setTasaInput] = useState('');
    const [referencia, setReferencia] = useState('');
    
    // Carrito
    const [pagosACargar, setPagosACargar] = useState([]);

    // --- Cálculos Dinámicos ---
    const currentMethodInfo = METODOS_PAGO.find(m => m.value === metodo);
    const isBolivares = currentMethodInfo?.currency === 'VES';

    const totalEnListaUSD = pagosACargar.reduce((acc, p) => acc + p.monto_usd, 0);
    const saldoRestanteUSD = Math.max(0, saldoOriginal - totalEnListaUSD);

    // Cálculo Inverso: ¿Cuánto debo en Bs?
    const saldoRestanteLocal = isBolivares && tasaInput && parseFloat(tasaInput) > 0
        ? (saldoRestanteUSD * parseFloat(tasaInput)) 
        : 0;

    const getValorEnUSD = (montoLocal, tasa) => {
        const monto = parseFloat(montoLocal);
        if (!monto) return 0;
        if (!isBolivares) return monto;
        const tasaFinal = parseFloat(tasa);
        if (!tasaFinal || tasaFinal === 0) return 0;
        return monto / tasaFinal;
    };

    // --- 1. Cargar Datos ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resCompra = await axios.get(`${COMPRAS_URL}${compra.id_compra}/`);
                setHistorial(resCompra.data.pagos || []);
                setSaldoOriginal(parseFloat(resCompra.data.saldo_pendiente || 0));
            } catch (err) {
                console.error("Error al cargar compra:", err);
                toast.error("Error al cargar datos de la compra.");
            } finally {
                setLoading(false);
            }
        };

        const fetchTasa = async () => {
            try {
                setLoadingTasa(true);
                const response = await axios.get(`http://127.0.0.1:8000/api${API_TASA_LOCAL}`);
                
                const tasa = response.data.promedio || response.data.price; 
                if (tasa) {
                    setTasaBCV(tasa);
                    setTasaInput(tasa);
                }
            } catch (e) {
                console.error("Error tasa:", e);
                toast('Usando tasa manual', { icon: '⚠️' });
                setTasaBCV(null);
            } finally {
                setLoadingTasa(false);
            }
        };

        fetchData();
        fetchTasa();
    }, [compra]);

    // --- Handlers ---

    const handleFillRestante = () => {
        if (saldoRestanteLocal > 0) {
            setMontoInput(saldoRestanteLocal.toFixed(2));
        } else if (!isBolivares && saldoRestanteUSD > 0) {
             setMontoInput(saldoRestanteUSD.toFixed(2));
        }
    };

    const handleAddPago = () => {
        const valorLocal = parseFloat(montoInput);
        const tasa = parseFloat(tasaInput);
        
        if (!valorLocal || valorLocal <= 0) return toast.error("Ingrese un monto válido.");
        if (isBolivares && (!tasa || tasa <= 0)) return toast.error("Ingrese una tasa válida.");

        const valorUSD = getValorEnUSD(valorLocal, tasa);

        if (valorUSD > (saldoRestanteUSD + 0.05)) { 
            return toast.error(`El monto excede el saldo restante ($${saldoRestanteUSD.toFixed(2)}).`);
        }

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
        toast.success("Pago agregado a la lista", { duration: 2000 });
    };

    const handleRemovePago = (index) => {
        const newPagos = [...pagosACargar];
        newPagos.splice(index, 1);
        setPagosACargar(newPagos);
        toast.dismiss(); // Limpia notificaciones previas
        toast("Pago eliminado de la lista", { icon: '🗑️' });
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
            await axios.post(`${COMPRAS_URL}${compra.id_compra}/registrar_pago/`, payload);
            toast.dismiss(loadingToast); // Quitar loading
            toast.success("¡Pagos registrados correctamente!", { duration: 4000 });
            onSuccess();
            onClose();
        } catch (err) {
            toast.dismiss(loadingToast);
            const msg = err.response?.data?.error || "Error al procesar.";
            toast.error(`Error: ${msg}`, { duration: 5000 }); // 🚨 ERROR
        }
    };

    if (loading) return <div style={overlayStyle}><div style={contentStyle}><p>Cargando...</p></div></div>;

    return (
        <div style={overlayStyle}>
            <div style={contentStyle}>
                <button onClick={onClose} style={closeBtnStyle}>X</button>
                <h3 style={{margin: '0 0 20px 0', color: '#2c3e50'}}>💰 Registrar Pago</h3>
                
                {/* Resumen */}
                <div style={infoBoxStyle}>
                    <div style={{flex: 1, textAlign: 'center'}}>
                        <small>Deuda Total</small><br/><strong>${saldoOriginal.toFixed(2)}</strong>
                    </div>
                    <div style={{flex: 1, textAlign: 'center', borderLeft: '1px solid #ccc'}}>
                        <small>En Cola</small><br/><strong style={{color: 'orange'}}>${totalEnListaUSD.toFixed(2)}</strong>
                    </div>
                    <div style={{flex: 1, textAlign: 'center', borderLeft: '1px solid #ccc'}}>
                        <small>Restante USD</small><br/>
                        <strong style={{color: saldoRestanteUSD < 0.01 ? 'green' : 'red'}}>
                            ${saldoRestanteUSD.toFixed(2)}
                        </strong>
                    </div>
                </div>

                {/* Tasa */}
                <div style={{marginBottom: '10px', padding: '8px', background: '#e3f2fd', borderRadius: '4px', color: '#0d47a1', fontSize: '0.9em', display: 'flex', justifyContent: 'space-between'}}>
                    <span>🏦 <strong>Tasa Oficial:</strong></span>
                    <strong>{loadingTasa ? "..." : (tasaBCV ? `Bs. ${tasaBCV}` : "Manual")}</strong>
                </div>

                {/* Formulario */}
                {saldoRestanteUSD > 0.001 ? (
                    <div style={formContainerStyle}>
                        <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                            <div style={{flex: 2}}>
                                <label style={labelStyle}>Método:</label>
                                <select value={metodo} onChange={e=>setMetodo(e.target.value)} style={inputStyle}>
                                    {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                            {isBolivares && (
                                <div style={{flex: 1}}>
                                    <label style={labelStyle}>Tasa:</label>
                                    <input type="number" step="0.01" value={tasaInput} onChange={e=>setTasaInput(e.target.value)} style={{...inputStyle, fontWeight: 'bold', color: '#2c3e50'}} />
                                </div>
                            )}
                        </div>

                        <div style={{display: 'flex', gap: '10px', marginBottom: '5px'}}>
                            <div style={{flex: 1}}>
                                <label style={labelStyle}>Monto ({isBolivares ? 'Bs' : '$'}):</label>
                                <input type="number" step="0.01" value={montoInput} onChange={e=>setMontoInput(e.target.value)} style={inputStyle} placeholder="0.00" />
                            </div>
                            <div style={{flex: 1}}>
                                 <label style={labelStyle}>Ref #:</label>
                                 <input type="text" value={referencia} onChange={e=>setReferencia(e.target.value)} style={inputStyle} placeholder="Opcional" />
                            </div>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                            <span style={{fontSize: '0.85em', color: '#666'}}>
                                {isBolivares && (!tasaInput || parseFloat(tasaInput) <= 0) ? (
                                    <span style={{color: 'orange'}}>⚠️ Ingresa tasa</span>
                                ) : (
                                    <>Restante: <strong>{isBolivares ? `Bs ${saldoRestanteLocal.toFixed(2)}` : `$${saldoRestanteUSD.toFixed(2)}`}</strong></>
                                )}
                            </span>
                            {(!isBolivares || (tasaInput && parseFloat(tasaInput) > 0)) && (
                                <button type="button" onClick={handleFillRestante} style={payAllBtnStyle}>
                                    Pagar Todo
                                </button>
                            )}
                        </div>

                        <div style={conversionBarStyle}>
                            <span style={{fontSize: '0.9em', color: '#555'}}>
                                Equivale a: <strong>${getValorEnUSD(montoInput, tasaInput).toFixed(2)}</strong>
                            </span>
                            <button onClick={handleAddPago} style={addBtnStyle} disabled={saldoRestanteUSD <= 0.00}>+ Agregar</button>
                        </div>
                    </div>
                ) : (
                    <div style={{padding: '10px', backgroundColor: '#dff0d8', color: '#3c763d', borderRadius: '5px', textAlign: 'center', marginBottom: '15px'}}>
                        <strong>¡Orden completada!</strong>
                    </div>
                )}

                {/* Lista de Historial */}
                <h4 style={sectionHeaderStyle}>Historial de Pagos</h4>
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={headerRowStyle}>
                                <th style={thStyle}>Fecha</th>
                                <th style={thStyle}>Método</th>
                                <th style={{...thStyle, textAlign: 'right'}}>Monto Local</th>
                                <th style={{...thStyle, textAlign: 'center'}}>Tasa</th>
                                <th style={{...thStyle, textAlign: 'right'}}>USD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.length > 0 ? (
                                historial.map((p) => (
                                    <tr key={p.id_pago} style={rowStyle}>
                                        <td style={tdStyle}>{p.fecha_pago}</td>
                                        <td style={tdStyle}>
                                            {p.metodo_pago.replace(/_/g, ' ').replace('TRANSFERENCIA', 'Transf.')}
                                            <div style={{fontSize: '0.8em', color: '#888'}}>{p.referencia || ''}</div>
                                        </td>
                                        <td style={{...tdStyle, textAlign: 'right'}}>
                                            {p.moneda === 'VES' ? `Bs ${parseFloat(p.monto_local).toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{...tdStyle, textAlign: 'center'}}>
                                            {p.moneda === 'VES' ? p.tasa_cambio : '-'}
                                        </td>
                                        <td style={{...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#2e7d32'}}>
                                            ${p.monto}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center', color: '#999'}}>No hay pagos previos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Lista de Carrito (Pagos por confirmar) */}
                {pagosACargar.length > 0 && (
                    <div style={{marginTop: '15px', borderTop: '1px dashed #ccc', paddingTop: '10px'}}>
                        <h5 style={{margin: '0 0 5px 0', fontSize: '0.9em'}}>Por procesar:</h5>
                        <table style={{width: '100%', fontSize: '0.85em'}}>
                            <tbody>
                                {pagosACargar.map((p, i) => (
                                    <tr key={i} style={{background: '#e3f2fd'}}>
                                        <td style={{padding: '5px'}}>{p.label_metodo}</td>
                                        <td style={{padding: '5px'}}>{p.monto_local} {p.moneda}</td>
                                        <td style={{padding: '5px'}}>{p.tasa_cambio > 1 ? `@${p.tasa_cambio}` : ''}</td>
                                        <td style={{padding: '5px', fontWeight: 'bold'}}>${p.monto_usd.toFixed(2)}</td>
                                        <td style={{textAlign: 'right'}}><button onClick={()=>handleRemovePago(i)} style={removeBtnStyle}>✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{marginTop: '10px', textAlign: 'right'}}>
                            <button onClick={handleFinalSubmit} style={submitBtnStyle}>✅ CONFIRMAR PAGOS</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- ESTILOS DEFINIDOS ---
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000 };
const contentStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const closeBtnStyle = { position: 'absolute', top: 15, right: 15, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2em', color: '#888' };

const infoBoxStyle = { display: 'flex', background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e9ecef' };
const infoItemStyle = { flex: 1, textAlign: 'center', borderRight: '1px solid #e9ecef' };

const sectionHeaderStyle = { margin: '15px 0 10px 0', fontSize: '0.95em', color: '#555', borderBottom: '1px solid #eee', paddingBottom: '5px' };
const tableContainerStyle = { maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px', marginBottom: '20px' };
const tableStyle = { width: '100%', fontSize: '0.85em', borderCollapse: 'collapse' };
const headerRowStyle = { background: '#f1f3f5', color: '#495057', position: 'sticky', top: 0 };
const rowStyle = { borderBottom: '1px solid #f8f9fa' };
const thStyle = { padding: '8px 10px', textAlign: 'left', fontWeight: '600' };
const tdStyle = { padding: '8px 10px', verticalAlign: 'middle' };

// 🚨 AQUÍ ESTÁ LA VARIABLE QUE FALTABA 🚨
const formContainerStyle = { border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' };
const tasaBarStyle = { marginBottom: '10px', padding: '8px', background: '#e3f2fd', borderRadius: '4px', color: '#0d47a1', fontSize: '0.9em' };
const conversionBarStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' };

const labelStyle = { display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: '4px', color: '#555' };
const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' };

const addBtnStyle = { padding: '6px 15px', backgroundColor: '#0288d1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', fontWeight: 'bold' };
const payAllBtnStyle = { marginLeft: '5px', padding: '0 10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' };
const submitBtnStyle = { width: '100%', padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em', marginTop: '5px' };
const removeBtnStyle = { color: '#c62828', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em' };

export default RegisterPaymentModal;