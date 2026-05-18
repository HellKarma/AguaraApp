import { create } from 'zustand';
import { TABLES, MENU_ITEMS, CATEGORIES } from '../data/mockData';

export const useAguaraStore = create((set, get) => ({
    tables: TABLES,
    menu: MENU_ITEMS,
    categories: CATEGORIES,

    // --- Supply Chain States ---
    ingredients: [],
    ingredientCategories: [
        { id: 'carnes', name: 'Carnes' },
        { id: 'verduras', name: 'Verduras' },
        { id: 'otros', name: 'Otros' }
    ],
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
    customers: [
        { id: 'c1', name: 'Juan Galván', phone: '12345678', address: 'Calle Selva 123', email: 'juan@aguara.com', birthday: '1985-05-15', points: 450, totalSpent: 75000, lastOrderDate: '2026-02-15T20:00:00Z', vipLevel: 'plata' },
        { id: 'c2', name: 'María Thompson', phone: '87654321', address: 'Av. Corrientes 456', email: 'maria@gmail.com', birthday: '1992-11-22', points: 120, totalSpent: 12000, lastOrderDate: '2026-02-18T14:30:00Z', vipLevel: 'bronce' },
    ],
    vipConfig: {
        plata: { minSpent: 50000, discount: 5 },
        oro: { minSpent: 150000, discount: 10 },
        platino: { minSpent: 300000, discount: 15 },
        diamante: { minSpent: 600000, discount: 20 }
    },
    selectedCustomerId: {}, // { [tableId]: customerId }

    // --- Analytics Mock Data ---
    orderHistory: [
        { id: 'h1', date: new Date(Date.now() - 3600000 * 24).toISOString(), total: 4500, items: [], tableName: 'Mesa 1', method: 'cash' },
        { id: 'h2', date: new Date(Date.now() - 3600000 * 20).toISOString(), total: 3200, items: [], tableName: 'Pedido #101', method: 'mp' },
        { id: 'h3', date: new Date(Date.now() - 3600000 * 18).toISOString(), total: 8900, items: [], tableName: 'Mesa 4', method: 'card' },
        { id: 'h4', date: new Date(Date.now() - 3600000 * 5).toISOString(), total: 1200, items: [], tableName: 'Mesa 2', method: 'cash' },
        { id: 'h5', date: new Date(Date.now() - 3600000 * 2).toISOString(), total: 5600, items: [], tableName: 'Pedido #104', method: 'transfer' },
    ],

    // --- Phase 5: Caja & Flujo de Efectivo ---
    cashRegister: {
        isOpen: false,
        openingBalance: 0,
        currentBalance: 0,
        openingDate: null,
        logs: [] // { id, date, type: 'sale'|'income'|'expense'|'open'|'close', amount, method, note }
    },

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
    occupyTable: (tableId) => set((state) => ({
        tables: state.tables.map(t => t.id === tableId ? { ...t, status: 'occupied' } : t)
    })),

    setTableStatus: (tableId, status) => set((state) => ({
        tables: state.tables.map(t => t.id === tableId ? { ...t, status } : t)
    })),

    // --- POS Order Management ---
    addItemToOrder: (tableId, item, selectedModifiers = []) => {
        const { ingredients, recipes, activeOrders, logMovement, getActivePrice } = get();

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
    },

    removeOrder: (tableId, paymentInfo) => set((state) => {
        const newOrders = { ...state.activeOrders };
        const orderItems = newOrders[tableId] || [];
        delete newOrders[tableId];
        const newMetadata = { ...state.deliveryMetadata };
        delete newMetadata[tableId];

        const totalAmount = orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        // CRM Logic
        const customerId = state.selectedCustomerId[tableId];
        let newCustomers = [...state.customers];
        let finalAmount = totalAmount;

        if (customerId) {
            const customer = newCustomers.find(c => c.id === customerId);
            if (customer) {
                const discount = state.getCustomerDiscount(customerId);
                finalAmount = totalAmount * (1 - discount / 100);

                const newTotalSpent = customer.totalSpent + finalAmount;
                const newVipLevel = state.calculateVipLevel(newTotalSpent);

                newCustomers = newCustomers.map(c =>
                    c.id === customerId
                        ? { ...c, totalSpent: newTotalSpent, vipLevel: newVipLevel, lastOrderDate: new Date().toISOString(), points: c.points + Math.floor(finalAmount / 100) }
                        : c
                );
            }
        }

        const orderSnapshot = {
            id: `h_${Date.now()}`,
            date: new Date().toISOString(),
            total: finalAmount,
            items: orderItems,
            tableName: paymentInfo?.tableName || tableId,
            method: paymentInfo?.method || 'cash',
            customerId: customerId || null
        };

        let newCashRegister = state.cashRegister;
        if (state.cashRegister.isOpen && paymentInfo) {
            const logId = `sale_${Date.now()}`;

            newCashRegister = {
                ...state.cashRegister,
                currentBalance: paymentInfo.method === 'cash'
                    ? state.cashRegister.currentBalance + totalAmount
                    : state.cashRegister.currentBalance,
                logs: [{
                    id: logId,
                    date: new Date().toISOString(),
                    type: 'sale',
                    amount: totalAmount,
                    method: paymentInfo.method || 'cash',
                    note: `Venta: ${paymentInfo.tableName || tableId}`
                }, ...state.cashRegister.logs]
            };
        }

        return {
            activeOrders: newOrders,
            deliveryMetadata: newMetadata,
            cashRegister: newCashRegister,
            orderHistory: [orderSnapshot, ...state.orderHistory]
        };
    }),

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
            orderHistory: [historyEntry, ...state.orderHistory]
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
        priceLists: [...state.priceLists, { id: name.toLowerCase().replace(/\s+/g, '_'), name, isDefault: false }]
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
    addProduct: (product) => set((state) => ({
        menu: [...state.menu, { ...product, id: `m${Date.now()}` }]
    })),
    updateProduct: (updatedProduct) => set((state) => ({
        menu: state.menu.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    })),
    deleteProduct: (productId) => set((state) => ({
        menu: state.menu.filter(p => p.id !== productId)
    })),

    addIngredient: (ingredient) => set((state) => ({
        ingredients: [...state.ingredients, { ...ingredient, id: `i${Date.now()}` }]
    })),
    updateIngredient: (updatedIngredient) => set((state) => ({
        ingredients: state.ingredients.map(i => i.id === updatedIngredient.id ? updatedIngredient : i)
    })),
    deleteIngredient: (ingredientId) => set((state) => ({
        ingredients: state.ingredients.filter(i => i.id !== ingredientId)
    })),

    updateRecipe: (productId, ingredientsList) => set((state) => ({
        recipes: { ...state.recipes, [productId]: ingredientsList }
    })),

    decrementStock: (itemId, amount) => set((state) => ({
        menu: state.menu.map(item =>
            item.id === itemId ? { ...item, stock: Math.max(0, item.stock - amount) } : item
        )
    })),

    // --- Category Management ---
    addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: category.name.toLowerCase().replace(/\s+/g, '_') }]
    })),
    updateCategory: (id, newName) => set((state) => {
        const newId = newName.toLowerCase().replace(/\s+/g, '_');
        const updatedCategories = state.categories.map(c => c.id === id ? { ...c, id: newId, name: newName } : c);
        const updatedMenu = state.menu.map(p => p.category === id ? { ...p, category: newId } : p);
        return { categories: updatedCategories, menu: updatedMenu };
    }),
    deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id),
        menu: state.menu.map(p => p.category === id ? { ...p, category: 'otros' } : p) // Default to 'otros'
    })),

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
    openShift: (amount) => set((state) => ({
        cashRegister: {
            ...state.cashRegister,
            isOpen: true,
            openingBalance: amount,
            currentBalance: amount,
            openingDate: new Date().toISOString(),
            logs: [{
                id: `open_${Date.now()}`,
                date: new Date().toISOString(),
                type: 'open',
                amount: amount,
                method: 'cash',
                note: 'Apertura de Caja'
            }]
        }
    })),

    closeShift: () => set((state) => ({
        cashRegister: {
            ...state.cashRegister,
            isOpen: false,
            logs: [{
                id: `close_${Date.now()}`,
                date: new Date().toISOString(),
                type: 'close',
                amount: state.cashRegister.currentBalance,
                method: 'cash',
                note: 'Cierre de Caja'
            }, ...state.cashRegister.logs]
        }
    })),

    addCashMovement: (type, amount, method, note) => set((state) => {
        const numericAmount = Number(amount);
        const newBalance = type === 'expense'
            ? state.cashRegister.currentBalance - numericAmount
            : state.cashRegister.currentBalance + numericAmount;

        return {
            cashRegister: {
                ...state.cashRegister,
                currentBalance: newBalance,
                logs: [{
                    id: `mv_${Date.now()}`,
                    date: new Date().toISOString(),
                    type,
                    amount: numericAmount,
                    method,
                    note
                }, ...state.cashRegister.logs]
            }
        };
    }),

    // --- Intelligence Actions ---
    getProductProfitability: () => {
        const { menu, recipes, ingredients } = get();
        return menu.map(p => {
            const recipe = recipes[p.id] || [];
            const cost = recipe.reduce((acc, r) => {
                const ing = ingredients.find(i => i.id === r.ingredientId);
                const unitCost = ing ? (ing.cost / 1) : 0;
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
    selectCustomerForOrder: (tableId, customerId) => set((state) => ({
        selectedCustomerId: { ...state.selectedCustomerId, [tableId]: customerId }
    })),

    addCustomer: (customer) => set((state) => ({
        customers: [{ ...customer, id: `c_${Date.now()}`, points: 0, totalSpent: 0, vipLevel: 'bronce' }, ...state.customers]
    })),

    updateCustomer: (updatedCustomer) => set((state) => ({
        customers: state.customers.map(c =>
            c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
        )
    })),

    removeCustomer: (customerId) => set((state) => ({
        customers: state.customers.filter(c => c.id !== customerId)
    })),

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

    getCustomerDiscount: (customerId) => {
        const { customers, vipConfig } = get();
        const customer = customers.find(c => c.id === customerId);
        if (!customer || customer.vipLevel === 'bronce') return 0;
        return vipConfig[customer.vipLevel]?.discount || 0;
    }
}));
