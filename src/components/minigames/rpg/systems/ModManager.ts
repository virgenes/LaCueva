// ModManager — Pure mod management with deep merge and validation
// No React dependencies

import { GameData, Mod } from '../types/GameTypes';

const MODS_STORAGE_KEY = 'rpg_mods_v2';

export class ModManager {
  private baseData: GameData;
  private mods: Mod[];

  constructor(baseData: GameData) {
    this.baseData = JSON.parse(JSON.stringify(baseData)); // deep clone
    this.mods = [];
  }

  // ===== MOD CRUD =====

  addMod(mod: Mod): boolean {
    if (!ModManager.validateMod(mod)) return false;
    if (this.mods.some(m => m.id === mod.id)) return false;
    this.mods.push({ ...mod });
    return true;
  }

  removeMod(id: string): boolean {
    const idx = this.mods.findIndex(m => m.id === id);
    if (idx < 0) return false;
    this.mods.splice(idx, 1);
    return true;
  }

  enableMod(id: string, enabled: boolean): boolean {
    const mod = this.mods.find(m => m.id === id);
    if (!mod) return false;
    mod.enabled = enabled;
    return true;
  }

  getMod(id: string): Mod | undefined {
    return this.mods.find(m => m.id === id);
  }

  getAllMods(): Mod[] {
    return [...this.mods];
  }

  // ===== DEEP MERGE =====

  /** Compute final game data by applying all enabled mods in order */
  computeFinalGameData(): GameData {
    let result = JSON.parse(JSON.stringify(this.baseData)) as GameData;

    const enabledMods = this.mods.filter(m => m.enabled);
    for (const mod of enabledMods) {
      if (mod.data) {
        result = ModManager.deepMerge(result, mod.data as Partial<GameData>) as GameData;
      }
    }

    return result;
  }

  /** Recursive deep merge — arrays are replaced, objects are merged */
  static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key of Object.keys(source) as (keyof T)[]) {
      const srcVal = source[key];
      const tgtVal = target[key];

      if (srcVal === undefined) continue;

      if (Array.isArray(srcVal)) {
        // Arrays: replace entirely (mod wins)
        (result as any)[key] = [...srcVal];
      } else if (
        srcVal !== null &&
        typeof srcVal === 'object' &&
        tgtVal !== null &&
        typeof tgtVal === 'object' &&
        !Array.isArray(tgtVal)
      ) {
        // Objects: recursive merge
        (result as any)[key] = ModManager.deepMerge(tgtVal as any, srcVal as any);
      } else {
        // Primitives: replace
        (result as any)[key] = srcVal;
      }
    }

    return result;
  }

  // ===== VALIDATION =====

  static validateMod(mod: any): mod is Mod {
    if (!mod || typeof mod !== 'object') return false;
    if (typeof mod.id !== 'string' || mod.id.length === 0) return false;
    if (typeof mod.name !== 'string' || mod.name.length === 0) return false;
    if (typeof mod.author !== 'string') return false;
    if (typeof mod.version !== 'string') return false;
    if (typeof mod.description !== 'string') return false;
    if (mod.data && typeof mod.data !== 'object') return false;
    return true;
  }

  // ===== PERSISTENCE =====

  persist(): void {
    try {
      localStorage.setItem(MODS_STORAGE_KEY, JSON.stringify(this.mods));
    } catch (e) {
      console.error('Failed to persist mods:', e);
    }
  }

  loadPersisted(): void {
    try {
      const raw = localStorage.getItem(MODS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.mods = parsed.filter(ModManager.validateMod);
        }
      }
    } catch (e) {
      console.error('Failed to load persisted mods:', e);
    }
  }

  reset(): void {
    this.mods = [];
    localStorage.removeItem(MODS_STORAGE_KEY);
  }
}
