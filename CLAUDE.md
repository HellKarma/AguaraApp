# Aguara App - Proyecto de Traspaso (Project Handover)

## 📌 Resumen del Proyecto
**Aguara** es una aplicación web moderna de gestión de restaurantes y gastronomía (Restaurant Management System & POS), conceptualizada con la ambición de replicar y superar las funcionalidades y la experiencia de usuario de sistemas líderes del mercado como Fudo. 

El proyecto cuenta con una estética "Premium", utilizando colores vibrantes, *dark mode* fluido, glassmorfismo y micro-animaciones (CSS puro interconectado, sin Tailwind). Se prioriza la legibilidad, interactividad inmediata y una arquitectura sólida del lado del cliente.

**Stack Tecnológico:**
- **Framework:** React 19 + Vite.
- **Enrutamiento:** React Router DOM (v7).
- **Gestión de Estado Centralizada:** Zustand.
- **Estilos:** Vanilla CSS moderno con variables de entorno visual (Custom Properties).
- **Iconos:** Lucide-React.

---

## 🚀 Módulos y Funciones Actuales (Implementadas)

El sistema actualmente cuenta con una navegación (Sidebar) a través de los siguientes módulos funcionales:

1. **Dashboard (`/`)**: Vista principal de métricas y resumen general operativo.
2. **Punto de Venta / POS (`/pos`)**:
   - Panel interactivo para la creación de pedidos.
   - Cuenta con componentes dedicados: `OrderDrawer.jsx` (cajón lateral para el detalle de la orden en curso) y `CheckoutModal.jsx` (flujo final de cobro).
3. **KDS - Kitchen Display System (`/kds`)**: Recepción de comandas en la cocina, con gestión visual del estado del pedido (Pendiente, En Preparación, Listo).
4. **Inventario (`/inventory`)**: Panel para la visualización del stock.
5. **Caja (`/caja`)**: Gestión transaccional, flujo de efectivo y cuadre de turnos.
6. **Reportes (`/reports`)**: Panel para visualización de informes analíticos.
7. **CRM & Clientes (`/customers`) (Módulo Principal Reciente)**:
   - **Gestión de Clientes:** Tabla dinámica con información y métricas de clientes (visitas, ticket promedio).
   - **Formularios Mejorados:** Funcionalidad para agregar/editar clientes incluyendo su **Fecha de Cumpleaños (Birthday)**.
   - **Reglas VIP Automáticas:** Configuración visual (con funcionalidad de Guardado) para establecer umbrales automáticos en los que un cliente adquiere el estatus VIP (basado en cantidad de visitas o dinero gastado).
   - **Legibilidad:** Estilos refinados de los inputs numéricos (Reglas VIP y formularios) para asegurar contraste perfecto en el *dark mode*.
   - **Eliminación Segura:** Sistema de borrado de clientes protegido por un *Dialog/Modal de confirmación* accidental.

El estado maestro (productos, órdenes en curso, configuraciones VIP, lista de clientes) se maneja a lo largo de los componentes a través de **Zustand** (`aguaraStore.js`) alimentado actualmente por información predefinida (`mockData.js`).

---

## 🛠️ Lo que quedó pendiente por continuar

Para tu nuevo asistente (Claude Code), este es el punto de partida sugerido con características inmediatas para implementar:

1. **Cierre e interactividad del Backend:** Todas las transacciones son manejadas en memoria (Zustand). Requiere el planeamiento de una API Real y base de datos, o la inserción de un BaaS como Supabase o Firebase para persistir la información permanentemente.
2. **Mejoras pendientes al KDS:**
   - Temporizadores visuales (alertas de pedidos retrasados con cambio de color amarillo/rojo).
   - Arrastrar y soltar (Drag and Drop) o botones rápidos mejorados para las transacciones de estado.
3. **Inventario (Inventory) Avanzado:**
   - Descuento automático de ingredientes (Recetas vinculadas a los platillos del POS) que reste el inventario real al ejecutar ventas.
4. **Caja / Reports:**
   - Terminar la lógica dinámica para generar cierres en PDF/Impresión térmica directamente desde la interfaz.
5. **Responsividad Móvil Refinada:** Gran parte de la aplicación se ha priorizado para Web/Tablet Kiosks. Aún requiere revisiones exhaustivas de comportamiento CSS en resoluciones telefónicas delgadas (Mobile-first en los modales y grillas de producto).

---

## Instrucciones de Lanzamiento (Para el agente/usuario):

Para correr el proyecto tal y como se dejó:
```bash
npm install
npm run dev
```
