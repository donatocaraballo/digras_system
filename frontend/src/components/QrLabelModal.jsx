// frontend/src/components/QrLabelModal.jsx

import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function QrLabelModal({ lote, onClose, productName }) {
    const labelRef = useRef();
    const [qrImage, setQrImage] = useState(null);
    
    // Estados para posicionar la etiqueta en la hoja (simulación cm -> px)
    const [marginTop, setMarginTop] = useState(10); 
    const [marginLeft, setMarginLeft] = useState(10);

    // Convertir Canvas a Imagen para asegurar impresión
    useEffect(() => {
        const canvas = document.getElementById('qr-canvas-el');
        if(canvas) {
            setQrImage(canvas.toDataURL("image/png"));
        }
    }, [lote]);

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        const content = labelRef.current.innerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir Etiqueta - ${lote.numero_lote}</title>
                    <style>
                        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                        /* Aplicamos los márgenes configurados al contenedor principal */
                        .print-container {
                            margin-top: ${marginTop}mm;
                            margin-left: ${marginLeft}mm;
                        }
                        /* Estilos exactos de la etiqueta para impresión */
                        .label-box {
                            width: 8cm;
                            height: 5cm;
                            border: 2px solid #000;
                            padding: 10px;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            page-break-inside: avoid;
                        }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 5px; }
                        .brand { font-weight: 900; font-size: 14pt; }
                        .date { font-size: 8pt; align-self: center; }
                        .product-name { font-size: 12pt; font-weight: bold; text-align: center; margin: 5px 0; white-space: nowrap; overflow: hidden; }
                        .body { display: flex; gap: 10px; align-items: center; height: 100%; }
                        .qr-img { width: 2.5cm; height: 2.5cm; }
                        .info { font-size: 10pt; line-height: 1.4; flex: 1; }
                        .info p { margin: 2px 0; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${content}
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Esperar a que cargue la imagen (si la hay) antes de imprimir
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    // Datos para el QR
    const qrData = JSON.stringify({
        id: lote.id_lote,
        lote: lote.numero_lote,
        prod: productName.substring(0, 20), // Cortar nombre para ahorrar data
        v: lote.fecha_vencimiento
    });

    return (
        <div style={styles.overlay}>
            {/* 🚨 MODAL RESPONSIVO */}
            <div className="modal-content-responsive" style={{maxWidth: '600px', display:'flex', flexDirection:'column', gap:'20px'}}>
                
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                    <h3 style={{margin:0, color: '#0f172a'}}>🖨️ Configurar Impresión</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.controlsArea}>
                    <div style={styles.controlGroup}>
                        <label style={{fontSize: '0.85rem', fontWeight: 600, color: '#64748b'}}>Margen Superior (mm):</label>
                        <input 
                            type="number" 
                            value={marginTop} 
                            onChange={(e) => setMarginTop(Number(e.target.value))} 
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.controlGroup}>
                        <label style={{fontSize: '0.85rem', fontWeight: 600, color: '#64748b'}}>Margen Izquierdo (mm):</label>
                        <input 
                            type="number" 
                            value={marginLeft} 
                            onChange={(e) => setMarginLeft(Number(e.target.value))} 
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* Previsualización en Pantalla (Hoja Virtual) */}
                <div style={styles.previewSheet}>
                    <p style={{position:'absolute', top:5, left:5, margin:0, fontSize:'0.7rem', color:'#999'}}>Vista Previa (Hoja A4)</p>
                    
                    {/* Elemento que se moverá */}
                    <div style={{
                        marginTop: `${marginTop}px`, // En pantalla 1mm ~= 1px para preview simple
                        marginLeft: `${marginLeft}px`,
                        transition: 'all 0.2s ease'
                    }}>
                        {/* Contenido REAL a imprimir (referenciado) */}
                        <div ref={labelRef}>
                            <div className="label-box" style={styles.labelBox}>
                                <div className="header" style={styles.labelHeader}>
                                    <span className="brand" style={{fontWeight:900, fontSize:'1.2rem'}}>DIGRAS</span>
                                    <span className="date" style={{fontSize:'0.7rem'}}>Ingreso: {lote.fecha_pedido}</span>
                                </div>
                                
                                <div className="product-name" style={{textAlign:'center', fontWeight:'bold', fontSize:'1rem', margin:'5px 0'}}>
                                    {productName.substring(0,25)}{productName.length>25?'...':''}
                                </div>

                                <div className="body" style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                    {/* QR Renderizado como IMAGEN para impresión segura */}
                                    {qrImage ? (
                                        <img src={qrImage} alt="QR" className="qr-img" style={{width:'80px', height:'80px'}} />
                                    ) : (
                                        <div style={{width:80, height:80, background:'#eee'}}>Generando...</div>
                                    )}
                                    
                                    <div className="info" style={{fontSize:'0.8rem', lineHeight:1.3}}>
                                        <p style={{margin:'2px 0'}}><strong>LOTE:</strong> {lote.numero_lote}</p>
                                        <p style={{margin:'2px 0'}}><strong>CANT:</strong> {lote.cantidad} Und.</p>
                                        <p style={{margin:'2px 0', color: '#d32f2f'}}><strong>VENCE:</strong> {lote.fecha_vencimiento || 'N/A'}</p>
                                        <p style={{fontSize:'0.7em', color:'#666', marginTop:4}}>#{lote.id_lote}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.actions}>
                    <button onClick={handlePrint} style={styles.printBtn}>
                        Imprimir Etiqueta
                    </button>
                </div>

                {/* Canvas oculto para generar la imagen del QR */}
                <div style={{display:'none'}}>
                    <QRCodeCanvas id="qr-canvas-el" value={qrData} size={200} level={"H"} />
                </div>

            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 9999999, // Muy alto para tapar todo
        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
    },
    // El modal principal se controla por clase CSS .modal-content-responsive
    
    closeBtn: {
        border: 'none', background: '#f1f5f9', borderRadius:'50%', width:'30px', height:'30px',
        cursor: 'pointer', color: '#64748b', fontWeight: 'bold', fontSize:'1.2rem', lineHeight:1
    },
    
    // Controles de posición (Responsive Flex)
    controlsArea: {
        display: 'flex', gap: '20px', padding: '15px', backgroundColor: '#f8fafc', 
        borderRadius: '8px', border: '1px solid #e2e8f0', justifyContent:'center', flexWrap: 'wrap'
    },
    controlGroup: { display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' },
    input: { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '80px', textAlign:'center' },

    // Hoja de Vista Previa
    previewSheet: {
        width: '100%', height: '300px', backgroundColor: '#fff', 
        border: '1px solid #ccc', position: 'relative', overflow: 'hidden',
        backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)',
        backgroundSize: '20px 20px', // Cuadrícula de guia
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
    },

    // Estilos Visuales de la Etiqueta (Preview)
    labelBox: {
        width: '300px', height: '180px', backgroundColor: 'white',
        border: '2px solid #000', padding: '10px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    },
    labelHeader: {
        display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000',
        paddingBottom: '5px', marginBottom: '5px'
    },

    actions: { textAlign: 'right', borderTop:'1px solid #eee', paddingTop:'15px' },
    printBtn: {
        padding: '12px 24px', backgroundColor: '#0f172a', color: 'white',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
        fontSize: '1rem', display:'flex', alignItems:'center', gap:'8px', marginLeft:'auto',
        width: '100%', justifyContent: 'center' // Botón ancho en móvil
    }
};

export default QrLabelModal;