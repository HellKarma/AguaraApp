import React, { useState, useEffect } from 'react';
import { useAguaraStore } from '../store/aguaraStore';
import {
    X, Search, Flame, Wine, IceCream, UtensilsCrossed,
    CheckCircle2, Clock, Star, ChevronRight, Plus, Minus, AlertCircle, ShoppingCart,
    Truck, Wallet, CreditCard, ArrowRight, Smartphone, MoreHorizontal, DollarSign
} from 'lucide-react';

export function OrderDrawer({ table, onClose, onCheckout }) {
    const {
        menu, activeOrders, addItemToOrder, adjustOrderItemQty,
        setTableStatus, sendToKitchen, favorites, toggleFavorite,
        modifiers, checkAvailability, recipes, getActivePrice,
        deliveryMetadata, updateDeliveryMetadata,
        customers, selectCustomerForOrder, selectedCustomerId, getCustomerDiscount,
        categories
    } = useAguaraStore();

    const [activeCategory, setActiveCategory] = useState(() => categories[0]?.id || '');

    useEffect(() => {
        if (activeCategory !== 'favorites' && !categories.find(c => c.id === activeCategory)) {
            setActiveCategory(categories[0]?.id || '');
        }
    }, [categories]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modifierModalItem, setModifierModalItem] = useState(null);

    const tableOrder = activeOrders[table.id] || [];
    const addedThisSession = tableOrder.filter(it => it.status === 'pending');
    const isProductionPending = tableOrder.length > 0 && tableOrder.some(it => it.status !== 'ready');

    const currentCustomerId = selectedCustomerId[table.id];
    const currentCustomer = customers.find(c => c.id === currentCustomerId);
    const vipDiscount = getCustomerDiscount(currentCustomerId);

    const filteredMenu = menu.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeCategory === 'favorites') return favorites.includes(item.id) && matchesSearch;
        return item.category === activeCategory && matchesSearch;
    });

    const handleItemClick = (item) => {
        const isAvailable = checkAvailability(item.id);
        if (!isAvailable) return;

        const itemModifiers = modifiers[item.id];
        if (itemModifiers && itemModifiers.length > 0) {
            setModifierModalItem(item);
        } else {
            addItemToOrder(table.id, item);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'production': return { borderLeft: '4px solid var(--fire-orange)', background: 'rgba(255, 69, 0, 0.05)' };
            case 'ready': return { borderLeft: '4px solid #22c55e', background: 'rgba(34, 197, 94, 0.05)' };
            default: return { opacity: 0.8, borderLeft: '4px solid rgba(255,255,255,0.1)' };
        }
    };

    return (
        <div className="order-drawer-overlay" style={overlayStyle}>
            <div className="obsidian-card" style={drawerStyle}>
                {/* Menu Section */}
                <div style={menuContainerStyle}>
                    <header style={headerStyle}>
                        <h2 className="font-serif" style={{ fontSize: '1.8rem' }}>
                            {activeCategory === 'favorites' ? 'Destacados' : `Carta: ${categories.find(c => c.id === activeCategory)?.name?.toUpperCase() || activeCategory.toUpperCase()}`}
                        </h2>
                        <div className="obsidian-card" style={searchContainerStyle}>
                            <Search size={18} color="rgba(255,255,255,0.3)" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={searchInputStyle}
                            />
                        </div>
                    </header>

                    <nav style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <CategoryTab id="favorites" label="" icon={<Star size={18} fill={activeCategory === 'favorites' ? 'white' : 'transparent'} />} active={activeCategory === 'favorites'} onClick={setActiveCategory} />
                        {categories.map(cat => {
                            const iconMap = { parrilla: <Flame size={18} />, entradas: <UtensilsCrossed size={18} />, vinos: <Wine size={18} />, postres: <IceCream size={18} /> };
                            return (
                                <CategoryTab key={cat.id} id={cat.id} label={cat.name} icon={iconMap[cat.id] || <UtensilsCrossed size={18} />} active={activeCategory === cat.id} onClick={setActiveCategory} />
                            );
                        })}
                    </nav>

                    <div style={gridStyle}>
                        {filteredMenu.map(item => {
                            const available = checkAvailability(item.id);
                            const hasRecipe = recipes[item.id] && recipes[item.id].length > 0;
                            return (
                                <div
                                    key={item.id}
                                    className="obsidian-card"
                                    style={{
                                        ...itemCardStyle,
                                        opacity: available ? 1 : 0.4,
                                        filter: available ? 'none' : 'grayscale(1)',
                                        border: favorites.includes(item.id) ? '1px solid rgba(255, 215, 0, 0.2)' : '1px solid transparent'
                                    }}
                                >
                                    <div onClick={() => available && handleItemClick(item)} style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                                            {!available && <span style={noStockBadge}><AlertCircle size={10} /> AGOTADO</span>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <p style={{ color: 'var(--fire-orange)', fontWeight: 700 }}>${getActivePrice(item.id)}</p>
                                            {!hasRecipe && (
                                                <div style={{ fontSize: '0.65rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <ShoppingCart size={10} /> {item.stock} disp.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                    >
                                        <Star size={16} color={favorites.includes(item.id) ? '#ffd700' : 'rgba(255,255,255,0.2)'} fill={favorites.includes(item.id) ? '#ffd700' : 'transparent'} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Current Order Section */}
                <div style={orderSidebarStyle}>
                    <header style={orderHeaderStyle}>
                        <div>
                            <h3 className="font-serif" style={{ fontSize: '1.2rem' }}>{table.name}</h3>
                            <p style={{ fontSize: '0.6rem', color: 'var(--fire-orange)', fontWeight: 800, textTransform: 'uppercase' }}>Pedido Activo</p>
                        </div>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
                            <X size={20} />
                        </button>
                    </header>

                    <div style={orderListStyle}>
                        {tableOrder.map((item, idx) => (
                            <div key={item.lineId || idx} className="obsidian-card" style={{ ...orderItemStyle, ...getStatusStyle(item.status) }}>
                                <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                                    {item.status === 'pending' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                            <button onClick={() => adjustOrderItemQty(table.id, item.lineId, -1)} style={qtyBtnStyle}>
                                                <Minus size={10} />
                                            </button>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: '1.2rem', textAlign: 'center' }}>{item.quantity}</span>
                                            <button onClick={() => adjustOrderItemQty(table.id, item.lineId, 1)} style={qtyBtnStyle}>
                                                <Plus size={10} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6, flexShrink: 0 }}>{item.quantity}x</div>
                                    )}
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                                        {item.selectedModifiers?.map((m, midx) => (
                                            <p key={midx} style={{ fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic' }}>+ {m.name}</p>
                                        ))}
                                        <p style={statusLabelStyle}>
                                            {item.status === 'production' && 'En Cocina'}
                                            {item.status === 'ready' && 'Entregado'}
                                            {item.status === 'pending' && 'Por enviar'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontWeight: 800 }}>${item.price * item.quantity}</p>
                                    {item.status === 'ready' && <CheckCircle2 size={14} color="#22c55e" />}
                                    {item.status === 'production' && <Clock size={14} color="var(--fire-orange)" />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Delivery Metadata Section */}
                    {String(table.id).startsWith('del_') && (
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05rem' }}>Datos de Entrega</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                <PaymentMethodBtn
                                    icon={<Wallet size={14} />}
                                    active={(deliveryMetadata[table.id]?.paymentMethod || 'cash') === 'cash'}
                                    onClick={() => updateDeliveryMetadata(table.id, { paymentMethod: 'cash' })}
                                    label="Efectivo"
                                />
                                <PaymentMethodBtn
                                    icon={<ArrowRight size={14} />}
                                    active={deliveryMetadata[table.id]?.paymentMethod === 'transfer'}
                                    onClick={() => updateDeliveryMetadata(table.id, { paymentMethod: 'transfer' })}
                                    label="Transf."
                                />
                                <PaymentMethodBtn
                                    icon={<CreditCard size={14} />}
                                    active={deliveryMetadata[table.id]?.paymentMethod === 'card'}
                                    onClick={() => updateDeliveryMetadata(table.id, { paymentMethod: 'card' })}
                                    label="Tarjeta"
                                />
                                <PaymentMethodBtn
                                    icon={<Smartphone size={14} />}
                                    active={deliveryMetadata[table.id]?.paymentMethod === 'mp'}
                                    onClick={() => updateDeliveryMetadata(table.id, { paymentMethod: 'mp' })}
                                    label="M. Pago"
                                />
                                <PaymentMethodBtn
                                    icon={<MoreHorizontal size={14} />}
                                    active={deliveryMetadata[table.id]?.paymentMethod === 'other'}
                                    onClick={() => updateDeliveryMetadata(table.id, { paymentMethod: 'other' })}
                                    label="Otros"
                                />
                            </div>

                            {deliveryMetadata[table.id]?.paymentMethod === 'other' && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Especifique el método..."
                                        value={deliveryMetadata[table.id]?.paymentMethodDetail || ''}
                                        onChange={(e) => updateDeliveryMetadata(table.id, { paymentMethodDetail: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--fire-orange)', borderRadius: '4px', color: 'white', fontSize: '0.7rem'
                                        }}
                                    />
                                </div>
                            )}

                            <button
                                onClick={() => updateDeliveryMetadata(table.id, { isPaid: !deliveryMetadata[table.id]?.isPaid })}
                                className="obsidian-card"
                                style={{
                                    width: '100%', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    background: deliveryMetadata[table.id]?.isPaid ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                    border: `1px solid ${deliveryMetadata[table.id]?.isPaid ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                                    color: deliveryMetadata[table.id]?.isPaid ? '#22c55e' : 'white',
                                    fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
                                }}
                            >
                                {deliveryMetadata[table.id]?.isPaid ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                {deliveryMetadata[table.id]?.isPaid ? 'PEDIDO PAGADO' : 'MARCAR COMO PAGADO'}
                            </button>
                        </div>
                    )}

                    {/* Customer Selection Section */}
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.6rem', color: 'var(--fire-orange)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05rem' }}>Asignar Miembro (CRM)</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <select
                                value={currentCustomerId || ''}
                                onChange={(e) => selectCustomerForOrder(table.id, e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="">Seleccionar Miembro...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.vipLevel.toUpperCase()})</option>
                                ))}
                            </select>
                            {currentCustomer && (
                                <div style={{
                                    padding: '0.2rem 0.5rem',
                                    background: 'rgba(229, 228, 226, 0.1)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <Star size={12} color="var(--fire-orange)" fill="var(--fire-orange)" />
                                </div>
                            )}
                        </div>
                        {currentCustomer && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--amber-warm)', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Beneficio {currentCustomer.vipLevel.toUpperCase()}</span>
                                <span style={{ fontWeight: 800 }}>-{vipDiscount}% OFF</span>
                            </div>
                        )}
                    </div>

                    <footer style={{ ...footerStyle, gap: '0.75rem' }}>
                        <div style={totalContainerStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={totalLabelStyle}>Total</span>
                                {vipDiscount > 0 && <span style={{ fontSize: '0.6rem', color: 'var(--fire-orange)', textDecoration: 'line-through' }}>${tableOrder.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</span>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={totalValueStyle}>
                                    ${Math.round(tableOrder.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (1 - vipDiscount / 100))}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                className="primary-button"
                                style={{ flex: 1, padding: '0.75rem', opacity: addedThisSession.length > 0 ? 1 : 0.5 }}
                                disabled={addedThisSession.length === 0}
                                onClick={() => { sendToKitchen(table.id, addedThisSession); onClose(); }}
                            >
                                COCINA ({addedThisSession.length})
                            </button>
                            <button
                                className="primary-button"
                                style={{
                                    flex: 1, padding: '0.75rem',
                                    background: 'var(--amber-warm)', color: 'black',
                                    opacity: (tableOrder.length > 0 && !isProductionPending) ? 1 : 0.4,
                                    cursor: (tableOrder.length > 0 && !isProductionPending) ? 'pointer' : 'not-allowed'
                                }}
                                disabled={tableOrder.length === 0 || isProductionPending}
                                title={isProductionPending ? "Hay productos en producción o sin enviar" : "Mesa lista para cobrar"}
                                onClick={() => {
                                    if (table.status === 'available') setTableStatus(table.id, 'occupied');
                                    onCheckout(table);
                                }}
                            >
                                <DollarSign size={16} /> COBRAR
                            </button>
                        </div>
                    </footer>
                </div>
            </div>

            {modifierModalItem && (
                <ModifierModal
                    item={modifierModalItem}
                    modifierGroups={modifiers[modifierModalItem.id]}
                    ctx={{ checkAvailability: (sel) => checkAvailability(modifierModalItem.id, sel) }}
                    onClose={() => setModifierModalItem(null)}
                    onAdd={(selected) => {
                        addItemToOrder(table.id, modifierModalItem, selected);
                        setModifierModalItem(null);
                    }}
                />
            )}
        </div>
    );
}

function ModifierModal({ item, modifierGroups, ctx, onClose, onAdd }) {
    const [selections, setSelections] = useState([]);

    const toggleOption = (group, option) => {
        const isSelected = selections.find(s => s.name === option.name);
        let nextSelections;
        if (isSelected) {
            nextSelections = selections.filter(s => s.name !== option.name);
        } else {
            nextSelections = [...selections, option];
        }

        // Validate ingredient availability for the combined selection
        if (ctx.checkAvailability(nextSelections)) {
            setSelections(nextSelections);
        }
    };

    return (
        <div style={modalOverlayStyle}>
            <div className="obsidian-card" style={modalContentStyle}>
                <header style={modalHeaderStyle}>
                    <h3 className="font-serif" style={{ fontSize: '1.5rem' }}>Personalizar {item.name}</h3>
                    <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
                </header>

                <div style={modalBodyStyle}>
                    {modifierGroups.map((group, gidx) => (
                        <div key={gidx} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={groupTitleStyle}>{group.name}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {group.options.map((opt, oidx) => {
                                    const active = selections.find(s => s.name === opt.name);
                                    return (
                                        <button
                                            key={oidx}
                                            onClick={() => toggleOption(group, opt)}
                                            className="obsidian-card"
                                            style={{
                                                ...optionButtonStyle,
                                                border: active ? '1px solid var(--fire-orange)' : '1px solid rgba(255,255,255,0.05)',
                                                background: active ? 'rgba(255, 69, 0, 0.1)' : 'transparent',
                                                opacity: 1
                                            }}
                                        >
                                            <span>{opt.name}</span>
                                            {opt.extraPrice > 0 && <span style={{ color: 'var(--fire-orange)' }}>+${opt.extraPrice}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    className="primary-button"
                    style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
                    onClick={() => onAdd(selections)}
                >
                    AÑADIR AL PEDIDO
                </button>
            </div>
        </div>
    );
}

function PaymentMethodBtn({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className="obsidian-card"
            style={{
                flexDirection: 'column', gap: '0.3rem', padding: '0.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer',
                background: active ? 'rgba(255, 69, 0, 0.1)' : 'transparent',
                borderColor: active ? 'var(--fire-orange)' : 'rgba(255,255,255,0.05)',
                color: active ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
            }}
        >
            {icon}
            <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>{label.toUpperCase()}</span>
        </button>
    );
}

function CategoryTab({ id, label, icon, active, onClick }) {
    return (
        <button
            onClick={() => onClick(id)}
            style={{
                padding: '0.6rem 1.2rem',
                background: active ? 'var(--fire-orange)' : 'rgba(255,255,255,0.03)',
                border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem',
                letterSpacing: '0.1rem', transition: 'all 0.3s ease'
            }}
        >
            {icon} {label}
        </button>
    );
}

// Styles
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' };
const drawerStyle = { width: '100%', maxWidth: '1100px', height: '100vh', borderRadius: '0', borderLeft: '1px solid var(--fire-orange)', display: 'flex', padding: '0', overflow: 'hidden' };
const menuContainerStyle = { flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 };
const searchContainerStyle = { padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' };
const searchInputStyle = { background: 'transparent', border: 'none', color: 'white', outline: 'none' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', overflowY: 'auto' };
const itemCardStyle = { padding: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' };
const noStockBadge = { fontSize: '0.6rem', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 900 };
const orderSidebarStyle = { width: '350px', background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 };
const orderHeaderStyle = { padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 };
const orderListStyle = { flex: 1, overflowY: 'auto', padding: '1.2rem', minHeight: 0 };
const orderItemStyle = { padding: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s' };
const statusLabelStyle = { fontSize: '0.65rem', color: 'var(--fire-orange)', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.2rem' };
const footerStyle = { padding: '1.5rem', background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0 };
const totalContainerStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' };
const totalLabelStyle = { opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1rem', fontSize: '0.7rem' };
const totalValueStyle = { fontSize: '1.8rem', fontWeight: 900, color: 'var(--fire-orange)' };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalContentStyle = { width: '400px', padding: '2rem' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' };
const closeButtonStyle = { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' };
const modalBodyStyle = { maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' };
const groupTitleStyle = { fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05rem' };
const optionButtonStyle = { width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', color: 'white' };
const qtyBtnStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', cursor: 'pointer', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all 0.2s' };
