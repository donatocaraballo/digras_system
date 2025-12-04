// frontend/src/components/TableSkeleton.jsx

import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function TableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <SkeletonTheme baseColor="#f0f0f0" highlightColor="#e0e0e0">
            <div style={{ width: '100%', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Encabezado Falso */}
                <div style={{ display: 'flex', padding: '15px', backgroundColor: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
                    {Array(columns).fill(0).map((_, i) => (
                        <div key={i} style={{ flex: 1, paddingRight: '10px' }}>
                            <Skeleton height={20} width="60%" />
                        </div>
                    ))}
                </div>

                {/* Filas Falsas */}
                {Array(rows).fill(0).map((_, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'flex', padding: '15px', borderBottom: '1px solid #eee' }}>
                        {Array(columns).fill(0).map((_, colIndex) => (
                            <div key={colIndex} style={{ flex: 1, paddingRight: '10px' }}>
                                {colIndex === 0 ? (
                                    // Primera columna (Nombre) más ancha/doble línea
                                    <div>
                                        <Skeleton width="80%" />
                                        <Skeleton width="40%" height={10} style={{marginTop: 5}} />
                                    </div>
                                ) : (
                                    <Skeleton />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </SkeletonTheme>
    );
}

export default TableSkeleton;