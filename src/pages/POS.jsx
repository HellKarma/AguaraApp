import React, { useState } from 'react';
import { useAguaraStore } from '../store/aguaraStore';
import { User, DollarSign, Clock, Check, Truck, Wallet, CreditCard, ArrowRight, AlertCircle, Package, Smartphone, CheckCircle2 } from 'lucide-react';
import { OrderDrawer } from '../components/OrderDrawer';
import { CheckoutModal } from '../components/CheckoutModal';

export default function POS() {
    const {
        tables, setTableStatus, activeOrders, activePriceListId,
        priceLists, setActivePriceList, addItemToOrder,
        deliveryMetadata, updateDeliveryMetadata, removeOrder
    } = useAguaraStore();
    const [selectedTable, setSelectedTable] = useState(null);
    const [checkoutTable, setCheckoutTable] = useState(null);

    const isDeliveryMode = activePriceListId === 'delivery' || activePriceListId === 'mostrador';

    const getStatusColor = (status) => {
        switch (status) {
            case 'occupied': return 'var(--fire-orange)';
            case 'paying': return 'var(--amber-warm)';
            case 'available': return 'rgba(255,255,255,0.05)';
            default: return 'rgba(255,255,255,0.05)';
        }
    };

    // Extract non-table orders (Delivery/Mostrador)
    const deliveryOrders = Object.entries(activeOrders)
        .filter(([id]) => String(id).startsWith('del_'))
        .map(([id, items]) => ({ id, items, name: `Pedido #${id.split('_')[1]}` }));

    return (
        <div className="page-container" style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="title-xl font-serif" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                        {isDeliveryMode ? 'Delivery & Mostrador' : 'El Salón'}
                    </h2>
                    <p className="text-mystic" style={{ opacity: 0.6 }}>
                        {activePriceListId === 'delivery' ? 'Control central de pedidos externos y despacho.' :
                            activePriceListId === 'mostrador' ? 'Ventas directas por mostrador.' :
                                'Mapa de brasas interactivas en tiempo real.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05rem', textAlign: 'right' }}>Tarifa Activa</span>
                        <select
                            value={activePriceListId}
                            onChange={e => setActivePriceList(e.target.value)}
                            style={{
                                background: 'rgba(255, 69, 0, 0.1)', border: '1px solid var(--fire-orange)', color: 'white',
                                padding: '0.5rem 1rem', borderRadius: '4px', outline: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem'
                            }}
                        >
                            {priceLists.map(l => <option key={l.id} value={l.id} style={{ background: 'black' }}>{l.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    {!isDeliveryMode && (
                        <div className="obsidian-card" style={{ padding: '1rem 2rem', display: 'flex', gap: '2rem', height: 'fit-content' }}>
                            <LegendItem color="rgba(255,255,255,0.05)" label="Libre" />
                            <LegendItem color="var(--fire-orange)" label="Ocupada" glow />
                            <LegendItem color="var(--amber-warm)" label="Pagando" glow />
                        </div>
                    )}
                    {isDeliveryMode && (
                        <button
                            onClick={() => setSelectedTable({ id: `del_${Date.now()}`, name: activePriceListId === 'mostrador' ? 'Venta Mostrador' : 'Nuevo Pedido Delivery' })}
                            className="primary-button"
                            style={{ padding: '1rem 2rem', fontWeight: 900 }}
                        >
                            + {activePriceListId === 'mostrador' ? 'NUEVA VENTA' : 'NUEVO PEDIDO'}
                        </button>
                    )}
                </div>
            </header>

            {/* View Switcher Content */}
            {!isDeliveryMode ? (
                /* Interactive Floor Plan */
                <div className="obsidian-card" style={{
                    width: '100%',
                    height: '600px',
                    position: 'relative',
                    background: 'rgba(255,255,255,0.01)',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.02)'
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        pointerEvents: 'none'
                    }} />

                    {tables.map(table => (
                        <div
                            key={table.id}
                            onClick={() => {
                                if (table.status === 'available') {
                                    setTableStatus(table.id, 'occupied');
                                } else if (table.status === 'paying') {
                                    setCheckoutTable(table);
                                } else {
                                    setSelectedTable(table);
                                }
                            }}
                            className="obsidian-card table-item"
                            style={{
                                position: 'absolute',
                                left: `${table.position.x}%`,
                                top: `${table.position.y}%`,
                                width: table.shape === 'rect' ? '120px' : '80px',
                                height: '80px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem',
                                backgroundColor: getStatusColor(table.status),
                                borderColor: table.status !== 'available' ? 'var(--fire-orange)' : 'rgba(255,255,255,0.1)',
                                boxShadow: table.status !== 'available' ? '0 0 20px rgba(255, 69, 0, 0.3)' : 'var(--shadow-carved)',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                borderRadius: table.shape === 'round' ? '50%' : 'var(--radius-tribal)',
                                padding: '0'
                            }}
                        >
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                color: table.status === 'available' ? 'var(--text-muted)' : 'white',
                                textShadow: table.status !== 'available' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                            }}>
                                {table.name}
                            </span>
                            {table.status === 'occupied' && <User size={14} color="white" />}
                            {table.status === 'paying' && <DollarSign size={14} color="white" />}
                        </div>
                    ))}
                </div>
            ) : (
                /* Delivery List View */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {deliveryOrders.map(order => {
                        const meta = deliveryMetadata[order.id] || {};
                        const isReady = order.items.length > 0 && order.items.every(i => i.status === 'ready');
                        const isShipped = meta.deliveryStatus === 'shipped';

                        return (
                            <div
                                key={order.id}
                                className="obsidian-card"
                                style={{
                                    padding: '1.5rem',
                                    borderLeft: `4px solid ${isShipped ? '#444' : (isReady ? '#22c55e' : 'var(--fire-orange)')}`,
                                    boxShadow: isReady && !isShipped ? '0 0 20px rgba(34, 197, 94, 0.2)' : 'none',
                                    transition: 'all 0.3s',
                                    opacity: isShipped ? 0.6 : 1
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{order.name}</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            {isReady && !isShipped && <span style={{ fontSize: '0.6rem', background: '#22c55e', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900 }}>{activePriceListId === 'mostrador' ? 'LISTO PARA ENTREGAR' : 'LISTO PARA EMPACAR'}</span>}
                                            {isShipped && <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900 }}>{activePriceListId === 'mostrador' ? 'ENTREGADO' : 'EN CAMINO'}</span>}
                                        </div>
                                    </div>
                                    <Clock size={16} opacity={0.4} />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                                        {order.items.length} items - Total: <strong>${order.items.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</strong>
                                    </div>

                                    {/* Payment Info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {meta.paymentMethod === 'transfer' ? <ArrowRight size={14} /> : meta.paymentMethod === 'card' ? <CreditCard size={14} /> : meta.paymentMethod === 'mp' ? <Smartphone size={14} /> : <Wallet size={14} />}
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                {meta.paymentMethod === 'transfer' ? 'Transferencia' : meta.paymentMethod === 'card' ? 'Tarjeta' : meta.paymentMethod === 'mp' ? 'M. Pago' : 'Efectivo'}
                                            </span>
                                        </div>
                                        <div
                                            onClick={() => updateDeliveryMetadata(order.id, { isPaid: !meta.isPaid })}
                                            style={{
                                                marginLeft: 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800,
                                                background: meta.isPaid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 69, 0, 0.1)',
                                                color: meta.isPaid ? '#22c55e' : 'var(--fire-orange)',
                                                border: `1px solid ${meta.isPaid ? '#22c55e' : 'var(--fire-orange)'}`
                                            }}
                                        >
                                            {meta.isPaid ? <Check size={12} /> : <AlertCircle size={12} />}
                                            {meta.isPaid ? 'PAGADO' : 'PENDIENTE'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setSelectedTable({ id: order.id, name: order.name })} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>EDITAR</button>

                                    {!isShipped ? (
                                        <button
                                            disabled={!isReady}
                                            onClick={() => {
                                                if (activePriceListId === 'mostrador') {
                                                    if (meta.isPaid) {
                                                        removeOrder(order.id, { method: meta.paymentMethod || 'cash', tableName: order.name });
                                                    } else {
                                                        setCheckoutTable({ id: order.id, name: order.name });
                                                    }
                                                } else {
                                                    updateDeliveryMetadata(order.id, { deliveryStatus: 'shipped' });
                                                }
                                            }}
                                            className="primary-button"
                                            style={{
                                                flex: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                fontWeight: 900,
                                                fontSize: '0.7rem',
                                                opacity: isReady ? 1 : 0.4,
                                                cursor: isReady ? 'pointer' : 'not-allowed',
                                                filter: isReady ? 'none' : 'grayscale(0.5)'
                                            }}
                                            title={!isReady ? "Aún hay productos en producción" : (activePriceListId === 'mostrador' ? "Entregar pedido" : "Marcar como enviado")}
                                        >
                                            {activePriceListId === 'mostrador' ? <CheckCircle2 size={14} /> : <Truck size={14} />}
                                            {activePriceListId === 'mostrador' ? 'ENTREGAR' : 'ENVIAR'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (meta.isPaid) {
                                                    removeOrder(order.id, { method: meta.paymentMethod || 'cash', tableName: order.name });
                                                } else {
                                                    setCheckoutTable({ id: order.id, name: order.name });
                                                }
                                            }}
                                            className="primary-button"
                                            style={{ flex: 1.5, background: '#22c55e', fontWeight: 900, fontSize: '0.7rem' }}
                                        >
                                            CONCLUIR
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {deliveryOrders.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', opacity: 0.2 }}>
                            <Package size={48} style={{ marginBottom: '1rem' }} />
                            <p>No hay pedidos de delivery activos.</p>
                        </div>
                    )}
                </div>
            )}

            {selectedTable && (
                <OrderDrawer
                    table={selectedTable}
                    onClose={() => setSelectedTable(null)}
                    onCheckout={(table) => {
                        setSelectedTable(null);
                        setCheckoutTable(table);
                    }}
                />
            )}

            {checkoutTable && (
                <CheckoutModal
                    table={checkoutTable}
                    order={activeOrders[checkoutTable.id] || []}
                    onClose={() => setCheckoutTable(null)}
                />
            )}

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    * {isDeliveryMode ? (activePriceListId === 'mostrador' ? 'Gestiona las ventas directas desde esta lista.' : 'Gestiona los pedidos de delivery desde esta lista.') : 'Haz clic en una mesa para alternar su estado simbólicamente.'}
                </p>
            </div>
        </div>
    );
}

function LegendItem({ color, label, glow }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: color,
                boxShadow: glow ? `0 0 10px ${color}` : 'none'
            }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1rem', fontWeight: 700 }}>{label}</span>
        </div>
    );
}
