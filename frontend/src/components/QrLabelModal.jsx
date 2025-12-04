// frontend/src/components/QrLabelModal.jsx

import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function QrLabelModal({ lote, onClose, productName }) {
    const labelRef = useRef();

    const handlePrint = () => {
        const printContent = labelRef.current.innerHTML;
        const originalContent = document.body.innerHTML;
        
        // Truco simple para imprimir solo la etiqueta
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Recargar para restaurar eventos de React
    };

    // Datos para el QR (JSON simple)
    const qrData = JSON.stringify({
        id: lote.id_lote,
        lote: lote.numero_lote,
        prod: productName,
        vence: lote.fecha_vencimiento
    });

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeBtn}>X</button>
                <h3 style={{textAlign: 'center', color: '#333'}}>Etiqueta de Trazabilidad</h3>
                
                {/* ÁREA IMPRIMIBLE */}
                <div ref={labelRef} style={styles.printArea}>
                    <div style={styles.labelContainer}>
                        <div style={styles.header}>
                            <span style={styles.brand}>DIGRAS</span>
                            <span style={styles.date}>Ingreso: {lote.fecha_pedido}</span>
                        </div>
                        
                        <h2 style={styles.productName}>{productName}</h2>
                        
                        <div style={styles.body}>
                            <div style={styles.qrWrapper}>
                                <QRCodeCanvas value={qrData} size={90} />
                            </div>
                            <div style={styles.info}>
                                <p><strong>LOTE:</strong> {lote.numero_lote}</p>
                                <p><strong>CANT:</strong> {lote.cantidad} Unid.</p>
                                <p style={{color: '#d32f2f'}}><strong>VENCE:</strong> {lote.fecha_vencimiento || 'N/A'}</p>
                                <p style={{fontSize: '0.7em', marginTop: '5px'}}>ID Interno: #{lote.id_lote}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.actions}>
                    <button onClick={handlePrint} style={styles.printBtn}>🖨️ Imprimir Etiqueta</button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 5000,
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    modal: {
        backgroundColor: 'white', padding: '20px', borderRadius: '10px', width: '400px',
        position: 'relative'
    },
    closeBtn: {
        position: 'absolute', top: 10, right: 10, border: 'none', background: 'none',
        fontSize: '1.2em', cursor: 'pointer'
    },
    // Estilos de la Etiqueta (Simulando una etiqueta adhesiva de 10x6cm aprox)
    printArea: {
        display: 'flex', justifyContent: 'center', padding: '20px',
        backgroundColor: '#f0f0f0', borderRadius: '5px', margin: '15px 0'
    },
    labelContainer: {
        width: '300px', height: '180px', backgroundColor: 'white',
        border: '2px solid #000', padding: '10px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        fontFamily: 'Arial, sans-serif'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000',
        paddingBottom: '5px', marginBottom: '5px'
    },
    brand: { fontWeight: '900', fontSize: '1.1em' },
    date: { fontSize: '0.7em' },
    productName: {
        fontSize: '1.1em', margin: '0 0 5px 0', textAlign: 'center',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
    },
    body: { display: 'flex', gap: '10px', alignItems: 'center' },
    qrWrapper: { border: '1px solid #eee' },
    info: { fontSize: '0.85em', lineHeight: '1.3' },
    
    actions: { textAlign: 'center' },
    printBtn: {
        padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white',
        border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
    }
};

export default QrLabelModal;