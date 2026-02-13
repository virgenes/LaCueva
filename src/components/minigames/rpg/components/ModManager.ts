import { GameData, Mod } from '../types/GameTypes';

export class ModManager {
  private mods: Mod[] = [];
  private baseGameData: GameData;

  constructor(base: GameData) {
    this.baseGameData = this.deepClone(base);
  }

  // ------------------------------------------------------------
  // Gestión de mods
  // ------------------------------------------------------------
  addMod(mod: Mod): void {
    if (!this.validateMod(mod)) {
      throw new Error('Invalid mod structure');
    }
    const existing = this.mods.findIndex(m => m.id === mod.id);
    if (existing >= 0) {
      this.mods[existing] = { ...mod, enabled: mod.enabled ?? true };
    } else {
      this.mods.push({ ...mod, enabled: mod.enabled ?? true });
    }
    // Persistir en localStorage
    this.persist();
  }

  removeMod(modId: string): void {
    this.mods = this.mods.filter(m => m.id !== modId);
    this.persist();
  }

  enableMod(modId: string, enabled: boolean): void {
    const mod = this.mods.find(m => m.id === modId);
    if (mod) mod.enabled = enabled;
    this.persist();
  }

  getMod(modId: string): Mod | undefined {
    return this.mods.find(m => m.id === modId);
  }

  getAllMods(): Mod[] {
    return [...this.mods];
  }

  reset(): void {
    this.mods = [];
    localStorage.removeItem('rpg_mods');
  }

  // ------------------------------------------------------------
  // Fusión profunda (GameData <- mods)
  // ------------------------------------------------------------
  computeFinalGameData(): GameData {
    let merged = this.deepClone(this.baseGameData);
    // Aplicar mods en orden de prioridad (último = mayor prioridad)
    const enabledMods = this.mods.filter(m => m.enabled).sort((a, b) => (a.priority || 0) - (b.priority || 0));
    for (const mod of enabledMods) {
      merged = this.deepMerge(merged, mod.data);
    }
    return merged;
  }

  // ------------------------------------------------------------
  // Utilidades de deep merge (inmutable)
  // ------------------------------------------------------------
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    for (const key in source) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key]; // sobrescribe arrays y primitivos
      }
    }
    return output;
  }

  // ------------------------------------------------------------
  // Validación básica de esquema
  // ------------------------------------------------------------
  private validateMod(mod: any): mod is Mod {
    return (
      mod &&
      typeof mod.id === 'string' &&
      typeof mod.name === 'string' &&
      typeof mod.author === 'string' &&
      typeof mod.version === 'string' &&
      mod.data &&
      typeof mod.data === 'object'
    );
  }

  // ------------------------------------------------------------
  // Persistencia en localStorage
  // ------------------------------------------------------------
  private persist(): void {
    localStorage.setItem('rpg_mods', JSON.stringify(this.mods));
  }

  // Cargar mods guardados
  loadPersisted(): void {
    const raw = localStorage.getItem('rpg_mods');
    if (raw) {
      try {
        const savedMods = JSON.parse(raw);
        if (Array.isArray(savedMods)) {
          this.mods = savedMods.filter(m => this.validateMod(m));
        }
      } catch (e) {
        console.error('Failed to load mods', e);
      }
    }
  }
}