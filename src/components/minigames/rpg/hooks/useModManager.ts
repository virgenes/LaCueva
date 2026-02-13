import { useState, useEffect } from 'react';
import { ModManager } from '../systems/ModManager';
import { GameData, Mod } from '../types/GameTypes';

export const useModManager = (baseGameData: GameData) => {
  const [manager] = useState(() => new ModManager(baseGameData));
  const [finalData, setFinalData] = useState(baseGameData);
  const [mods, setMods] = useState<Mod[]>([]);

  useEffect(() => {
    const merged = manager.computeFinalGameData();
    setFinalData(merged);
  }, [manager, mods]);

  const addMod = (mod: Mod) => {
    manager.addMod(mod);
    setMods(manager.getAllMods());
  };

  const removeMod = (id: string) => {
    manager.removeMod(id);
    setMods(manager.getAllMods());
  };

  const enableMod = (id: string, enabled: boolean) => {
    manager.enableMod(id, enabled);
    setMods(manager.getAllMods());
  };

  const exportMod = (modId: string) => {
    const mod = manager.getMod(modId);
    if (!mod) return;
    const blob = new Blob([JSON.stringify(mod, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mod.id}.mod.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMod = async (file: File) => {
    const text = await file.text();
    const mod = JSON.parse(text) as Mod;
    addMod(mod);
  };

  const resetMods = () => {
    manager.reset();
    setMods([]);
  };

  return {
    finalGameData: finalData,
    manager,
    mods,
    addMod,
    removeMod,
    enableMod,
    exportMod,
    importMod,
    resetMods,
  };
};