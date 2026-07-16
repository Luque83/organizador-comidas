/**
 * Normaliza un nombre de ingrediente para comparación.
 * Elimina tildes, convierte a minúsculas y elimina espacios extra.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Compara dos nombres normalizados para ver si son iguales.
 */
export function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

/**
 * Compara un nombre con una lista de sinónimos normalizados.
 */
export function matchesAnyAlias(
  name: string,
  aliases: string[]
): boolean {
  const normalized = normalizeName(name);
  return aliases.some(alias => normalizeName(alias) === normalized);
}

/**
 * Calcula la similitud entre dos cadenas (0-1) usando Levenshtein.
 * Útil para detectar posibles duplicados.
 */
export function similarityScore(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1;
  
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshtein(na, nb);
  return 1 - distance / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Detecta posibles duplicados en una lista de nombres.
 * Retorna pares con similitud > threshold.
 */
export function findPossibleDuplicates(
  names: string[],
  threshold = 0.85
): { a: string; b: string; score: number }[] {
  const pairs: { a: string; b: string; score: number }[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const score = similarityScore(names[i], names[j]);
      if (score >= threshold && score < 1) {
        pairs.push({ a: names[i], b: names[j], score });
      }
    }
  }
  return pairs;
}
