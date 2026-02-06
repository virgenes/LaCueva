import React, { useState, useRef } from 'react';
import { X, Download, Upload, RotateCcw, FileJson, Palette, MessageSquare, Map } from 'lucide-react';
import { GameData } from '../types/GameTypes';
import { useSettings } from '@/contexts/SettingsContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModMenuProps {
  gameData: GameData;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onUpdateGameData: (data: GameData) => void;
}

type TabType = 'overview' | 'sprites' | 'dialogues' | 'tiles';

export const ModMenu: React.FC<ModMenuProps> = ({
  gameData,
  onClose,
  onExport,
  onImport,
  onReset,
  onUpdateGameData,
}) => {
  const { language } = useSettings();
  const isSpanish = language === 'es';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingDialogue, setEditingDialogue] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleEditDialogue = (dialogueId: string, lineIndex: number, newText: string) => {
    const updatedGameData = { ...gameData };
    if (updatedGameData.dialogues[dialogueId]) {
      const lines = [...updatedGameData.dialogues[dialogueId].lines];
      if (isSpanish) {
        lines[lineIndex] = { ...lines[lineIndex], textEs: newText };
      } else {
        lines[lineIndex] = { ...lines[lineIndex], text: newText };
      }
      updatedGameData.dialogues[dialogueId] = {
        ...updatedGameData.dialogues[dialogueId],
        lines,
      };
      onUpdateGameData(updatedGameData);
    }
  };

  const tabs = [
    { id: 'overview' as const, icon: FileJson, label: isSpanish ? 'General' : 'Overview' },
    { id: 'sprites' as const, icon: Palette, label: 'Sprites' },
    { id: 'dialogues' as const, icon: MessageSquare, label: isSpanish ? 'Diálogos' : 'Dialogues' },
    { id: 'tiles' as const, icon: Map, label: 'Tiles' },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 bg-night-deep/95 backdrop-blur-sm">
      <div 
        className="game-card p-4 max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-sm text-neon-purple flex items-center gap-2">
            🔧 {isSpanish ? 'MENÚ DE MODS' : 'MOD MENU'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-sm border border-neon-pink hover:bg-neon-pink/20 transition-colors"
          >
            <X size={14} className="text-neon-pink" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-sm font-pixel text-[8px] whitespace-nowrap
                transition-all ${activeTab === tab.id 
                  ? 'bg-neon-cyan text-night-deep' 
                  : 'bg-muted text-foreground hover:bg-muted/80'}`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0">
          {activeTab === 'overview' && (
            <div className="space-y-4 pr-2">
              {/* Game info */}
              <div className="game-card p-3">
                <h3 className="font-pixel text-[9px] text-neon-cyan mb-2">
                  {isSpanish ? 'INFORMACIÓN DEL JUEGO' : 'GAME INFO'}
                </h3>
                <div className="space-y-1 font-retro text-xs text-muted-foreground">
                  <p>{isSpanish ? 'Título:' : 'Title:'} <span className="text-foreground">{isSpanish ? gameData.titleEs : gameData.title}</span></p>
                  <p>{isSpanish ? 'Autor:' : 'Author:'} <span className="text-foreground">{gameData.author}</span></p>
                  <p>{isSpanish ? 'Versión:' : 'Version:'} <span className="text-foreground">{gameData.version}</span></p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="game-card p-2 text-center">
                  <p className="font-pixel text-lg text-neon-pink">{Object.keys(gameData.sprites).length}</p>
                  <p className="font-retro text-[10px] text-muted-foreground">Sprites</p>
                </div>
                <div className="game-card p-2 text-center">
                  <p className="font-pixel text-lg text-neon-cyan">{Object.keys(gameData.dialogues).length}</p>
                  <p className="font-retro text-[10px] text-muted-foreground">{isSpanish ? 'Diálogos' : 'Dialogues'}</p>
                </div>
                <div className="game-card p-2 text-center">
                  <p className="font-pixel text-lg text-star-gold">{Object.keys(gameData.tiles).length}</p>
                  <p className="font-retro text-[10px] text-muted-foreground">Tiles</p>
                </div>
                <div className="game-card p-2 text-center">
                  <p className="font-pixel text-lg text-neon-purple">{Object.keys(gameData.maps).length}</p>
                  <p className="font-retro text-[10px] text-muted-foreground">{isSpanish ? 'Mapas' : 'Maps'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={onExport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neon-cyan text-night-deep font-pixel text-[9px] rounded-sm hover:shadow-neon transition-all"
                >
                  <Download size={14} />
                  {isSpanish ? 'EXPORTAR MOD' : 'EXPORT MOD'}
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neon-pink text-night-deep font-pixel text-[9px] rounded-sm hover:shadow-pink transition-all"
                >
                  <Upload size={14} />
                  {isSpanish ? 'IMPORTAR MOD' : 'IMPORT MOD'}
                </button>
                
                <button
                  onClick={onReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground font-pixel text-[9px] rounded-sm border border-destructive hover:bg-destructive/20 transition-all"
                >
                  <RotateCcw size={14} />
                  {isSpanish ? 'REINICIAR TODO' : 'RESET ALL'}
                </button>
              </div>

              {/* Help */}
              <div className="game-card p-3 border-star-gold/50">
                <h3 className="font-pixel text-[8px] text-star-gold mb-2">💡 {isSpanish ? 'CONSEJOS' : 'TIPS'}</h3>
                <ul className="font-retro text-[10px] text-muted-foreground space-y-1">
                  <li>• {isSpanish ? 'Exporta tu mod como JSON para compartirlo' : 'Export your mod as JSON to share it'}</li>
                  <li>• {isSpanish ? 'Edita diálogos directamente en la pestaña "Diálogos"' : 'Edit dialogues directly in the "Dialogues" tab'}</li>
                  <li>• {isSpanish ? 'Los cambios se guardan automáticamente' : 'Changes are saved automatically'}</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'dialogues' && (
            <div className="space-y-3 pr-2">
              {Object.entries(gameData.dialogues).map(([id, dialogue]) => (
                <div key={id} className="game-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-pixel text-[8px] text-neon-cyan">{id}</span>
                    <span className="font-retro text-[10px] text-muted-foreground">
                      {dialogue.lines.length} {isSpanish ? 'líneas' : 'lines'}
                    </span>
                  </div>
                  
                  {dialogue.lines.map((line, index) => (
                    <div key={index} className="mt-2">
                      {editingDialogue === `${id}-${index}` ? (
                        <div className="space-y-1">
                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full p-2 bg-muted border border-border rounded-sm font-retro text-xs text-foreground resize-none"
                            rows={3}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                handleEditDialogue(id, index, editedText);
                                setEditingDialogue(null);
                              }}
                              className="px-2 py-1 bg-neon-cyan text-night-deep font-pixel text-[7px] rounded-sm"
                            >
                              {isSpanish ? 'GUARDAR' : 'SAVE'}
                            </button>
                            <button
                              onClick={() => setEditingDialogue(null)}
                              className="px-2 py-1 bg-muted text-foreground font-pixel text-[7px] rounded-sm"
                            >
                              {isSpanish ? 'CANCELAR' : 'CANCEL'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDialogue(`${id}-${index}`);
                            setEditedText(isSpanish ? line.textEs : line.text);
                          }}
                          className="w-full text-left p-2 bg-muted/50 rounded-sm font-retro text-[10px] text-foreground hover:bg-muted transition-colors"
                        >
                          {isSpanish ? line.textEs : line.text}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sprites' && (
            <div className="space-y-3 pr-2">
              <p className="font-retro text-xs text-muted-foreground mb-3">
                {isSpanish 
                  ? 'Los sprites están definidos como matrices de colores. Exporta el mod y edita el JSON para modificarlos.'
                  : 'Sprites are defined as color arrays. Export the mod and edit the JSON to modify them.'}
              </p>
              {Object.entries(gameData.sprites).map(([id, sprite]) => (
                <div key={id} className="game-card p-3 flex items-center gap-3">
                  <div 
                    className="border border-border p-1"
                    style={{ imageRendering: 'pixelated' }}
                  >
                    {/* Simple sprite preview */}
                    <div 
                      className="grid gap-0"
                      style={{ 
                        gridTemplateColumns: `repeat(${sprite.frames[0]?.[0]?.length || 8}, 4px)`,
                      }}
                    >
                      {sprite.frames[0]?.flat().map((color, i) => (
                        <div 
                          key={i}
                          className="w-1 h-1"
                          style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-pixel text-[9px] text-foreground">{sprite.name}</p>
                    <p className="font-retro text-[10px] text-muted-foreground">
                      ID: {id} | {sprite.frames.length} frame(s)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tiles' && (
            <div className="space-y-3 pr-2">
              <p className="font-retro text-xs text-muted-foreground mb-3">
                {isSpanish 
                  ? 'Los tiles definen el terreno del mapa. Exporta para editar colores y propiedades.'
                  : 'Tiles define map terrain. Export to edit colors and properties.'}
              </p>
              {Object.entries(gameData.tiles).map(([id, tile]) => (
                <div key={id} className="game-card p-3 flex items-center gap-3">
                  <div 
                    className="border border-border p-1"
                    style={{ imageRendering: 'pixelated' }}
                  >
                    <div 
                      className="grid gap-0"
                      style={{ 
                        gridTemplateColumns: `repeat(${tile.sprite[0]?.length || 8}, 4px)`,
                      }}
                    >
                      {tile.sprite.flat().map((color, i) => (
                        <div 
                          key={i}
                          className="w-1 h-1"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-pixel text-[9px] text-foreground">{id}</p>
                    <p className="font-retro text-[10px] text-muted-foreground">
                      {tile.solid ? (isSpanish ? 'Sólido' : 'Solid') : (isSpanish ? 'Transitable' : 'Walkable')}
                      {tile.interactable && ' | ⚡ Interactive'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
