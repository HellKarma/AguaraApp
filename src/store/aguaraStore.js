import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

const getTenantId = () => useAuthStore.getState().tenantId;

export const useAguaraStore = create((set, get) => ({
    loading: false,
    error: null,

    tables: [],
    menu: [],
    categories: [],

    // --- Supply Chain States ---
    ingredients: [],
    ingredientCategories: [],
    recipes: {},
    stockHistory: [], // { id, type: 'sale'|'adjustment'|'waste', date, itemId, itemName, qty, unit, note }

    // --- Phase 4: Multiple Price Lists ---
    priceLists: [
        { id: 'salon', name: 'Salón', isDefault: true },
        { id: 'delivery', name: 'Delivery', isDefault: false },
        { id: 'mostrador', name: 'Mostrador', isDefault: false }
    ],
    activePriceListId: 'salon',
    priceOverrides: {}, // { [productId]: { [priceListId]: price } }
    deliveryMetadata: {}, // { [orderId]: { paymentMethod, isPaid, deliveryStatus, note, address } }

    // --- Phase 2: Personalization ---
    favorites: [],
    modifiers: {},

    activeOrders: {},
    kitchenQueue: {},

    // --- Phase 7: CRM & VIP ---
    customers: [],
    vipConfig: {
        plata: { minSpent: 50000, discount: 5 },
        oro: { minSpent: 150000, discount: 10 },
        platino: { minSpent: 300000, discount: 15 },
        diamante: { minSpent: 600000, discount: 20 }
    },
    selectedCustomerId: {}, // { [tableId]: customerId }

    orderHistory: [],

    // --- Phase 5: Caja & Flujo de Efectivo ---
    cashRegister: {
        isOpen: false,
        sessionId: null,
        openingBalance: 0,
        currentBalance: 0,
        totalRevenue: 0,
        openingDate: null,
        logs: [] // { id, date, type: 'sale'|'income'|'expense'|'open'|'close', amount, method, note }
    },
    shiftHistory: [], // archived closed shifts { id, openDate, closeDate, openBalance, closeBalance, totalRevenue, logs }
    kitchenHistory: [], // KDS completed items { id, tableId, tableName, name, quantity, startTime, endTime, durationSeconds }

    // --- POS Helpers ---
    getActivePrice: (productId) => {
        const { menu, activePriceListId, priceOverrides } = get();
        const product = menu.find(p => p.id === productId);
        if (!product) return 0;

        const override = priceOverrides[productId]?.[activePriceListId];
        return override !== undefined ? override : product.price;
    },

    // --- Stock Validation Helper ---
    checkAvailability: (productId, selectedModifiers = []) => {
        const { ingredients, recipes, menu } = get();
        const product = menu.find(p => p.id === productId);
        if (!product) return false;

        const baseRecipe = recipes[productId] || [];

        // If no recipe, check product-level stock
        if (baseRecipe.length === 0) {
            return product.stock > 0;
        }

        // If recipe exists, check ingredients
        const modifierIngredients = selectedModifiers
            .filter(m => m.ingredientId)
            .map(m => ({ ingredientId: m.ingredientId, quantity: m.quantity || 1 }));

        const totalRequired = [...baseRecipe, ...modifierIngredients].reduce((acc, req) => {
            acc[req.ingredientId] = (acc[req.ingredientId] || 0) + req.quantity;
            return acc;
        }, {});

        for (const [ingId, qty] of Object.entries(totalRequired)) {
            const ing = ingredients.find(i => i.id === ingId);
            if (!ing || ing.currentStock < qty) return false;
        }
        return true;
    },

    // --- Movement Logging Helper ---
    logMovement: (type, itemId, itemName, qty, unit, note = '') => set((state) => ({
        stockHistory: [{
            id: Date.now(),
            date: new Date().toISOString(),
            type, itemId, itemName, qty, unit, note
        }, ...state.stockHistory]
    })),

    // --- Stock Actions ---
    adjustStock: (ingredientId, amount, note = '') => set((state) => {
        const ing = state.ingredients.find(i => i.id === ingredientId);
        if (!ing) return state;

        const newIngredients = state.ingredients.map(i =>
            i.id === ingredientId ? { ...i, currentStock: i.currentStock + amount } : i
        );

        const historyEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            type: amount > 0 ? 'entry' : 'adjustment',
            itemId: ingredientId,
            itemName: ing.name,
            qty: Math.abs(amount),
            unit: ing.unit,
            note
        };

        return {
            ingredients: newIngredients,
            stockHistory: [historyEntry, ...state.stockHistory]
        };
    }),

    addWaste: (ingredientId, qty, reason = '') => set((state) => {
        const ing = state.ingredients.find(i => i.id === ingredientId);
        if (!ing) return state;

        const newIngredients = state.ingredients.map(i =>
            i.id === ingredientId ? { ...i, currentStock: Math.max(0, i.currentStock - qty) } : i
        );

        const historyEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'waste',
            itemId: ingredientId,
            itemName: ing.name,
            qty,
            unit: ing.unit,
            note: reason
        };

        return {
            ingredients: newIngredients,
            stockHistory: [historyEntry, ...state.stockHistory]
        };
    }),

    // --- Favorites Management ---
    toggleFavorite: (productId) => set((state) => ({
        favorites: state.favorites.includes(productId)
            ? state.favorites.filter(id => id !== productId)
            : [...state.favorites, productId]
    })),

    setModifiers: (productId, modifierGroups) => set((state) => ({
        modifiers: { ...state.modifiers, [productId]: modifierGroups }
    })),

    // --- Table Management ---
    fetchTables: async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('restaurant_tables')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');
        if (error) { set({ loading: false, error: error.message }); return; }
        set({ tables: data, loading: false });
    },

    occupyTable: (tableId) => set((state) => ({
        tables: state.tables.map(t => t.id === tableId ? { ...t, status: 'occupied' } : t)
    })),

    setTableStatus: (tableId, status) => set((state) => ({
        tables: state.tables.map(t => t.id === tableId ? { ...t, status } : t)
    })),

    addTable: async (tableData) => {
        const tenantId = getTenantId();
        const { tables } = get();
        const usedPositions = tables.map(t => t.position);
        let pos = { x: 10, y: 10 };
        for (let y = 10; y <= 70; y += 25) {
            for (let x = 10; x <= 70; x += 30) {
                if (!usedPositions.some(p => Math.abs(p.x - x) < 15 && Math.abs(p.y - y) < 15)) {
                    pos = { x, y };
                    break;
                }
            }
        }
        const tempId = `temp_${Date.now()}`;
        const optimistic = { id: tempId, name: tableData.name, status: 'available', shape: tableData.shape || 'square', capacity: tableData.capacity || 4, position: pos };
        set(state => ({ tables: [...state.tables, optimistic] }));

        const { data, error } = await supabase
            .from('restaurant_tables')
            .insert({ name: tableData.name, status: 'available', shape: tableData.shape || 'square', capacity: tableData.capacity || 4, position: pos, tenant_id: tenantId })
            .select()
            .single();
        if (error) {
            set(state => ({ tables: state.tables.filter(t => t.id !== tempId), error: error.message }));
            return;
        }
        set(state => ({ tables: state.tables.map(t => t.id === tempId ? data : t) }));
    },

    // Sync local state (used during drag for smooth UX)
    updateTable: (tableId, updates) => set((state) => ({
        tables: state.tables.map(t => t.id === tableId ? { ...t, ...updates } : t)
    })),

    // Async Supabase write — call after drag ends or on rename/shape change
    persistTable: async (tableId) => {
        const table = get().tables.find(t => t.id === tableId);
        if (!table) return;
        await supabase
            .from('restaurant_tables')
            .update({ name: table.name, shape: table.shape, position: table.position, capacity: table.capacity })
            .eq('id', tableId)
            .eq('tenant_id', getTenantId());
    },

    deleteTable: async (tableId) => {
        set({ loading: true, error: null });
        const { error } = await supabase
            .from('restaurant_tables')
            .delete()
            .eq('id', tableId)
            .eq('tenant_id', getTenantId());
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => ({ tables: state.tables.filter(t => t.id !== tableId), loading: false }));
    },

    // --- Active Orders Persistence ---
    fetchActiveOrders: async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('status', 'open');
        if (error) return;
        const activeOrders = {};
        data.forEach(order => { activeOrders[order.table_id] = order.items || []; });
        set({ activeOrders });
    },

    persistOrder: async (tableId) => {
        const tenantId = getTenantId();
        const items = get().activeOrders[tableId];
        if (!items || items.length === 0) {
            supabase.from('orders').delete().eq('table_id', tableId).eq('tenant_id', tenantId);
            return;
        }
        const { data: existing } = await supabase
            .from('orders').select('id').eq('table_id', tableId).eq('tenant_id', tenantId).single();
        if (existing) {
            await supabase.from('orders').update({ items }).eq('id', existing.id);
        } else {
            await supabase.from('orders').insert({ table_id: tableId, items, status: 'open', tenant_id: tenantId });
        }
    },

    // --- POS Order Management ---
    addItemToOrder: (tableId, item, selectedModifiers = []) => {
        const { ingredients, recipes, activeOrders, getActivePrice } = get();

        // Check stock one last time before final add
        const baseRecipe = recipes[item.id] || [];
        const modifierIngredients = selectedModifiers
            .filter(m => m.ingredientId)
            .map(m => ({ ingredientId: m.ingredientId, quantity: m.quantity || 1 }));

        const fullDepletion = [...baseRecipe, ...modifierIngredients];

        set((state) => {
            const existingOrder = state.activeOrders[tableId] || [];
            const hasModifiers = selectedModifiers.length > 0;
            const itemIndex = hasModifiers
                ? -1
                : existingOrder.findIndex(i => i.id === item.id && i.status === 'pending' && (!i.selectedModifiers || i.selectedModifiers.length === 0));

            let newOrder;
            const currentBasePrice = getActivePrice(item.id);
            const modifierTotal = selectedModifiers.reduce((acc, mod) => acc + (mod.extraPrice || 0), 0);
            const lineId = Date.now() + Math.random().toString(36).substr(2, 9);

            if (itemIndex > -1) {
                newOrder = existingOrder.map((it, idx) =>
                    idx === itemIndex ? { ...it, quantity: it.quantity + 1 } : it
                );
            } else {
                newOrder = [...existingOrder, {
                    ...item,
                    quantity: 1,
                    status: item.category === 'vinos' ? 'ready' : 'pending',
                    lineId,
                    price: currentBasePrice + modifierTotal,
                    selectedModifiers
                }];
            }

            let newIngredients = state.ingredients;
            let newHistory = state.stockHistory;
            let newMenu = state.menu;

            // Deplete product-level stock if no recipe
            if (fullDepletion.length === 0) {
                newMenu = state.menu.map(p => p.id === item.id ? { ...p, stock: Math.max(0, p.stock - 1) } : p);
            } else {
                // Deplete ingredients
                newIngredients = state.ingredients.map(ing => {
                    const components = fullDepletion.filter(r => r.ingredientId === ing.id);
                    if (components.length > 0) {
                        const totalQty = components.reduce((acc, c) => acc + c.quantity, 0);

                        // Log movement for each depletion
                        const logId = Date.now() + Math.random();
                        newHistory = [{
                            id: logId,
                            date: new Date().toISOString(),
                            type: 'sale',
                            itemId: ing.id,
                            itemName: ing.name,
                            qty: totalQty,
                            unit: ing.unit,
                            note: `Venta: ${item.name}`
                        }, ...newHistory];

                        return { ...ing, currentStock: ing.currentStock - totalQty };
                    }
                    return ing;
                });
            }

            return {
                activeOrders: { ...state.activeOrders, [tableId]: newOrder },
                ingredients: newIngredients,
                stockHistory: newHistory,
                menu: newMenu
            };
        });
        get().persistOrder(tableId);
    },

    fetchOrderHistory: async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        const { data, error } = await supabase
            .from('order_history')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(500);
        if (error) return;
        set({ orderHistory: data.map(h => ({ ...h, date: h.created_at, tableName: h.table_name, customerId: h.client_id })) });
    },

    removeOrder: async (tableId, paymentInfo) => {
        const state = get();
        const tenantId = getTenantId();
        const orderItems = state.activeOrders[tableId] || [];
        const totalAmount = orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        // CRM logic
        const customerId = state.selectedCustomerId[tableId];
        let finalAmount = totalAmount;
        let updatedCustomer = null;

        if (customerId) {
            const customer = state.customers.find(c => c.id === customerId);
            if (customer) {
                const discount = state.getCustomerDiscount(customerId);
                finalAmount = totalAmount * (1 - discount / 100);
                const newTotalSpent = customer.totalSpent + finalAmount;
                const newVipLevel = state.calculateVipLevel(newTotalSpent);
                updatedCustomer = {
                    ...customer,
                    totalSpent: newTotalSpent,
                    vipLevel: newVipLevel,
                    lastOrderDate: new Date().toISOString(),
                    points: customer.points + Math.floor(finalAmount / 100)
                };
            }
        }

        const payments = paymentInfo?.payments?.length
            ? paymentInfo.payments
            : [{ amount: finalAmount, method: paymentInfo?.method || 'cash' }];

        const now = new Date().toISOString();
        const tableName = paymentInfo?.tableName || String(tableId);

        const cashAmount = payments.filter(p => p.method === 'cash').reduce((acc, p) => acc + p.amount, 0);
        const paymentLogs = state.cashRegister.isOpen && paymentInfo
            ? payments.map(p => ({
                id: `sale_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                date: now,
                type: 'sale',
                amount: p.amount,
                method: p.method,
                note: `Venta: ${tableName}`
            }))
            : [];

        const localSnapshot = {
            id: `h_${Date.now()}`,
            date: now,
            total: finalAmount,
            items: orderItems,
            tableName,
            payments,
            customerId: customerId || null
        };

        // Optimistic local state update first
        set(state => {
            const newOrders = { ...state.activeOrders };
            delete newOrders[tableId];
            const newMetadata = { ...state.deliveryMetadata };
            delete newMetadata[tableId];
            const newSelectedCustomerId = { ...state.selectedCustomerId };
            delete newSelectedCustomerId[tableId];

            const newCustomers = updatedCustomer
                ? state.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
                : state.customers;

            const newCashRegister = paymentLogs.length
                ? {
                    ...state.cashRegister,
                    currentBalance: state.cashRegister.currentBalance + cashAmount,
                    totalRevenue: (state.cashRegister.totalRevenue || 0) + finalAmount,
                    logs: [...paymentLogs, ...state.cashRegister.logs]
                }
                : state.cashRegister;

            return {
                activeOrders: newOrders,
                deliveryMetadata: newMetadata,
                cashRegister: newCashRegister,
                orderHistory: [localSnapshot, ...state.orderHistory],
                customers: newCustomers,
                selectedCustomerId: newSelectedCustomerId
            };
        });

        // Supabase writes in background
        supabase.from('order_history').insert({
            total: finalAmount, items: orderItems,
            table_name: tableName, payments, client_id: customerId || null, tenant_id: tenantId
        });
        supabase.from('orders').delete().eq('table_id', tableId).eq('tenant_id', tenantId);
        if (updatedCustomer) {
            supabase.from('clients').update({
                total_spent: updatedCustomer.totalSpent,
                vip_level: updatedCustomer.vipLevel,
                points: updatedCustomer.points,
                visit_count: (updatedCustomer.visit_count || 0) + 1
            }).eq('id', updatedCustomer.id).eq('tenant_id', tenantId);
        }
        const { cashRegister } = get();
        if (cashRegister.sessionId && paymentLogs.length) {
            paymentLogs.forEach(log => {
                supabase.from('cash_movements').insert({
                    session_id: cashRegister.sessionId,
                    tenant_id: tenantId,
                    type: 'sale',
                    amount: log.amount,
                    method: log.method,
                    note: log.note
                });
            });
            supabase.from('cash_sessions').update({
                total_revenue: (cashRegister.totalRevenue || 0) + finalAmount,
                current_balance: cashRegister.currentBalance
            }).eq('id', cashRegister.sessionId);
        }
    },

    // --- Order Item Editing (carrito) ---
    adjustOrderItemQty: (tableId, lineId, delta) => {
        set((state) => {
            const orderItems = state.activeOrders[tableId] || [];
            const item = orderItems.find(it => it.lineId === lineId);
            if (!item || item.status !== 'pending') return state;

            const newQty = item.quantity + delta;
            const recipe = state.recipes[item.id] || [];

            const adjustStock = (ingredients, menu, units) => {
                if (recipe.length === 0) {
                    return {
                        menu: menu.map(p => p.id === item.id ? { ...p, stock: Math.max(0, p.stock - units) } : p),
                        ingredients
                    };
                }
                return {
                    menu,
                    ingredients: ingredients.map(ing => {
                        const req = recipe.filter(r => r.ingredientId === ing.id);
                        if (req.length === 0) return ing;
                        const qty = req.reduce((acc, r) => acc + r.quantity, 0) * units;
                        return { ...ing, currentStock: ing.currentStock - qty };
                    })
                };
            };

            if (newQty <= 0) {
                const { menu, ingredients } = adjustStock(state.ingredients, state.menu, -item.quantity);
                const newOrder = orderItems.filter(it => it.lineId !== lineId);
                const newOrders = { ...state.activeOrders, [tableId]: newOrder };
                if (newOrder.length === 0) delete newOrders[tableId];
                return { activeOrders: newOrders, menu, ingredients };
            }

            const { menu, ingredients } = adjustStock(state.ingredients, state.menu, -delta);
            const newOrder = orderItems.map(it => it.lineId === lineId ? { ...it, quantity: newQty } : it);
            return {
                activeOrders: { ...state.activeOrders, [tableId]: newOrder },
                menu,
                ingredients
            };
        });
        get().persistOrder(tableId);
    },

    // --- Kitchen Management ---
    sendToKitchen: (tableId, items) => set((state) => {
        const orderItems = state.activeOrders[tableId] || [];
        const startTime = new Date().toISOString();

        const newOrder = orderItems.map(it => {
            const isBeingSent = items.some(sentIt => sentIt.lineId === it.lineId);
            if (isBeingSent) return { ...it, status: 'production' };
            return it;
        });

        const existingQueue = state.kitchenQueue[tableId] || [];
        const newQueueItems = items.map(item => ({ ...item, startTime, status: 'production' }));

        return {
            activeOrders: { ...state.activeOrders, [tableId]: newOrder },
            kitchenQueue: { ...state.kitchenQueue, [tableId]: [...existingQueue, ...newQueueItems] }
        };
    }),

    removeFromKitchen: (tableId, itemIndex) => set((state) => {
        const existingQueue = state.kitchenQueue[tableId] || [];
        const kitchenItem = existingQueue[itemIndex];
        if (!kitchenItem) return state;

        const endTime = new Date().toISOString();
        const durationSeconds = Math.round((new Date(endTime) - new Date(kitchenItem.startTime)) / 1000);

        const orderItems = state.activeOrders[tableId] || [];
        const newOrder = orderItems.map(it => {
            if (it.lineId === kitchenItem.lineId) return { ...it, status: 'ready' };
            return it;
        });

        const historyEntry = {
            id: `kh_${Date.now()}`,
            tableId,
            tableName: state.tables.find(t => t.id === Number(tableId))?.name || `Mesa ${tableId}`,
            name: kitchenItem.name,
            quantity: kitchenItem.quantity,
            startTime: kitchenItem.startTime,
            endTime,
            durationSeconds,
            selectedModifiers: kitchenItem.selectedModifiers
        };

        const newQueue = existingQueue.filter((_, idx) => idx !== itemIndex);
        const newQueueState = { ...state.kitchenQueue };
        if (newQueue.length === 0) delete newQueueState[tableId];
        else newQueueState[tableId] = newQueue;

        return {
            activeOrders: { ...state.activeOrders, [tableId]: newOrder },
            kitchenQueue: newQueueState,
            kitchenHistory: [historyEntry, ...state.kitchenHistory]
        };
    }),

    // --- Price List Management ---
    setActivePriceList: (priceListId) => set({ activePriceListId: priceListId }),

    updatePriceOverride: (productId, priceListId, price) => set((state) => ({
        priceOverrides: {
            ...state.priceOverrides,
            [productId]: {
                ...(state.priceOverrides[productId] || {}),
                [priceListId]: price
            }
        }
    })),

    addPriceList: (name) => set((state) => ({
        priceLists: [...state.priceLists, { id: `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`, name, isDefault: false }]
    })),

    updateDeliveryMetadata: (orderId, metadata) => set((state) => ({
        deliveryMetadata: {
            ...state.deliveryMetadata,
            [orderId]: { ...(state.deliveryMetadata[orderId] || {}), ...metadata }
        }
    })),

    // --- Bulk Import ---
    bulkImportProducts: (products) => set((state) => {
        const newMenu = [...state.menu];
        products.forEach(importProd => {
            const existingIdx = newMenu.findIndex(p => p.name.toLowerCase() === importProd.name.toLowerCase());
            if (existingIdx !== -1) {
                newMenu[existingIdx] = { ...newMenu[existingIdx], ...importProd };
            } else {
                newMenu.push({ ...importProd, id: `m${Date.now()}_${Math.random().toString(36).substr(2, 5)}` });
            }
        });
        return { menu: newMenu };
    }),

    bulkImportIngredients: (ingredients) => set((state) => {
        const newIngredients = [...state.ingredients];
        ingredients.forEach(importIng => {
            const existingIdx = newIngredients.findIndex(i => i.name.toLowerCase() === importIng.name.toLowerCase());
            if (existingIdx !== -1) {
                newIngredients[existingIdx] = { ...newIngredients[existingIdx], ...importIng };
            } else {
                newIngredients.push({ ...importIng, id: `i${Date.now()}_${Math.random().toString(36).substr(2, 5)}` });
            }
        });
        return { ingredients: newIngredients };
    }),

    reconcileStock: (adjustments) => set((state) => {
        let newMenu = [...state.menu];
        let newIngredients = [...state.ingredients];
        let newHistory = [...state.stockHistory];

        adjustments.forEach(adj => {
            const isProduct = adj.id.startsWith('m');
            if (isProduct) {
                const idx = newMenu.findIndex(p => p.id === adj.id);
                if (idx !== -1) {
                    const diff = adj.physicalCount - newMenu[idx].stock;
                    if (diff !== 0) {
                        newMenu[idx] = { ...newMenu[idx], stock: adj.physicalCount };
                        newHistory.push({
                            id: `mv_${Date.now()}_${Math.random()}`,
                            date: new Date().toISOString(),
                            type: diff > 0 ? 'entry' : 'adjustment',
                            itemId: adj.id,
                            itemName: adj.name,
                            qty: Math.abs(diff),
                            unit: 'u',
                            note: 'Auditoría de Inventario'
                        });
                    }
                }
            } else {
                const idx = newIngredients.findIndex(i => i.id === adj.id);
                if (idx !== -1) {
                    const diff = adj.physicalCount - newIngredients[idx].currentStock;
                    if (diff !== 0) {
                        newIngredients[idx] = { ...newIngredients[idx], currentStock: adj.physicalCount };
                        newHistory.push({
                            id: `mv_${Date.now()}_${Math.random()}`,
                            date: new Date().toISOString(),
                            type: diff > 0 ? 'entry' : 'adjustment',
                            itemId: adj.id,
                            itemName: adj.name,
                            qty: Math.abs(diff),
                            unit: newIngredients[idx].unit,
                            note: 'Auditoría de Inventario'
                        });
                    }
                }
            }
        });

        return { menu: newMenu, ingredients: newIngredients, stockHistory: newHistory };
    }),

    // --- Inventory & Menu Management ---
    fetchProducts: async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');
        if (error) { set({ loading: false, error: error.message }); return; }
        set({ menu: data.map(p => ({ ...p, category: p.category_id })), loading: false });
    },

    addProduct: async (product) => {
        const tenantId = getTenantId();
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('products')
            .insert({ name: product.name, price: product.price, stock: product.stock || 0, category_id: product.category, tenant_id: tenantId })
            .select()
            .single();
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => ({ menu: [...state.menu, { ...data, category: data.category_id }], loading: false }));
    },

    updateProduct: async (updatedProduct) => {
        set({ loading: true, error: null });
        const { error } = await supabase
            .from('products')
            .update({ name: updatedProduct.name, price: updatedProduct.price, stock: updatedProduct.stock, category_id: updatedProduct.category })
            .eq('id', updatedProduct.id)
            .eq('tenant_id', getTenantId());
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => ({ menu: state.menu.map(p => p.id === updatedProduct.id ? { ...updatedProduct } : p), loading: false }));
    },

    deleteProduct: async (productId) => {
        set({ loading: true, error: null });
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('tenant_id', getTenantId());
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => ({ menu: state.menu.filter(p => p.id !== productId), loading: false }));
    },

    fetchIngredients: async () => {
        const tenantId = getTenantId(); if (!tenantId) return;
        set({ loading: true, error: null });
        const { data, error } = await supabase.from('ingredients').select('*').eq('tenant_id', tenantId).order('name');
        if (error) { set({ loading: false, error: error.message }); return; }
        set({ ingredients: data.map(i => ({ ...i, currentStock: i.current_stock, minStock: i.min_stock })), loading: false });
    },
    addIngredient: async (ingredient) => {
        const tenantId = getTenantId(); if (!tenantId) return;
        const tempId = `temp_i_${Date.now()}`;
        set(state => ({ ingredients: [...state.ingredients, { ...ingredient, id: tempId }] }));
        const { data, error } = await supabase.from('ingredients').insert({
            name: ingredient.name,
            unit: ingredient.unit,
            current_stock: ingredient.currentStock ?? ingredient.current_stock ?? 0,
            min_stock: ingredient.minStock ?? ingredient.min_stock ?? 0,
            tenant_id: tenantId
        }).select().single();
        if (error) { set(state => ({ ingredients: state.ingredients.filter(i => i.id !== tempId), error: error.message })); return; }
        set(state => ({ ingredients: state.ingredients.map(i => i.id === tempId ? { ...data, currentStock: data.current_stock, minStock: data.min_stock } : i) }));
    },
    updateIngredient: async (updatedIngredient) => {
        const tenantId = getTenantId(); if (!tenantId) return;
        set(state => ({ ingredients: state.ingredients.map(i => i.id === updatedIngredient.id ? updatedIngredient : i) }));
        await supabase.from('ingredients').update({
            name: updatedIngredient.name,
            unit: updatedIngredient.unit,
            current_stock: updatedIngredient.currentStock ?? updatedIngredient.current_stock ?? 0,
            min_stock: updatedIngredient.minStock ?? updatedIngredient.min_stock ?? 0
        }).eq('id', updatedIngredient.id).eq('tenant_id', tenantId);
    },
    deleteIngredient: async (ingredientId) => {
        const tenantId = getTenantId(); if (!tenantId) return;
        set(state => ({ ingredients: state.ingredients.filter(i => i.id !== ingredientId) }));
        await supabase.from('ingredients').delete().eq('id', ingredientId).eq('tenant_id', tenantId);
    },

    updateRecipe: (productId, ingredientsList) => set((state) => ({
        recipes: { ...state.recipes, [productId]: ingredientsList }
    })),

    decrementStock: (itemId, amount) => set((state) => ({
        menu: state.menu.map(item =>
            item.id === itemId ? { ...item, stock: Math.max(0, item.stock - amount) } : item
        )
    })),

    // --- Tenant Seed ---
    seedTenantIfNew: async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;

        const { count } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

        if (count > 0) return;

        const { data, error } = await supabase
            .from('categories')
            .insert({ name: 'General', icon: 'Utensils', sort_order: 0, tenant_id: tenantId })
            .select()
            .single();

        if (!error && data) set({ categories: [data] });
    },

    // --- Category Management ---
    fetchCategories: async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('sort_order');
        if (error) { set({ loading: false, error: error.message }); return; }
        set({ categories: data, loading: false });
    },

    addCategory: async (category) => {
        const tenantId = getTenantId();
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('categories')
            .insert({ name: category.name, icon: category.icon || null, sort_order: category.sort_order ?? 0, tenant_id: tenantId })
            .select()
            .single();
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => ({ categories: [...state.categories, data], loading: false }));
    },

    updateCategory: async (id, newName) => {
        set({ loading: true, error: null });
        const { error } = await supabase
            .from('categories')
            .update({ name: newName })
            .eq('id', id)
            .eq('tenant_id', getTenantId());
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => ({
            categories: state.categories.map(c => c.id === id ? { ...c, name: newName } : c),
            menu: state.menu.map(p => p.category === id ? { ...p, category: id } : p),
            loading: false
        }));
    },

    deleteCategory: async (id) => {
        set({ loading: true, error: null });
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('tenant_id', getTenantId());
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => {
            const fallback = state.categories.find(c => c.id !== id)?.id || null;
            return {
                categories: state.categories.filter(c => c.id !== id),
                menu: state.menu.map(p => p.category === id ? { ...p, category: fallback } : p),
                loading: false
            };
        });
    },

    addIngredientCategory: (category) => set((state) => ({
        ingredientCategories: [...state.ingredientCategories, { ...category, id: category.name.toLowerCase().replace(/\s+/g, '_') }]
    })),
    updateIngredientCategory: (id, newName) => set((state) => {
        const newId = newName.toLowerCase().replace(/\s+/g, '_');
        const updatedCategories = state.ingredientCategories.map(c => c.id === id ? { ...c, id: newId, name: newName } : c);
        const updatedIngredients = state.ingredients.map(i => i.category === id ? { ...i, category: newId } : i);
        return { ingredientCategories: updatedCategories, ingredients: updatedIngredients };
    }),
    deleteIngredientCategory: (id) => set((state) => ({
        ingredientCategories: state.ingredientCategories.filter(c => c.id !== id),
        ingredients: state.ingredients.map(i => i.category === id ? { ...i, category: 'otros' } : i)
    })),

    // --- Caja Actions ---
    fetchCashSession: async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        const { data: session } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_open', true)
            .single();
        if (!session) return;

        const { data: movements } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false });

        const logs = (movements || []).map(m => ({
            id: m.id, date: m.created_at, type: m.type,
            amount: m.amount, method: m.method, note: m.note
        }));

        set({
            cashRegister: {
                isOpen: true,
                sessionId: session.id,
                openingBalance: session.opening_balance,
                currentBalance: session.current_balance,
                totalRevenue: session.total_revenue || 0,
                openingDate: session.opened_at,
                logs
            }
        });
    },

    openShift: async (amount) => {
        const tenantId = getTenantId();
        const now = new Date().toISOString();
        const { data: session, error } = await supabase
            .from('cash_sessions')
            .insert({ tenant_id: tenantId, opening_balance: amount, current_balance: amount, total_revenue: 0, is_open: true, opened_at: now })
            .select().single();
        if (error) return;

        const { data: openLog } = await supabase
            .from('cash_movements')
            .insert({ session_id: session.id, tenant_id: tenantId, type: 'open', amount, method: 'cash', note: 'Apertura de Caja' })
            .select().single();

        set({
            cashRegister: {
                isOpen: true,
                sessionId: session.id,
                openingBalance: amount,
                currentBalance: amount,
                totalRevenue: 0,
                openingDate: now,
                logs: openLog ? [{ id: openLog.id, date: openLog.created_at, type: 'open', amount, method: 'cash', note: 'Apertura de Caja' }] : []
            }
        });
    },

    closeShift: async () => {
        const state = get();
        const { sessionId, currentBalance, openingBalance, openingDate, totalRevenue, logs } = state.cashRegister;
        const tenantId = getTenantId();
        const now = new Date().toISOString();

        if (sessionId) {
            await supabase.from('cash_sessions').update({
                is_open: false, closing_balance: currentBalance,
                total_revenue: totalRevenue, closed_at: now
            }).eq('id', sessionId).eq('tenant_id', tenantId);

            await supabase.from('cash_movements').insert({
                session_id: sessionId, tenant_id: tenantId,
                type: 'close', amount: currentBalance, method: 'cash', note: 'Cierre de Caja'
            });
        }

        const closeLog = { id: `close_${Date.now()}`, date: now, type: 'close', amount: currentBalance, method: 'cash', note: 'Cierre de Caja' };
        const snapshot = {
            id: sessionId || `shift_${Date.now()}`,
            openDate: openingDate, closeDate: now,
            openBalance: openingBalance, closeBalance: currentBalance,
            totalRevenue: totalRevenue || 0,
            logs: [closeLog, ...logs]
        };

        set(state => ({
            cashRegister: { ...state.cashRegister, isOpen: false, sessionId: null, logs: [closeLog, ...logs] },
            shiftHistory: [snapshot, ...state.shiftHistory]
        }));
    },

    addCashMovement: async (type, amount, method, note) => {
        const numericAmount = Number(amount);
        const { cashRegister } = get();
        const tenantId = getTenantId();
        const newBalance = type === 'expense'
            ? cashRegister.currentBalance - numericAmount
            : cashRegister.currentBalance + numericAmount;

        const localLog = { id: `mv_${Date.now()}`, date: new Date().toISOString(), type, amount: numericAmount, method, note };

        set(state => ({
            cashRegister: {
                ...state.cashRegister,
                currentBalance: newBalance,
                logs: [localLog, ...state.cashRegister.logs]
            }
        }));

        if (cashRegister.sessionId) {
            const { data } = await supabase.from('cash_movements')
                .insert({ session_id: cashRegister.sessionId, tenant_id: tenantId, type, amount: numericAmount, method, note })
                .select().single();
            if (data) {
                set(state => ({
                    cashRegister: {
                        ...state.cashRegister,
                        logs: state.cashRegister.logs.map(l => l.id === localLog.id ? { ...l, id: data.id } : l)
                    }
                }));
                await supabase.from('cash_sessions').update({ current_balance: newBalance }).eq('id', cashRegister.sessionId);
            }
        }
    },

    deleteCashMovement: async (logId) => {
        const { cashRegister } = get();
        const log = cashRegister.logs.find(l => l.id === logId);
        if (!log || (log.type !== 'income' && log.type !== 'expense')) return;
        const balanceAdjust = log.type === 'expense' ? log.amount : -log.amount;
        const newBalance = cashRegister.currentBalance + balanceAdjust;

        set(state => ({
            cashRegister: {
                ...state.cashRegister,
                currentBalance: newBalance,
                logs: state.cashRegister.logs.filter(l => l.id !== logId)
            }
        }));

        supabase.from('cash_movements').delete().eq('id', logId);
        if (cashRegister.sessionId) {
            supabase.from('cash_sessions').update({ current_balance: newBalance }).eq('id', cashRegister.sessionId);
        }
    },

    // --- Intelligence Actions ---
    getProductProfitability: () => {
        const { menu, recipes, ingredients } = get();
        return menu.map(p => {
            const recipe = recipes[p.id] || [];
            const cost = recipe.reduce((acc, r) => {
                const ing = ingredients.find(i => i.id === r.ingredientId);
                const unitCost = ing ? ing.costPerUnit : 0;
                return acc + (unitCost * r.quantity);
            }, 0);
            return {
                ...p,
                cost,
                margin: p.price - cost,
                marginPct: cost > 0 ? ((p.price - cost) / p.price) * 100 : 100
            };
        }).sort((a, b) => b.margin - a.margin);
    },

    // --- CRM Actions ---
    fetchCustomers: async () => {
        const tenantId = getTenantId();
        if (!tenantId) return;
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');
        if (error) { set({ loading: false, error: error.message }); return; }
        const customers = data.map(c => ({ ...c, vipLevel: c.vip_level, totalSpent: c.total_spent || 0 }));
        set({ customers, loading: false });
    },

    selectCustomerForOrder: (tableId, customerId) => set((state) => ({
        selectedCustomerId: { ...state.selectedCustomerId, [tableId]: customerId }
    })),

    addCustomer: async (customer) => {
        const tenantId = getTenantId();
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('clients')
            .insert({ name: customer.name, phone: customer.phone || null, email: customer.email || null, birthday: customer.birthday || null, vip_level: 'bronce', total_spent: 0, points: 0, visit_count: 0, tenant_id: tenantId })
            .select()
            .single();
        if (error) { set({ loading: false, error: error.message }); return; }
        const newCustomer = { ...data, vipLevel: data.vip_level, totalSpent: data.total_spent || 0 };
        set(state => ({ customers: [newCustomer, ...state.customers], loading: false }));
    },

    updateCustomer: async (updatedCustomer) => {
        set({ loading: true, error: null });
        const { error } = await supabase
            .from('clients')
            .update({ name: updatedCustomer.name, phone: updatedCustomer.phone || null, email: updatedCustomer.email || null, birthday: updatedCustomer.birthday || null, vip_level: updatedCustomer.vipLevel, total_spent: updatedCustomer.totalSpent, points: updatedCustomer.points, visit_count: updatedCustomer.visit_count || 0 })
            .eq('id', updatedCustomer.id)
            .eq('tenant_id', getTenantId());
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => ({
            customers: state.customers.map(c => c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c),
            loading: false
        }));
    },

    removeCustomer: async (customerId) => {
        set({ loading: true, error: null });
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', customerId)
            .eq('tenant_id', getTenantId());
        if (error) { set({ loading: false, error: error.message }); return; }
        set(state => ({ customers: state.customers.filter(c => c.id !== customerId), loading: false }));
    },

    updateVipConfig: (newConfig) => set((state) => {
        const newState = { vipConfig: newConfig };
        // Re-calculate everyone's VIP level when config changes
        newState.customers = state.customers.map(c => ({
            ...c,
            vipLevel: get().calculateVipLevel(c.totalSpent, newConfig)
        }));
        return newState;
    }),

    calculateVipLevel: (totalSpent, customConfig) => {
        const config = customConfig || get().vipConfig;
        if (totalSpent >= config.diamante.minSpent) return 'diamante';
        if (totalSpent >= config.platino.minSpent) return 'platino';
        if (totalSpent >= config.oro.minSpent) return 'oro';
        if (totalSpent >= config.plata.minSpent) return 'plata';
        return 'bronce';
    },

    // --- Inventory Extensions ---
    deleteRecipe: (productId) => set((state) => ({
        recipes: { ...state.recipes, [productId]: [] }
    })),

    deletePriceList: (priceListId) => set((state) => {
        const PROTECTED = ['salon', 'delivery', 'mostrador'];
        if (PROTECTED.includes(priceListId) || state.activePriceListId === priceListId) return state;
        const newOverrides = {};
        Object.entries(state.priceOverrides).forEach(([productId, overrides]) => {
            const { [priceListId]: _, ...rest } = overrides;
            newOverrides[productId] = rest;
        });
        return {
            priceLists: state.priceLists.filter(l => l.id !== priceListId),
            priceOverrides: newOverrides
        };
    }),

    updatePriceList: (priceListId, newName) => set((state) => ({
        priceLists: state.priceLists.map(l => l.id === priceListId ? { ...l, name: newName } : l)
    })),

    // --- Kitchen Extensions ---
    revertKitchenItem: (tableId, itemIndex) => set((state) => {
        const existingQueue = state.kitchenQueue[tableId] || [];
        const kitchenItem = existingQueue[itemIndex];
        if (!kitchenItem) return state;
        const orderItems = state.activeOrders[tableId] || [];
        const newOrder = orderItems.map(it =>
            it.lineId === kitchenItem.lineId ? { ...it, status: 'pending' } : it
        );
        const newQueue = existingQueue.filter((_, idx) => idx !== itemIndex);
        const newQueueState = { ...state.kitchenQueue };
        if (newQueue.length === 0) delete newQueueState[tableId];
        else newQueueState[tableId] = newQueue;
        return {
            activeOrders: { ...state.activeOrders, [tableId]: newOrder },
            kitchenQueue: newQueueState
        };
    }),

    getCustomerDiscount: (customerId) => {
        const { customers, vipConfig } = get();
        const customer = customers.find(c => c.id === customerId);
        if (!customer || customer.vipLevel === 'bronce') return 0;
        return vipConfig[customer.vipLevel]?.discount || 0;
    },

    subscribeRealtime: () => {
        const tenantId = getTenantId(); if (!tenantId) return () => {};

        const ordersChannel = supabase
            .channel(`orders:${tenantId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, payload => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const order = payload.new;
                    set(state => ({ activeOrders: { ...state.activeOrders, [order.table_id]: order.items || [] } }));
                } else if (payload.eventType === 'DELETE') {
                    set(state => {
                        const next = { ...state.activeOrders };
                        const tableId = payload.old?.table_id;
                        if (tableId) delete next[tableId];
                        return { activeOrders: next };
                    });
                }
            })
            .subscribe();

        const tablesChannel = supabase
            .channel(`tables:${tenantId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables', filter: `tenant_id=eq.${tenantId}` }, payload => {
                if (payload.eventType === 'INSERT') {
                    const t = payload.new;
                    set(state => {
                        if (state.tables.find(tbl => tbl.id === t.id)) return state;
                        return { tables: [...state.tables, t] };
                    });
                } else if (payload.eventType === 'UPDATE') {
                    set(state => ({ tables: state.tables.map(tbl => tbl.id === payload.new.id ? payload.new : tbl) }));
                } else if (payload.eventType === 'DELETE') {
                    set(state => ({ tables: state.tables.filter(tbl => tbl.id !== payload.old.id) }));
                }
            })
            .subscribe();

        const historyChannel = supabase
            .channel(`order_history:${tenantId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_history', filter: `tenant_id=eq.${tenantId}` }, payload => {
                const h = payload.new;
                set(state => ({
                    orderHistory: [{ ...h, tableName: h.table_name, customerId: h.customer_id }, ...state.orderHistory]
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(tablesChannel);
            supabase.removeChannel(historyChannel);
        };
    }
}));
