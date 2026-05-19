import React, { useState, useEffect } from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Clock,
    Unlock,
    Lock,
    PlusCircle,
    MinusCircle,
    History,
    DollarSign,
    Smartphone,
    CreditCard,
    ArrowRight,
    FileText,
    Trash2,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { useAguaraStore } from '../store/aguaraStore';

function Caja() {
    const { cashRegister, shiftHistory, openShift, closeShift, addCashMovement, deleteCashMovement, fetchCashSession } = useAguaraStore();

    useEffect(() => { fetchCashSession(); }, []);
    const [shiftHistoryOpen, setShiftHistoryOpen] = useState(false);
    const [openingAmount, setOpeningAmount] = useState('');
    const [movementModal, setMovementModal] = useState(null); // 'income' | 'expense'
    const [movementAmount, setMovementAmount] = useState('');
    const [movementNote, setMovementNote] = useState('');
    const [movementMethod, setMovementMethod] = useState('cash');

    const handleOpenShift = (e) => {
        e.preventDefault();
        if (!openingAmount || isNaN(openingAmount)) return;
        openShift(Number(openingAmount));
        setOpeningAmount('');
    };

    const handleMovement = (e) => {
        e.preventDefault();
        if (!movementAmount || isNaN(movementAmount)) return;
        addCashMovement(movementModal, Number(movementAmount), movementMethod, movementNote);
        setMovementModal(null);
        setMovementAmount('');
        setMovementNote('');
        setMovementMethod('cash');
    };

    if (!cashRegister.isOpen) {
        return (
            <div className="content-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div className="obsidian-card" style={{ padding: '3rem', maxWidth: '450px', width: '100%', textAlign: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 69, 0, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem',
                        border: '2px solid var(--fire-orange)', boxShadow: '0 0 20px rgba(255, 69, 0, 0.2)'
                    }}>
                        <Lock size={40} color="var(--fire-orange)" />
                    </div>
                    <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Caja Cerrada</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Para iniciar la jornada y procesar ventas, primero debes abrir el turno de caja.</p>

                    <form onSubmit={handleOpenShift}>
                        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--fire-orange)', marginBottom: '0.5rem', display: 'block' }}>Monto de Apertura (Efectivo)</label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={openingAmount}
                                    onChange={(e) => setOpeningAmount(e.target.value)}
                                    style={{
                                        width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1.2rem', fontWeight: 900
                                    }}
                                />
                            </div>
                        </div>
                        <button type="submit" className="primary-button" style={{ width: '100%', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                            <Unlock size={20} /> ABRIR CAJA
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const salesTotal = cashRegister.logs
        .filter(l => l.type === 'sale')
        .reduce((acc, l) => acc + l.amount, 0);

    const expensesTotal = cashRegister.logs
        .filter(l => l.type === 'expense')
        .reduce((acc, l) => acc + l.amount, 0);

    const incomesTotal = cashRegister.logs
        .filter(l => l.type === 'income')
        .reduce((acc, l) => acc + l.amount, 0);

    return (
        <div className="content-wrapper">
            {/* Header / Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ height: '1px', width: '40px', background: '#22c55e' }}></div>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.4rem', color: '#22c55e', fontWeight: 700 }}>CAJA OPERATIVA</span>
                    </div>
                    <h2 className="title-xl font-serif" style={{ fontSize: '3rem' }}>Flujo de Caja</h2>
                    <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} /> Abierto desde: {new Date(cashRegister.openingDate).toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={() => { if (window.confirm('¿Deseas cerrar la caja y finalizar el turno?')) closeShift(); }}
                    className="obsidian-card"
                    style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.03)', color: 'var(--fire-orange)', border: '1px solid var(--fire-orange)', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Lock size={16} /> CIERRE DE CAJA
                </button>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <MetricCard label="Efectivo en Caja" value={`$${cashRegister.currentBalance.toLocaleString()}`} icon={<Wallet size={20} color="var(--fire-orange)" />} />
                <MetricCard label="Facturación Total" value={`$${(cashRegister.totalRevenue || 0).toLocaleString()}`} icon={<TrendingUp size={20} color="#22c55e" />} highlight />
                <MetricCard label="Otros Ingresos" value={`$${incomesTotal.toLocaleString()}`} icon={<PlusCircle size={20} color="#22c55e" />} />
                <MetricCard label="Egresos / Gastos" value={`$${expensesTotal.toLocaleString()}`} icon={<MinusCircle size={20} color="var(--fire-red)" />} />
            </div>

            {/* Actions & History */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
                {/* Manual Movements */}
                <div className="obsidian-card" style={{ padding: '2rem' }}>
                    <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Movimientos Manuales</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>Registra ingresos extra o gastos operativos fuera de las ventas POS.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => setMovementModal('income')}
                            className="primary-button"
                            style={{ background: '#22c55e', color: 'white', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                        >
                            <PlusCircle size={18} /> REGISTRAR INGRESO
                        </button>
                        <button
                            onClick={() => setMovementModal('expense')}
                            className="primary-button"
                            style={{ background: 'var(--fire-red)', color: 'white', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                        >
                            <MinusCircle size={18} /> REGISTRAR EGRESO
                        </button>
                    </div>

                    <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Resumen por Medio</h4>
                        <SummaryRow label="Efectivo" value={cashRegister.logs.filter(l => l.method === 'cash').reduce((acc, l) => acc + (l.type === 'expense' ? -l.amount : l.amount), 0)} icon={<Wallet size={14} />} />
                        <SummaryRow label="Tarjeta" value={cashRegister.logs.filter(l => l.method === 'card').reduce((acc, l) => acc + (l.type === 'expense' ? -l.amount : l.amount), 0)} icon={<CreditCard size={14} />} />
                        <SummaryRow label="Mercado Pago" value={cashRegister.logs.filter(l => l.method === 'mp').reduce((acc, l) => acc + (l.type === 'expense' ? -l.amount : l.amount), 0)} icon={<Smartphone size={14} />} />
                        <SummaryRow label="Transferencia" value={cashRegister.logs.filter(l => l.method === 'transfer').reduce((acc, l) => acc + (l.type === 'expense' ? -l.amount : l.amount), 0)} icon={<ArrowRight size={14} />} />
                    </div>
                </div>

                {/* Logs History */}
                <div className="obsidian-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 className="font-serif" style={{ fontSize: '1.5rem' }}>Historial del Turno</h3>
                        <History size={18} opacity={0.3} />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '1rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>HORA</th>
                                    <th style={{ padding: '1rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>CONCEPTO</th>
                                    <th style={{ padding: '1rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>MEDIO</th>
                                    <th style={{ padding: '1rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textAlign: 'right' }}>MONTO</th>
                                    <th style={{ padding: '1rem 0.5rem', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cashRegister.logs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {log.type === 'sale' ? <TrendingUp size={14} color="#22c55e" /> :
                                                    log.type === 'expense' ? <TrendingDown size={14} color="var(--fire-red)" /> :
                                                        <FileText size={14} color="var(--fire-orange)" />}
                                                {log.note}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 0.5rem' }}>
                                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontWeight: 800, textTransform: 'uppercase' }}>
                                                {log.method}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 800, color: log.type === 'expense' ? 'var(--fire-red)' : (log.type === 'sale' || log.type === 'income' ? '#22c55e' : 'white') }}>
                                            {log.type === 'expense' ? '-' : ''}${log.amount.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            {(log.type === 'income' || log.type === 'expense') && (
                                                <button
                                                    title="Eliminar movimiento"
                                                    onClick={() => { if (confirm('¿Eliminar este movimiento?')) deleteCashMovement(log.id); }}
                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,68,68,0.4)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '4px', transition: 'color 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,68,68,0.4)'}
                                                ><Trash2 size={14} /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {cashRegister.logs.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.2 }}>
                                <History size={40} style={{ marginBottom: '1rem' }} />
                                <p>No hay movimientos registrados</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shift History */}
            {shiftHistory.length > 0 && (
                <div className="obsidian-card" style={{ marginTop: '2rem', padding: '2rem' }}>
                    <button
                        onClick={() => setShiftHistoryOpen(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, width: '100%' }}
                    >
                        {shiftHistoryOpen ? <ChevronDown size={18} color="var(--fire-orange)" /> : <ChevronRight size={18} color="var(--fire-orange)" />}
                        <h3 className="font-serif" style={{ fontSize: '1.25rem' }}>Turnos Anteriores</h3>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255,69,0,0.15)', color: 'var(--fire-orange)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 800 }}>{shiftHistory.length}</span>
                    </button>
                    {shiftHistoryOpen && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {shiftHistory.map(shift => (
                                <div key={shift.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                                                {new Date(shift.openDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                            <p style={{ fontSize: '0.7rem', opacity: 0.4 }}>
                                                {new Date(shift.openDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(shift.closeDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#22c55e' }}>${shift.totalRevenue.toLocaleString()}</p>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Facturado</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
                                        <span>Apertura: ${shift.openBalance.toLocaleString()}</span>
                                        <span>Cierre: ${shift.closeBalance.toLocaleString()}</span>
                                        <span>{shift.logs.length} movimientos</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Movement Modal */}
            {movementModal && (
                <div className="order-drawer-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="obsidian-card" style={{ padding: '2.5rem', maxWidth: '400px', width: '100%', border: `1px solid ${movementModal === 'income' ? '#22c55e' : 'var(--fire-red)'}` }}>
                        <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                            {movementModal === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso'}
                        </h3>

                        <form onSubmit={handleMovement}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Monto</label>
                                <input
                                    autoFocus
                                    type="number"
                                    required
                                    value={movementAmount}
                                    onChange={(e) => setMovementAmount(e.target.value)}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '1.2rem', fontWeight: 900 }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Medio de Pago</label>
                                <select
                                    value={movementMethod}
                                    onChange={(e) => setMovementMethod(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}
                                >
                                    <option value="cash">Efectivo</option>
                                    <option value="card">Tarjeta</option>
                                    <option value="transfer">Transferencia</option>
                                    <option value="mp">Mercado Pago</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Nota / Concepto</label>
                                <textarea
                                    required
                                    placeholder="Escribe el motivo..."
                                    value={movementNote}
                                    onChange={(e) => setMovementNote(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', minHeight: '80px', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setMovementModal(null)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>CANCELAR</button>
                                <button
                                    type="submit"
                                    className="primary-button"
                                    style={{ flex: 2, padding: '0.75rem', background: movementModal === 'income' ? '#22c55e' : 'var(--fire-red)' }}
                                >
                                    CONFIRMAR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, icon, highlight }) {
    return (
        <div className="obsidian-card" style={{ padding: '1.5rem', border: highlight ? '1px solid rgba(34, 197, 94, 0.2)' : 'var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1rem' }}>{label}</span>
                {icon}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: highlight ? '#22c55e' : 'white' }}>{value}</div>
        </div>
    );
}

function SummaryRow({ label, value, icon }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                {icon}
                {label}
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: value < 0 ? 'var(--fire-red)' : 'white' }}>${value}</div>
        </div>
    );
}

export default Caja;
