import React, { useState, useRef, useEffect } from 'react';
import { useAguaraStore } from '../store/aguaraStore';
import { User, DollarSign, Clock, Check, Truck, Wallet, CreditCard, ArrowRight, AlertCircle, Package, Smartphone, CheckCircle2, Plus, Trash2, X, Edit3, Pencil } from 'lucide-react';
import { OrderDrawer } from '../components/OrderDrawer';
import { CheckoutModal } from '../components/CheckoutModal';

export default function POS() {
    const {
        tables, setTableStatus, activeOrders, activePriceListId,
        priceLists, setActivePriceList, addItemToOrder,
        deliveryMetadata, updateDeliveryMetadata, removeOrder,
        addTable, deleteTable, updateTable, persistTable, fetchTables, fetchActiveOrders
    } = useAguaraStore();
    const [selectedTable, setSelectedTable] = useState(null);

    useEffect(() => {
        fetchTables();
        fetchActiveOrders();
    }, []);
    const [checkoutTable, setCheckoutTable] = useState(null);
    const [tableModal, setTableModal] = useState(false);
    const [newTableForm, setNewTableForm] = useState({ name: '', shape: 'square' });
    const [editMode, setEditMode] = useState(false);
    const containerRef = useRef(null);
    const dragRef = useRef(null);

    const isDeliveryMode = activePriceListId === 'delivery' || activePriceListId === 'mostrador';

    const startDrag = (e, tableId) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const table = tables.find(t => t.id === tableId);
        dragRef.current = { tableId, startX: e.clientX, startY: e.clientY, startPosX: table.position.x, startPosY: table.position.y };
    };

    const handlePointerMove = (e) => {
        if (!dragRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
        const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
        updateTable(dragRef.current.tableId, {
            position: {
                x: Math.max(0, Math.min(85, dragRef.current.startPosX + dx)),
                y: Math.max(0, Math.min(85, dragRef.current.startPosY + dy))
            }
        });
    };

    const handlePointerUp = () => {
        if (dragRef.current) persistTable(dragRef.current.tableId);
        dragRef.current = null;
    };

    const cycleShape = (e, table) => {
        e.stopPropagation();
        const shapes = ['square', 'round', 'rect'];
        const newShape = shapes[(shapes.indexOf(table.shape) + 1) % shapes.length];
        updateTable(table.id, { shape: newShape });
        persistTable(table.id);
    };

    const renameTable = (e, table) => {
        e.stopPropagation();
        const name = prompt('Nuevo nombre:', table.name);
        if (name && name.trim()) {
            updateTable(table.id, { name: name.trim() });
            persistTable(table.id);
        }
    };

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
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div className="obsidian-card" style={{ padding: '1rem 2rem', display: 'flex', gap: '2rem', height: 'fit-content' }}>
                                <LegendItem color="rgba(255,255,255,0.05)" label="Libre" />
                                <LegendItem color="var(--fire-orange)" label="Ocupada" glow />
                                <LegendItem color="var(--amber-warm)" label="Pagando" glow />
                            </div>
                            <button
                                onClick={() => setEditMode(m => !m)}
                                style={{
                                    padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', borderRadius: '8px',
                                    background: editMode ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${editMode ? 'var(--fire-orange)' : 'rgba(255,255,255,0.15)'}`,
                                    color: editMode ? 'var(--fire-orange)' : 'var(--text-muted)'
                                }}
                            >
                                <Edit3 size={16} /> {editMode ? 'LISTO' : 'EDITAR'}
                            </button>
                            <button
                                onClick={() => { setNewTableForm({ name: '', shape: 'square' }); setTableModal(true); }}
                                className="primary-button"
                                style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
                            >
                                <Plus size={16} /> NUEVA MESA
                            </button>
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
                <div
                    ref={containerRef}
                    className="obsidian-card"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                        width: '100%',
                        height: '600px',
                        position: 'relative',
                        background: 'rgba(255,255,255,0.01)',
                        overflow: 'hidden',
                        border: `1px solid ${editMode ? 'rgba(255,69,0,0.3)' : 'rgba(255,255,255,0.02)'}`,
                        transition: 'border-color 0.3s'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        pointerEvents: 'none'
                    }} />

                    {editMode && (
                        <div style={{ position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,69,0,0.12)', border: '1px solid rgba(255,69,0,0.3)', borderRadius: '20px', padding: '0.3rem 1rem', fontSize: '0.65rem', color: 'var(--fire-orange)', fontWeight: 800, letterSpacing: '0.05rem', pointerEvents: 'none' }}>
                            MODO EDICIÓN — ARRASTRÁ PARA MOVER
                        </div>
                    )}

                    {tables.map(table => (
                        <div
                            key={table.id}
                            style={{ position: 'absolute', left: `${table.position.x}%`, top: `${table.position.y}%` }}
                        >
                            {editMode && (
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', justifyContent: 'center' }}>
                                    <button
                                        onClick={(e) => renameTable(e, table)}
                                        title="Renombrar"
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    ><Pencil size={11} /></button>
                                    <button
                                        onClick={(e) => cycleShape(e, table)}
                                        title="Cambiar forma"
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', fontSize: '10px', fontWeight: 800 }}
                                    >{table.shape === 'round' ? '○' : table.shape === 'rect' ? '▬' : '□'}</button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`¿Eliminar ${table.name}?`)) deleteTable(table.id); }}
                                        title="Eliminar"
                                        style={{ background: 'rgba(212,32,0,0.2)', border: '1px solid var(--fire-red)', color: 'var(--fire-red)', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    ><Trash2 size={11} /></button>
                                </div>
                            )}
                            <div
                                onPointerDown={editMode ? (e) => startDrag(e, table.id) : undefined}
                                onClick={() => {
                                    if (editMode) return;
                                    if (table.status === 'available') setTableStatus(table.id, 'occupied');
                                    else if (table.status === 'paying') setCheckoutTable(table);
                                    else setSelectedTable(table);
                                }}
                                className="obsidian-card table-item"
                                style={{
                                    width: table.shape === 'rect' ? '120px' : '80px',
                                    height: '80px',
                                    cursor: editMode ? 'grab' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem',
                                    backgroundColor: editMode ? 'rgba(255,69,0,0.07)' : getStatusColor(table.status),
                                    borderColor: editMode ? 'rgba(255,69,0,0.4)' : (table.status !== 'available' ? 'var(--fire-orange)' : 'rgba(255,255,255,0.1)'),
                                    boxShadow: table.status !== 'available' && !editMode ? '0 0 20px rgba(255, 69, 0, 0.3)' : 'var(--shadow-carved)',
                                    transition: 'all 0.3s',
                                    borderRadius: table.shape === 'round' ? '50%' : 'var(--radius-tribal)',
                                    padding: '0',
                                    position: 'relative',
                                    userSelect: 'none'
                                }}
                            >
                                <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    color: (table.status === 'available' || editMode) ? 'var(--text-muted)' : 'white',
                                    textShadow: table.status !== 'available' && !editMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                                }}>
                                    {table.name}
                                </span>
                                {!editMode && table.status === 'occupied' && <User size={14} color="white" />}
                                {!editMode && table.status === 'paying' && <DollarSign size={14} color="white" />}
                            </div>
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

            {tableModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="obsidian-card" style={{ width: '380px', padding: '2rem', border: '1px solid var(--fire-orange)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="font-serif" style={{ fontSize: '1.5rem' }}>Nueva Mesa</h3>
                            <button onClick={() => setTableModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05rem', display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Mesa 7, Terraza 1..."
                                    value={newTableForm.name}
                                    onChange={e => setNewTableForm(f => ({ ...f, name: e.target.value }))}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05rem', display: 'block', marginBottom: '0.5rem' }}>Forma</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    {[{ id: 'round', label: 'Redonda' }, { id: 'square', label: 'Cuadrada' }, { id: 'rect', label: 'Rectangular' }].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setNewTableForm(f => ({ ...f, shape: s.id }))}
                                            className="obsidian-card"
                                            style={{
                                                padding: '0.75rem', border: `1px solid ${newTableForm.shape === s.id ? 'var(--fire-orange)' : 'rgba(255,255,255,0.05)'}`,
                                                background: newTableForm.shape === s.id ? 'rgba(255,69,0,0.1)' : 'transparent',
                                                color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={!newTableForm.name.trim()}
                                onClick={() => {
                                    addTable(newTableForm);
                                    setTableModal(false);
                                }}
                                className="primary-button"
                                style={{ padding: '1rem', opacity: newTableForm.name.trim() ? 1 : 0.5, marginTop: '0.5rem' }}
                            >
                                AGREGAR MESA
                            </button>
                        </div>
                    </div>
                </div>
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
