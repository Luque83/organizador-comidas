# 📅 Mi Menú Semanal

Aplicación móvil multiplataforma (iOS y Android) para organizar tu menú semanal, recetas, almacén y lista de la compra.

## ✨ Características principales

- 📆 **Planificador semanal** — Organiza desayuno, almuerzo, merienda y cena para cada día de la semana
- 🍽️ **Recetas** — Catálogo completo con ingredientes, pasos, tiempos y dificultad
- 🧠 **Recomendaciones inteligentes** — Sugiere recetas según lo que tienes en casa
- 📦 **Almacén** — Controla despensa, frigorífico y congelador con alertas de caducidad
- 🛒 **Lista de la compra** — Generación automática y manual, agrupada por categorías
- 🔒 **100% offline** — Todo se guarda localmente con SQLite, sin necesidad de cuenta

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | React Native + Expo |
| Lenguaje | TypeScript |
| Navegación | Expo Router (file-based) |
| Estado global | Zustand |
| Base de datos | SQLite vía expo-sqlite |
| Formularios | React Hook Form + Zod |
| Fechas | date-fns |
| Tests | Jest + ts-jest |

## 🚀 Instalación y ejecución

### Prerrequisitos
- [Node.js 18+](https://nodejs.org/)
- [Expo Go](https://expo.dev/client) en tu móvil (o emulador Android/iOS)

### Pasos

```bash
# 1. Clona el repositorio o accede al directorio del proyecto
cd "Organizador de comidas"

# 2. Instala las dependencias
npm install

# 3. Inicia el servidor de desarrollo
npx expo start

# 4. Escanea el QR con Expo Go o pulsa 'a' para Android / 'i' para iOS
```

### Ejecutar tests

```bash
npm test
# o con cobertura:
npm run test:coverage
```

## 📁 Estructura del proyecto

```
Organizador de comidas/
├── app/                     # Pantallas (Expo Router)
│   ├── _layout.tsx          # Layout raíz con inicialización de BD
│   ├── (tabs)/              # Navegación principal por pestañas
│   │   ├── index.tsx        # 🏠 Dashboard / Inicio
│   │   ├── week.tsx         # 📅 Planificador semanal
│   │   ├── recipes/         # 🍽️ Recetas (lista, detalle, nueva)
│   │   ├── pantry/          # 📦 Almacén (lista, detalle, nuevo)
│   │   ├── shopping/        # 🛒 Lista de la compra
│   │   └── settings/        # ⚙️ Ajustes
│   └── modals/              # Modales
│       └── add-meal.tsx     # Modal para añadir comida al menú
├── components/              # Componentes reutilizables
│   ├── ui/                  # Componentes base (EmptyState, Toast, etc.)
│   ├── RecipeCard.tsx       # Tarjeta de receta
│   ├── PantryItemCard.tsx   # Tarjeta de producto de almacén
│   └── ShoppingItemRow.tsx  # Fila de la lista de la compra
├── database/                # Capa de datos
│   ├── schema.ts            # Esquema SQL (16 tablas)
│   ├── db.ts                # Helper de acceso a SQLite
│   └── seed.ts              # Datos iniciales de ejemplo
├── services/                # Lógica de negocio
│   ├── unitConversion.ts    # Conversión de unidades
│   ├── ingredientMatcher.ts # Normalización de nombres
│   ├── shoppingListCalculator.ts # Cálculo de la lista de compra
│   ├── recommendationEngine.ts   # Recomendaciones de recetas
│   └── backupService.ts     # Exportación/importación de datos
├── store/                   # Stores de estado (Zustand)
│   ├── useSettingsStore.ts
│   ├── useRecipesStore.ts
│   ├── usePantryStore.ts
│   ├── useMealPlanStore.ts
│   ├── useShoppingStore.ts
│   └── useIngredientsStore.ts
├── schemas/                 # Validación con Zod
│   └── index.ts
├── types/                   # Tipos TypeScript
│   └── index.ts
├── constants/               # Constantes de la aplicación
│   └── index.ts
└── tests/                   # Tests unitarios
    ├── unitConversion.test.ts
    ├── ingredientMatcher.test.ts
    └── shoppingCalculator.test.ts
```

## 🎨 Diseño

La aplicación usa un sistema de diseño propio con:
- **Paleta cálida**: terracota (#E8784A), verde salvia (#7BAF7A), crema (#FFF8F0)
- **Modo claro/oscuro** totalmente personalizable
- Componentes reutilizables con tokens de color centralizados

## 📐 Reglas de negocio importantes

1. **Sin descuento automático**: Los ingredientes del almacén solo se descuentan cuando marcas una comida como "preparada"
2. **FIFO para caducidades**: El sistema prioriza consumir antes los productos más próximos a caducar
3. **Recomendaciones locales**: El motor de recomendaciones funciona 100% sin conexión a internet
4. **Datos locales**: Toda la información se almacena en SQLite en el dispositivo

## 🔮 Próximas versiones (roadmap)

- [ ] Compartir recetas con otros usuarios
- [ ] Sincronización en la nube (opcional)
- [ ] Escáner de códigos de barras para el almacén
- [ ] Planificación nutricional
- [ ] Importar recetas desde URLs

---
*Desarrollado con React Native + Expo — Funciona 100% offline*
