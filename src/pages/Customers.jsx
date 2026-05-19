import React, { useState, useMemo, useEffect } from 'react';
import {
    Users,
    Search,
    Plus,
    Phone,
    Mail,
    MapPin,
    Star,
    Settings,
    Save,
    Trash2,
    ChevronRight,
    Award,
    TrendingUp,
    History,
    Flame,
    Cake,
    Shield,
    Pencil,
    AlertTriangle
} from 'lucide-react';
import { useAguaraStore } from '../store/aguaraStore';

function Customers() {
    const { customers, addCustomer, updateCustomer, removeCustomer, fetchCustomers, vipConfig, updateVipConfig, orderHistory } = useAguaraStore();

    useEffect(() => { fetchCustomers(); }, []);

    const [activeTab, setActiveTab] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Local VIP Config for "Save" button
    const [localVipConfig, setLocalVipConfig] = useState(vipConfig);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleVipChange = (tier, field, value) => {
        setLocalVipConfig(prev => ({
            ...prev,
            [tier]: { ...prev[tier], [field]: value }
        }));
        setHasUnsavedChanges(true);
    };

    const handleSaveVip = () => {
        updateVipConfig(localVipConfig);
        setHasUnsavedChanges(false);
    };

    // Filtered Customers
    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    const getVipColor = (level) => {
        switch (level) {
            case 'diamante': return '#b9f2ff';
            case 'platino': return '#e5e4e2';
            case 'oro': return '#ffd700';
            case 'plata': return '#c0c0c0';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="content-wrapper">
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ height: '1px', width: '30px', background: 'var(--fire-orange)' }}></div>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.3rem', color: 'var(--fire-orange)', fontWeight: 800 }}>FIDELIZACIÓN</span>
                    </div>
                    <h2 className="title-xl font-serif" style={{ fontSize: '3rem' }}>Guardianes de la Manada</h2>
                    <p className="text-mystic" style={{ opacity: 0.6 }}>Gestiona a tus miembros más leales y sus beneficios ancestrales.</p>
                </div>

                <div className="tab-container" style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')} label="MIEMBROS" />
                    <TabButton active={activeTab === 'vip'} onClick={() => setActiveTab('vip')} label="REGLAS VIP" />
                </div>
            </header>

            {activeTab === 'list' ? (
                <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1.5fr 1fr' : '1fr', gap: '2rem' }}>
                    {/* Left Side: List & Search */}
                    <div className="obsidian-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o teléfono..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', color: 'white' }}
                                />
                            </div>
                            <button className="primary-button" onClick={() => setShowAddForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={18} /> NUEVO GUARDIÁN
                            </button>
                        </div>

                        <div className="custom-table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        <th style={{ padding: '1rem' }}>CLIENTE</th>
                                        <th style={{ padding: '1rem' }}>RANGO</th>
                                        <th style={{ padding: '1rem' }}>CONSUMO</th>
                                        <th style={{ padding: '1rem' }}>PUNTOS</th>
                                        <th style={{ padding: '1rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map(customer => (
                                        <tr
                                            key={customer.id}
                                            onClick={() => setSelectedCustomer(customer)}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                                                cursor: 'pointer',
                                                background: selectedCustomer?.id === customer.id ? 'rgba(255, 69, 0, 0.05)' : 'transparent'
                                            }}
                                            className="table-row-hover"
                                        >
                                            <td style={{ padding: '1.25rem' }}>
                                                <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{customer.phone}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800, color: getVipColor(customer.vipLevel) }}>
                                                    <Star size={12} fill={getVipColor(customer.vipLevel)} stroke="none" />
                                                    {customer.vipLevel}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem', fontWeight: 700 }}>
                                                ${customer.totalSpent.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '1.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Flame size={14} color="var(--fire-orange)" />
                                                    {customer.points}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                                <ChevronRight size={18} opacity={0.3} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Right Side: Customer Details */}
                    {selectedCustomer ? (
                        <div className="obsidian-card" style={{ padding: '2.5rem', border: `1px solid ${getVipColor(selectedCustomer.vipLevel)}22` }}>
                            <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
                                {!isEditing && (
                                    <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Eliminar Guardián"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(true); setEditData(selectedCustomer); }}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Editar Ficha"
                                        >
                                            <Pencil size={18} opacity={0.5} />
                                        </button>
                                    </div>
                                )}
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '40px',
                                    background: `linear-gradient(135deg, ${getVipColor(selectedCustomer.vipLevel)}22, transparent)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    border: `1px solid ${getVipColor(selectedCustomer.vipLevel)}44`
                                }}>
                                    <Users size={32} color={getVipColor(selectedCustomer.vipLevel)} />
                                </div>
                                <h3 className="font-serif" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{selectedCustomer.name}</h3>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: getVipColor(selectedCustomer.vipLevel) }}>
                                    MIEMBRO {selectedCustomer.vipLevel}
                                </div>
                            </div>

                            {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <EditInput label="Nombre" value={editData.name} onChange={v => setEditData({ ...editData, name: v })} />
                                    <EditInput label="Teléfono" value={editData.phone} onChange={v => setEditData({ ...editData, phone: v })} />
                                    <EditInput label="Email" value={editData.email} onChange={v => setEditData({ ...editData, email: v })} />
                                    <EditInput label="Dirección" value={editData.address} onChange={v => setEditData({ ...editData, address: v })} />
                                    <EditInput label="Cumpleaños" type="date" value={editData.birthday} onChange={v => setEditData({ ...editData, birthday: v })} />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                        <button className="primary-button" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => setIsEditing(false)}>CANCELAR</button>
                                        <button className="primary-button" onClick={() => {
                                            updateCustomer(editData);
                                            setSelectedCustomer(editData);
                                            setIsEditing(false);
                                        }}>GUARDAR CAMBIOS</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                                        <DetailItem icon={<Phone size={16} />} label="Teléfono" value={selectedCustomer.phone} />
                                        <DetailItem icon={<Mail size={16} />} label="Email" value={selectedCustomer.email} />
                                        <DetailItem icon={<MapPin size={16} />} label="Dirección" value={selectedCustomer.address} />
                                        <DetailItem icon={<Cake size={16} />} label="Cumpleaños" value={selectedCustomer.birthday || 'No registrado'} />
                                        <DetailItem icon={<History size={16} />} label="Última Visita" value={new Date(selectedCustomer.lastOrderDate).toLocaleDateString()} />
                                    </div>

                                    <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Historial Reciente</h4>
                                        {orderHistory.filter(h => h.customerId === selectedCustomer.id).slice(0, 3).map(order => (
                                            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                                                <span>{new Date(order.date).toLocaleDateString()}</span>
                                                <span style={{ fontWeight: 700 }}>${order.total.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="obsidian-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, flexDirection: 'column', padding: '4rem', textAlign: 'center' }}>
                            <Users size={48} style={{ marginBottom: '1rem' }} />
                            <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>Selecciona un Guardián para ver su sabiduría ancestral.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ maxWidth: '800px' }}>
                    <div className="obsidian-card" style={{ padding: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                            <Settings size={24} color="var(--fire-orange)" />
                            <h3 className="font-serif" style={{ fontSize: '1.8rem' }}>Configuración Ancestral de Rango</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <VipRow tier="plata" label="PLAN PLATA" config={localVipConfig.plata} color="#c0c0c0" onChange={handleVipChange} />
                            <VipRow tier="oro" label="PLAN ORO" config={localVipConfig.oro} color="#ffd700" onChange={handleVipChange} />
                            <VipRow tier="platino" label="PLAN PLATINO" config={localVipConfig.platino} color="#e5e4e2" onChange={handleVipChange} />
                            <VipRow tier="diamante" label="PLAN DIAMANTE" config={localVipConfig.diamante} color="#b9f2ff" onChange={handleVipChange} />
                        </div>

                        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="primary-button"
                                disabled={!hasUnsavedChanges}
                                onClick={handleSaveVip}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    opacity: hasUnsavedChanges ? 1 : 0.4,
                                    transform: hasUnsavedChanges ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                <Save size={18} /> GUARDAR CONFIGURACIÓN ANCESTRAL
                            </button>
                        </div>

                        <div style={{ marginTop: '3rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 69, 0, 0.05)', border: '1px solid rgba(255, 69, 0, 0.1)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--amber-warm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <TrendingUp size={18} />
                                Todos los cambios guardados se aplicarán retroactivamente a la base de datos de miembros.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Agregar Cliente (Placeholder) */}
            {showAddForm && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="obsidian-card" style={{ width: '500px', padding: '3rem' }}>
                        <h3 className="font-serif" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Invocar Nuevo Guardián</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <FormInput id="new-name" label="Nombre del Miembro" placeholder="Nombre completo..." />
                            <FormInput id="new-phone" label="Teléfono / Contacto" placeholder="Sin guiones ni espacios..." />
                            <FormInput id="new-address" label="Dirección de Envío" placeholder="Calle, Número, Localidad..." />
                            <FormInput id="new-email" label="Correo del Espíritu" placeholder="email@ejemplo.com" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Fecha de Cumpleaños</span>
                                <input
                                    type="date"
                                    className="search-input"
                                    style={{ width: '100%', padding: '1rem', color: 'white' }}
                                    id="new-customer-birthday"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <button className="primary-button" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => setShowAddForm(false)}>CANCELAR</button>
                                <button className="primary-button" onClick={() => {
                                    const name = document.getElementById('new-name')?.value || 'Nuevo Cliente';
                                    const phone = document.getElementById('new-phone')?.value || '0000';
                                    const address = document.getElementById('new-address')?.value || '';
                                    const email = document.getElementById('new-email')?.value || '';
                                    const bday = document.getElementById('new-customer-birthday')?.value;

                                    setShowAddForm(false);
                                    addCustomer({ name, phone, address, email, birthday: bday, vipLevel: 'bronce' });
                                }}>INVOCAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div className="obsidian-card" style={{ width: '400px', padding: '2.5rem', textAlign: 'center', border: '1px solid #ff4444' }}>
                        <AlertTriangle size={48} color="#ff4444" style={{ marginBottom: '1.5rem' }} />
                        <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>¿Desterrar Guardián?</h3>
                        <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '2rem' }}>
                            Estás a punto de eliminar a <strong>{selectedCustomer.name}</strong> del territorio. Esta acción es irreversible y borrará su historial de lealtad.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="primary-button" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => setShowDeleteConfirm(false)}>CONSERVAR</button>
                            <button className="primary-button" style={{ background: '#ff4444', border: 'none' }} onClick={() => {
                                removeCustomer(selectedCustomer.id);
                                setSelectedCustomer(null);
                                setShowDeleteConfirm(false);
                            }}>ELIMINAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'transparent',
                border: 'none',
                padding: '1rem 0',
                color: active ? 'var(--fire-orange)' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.1rem',
                cursor: 'pointer',
                position: 'relative'
            }}
        >
            {label}
            {active && <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: '2px', background: 'var(--fire-orange)' }}></div>}
        </button>
    );
}

function VipRow({ tier, label, config, color, onChange }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center', gap: '2rem', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Award size={20} color={color} />
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color }}>{label}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Min. Consumo</span>
                <input
                    type="number"
                    value={config.minSpent}
                    onChange={e => onChange(tier, 'minSpent', Number(e.target.value))}
                    className="search-input"
                    style={{ background: 'rgba(0,0,0,0.5)', border: 'none', padding: '0.5rem', fontSize: '0.9rem', color: 'white' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descuento %</span>
                <input
                    type="number"
                    value={config.discount}
                    onChange={e => onChange(tier, 'discount', Number(e.target.value))}
                    className="search-input"
                    style={{ background: 'rgba(0,0,0,0.5)', border: 'none', padding: '0.5rem', fontSize: '0.9rem', color: 'white' }}
                />
            </div>

            <div style={{ opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
                <TrendingUp size={20} />
            </div>
        </div>
    );
}

function DetailItem({ icon, label, value }) {
    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ opacity: 0.3 }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{value}</div>
            </div>
        </div>
    );
}

function FormInput({ label, placeholder, id }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>{label}</span>
            <input
                id={id}
                type="text"
                placeholder={placeholder}
                className="search-input"
                style={{ width: '100%', padding: '1rem', color: 'white' }}
            />
        </div>
    );
}

function EditInput({ label, value, onChange, type = "text" }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>{label}</span>
            <input
                type={type}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.02)', color: 'white' }}
            />
        </div>
    );
}

export default Customers;
