import { executeRun, executeFirst, withTransaction } from './db';
import { v4 as uuidv4 } from 'uuid';

// ─── Ingredientes base ───────────────────────────────────────
const SEED_INGREDIENTS = [
  // Verduras
  { name: 'Tomate', category: 'verduras', defaultUnit: 'g', isBasic: 1 },
  { name: 'Cebolla', category: 'verduras', defaultUnit: 'unidad', isBasic: 1 },
  { name: 'Ajo', category: 'verduras', defaultUnit: 'unidad', isBasic: 1 },
  { name: 'Pimiento rojo', category: 'verduras', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Pimiento verde', category: 'verduras', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Zanahoria', category: 'verduras', defaultUnit: 'unidad', isBasic: 1 },
  { name: 'Patata', category: 'verduras', defaultUnit: 'g', isBasic: 1 },
  { name: 'Calabacín', category: 'verduras', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Berenjena', category: 'verduras', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Espinacas', category: 'verduras', defaultUnit: 'g', isBasic: 0 },
  { name: 'Lechuga', category: 'verduras', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Pepino', category: 'verduras', defaultUnit: 'unidad', isBasic: 0 },
  // Frutas
  { name: 'Manzana', category: 'frutas', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Plátano', category: 'frutas', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Naranja', category: 'frutas', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Limón', category: 'frutas', defaultUnit: 'unidad', isBasic: 1 },
  // Carne
  { name: 'Pechuga de pollo', category: 'carne', defaultUnit: 'g', isBasic: 0 },
  { name: 'Muslo de pollo', category: 'carne', defaultUnit: 'g', isBasic: 0 },
  { name: 'Carne picada', category: 'carne', defaultUnit: 'g', isBasic: 0 },
  { name: 'Lomo de cerdo', category: 'carne', defaultUnit: 'g', isBasic: 0 },
  // Pescado
  { name: 'Salmón', category: 'pescado', defaultUnit: 'g', isBasic: 0 },
  { name: 'Atún en lata', category: 'conservas', defaultUnit: 'lata', isBasic: 1 },
  { name: 'Merluza', category: 'pescado', defaultUnit: 'g', isBasic: 0 },
  // Lácteos
  { name: 'Leche', category: 'lacteos', defaultUnit: 'ml', isBasic: 1 },
  { name: 'Yogur natural', category: 'lacteos', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Queso fresco', category: 'lacteos', defaultUnit: 'g', isBasic: 0 },
  { name: 'Queso rallado', category: 'lacteos', defaultUnit: 'g', isBasic: 0 },
  { name: 'Mantequilla', category: 'lacteos', defaultUnit: 'g', isBasic: 1 },
  // Huevos
  { name: 'Huevo', category: 'huevos', defaultUnit: 'unidad', isBasic: 1 },
  // Pasta y arroz
  { name: 'Arroz', category: 'pasta_arroz', defaultUnit: 'g', isBasic: 1 },
  { name: 'Pasta (macarrones)', category: 'pasta_arroz', defaultUnit: 'g', isBasic: 1 },
  { name: 'Espaguetis', category: 'pasta_arroz', defaultUnit: 'g', isBasic: 0 },
  // Legumbres
  { name: 'Lentejas', category: 'legumbres', defaultUnit: 'g', isBasic: 1 },
  { name: 'Garbanzos', category: 'legumbres', defaultUnit: 'g', isBasic: 1 },
  { name: 'Judías blancas', category: 'legumbres', defaultUnit: 'g', isBasic: 0 },
  // Cereales / Panadería
  { name: 'Pan de molde', category: 'panaderia', defaultUnit: 'unidad', isBasic: 1 },
  { name: 'Pan baguette', category: 'panaderia', defaultUnit: 'unidad', isBasic: 0 },
  { name: 'Avena', category: 'cereales', defaultUnit: 'g', isBasic: 0 },
  // Especias y condimentos
  { name: 'Aceite de oliva', category: 'salsas', defaultUnit: 'ml', isBasic: 1 },
  { name: 'Sal', category: 'especias', defaultUnit: 'g', isBasic: 1 },
  { name: 'Pimienta negra', category: 'especias', defaultUnit: 'g', isBasic: 1 },
  { name: 'Pimentón', category: 'especias', defaultUnit: 'g', isBasic: 0 },
  { name: 'Orégano', category: 'especias', defaultUnit: 'g', isBasic: 0 },
  // Conservas
  { name: 'Tomate frito', category: 'conservas', defaultUnit: 'g', isBasic: 1 },
  { name: 'Caldo de verduras', category: 'conservas', defaultUnit: 'ml', isBasic: 0 },
];

// ─── Alias para normalización ─────────────────────────────────
const SEED_ALIASES: { ingredientName: string; aliases: string[] }[] = [
  { ingredientName: 'Tomate', aliases: ['tomates', 'tomате'] },
  { ingredientName: 'Cebolla', aliases: ['cebollas'] },
  { ingredientName: 'Ajo', aliases: ['ajos', 'diente de ajo'] },
  { ingredientName: 'Patata', aliases: ['patatas', 'papa', 'papas'] },
  { ingredientName: 'Huevo', aliases: ['huevos'] },
  { ingredientName: 'Arroz', aliases: ['arroz blanco'] },
  { ingredientName: 'Lentejas', aliases: ['lenteja'] },
  { ingredientName: 'Garbanzos', aliases: ['garbanzo'] },
  { ingredientName: 'Pechuga de pollo', aliases: ['pollo', 'pollo en filete'] },
  { ingredientName: 'Salmón', aliases: ['salmon'] },
];

// ─── Conversiones personalizadas ─────────────────────────────
const SEED_CONVERSIONS = [
  { ingredientName: 'Cebolla', fromUnit: 'unidad', toUnit: 'g', factor: 150, description: '1 cebolla mediana ≈ 150g' },
  { ingredientName: 'Ajo', fromUnit: 'unidad', toUnit: 'g', factor: 5, description: '1 diente de ajo ≈ 5g' },
  { ingredientName: 'Tomate', fromUnit: 'unidad', toUnit: 'g', factor: 120, description: '1 tomate mediano ≈ 120g' },
  { ingredientName: 'Huevo', fromUnit: 'unidad', toUnit: 'g', factor: 60, description: '1 huevo L ≈ 60g' },
  { ingredientName: 'Patata', fromUnit: 'unidad', toUnit: 'g', factor: 200, description: '1 patata mediana ≈ 200g' },
  { ingredientName: 'Atún en lata', fromUnit: 'lata', toUnit: 'g', factor: 80, description: '1 lata de atún escurrido ≈ 80g' },
];

// ─── Recetas ──────────────────────────────────────────────────
const SEED_RECIPES = [
  {
    name: 'Lentejas con verduras',
    description: 'Un plato de cuchara tradicional, nutritivo y reconfortante.',
    category: 'legumbres',
    mealType: 'almuerzo',
    prepTime: 15,
    cookTime: 40,
    difficulty: 'facil',
    servings: 4,
    tags: ['cuchara', 'invierno', 'economico'],
    dietTags: ['vegetariana', 'sin_gluten'],
    allergens: [],
    ingredients: [
      { name: 'Lentejas', quantity: 400, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Tomate', quantity: 2, unit: 'unidad' },
      { name: 'Zanahoria', quantity: 2, unit: 'unidad' },
      { name: 'Ajo', quantity: 2, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 30, unit: 'ml' },
      { name: 'Pimentón', quantity: 5, unit: 'g' },
      { name: 'Sal', quantity: 5, unit: 'g' },
    ],
    steps: [
      'Pica la cebolla, el tomate, la zanahoria y el ajo en trozos pequeños.',
      'Sofríe en una olla con aceite de oliva durante 10 minutos.',
      'Añade las lentejas lavadas y cubre con agua.',
      'Incorpora el pimentón y la sal.',
      'Cocina a fuego medio durante 35-40 minutos hasta que las lentejas estén tiernas.',
      'Rectifica de sal y sirve caliente.',
    ],
  },
  {
    name: 'Arroz con pollo',
    description: 'Arroz sabroso con pollo jugoso, un clásico de la cocina casera.',
    category: 'arroz',
    mealType: 'almuerzo',
    prepTime: 15,
    cookTime: 35,
    difficulty: 'facil',
    servings: 4,
    tags: ['clasico', 'familiar'],
    dietTags: ['sin_gluten'],
    allergens: [],
    ingredients: [
      { name: 'Arroz', quantity: 320, unit: 'g' },
      { name: 'Pechuga de pollo', quantity: 600, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Pimiento rojo', quantity: 1, unit: 'unidad' },
      { name: 'Ajo', quantity: 2, unit: 'unidad' },
      { name: 'Tomate', quantity: 2, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 40, unit: 'ml' },
      { name: 'Caldo de verduras', quantity: 700, unit: 'ml' },
      { name: 'Sal', quantity: 5, unit: 'g' },
      { name: 'Pimentón', quantity: 5, unit: 'g' },
    ],
    steps: [
      'Corta el pollo en trozos y salpimienta.',
      'Dora el pollo en una paella con aceite. Reserva.',
      'En el mismo aceite, sofríe la cebolla, el ajo y el pimiento picados.',
      'Añade el tomate rallado y cocina 5 minutos.',
      'Incorpora el pollo, el arroz y el pimentón. Remueve 1 minuto.',
      'Vierte el caldo caliente. Ajusta de sal.',
      'Cocina a fuego fuerte 5 minutos y luego a fuego bajo 15 minutos.',
      'Deja reposar 5 minutos tapado antes de servir.',
    ],
  },
  {
    name: 'Pasta con tomate',
    description: 'La receta más sencilla y deliciosa. Lista en 20 minutos.',
    category: 'pasta',
    mealType: 'almuerzo',
    prepTime: 5,
    cookTime: 15,
    difficulty: 'facil',
    servings: 2,
    tags: ['rapida', 'economica'],
    dietTags: ['vegetariana'],
    allergens: ['gluten'],
    ingredients: [
      { name: 'Espaguetis', quantity: 200, unit: 'g' },
      { name: 'Tomate frito', quantity: 250, unit: 'g' },
      { name: 'Ajo', quantity: 1, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 20, unit: 'ml' },
      { name: 'Orégano', quantity: 3, unit: 'g' },
      { name: 'Sal', quantity: 5, unit: 'g' },
      { name: 'Queso rallado', quantity: 30, unit: 'g', optional: true },
    ],
    steps: [
      'Hierve agua con sal y cocina los espaguetis según las instrucciones del paquete.',
      'Sofríe el ajo laminado en aceite de oliva.',
      'Añade el tomate frito y el orégano. Cocina 5 minutos.',
      'Mezcla con la pasta escurrida.',
      'Sirve con queso rallado al gusto.',
    ],
  },
  {
    name: 'Ensalada completa',
    description: 'Ensalada variada y nutritiva, perfecta como plato único.',
    category: 'ensaladas',
    mealType: 'almuerzo',
    prepTime: 15,
    cookTime: 0,
    difficulty: 'facil',
    servings: 2,
    tags: ['fresca', 'verano', 'ligera'],
    dietTags: ['sin_gluten'],
    allergens: [],
    ingredients: [
      { name: 'Lechuga', quantity: 1, unit: 'unidad' },
      { name: 'Tomate', quantity: 2, unit: 'unidad' },
      { name: 'Pepino', quantity: 1, unit: 'unidad' },
      { name: 'Atún en lata', quantity: 2, unit: 'lata' },
      { name: 'Huevo', quantity: 2, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 30, unit: 'ml' },
      { name: 'Sal', quantity: 3, unit: 'g' },
      { name: 'Limón', quantity: 1, unit: 'unidad', optional: true },
    ],
    steps: [
      'Cuece los huevos durante 10 minutos. Enfría y pela.',
      'Lava y trocea la lechuga, el tomate y el pepino.',
      'Mezcla todo en un bol grande.',
      'Añade el atún escurrido y los huevos en cuartos.',
      'Aliña con aceite, sal y zumo de limón al gusto.',
    ],
  },
  {
    name: 'Tortilla de patatas',
    description: 'La tortilla española clásica, jugosa y sabrosa.',
    category: 'desayunos',
    mealType: 'almuerzo',
    prepTime: 20,
    cookTime: 20,
    difficulty: 'media',
    servings: 4,
    tags: ['clasico', 'espanol', 'versatil'],
    dietTags: ['vegetariana', 'sin_gluten'],
    allergens: ['huevo'],
    ingredients: [
      { name: 'Patata', quantity: 600, unit: 'g' },
      { name: 'Huevo', quantity: 5, unit: 'unidad' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 200, unit: 'ml' },
      { name: 'Sal', quantity: 8, unit: 'g' },
    ],
    steps: [
      'Pela y corta las patatas en láminas finas. Pela y pica la cebolla.',
      'Fríe las patatas y la cebolla en abundante aceite a fuego suave durante 20 minutos.',
      'Escurre el aceite y deja templar.',
      'Bate los huevos con sal y mezcla con las patatas.',
      'En una sartén con poco aceite vierte la mezcla y cuaja a fuego bajo.',
      'Da la vuelta con un plato y termina de cuajar por el otro lado.',
    ],
  },
  {
    name: 'Salmón al horno',
    description: 'Salmón jugoso y saludable, listo en 20 minutos.',
    category: 'pescado',
    mealType: 'cena',
    prepTime: 5,
    cookTime: 20,
    difficulty: 'facil',
    servings: 2,
    tags: ['saludable', 'rapida', 'omega3'],
    dietTags: ['sin_gluten', 'sin_lactosa'],
    allergens: ['pescado'],
    ingredients: [
      { name: 'Salmón', quantity: 400, unit: 'g' },
      { name: 'Limón', quantity: 1, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 20, unit: 'ml' },
      { name: 'Sal', quantity: 5, unit: 'g' },
      { name: 'Pimienta negra', quantity: 3, unit: 'g' },
      { name: 'Ajo', quantity: 1, unit: 'unidad', optional: true },
    ],
    steps: [
      'Precalienta el horno a 200°C.',
      'Coloca el salmón en una bandeja forrada con papel de hornear.',
      'Aliña con aceite, sal, pimienta y zumo de limón.',
      'Hornea 18-20 minutos hasta que esté bien cocido.',
      'Sirve con limón y acompañamiento al gusto.',
    ],
  },
  {
    name: 'Crema de calabacín',
    description: 'Crema suave y reconfortante, perfecta para cualquier temporada.',
    category: 'sopas',
    mealType: 'cena',
    prepTime: 10,
    cookTime: 25,
    difficulty: 'facil',
    servings: 4,
    tags: ['cremosa', 'ligera', 'saludable'],
    dietTags: ['vegetariana', 'sin_gluten'],
    allergens: ['lacteos'],
    ingredients: [
      { name: 'Calabacín', quantity: 3, unit: 'unidad' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Patata', quantity: 1, unit: 'unidad' },
      { name: 'Caldo de verduras', quantity: 600, unit: 'ml' },
      { name: 'Aceite de oliva', quantity: 30, unit: 'ml' },
      { name: 'Sal', quantity: 5, unit: 'g' },
      { name: 'Queso fresco', quantity: 50, unit: 'g', optional: true },
    ],
    steps: [
      'Trocea el calabacín, la cebolla y la patata.',
      'Sofríe la cebolla en aceite 5 minutos.',
      'Añade el calabacín y la patata. Cocina 5 minutos.',
      'Vierte el caldo y cocina 20 minutos hasta que todo esté blando.',
      'Tritura con una batidora hasta obtener una crema suave.',
      'Añade queso fresco si quieres. Ajusta de sal y sirve.',
    ],
  },
  {
    name: 'Garbanzos con espinacas',
    description: 'Plato tradicional andaluz, lleno de sabor y muy nutritivo.',
    category: 'legumbres',
    mealType: 'almuerzo',
    prepTime: 10,
    cookTime: 20,
    difficulty: 'facil',
    servings: 4,
    tags: ['tradicional', 'economico', 'nutritivo'],
    dietTags: ['vegetariana', 'vegana', 'sin_gluten'],
    allergens: [],
    ingredients: [
      { name: 'Garbanzos', quantity: 400, unit: 'g' },
      { name: 'Espinacas', quantity: 300, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Ajo', quantity: 3, unit: 'unidad' },
      { name: 'Tomate', quantity: 2, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 40, unit: 'ml' },
      { name: 'Pimentón', quantity: 5, unit: 'g' },
      { name: 'Sal', quantity: 5, unit: 'g' },
    ],
    steps: [
      'Sofríe la cebolla y el ajo picados en aceite de oliva.',
      'Añade el tomate rallado y el pimentón. Cocina 5 minutos.',
      'Incorpora las espinacas lavadas y deja que se reduzcan.',
      'Agrega los garbanzos cocidos (o de bote escurridos).',
      'Mezcla bien y cocina 10 minutos a fuego suave.',
      'Ajusta de sal y sirve caliente.',
    ],
  },
  {
    name: 'Pollo con verduras',
    description: 'Pollo jugoso con verduras de temporada al horno.',
    category: 'carne',
    mealType: 'almuerzo',
    prepTime: 15,
    cookTime: 45,
    difficulty: 'facil',
    servings: 4,
    tags: ['horno', 'saludable', 'completo'],
    dietTags: ['sin_gluten', 'sin_lactosa'],
    allergens: [],
    ingredients: [
      { name: 'Muslo de pollo', quantity: 800, unit: 'g' },
      { name: 'Patata', quantity: 3, unit: 'unidad' },
      { name: 'Pimiento rojo', quantity: 1, unit: 'unidad' },
      { name: 'Pimiento verde', quantity: 1, unit: 'unidad' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Ajo', quantity: 3, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 40, unit: 'ml' },
      { name: 'Sal', quantity: 8, unit: 'g' },
      { name: 'Pimienta negra', quantity: 3, unit: 'g' },
      { name: 'Orégano', quantity: 5, unit: 'g' },
    ],
    steps: [
      'Precalienta el horno a 200°C.',
      'Corta las patatas y los pimientos en trozos. Pela la cebolla y córtala en aros.',
      'Coloca las verduras en una bandeja. Añade el ajo entero.',
      'Coloca el pollo encima. Aliña todo con aceite, sal, pimienta y orégano.',
      'Hornea 45-50 minutos, dando la vuelta al pollo a la mitad.',
    ],
  },
  {
    name: 'Bocadillo vegetal',
    description: 'Bocadillo fresco y nutritivo, ideal para la merienda o cena ligera.',
    category: 'bocadillos',
    mealType: 'merienda',
    prepTime: 10,
    cookTime: 0,
    difficulty: 'facil',
    servings: 1,
    tags: ['rapido', 'frio', 'ligero'],
    dietTags: ['vegetariana'],
    allergens: ['gluten'],
    ingredients: [
      { name: 'Pan baguette', quantity: 1, unit: 'unidad' },
      { name: 'Tomate', quantity: 1, unit: 'unidad' },
      { name: 'Lechuga', quantity: 50, unit: 'g' },
      { name: 'Queso fresco', quantity: 60, unit: 'g' },
      { name: 'Pepino', quantity: 50, unit: 'g' },
      { name: 'Aceite de oliva', quantity: 10, unit: 'ml' },
      { name: 'Sal', quantity: 2, unit: 'g' },
    ],
    steps: [
      'Abre el pan y úntalo con aceite de oliva.',
      'Añade el tomate en rodajas y la lechuga.',
      'Incorpora el queso fresco y el pepino en láminas.',
      'Salpimienta y cierra el bocadillo.',
    ],
  },
  {
    name: 'Yogur con fruta y avena',
    description: 'Desayuno saludable y saciante, listo en 5 minutos.',
    category: 'desayunos',
    mealType: 'desayuno',
    prepTime: 5,
    cookTime: 0,
    difficulty: 'facil',
    servings: 1,
    tags: ['desayuno', 'saludable', 'rapido'],
    dietTags: ['vegetariana', 'sin_gluten'],
    allergens: ['lacteos'],
    ingredients: [
      { name: 'Yogur natural', quantity: 2, unit: 'unidad' },
      { name: 'Avena', quantity: 40, unit: 'g' },
      { name: 'Plátano', quantity: 1, unit: 'unidad' },
      { name: 'Manzana', quantity: 1, unit: 'unidad' },
    ],
    steps: [
      'Vierte el yogur en un bol.',
      'Añade la avena y mezcla bien.',
      'Trocea las frutas y colócalas encima.',
      'Sirve inmediatamente o guarda en la nevera hasta el momento de comer.',
    ],
  },
  {
    name: 'Ensalada de pasta',
    description: 'Ensalada de pasta colorida, ideal para llevar y preparar con antelación.',
    category: 'ensaladas',
    mealType: 'almuerzo',
    prepTime: 15,
    cookTime: 10,
    difficulty: 'facil',
    servings: 2,
    tags: ['fria', 'verano', 'preparar_antes'],
    dietTags: [],
    allergens: ['gluten'],
    ingredients: [
      { name: 'Pasta (macarrones)', quantity: 200, unit: 'g' },
      { name: 'Tomate', quantity: 2, unit: 'unidad' },
      { name: 'Pepino', quantity: 1, unit: 'unidad' },
      { name: 'Atún en lata', quantity: 2, unit: 'lata' },
      { name: 'Aceitunas', quantity: 50, unit: 'g', optional: true },
      { name: 'Aceite de oliva', quantity: 30, unit: 'ml' },
      { name: 'Sal', quantity: 3, unit: 'g' },
      { name: 'Orégano', quantity: 3, unit: 'g' },
    ],
    steps: [
      'Cuece la pasta en agua con sal según las instrucciones. Enfría con agua fría.',
      'Trocea el tomate y el pepino.',
      'Mezcla la pasta con las verduras y el atún escurrido.',
      'Aliña con aceite, sal y orégano.',
      'Refrigera al menos 30 minutos antes de servir.',
    ],
  },
];

// ─── Productos de ejemplo en almacén ─────────────────────────
const SEED_PANTRY_ITEMS = [
  { ingredientName: 'Arroz', quantity: 500, unit: 'g', location: 'despensa', expiryDate: '2026-12-01', minQuantity: 200 },
  { ingredientName: 'Pasta (macarrones)', quantity: 400, unit: 'g', location: 'despensa', expiryDate: '2026-10-15', minQuantity: 200 },
  { ingredientName: 'Lentejas', quantity: 600, unit: 'g', location: 'despensa', expiryDate: '2026-12-30', minQuantity: 200 },
  { ingredientName: 'Garbanzos', quantity: 800, unit: 'g', location: 'despensa', expiryDate: '2026-11-20', minQuantity: 200 },
  { ingredientName: 'Tomate frito', quantity: 400, unit: 'g', location: 'despensa', expiryDate: '2026-09-01', minQuantity: 200 },
  { ingredientName: 'Aceite de oliva', quantity: 750, unit: 'ml', location: 'despensa', expiryDate: '2027-01-01', minQuantity: 250 },
  { ingredientName: 'Sal', quantity: 500, unit: 'g', location: 'despensa', expiryDate: null, minQuantity: 100 },
  { ingredientName: 'Leche', quantity: 1000, unit: 'ml', location: 'frigorifico', expiryDate: '2026-07-20', minQuantity: 500 },
  { ingredientName: 'Huevo', quantity: 6, unit: 'unidad', location: 'frigorifico', expiryDate: '2026-07-28', minQuantity: 3 },
  { ingredientName: 'Yogur natural', quantity: 4, unit: 'unidad', location: 'frigorifico', expiryDate: '2026-07-18', minQuantity: 0 },
  { ingredientName: 'Zanahoria', quantity: 500, unit: 'g', location: 'frigorifico', expiryDate: '2026-07-22', minQuantity: 0 },
  { ingredientName: 'Pechuga de pollo', quantity: 500, unit: 'g', location: 'congelador', expiryDate: '2026-09-01', minQuantity: 0 },
  { ingredientName: 'Salmón', quantity: 300, unit: 'g', location: 'congelador', expiryDate: '2026-08-15', minQuantity: 0 },
  { ingredientName: 'Espinacas', quantity: 300, unit: 'g', location: 'congelador', expiryDate: '2026-10-01', minQuantity: 0 },
  { ingredientName: 'Atún en lata', quantity: 4, unit: 'lata', location: 'despensa', expiryDate: '2027-05-01', minQuantity: 2 },
];

function normalize(name: string): string {
  return name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export async function runSeed(): Promise<void> {
  // Verificar si ya hay datos
  const existing = await import('./db').then(m => m.executeFirst<{ count: number }>(
    'SELECT COUNT(*) as count FROM ingredients'
  ));
  if (existing && existing.count > 0) {
    console.log('[Seed] Datos ya existentes, omitiendo seed.');
    return;
  }

  console.log('[Seed] Insertando datos iniciales...');

  await withTransaction(async () => {
    // Insertar configuración inicial
    await executeRun(
      `INSERT OR IGNORE INTO user_settings (id, default_servings, meals_per_day) VALUES ('default', 2, 3)`,
      []
    );

    // Insertar ingredientes
    const ingredientIdMap: Record<string, string> = {};
    for (const ing of SEED_INGREDIENTS) {
      const id = uuidv4();
      ingredientIdMap[ing.name] = id;
      await executeRun(
        `INSERT INTO ingredients (id, name, normalized_name, category, default_unit, is_basic)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, ing.name, normalize(ing.name), ing.category, ing.defaultUnit, ing.isBasic]
      );
    }

    // Insertar alias
    for (const aliasGroup of SEED_ALIASES) {
      const ingId = ingredientIdMap[aliasGroup.ingredientName];
      if (!ingId) continue;
      for (const alias of aliasGroup.aliases) {
        await executeRun(
          `INSERT INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES (?, ?, ?, ?)`,
          [uuidv4(), ingId, alias, normalize(alias)]
        );
      }
    }

    // Insertar conversiones
    for (const conv of SEED_CONVERSIONS) {
      const ingId = ingredientIdMap[conv.ingredientName];
      if (!ingId) continue;
      await executeRun(
        `INSERT INTO ingredient_conversions (id, ingredient_id, from_unit, to_unit, factor, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), ingId, conv.fromUnit, conv.toUnit, conv.factor, conv.description]
      );
    }

    // Insertar recetas
    const recipeIdMap: Record<string, string> = {};
    for (const recipe of SEED_RECIPES) {
      const id = uuidv4();
      recipeIdMap[recipe.name] = id;
      await executeRun(
        `INSERT INTO recipes (id, name, description, category, meal_type, prep_time, cook_time, difficulty, servings, tags, diet_tags, allergens)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          recipe.name,
          recipe.description,
          recipe.category,
          recipe.mealType,
          recipe.prepTime,
          recipe.cookTime,
          recipe.difficulty,
          recipe.servings,
          JSON.stringify(recipe.tags),
          JSON.stringify(recipe.dietTags),
          JSON.stringify(recipe.allergens),
        ]
      );

      // Ingredientes de la receta
      for (const ing of recipe.ingredients) {
        const ingId = ingredientIdMap[ing.name] || null;
        await executeRun(
          `INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, name, quantity, unit, optional)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), id, ingId, ing.name, ing.quantity, ing.unit, (ing as any).optional ? 1 : 0]
        );
      }

      // Pasos de la receta
      for (let i = 0; i < recipe.steps.length; i++) {
        await executeRun(
          `INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES (?, ?, ?, ?)`,
          [uuidv4(), id, i + 1, recipe.steps[i]]
        );
      }
    }

    // Insertar productos en almacén
    for (const item of SEED_PANTRY_ITEMS) {
      const ingId = ingredientIdMap[item.ingredientName] || null;
      await executeRun(
        `INSERT INTO pantry_items (id, ingredient_id, custom_name, quantity, unit, min_quantity, location, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          ingId,
          item.ingredientName,
          item.quantity,
          item.unit,
          item.minQuantity ?? null,
          item.location,
          item.expiryDate,
        ]
      );
    }

    // Crear plan semanal de ejemplo (semana actual)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=domingo
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const weekStart = monday.toISOString().split('T')[0];

    const mealPlanId = uuidv4();
    await executeRun(
      `INSERT OR IGNORE INTO meal_plans (id, week_start) VALUES (?, ?)`,
      [mealPlanId, weekStart]
    );

    // Crear comidas de ejemplo para la semana
    const mealExamples = [
      { dayOffset: 0, mealType: 'desayuno', recipeName: 'Yogur con fruta y avena', servings: 2 },
      { dayOffset: 0, mealType: 'almuerzo', recipeName: 'Lentejas con verduras', servings: 4 },
      { dayOffset: 0, mealType: 'cena', recipeName: 'Salmón al horno', servings: 2 },
      { dayOffset: 1, mealType: 'desayuno', recipeName: 'Yogur con fruta y avena', servings: 2 },
      { dayOffset: 1, mealType: 'almuerzo', recipeName: 'Arroz con pollo', servings: 4 },
      { dayOffset: 1, mealType: 'cena', recipeName: 'Crema de calabacín', servings: 4 },
      { dayOffset: 2, mealType: 'almuerzo', recipeName: 'Pasta con tomate', servings: 2 },
      { dayOffset: 2, mealType: 'cena', recipeName: 'Ensalada completa', servings: 2 },
      { dayOffset: 3, mealType: 'almuerzo', recipeName: 'Garbanzos con espinacas', servings: 4 },
      { dayOffset: 4, mealType: 'almuerzo', recipeName: 'Tortilla de patatas', servings: 4 },
      { dayOffset: 4, mealType: 'merienda', recipeName: 'Bocadillo vegetal', servings: 1 },
      { dayOffset: 5, mealType: 'almuerzo', recipeName: 'Pollo con verduras', servings: 4 },
      { dayOffset: 6, mealType: 'almuerzo', recipeName: 'Ensalada de pasta', servings: 2 },
    ];

    for (const meal of mealExamples) {
      const mealDate = new Date(monday);
      mealDate.setDate(monday.getDate() + meal.dayOffset);
      const dateStr = mealDate.toISOString().split('T')[0];
      const recipeId = recipeIdMap[meal.recipeName] || null;

      await executeRun(
        `INSERT INTO planned_meals (id, meal_plan_id, date, meal_type, recipe_id, servings)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), mealPlanId, dateStr, meal.mealType, recipeId, meal.servings]
      );
    }

    // Crear lista de compra de ejemplo
    const listId = uuidv4();
    await executeRun(
      `INSERT INTO shopping_lists (id, name, week_start, is_active) VALUES (?, ?, ?, 1)`,
      [listId, `Compra semana del ${weekStart}`, weekStart]
    );

    const shoppingExamples = [
      { name: 'Cebolla', quantity: 3, unit: 'unidad', category: 'verduras' },
      { name: 'Tomate', quantity: 500, unit: 'g', category: 'verduras' },
      { name: 'Pimiento rojo', quantity: 2, unit: 'unidad', category: 'verduras' },
      { name: 'Limón', quantity: 2, unit: 'unidad', category: 'frutas' },
      { name: 'Pan baguette', quantity: 2, unit: 'unidad', category: 'panaderia' },
      { name: 'Queso fresco', quantity: 200, unit: 'g', category: 'lacteos' },
      { name: 'Lechuga', quantity: 1, unit: 'unidad', category: 'verduras' },
      { name: 'Pepino', quantity: 2, unit: 'unidad', category: 'verduras' },
    ];

    for (const item of shoppingExamples) {
      const ingId = ingredientIdMap[item.name] || null;
      await executeRun(
        `INSERT INTO shopping_items (id, shopping_list_id, ingredient_id, name, needed_quantity, unit, category, source_recipes, is_auto_generated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [uuidv4(), listId, ingId, item.name, item.quantity, item.unit, item.category, '[]']
      );
    }
  });

  console.log('[Seed] Datos iniciales insertados correctamente.');
}
