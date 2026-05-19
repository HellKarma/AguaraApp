import React, { useState } from 'react';
import { useAguaraStore } from '../store/aguaraStore';
import { X, CreditCard, Banknote, Receipt, CheckCircle, Sparkles, UserPlus, Users, Calculator, Smartphone, ArrowRight, MoreHorizontal } from 'lucide-react';

export function CheckoutModal({ table, order, onClose }) {
    const { setTableStatus, removeOrder, selectedCustomerId, getCustomerDiscount, customers, cashRegister } = useAguaraStore();
    const cajaOpen = cashRegister.isOpen;
    const [step, setStep] = useState('summary'); // summary, split, payment, success
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [customPaymentDetail, setCustomPaymentDetail] = useState('');
    const [splitCount, setSplitCount] = useState(1);
    const [currentPayer, setCurrentPayer] = useState(1);
    const [payments, setPayments] = useState([]);

    const subtotal = order.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const customerId = selectedCustomerId[table.id];
    const discount = getCustomerDiscount(customerId);
    const total = Math.round(subtotal * (1 - discount / 100));

    const amountPerPerson = Math.ceil(total / splitCount);

    const handleFinish = () => {
        const newPayments = [...payments, { amount: amountPerPerson, method: paymentMethod }];
        if (currentPayer < splitCount) {
            setPayments(newPayments);
            setCurrentPayer(curr => curr + 1);
            setStep('summary');
            setPaymentMethod(null);
        } else {
            setTableStatus(table.id, 'available');
            removeOrder(table.id, { payments: newPayments, tableName: table.name });
            setStep('success');
        }
    };

    if (step === 'success') {
        return (
            <div className="order-drawer-overlay" style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(20px)', zIndex: 1100,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div className="obsidian-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'var(--fire-orange)', margin: '0 auto 1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px var(--fire-orange)'
                    }}>
                        <Sparkles size={30} color="white" />
                    </div>
                    <h2 className="font-serif" style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>¡Transacción Exitosa!</h2>
                    <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>El legado continúa. La mesa {table.name} ha sido liberada.</p>
                    <button onClick={onClose} className="primary-button" style={{ width: '100%', padding: '0.75rem' }}>VOLVER AL TERRITORIO</button>
                </div>
            </div>
        );
    }

    return (
        <div className="order-drawer-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(15px)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div className="obsidian-card" style={{
                width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'hidden',
                border: '1px solid var(--fire-orange)', display: 'flex', flexDirection: 'column'
            }}>
                <header style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h3 className="font-serif" style={{ fontSize: '1.5rem' }}>Checkout: {table.name}</h3>
                        {splitCount > 1 && (
                            <span style={{ background: 'var(--fire-orange)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900 }}>
                                PAGADOR {currentPayer}/{splitCount}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white' }}><X size={20} /></button>
                </header>

                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', minHeight: 0 }}>
                    {step === 'summary' && (
                        <>
                            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15rem', color: 'var(--text-muted)' }}>
                                    {splitCount > 1 ? 'Monto por Persona' : 'Monto Total'}
                                </span>
                                <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--fire-orange)', margin: '0.5rem 0' }}>
                                    ${splitCount > 1 ? amountPerPerson : total}
                                </h2>
                                {discount > 0 && <p style={{ color: 'var(--amber-warm)', fontSize: '0.8rem', fontWeight: 700 }}>Beneficio VIP: -${subtotal - total} ({discount}%)</p>}
                                {splitCount > 1 && <p style={{ opacity: 0.4, fontSize: '0.8rem' }}>Total mesa: ${total}</p>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <PaymentOption active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} icon={<Banknote size={20} />} label="Efectivo" />
                                <PaymentOption active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} icon={<CreditCard size={20} />} label="Tarjeta" />
                                <PaymentOption active={paymentMethod === 'transfer'} onClick={() => setPaymentMethod('transfer')} icon={<ArrowRight size={20} />} label="Transf." />
                                <PaymentOption active={paymentMethod === 'mp'} onClick={() => setPaymentMethod('mp')} icon={<Smartphone size={20} />} label="M. Pago" />
                                <PaymentOption active={paymentMethod === 'other'} onClick={() => setPaymentMethod('other')} icon={<MoreHorizontal size={20} />} label="Otros" />
                            </div>

                            {paymentMethod === 'other' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Especifique el método (ej. Canje, Vale...)"
                                        value={customPaymentDetail}
                                        onChange={(e) => setCustomPaymentDetail(e.target.value)}
                                        style={{
                                            width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--fire-orange)', borderRadius: '4px', color: 'white', fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                            )}

                            {!cajaOpen && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(212,32,0,0.1)', border: '1px solid var(--fire-red)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--fire-orange)', fontWeight: 700 }}>
                                    ⚠ Abrí la caja antes de registrar ventas.
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setStep('split')}
                                    className="obsidian-card"
                                    style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                                >
                                    <Users size={16} /> DIVIDIR
                                </button>
                                <button
                                    disabled={!paymentMethod || !cajaOpen}
                                    onClick={() => setStep('payment')}
                                    className="primary-button"
                                    style={{ flex: 2, opacity: (paymentMethod && cajaOpen) ? 1 : 0.5, padding: '0.75rem', fontSize: '0.8rem', cursor: !cajaOpen ? 'not-allowed' : 'pointer' }}
                                >
                                    PROCESAR PAGO
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'split' && (
                        <div style={{ textAlign: 'center' }}>
                            <Users size={40} color="var(--fire-orange)" style={{ marginBottom: '1.5rem' }} />
                            <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>¿Varios comensales?</h3>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <button
                                    onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                                    style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', fontSize: '1.5rem' }}
                                >-</button>
                                <span style={{ fontSize: '3rem', fontWeight: 900 }}>{splitCount}</span>
                                <button
                                    onClick={() => setSplitCount(splitCount + 1)}
                                    style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', fontSize: '1.5rem' }}
                                >+</button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={() => { setSplitCount(1); setStep('summary'); }} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem', fontSize: '0.8rem' }}>CANCELAR</button>
                                <button onClick={() => setStep('summary')} className="primary-button" style={{ flex: 2, padding: '0.75rem', fontSize: '0.8rem' }}>CONFIRMAR</button>
                            </div>
                        </div>
                    )}

                    {step === 'payment' && (
                        <div style={{ textAlign: 'center' }}>
                            <Receipt size={40} color="var(--fire-orange)" style={{ marginBottom: '1.5rem' }} />
                            <h3 className="font-serif" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                                Confirmar Pago con {
                                    paymentMethod === 'mp' ? 'Mercado Pago' :
                                        paymentMethod === 'transfer' ? 'Transferencia' :
                                            paymentMethod === 'other' ? (customPaymentDetail || 'Otro Método') :
                                                (paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo')
                                }
                            </h3>
                            <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>Procesar en terminal físico antes de confirmar.</p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={() => setStep('summary')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '4px', border: 'none', color: 'white', fontSize: '0.8rem' }}>ATRÁS</button>
                                <button onClick={handleFinish} className="primary-button" style={{ flex: 2, padding: '0.75rem', fontSize: '0.8rem' }}>FINALIZAR</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PaymentOption({ icon, label, active, onClick }) {
    return (
        <div
            onClick={onClick}
            className="obsidian-card"
            style={{
                padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                borderColor: active ? 'var(--fire-orange)' : 'rgba(255,255,255,0.1)',
                background: active ? 'rgba(255, 69, 0, 0.05)' : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.3s'
            }}
        >
            {icon}
            <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1rem', fontSize: '0.7rem' }}>{label}</span>
        </div>
    );
}
