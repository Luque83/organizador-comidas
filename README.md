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
    ├── recommendationEngine.test.ts
    └── shoppingListCalculator.test.ts
```

## 🔄 Sincronización y Hogares (Supabase)

La aplicación utiliza **Supabase** para ofrecer funcionalidades "Offline-First" con sincronización en tiempo real. 

- **Offline-First**: Todo se guarda instantáneamente en SQLite. Si no hay conexión, se encola.
- **Hogares**: Varios usuarios pueden unirse a un mismo hogar mediante un código de invitación.
- **Sincronización**: Cuando recuperas conexión, se sincronizan los datos de tu hogar automáticamente.

### 📱 Testing con varios dispositivos (Dos móviles)

Para probar la sincronización en tiempo real entre dos móviles distintos, puedes seguir este flujo:

1. **Configurar el entorno**: Asegúrate de tener tu `.env` con las claves de Supabase (`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
2. **Levantar el servidor en tu red local**:
   ```bash
   npx expo start --lan
   ```
3. **Móvil 1 (El creador)**:
   - Conéctate al mismo WiFi que el PC y escanea el código QR con **Expo Go**.
   - Inicia sesión o regístrate en la app.
   - Crea un "Hogar" (o ve a Ajustes -> Mi Hogar) y **copia el código de invitación**.
   - Añade un producto a la Despensa.
4. **Móvil 2 (El invitado)**:
   - Escanea el mismo código QR con Expo Go en el segundo móvil.
   - Regístrate con una cuenta diferente.
   - Al entrar, selecciona **"Unirse con código"** y pega el código del Móvil 1.
   - **¡Magia!** Verás el producto que el Móvil 1 añadió a la despensa (y dirá "Añadido por..."). Si el Móvil 2 modifica la cantidad, el Móvil 1 lo verá reflejado al instante.

### 🚀 Compilación (EAS / TestFlight / APK)

Para compilar la aplicación para su distribución (APK de Android o TestFlight en iOS) usamos Expo Application Services (EAS). Ya existe un archivo `eas.json` preconfigurado.

1. Instala la CLI de EAS: `npm install -g eas-cli`
2. Haz login: `eas login`
3. Configura el proyecto: `eas build:configure`
4. **Para Android (APK local o AppBundle)**: `eas build -p android --profile preview`
5. **Para iOS (TestFlight)**: `eas build -p ios --profile production` (requiere cuenta de Apple Developer).

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.
Siéntete libre de modificarlo, mejorarlo o usarlo como base para tus proyectos.
