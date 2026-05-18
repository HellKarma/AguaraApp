import React, { useState, useEffect } from 'react';
import { useAguaraStore } from '../store/aguaraStore';
import { Clock, CheckCircle2, Flame, Utensils, History, ChevronLeft } from 'lucide-react';

export default function KDS() {
    const { kitchenQueue, tables, removeFromKitchen, orderHistory } = useAguaraStore();
    const [view, setView] = useState('live'); // 'live' or 'history'

    const getTableById = (id) => tables.find(t => t.id === Number(id));
    const liveOrders = Object.entries(kitchenQueue);

    return (
        <div className="page-container" style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="title-xl font-serif" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
                        {view === 'live' ? 'La Comanda' : 'El Historial'}
                    </h2>
                    <p className="text-mystic" style={{ opacity: 0.6 }}>
                        {view === 'live' ? 'Panel de control de la cocina ancestral.' : 'Registro de las brasas que ya pasaron.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setView(view === 'live' ? 'history' : 'live')}
                        className="obsidian-card"
                        style={{
                            padding: '1rem 2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            cursor: 'pointer',
                            border: '1px solid var(--fire-orange)',
                            color: 'white'
                        }}
                    >
                        {view === 'live' ? <History size={20} color="var(--fire-orange)" /> : <ChevronLeft size={20} color="var(--fire-orange)" />}
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                            {view === 'live' ? 'Ver Historial' : 'Volver al Fuego'}
                        </span>
                    </button>
                    {view === 'live' && (
                        <div className="obsidian-card" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Flame size={20} color="var(--fire-orange)" className="pulsate" />
                            <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1rem' }}>
                                {liveOrders.reduce((acc, [_, items]) => acc + items.length, 0)} Platos
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {view === 'live' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {liveOrders.map(([tableId, items]) => {
                        const table = getTableById(tableId);
                        return (
                            <div key={tableId} className="obsidian-card" style={{
                                padding: '0', borderTop: '4px solid var(--fire-orange)', display: 'flex', flexDirection: 'column'
                            }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 className="font-serif" style={{ fontSize: '1.5rem' }}>{table?.name || `Mesa ${tableId}`}</h3>
                                    <Clock size={20} color="var(--fire-orange)" />
                                </div>

                                <div style={{ padding: '1.5rem', flex: 1 }}>
                                    {items.map((item, idx) => (
                                        <KitchenItemCard
                                            key={`${tableId}-${idx}`}
                                            item={item}
                                            onFinish={() => removeFromKitchen(tableId, idx)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {liveOrders.length === 0 && <EmptyState message="Fuego en calma. No hay comandas." />}
                </div>
            ) : (
                <div className="obsidian-card" style={{ padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1.5rem' }}>MESA</th>
                                <th style={{ padding: '1.5rem' }}>PLATILLO</th>
                                <th style={{ padding: '1.5rem' }}>ENTRADA</th>
                                <th style={{ padding: '1.5rem' }}>SALIDA</th>
                                <th style={{ padding: '1.5rem' }}>DURACIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderHistory.map((entry, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '1.2rem 1.5rem', fontWeight: 700 }}>{entry.tableName}</td>
                                    <td style={{ padding: '1.2rem 1.5rem' }}>{entry.quantity}x {entry.name}</td>
                                    <td style={{ padding: '1.2rem 1.5rem', opacity: 0.6 }}>{new Date(entry.startTime).toLocaleTimeString()}</td>
                                    <td style={{ padding: '1.2rem 1.5rem', opacity: 0.6 }}>{new Date(entry.endTime).toLocaleTimeString()}</td>
                                    <td style={{ padding: '1.2rem 1.5rem' }}>
                                        {(() => {
                                            const mins = Math.floor(entry.durationSeconds / 60);
                                            const secs = entry.durationSeconds % 60;
                                            const isSlow = mins >= 15;
                                            return (
                                                <span style={{
                                                    background: isSlow ? 'rgba(212, 32, 0, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                                                    color: isSlow ? 'var(--fire-orange)' : '#22c55e',
                                                    padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800
                                                }}>
                                                    {mins > 0 ? `${mins}m ` : ''}{secs}s
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            ))}
                            {orderHistory.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', opacity: 0.3 }}>Aún no hay historia en este turno.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function KitchenItemCard({ item, onFinish }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = new Date(item.startTime).getTime();
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [item.startTime]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const isLate = elapsed > 900; // 15 mins

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '4px',
                    background: 'rgba(255, 69, 0, 0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: 'var(--fire-orange)'
                }}>
                    {item.quantity || 1}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{item.name}</span>
                    <span style={{
                        fontSize: '0.75rem',
                        color: isLate ? 'var(--fire-orange)' : 'var(--text-muted)',
                        fontWeight: isLate ? 800 : 400,
                        display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}>
                        <Clock size={12} /> {formatTime(elapsed)}
                    </span>
                </div>
            </div>
            <button
                onClick={onFinish}
                style={{
                    background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e',
                    color: '#22c55e', borderRadius: '4px', padding: '0.4rem', cursor: 'pointer'
                }}
            >
                <CheckCircle2 size={18} />
            </button>
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="obsidian-card" style={{ gridColumn: '1 / -1', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
            <Utensils size={64} style={{ marginBottom: '1.5rem' }} />
            <p className="font-serif" style={{ fontSize: '1.5rem' }}>{message}</p>
        </div>
    );
}
