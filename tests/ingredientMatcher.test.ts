import { normalizeName, namesMatch, matchesAnyAlias, similarityScore } from '../services/ingredientMatcher';

describe('ingredientMatcher', () => {
  describe('normalizeName', () => {
    it('convierte a minúsculas', () => {
      expect(normalizeName('TOMATE')).toBe('tomate');
    });
    it('elimina tildes', () => {
      expect(normalizeName('Ají')).toBe('aji');
      expect(normalizeName('Piñones')).toMatch(/pinones|pi.ones/);
    });
    it('elimina espacios extra', () => {
      expect(normalizeName('  arroz  ')).toBe('arroz');
    });
    it('normaliza múltiples espacios internos', () => {
      expect(normalizeName('arroz  blanco')).toBe('arroz blanco');
    });
  });

  describe('namesMatch', () => {
    it('detecta nombres iguales', () => {
      expect(namesMatch('Tomate', 'tomate')).toBe(true);
    });
    it('detecta nombres con tildes', () => {
      expect(namesMatch('Limón', 'limon')).toBe(true);
    });
    it('retorna false para nombres distintos', () => {
      expect(namesMatch('Tomate', 'Patata')).toBe(false);
    });
    it('detecta nombres con espacios extra', () => {
      expect(namesMatch(' arroz ', 'Arroz')).toBe(true);
    });
  });

  describe('matchesAnyAlias', () => {
    const aliases = ['tomates', 'tomаte', 'cherry'];
    it('encuentra coincidencia en alias', () => {
      expect(matchesAnyAlias('tomates', aliases)).toBe(true);
    });
    it('devuelve false si no hay coincidencia', () => {
      expect(matchesAnyAlias('patata', aliases)).toBe(false);
    });
  });

  describe('similarityScore', () => {
    it('retorna 1 para cadenas iguales', () => {
      expect(similarityScore('tomate', 'tomate')).toBe(1);
    });
    it('retorna menos de 1 para cadenas similares', () => {
      const score = similarityScore('tomates', 'tomate');
      expect(score).toBeGreaterThan(0.8);
      expect(score).toBeLessThan(1);
    });
    it('retorna cerca de 0 para cadenas muy distintas', () => {
      const score = similarityScore('arroz', 'chocolate');
      expect(score).toBeLessThan(0.5);
    });
  });
});
