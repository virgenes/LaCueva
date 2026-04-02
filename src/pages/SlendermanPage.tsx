import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { ExternalLinkDialog } from '@/components/ExternalLinkDialog';
import { PageTransition } from '@/components/PageTransition';
import slendermanBanner from '@/assets/projects/slenderman-banner.jpg';
import slendermanIcon from '@/assets/projects/slenderman-icon.png';
import { 
  X, Download, Github, ExternalLink, ChevronDown, ChevronRight,
  Skull, Eye, Shield, Swords, Map, Terminal, BookOpen, 
  Gamepad2, Volume2, Globe, Bug, Star, Zap, Heart
} from 'lucide-react';

// Windows XP Horror themed page
const SlendermanPage = () => {
  const navigate = useNavigate();
  const { playClick, playHover } = useSoundEffects();
  const { language } = useSettings();
  const isSpanish = language === 'es';
  const [externalLink, setExternalLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [glitching, setGlitching] = useState(false);
  const [showStatic, setShowStatic] = useState(true);
  const [xpTime, setXpTime] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Glitch effect on load
  useEffect(() => {
    const timer = setTimeout(() => setShowStatic(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Random glitch
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 150 + Math.random() * 300);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // XP clock
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setXpTime(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const i = setInterval(update, 30000);
    return () => clearInterval(i);
  }, []);

  const handleDownload = () => {
    playClick();
    const a = document.createElement('a');
    a.href = '/downloads/StopItSlender-1.5.0.jar';
    a.download = 'StopItSlender-1.5.0.jar';
    a.click();
  };

  const handleExternalLink = (url: string) => {
    playClick();
    setExternalLink(url);
  };

  const tabs = [
    { id: 'overview', icon: Eye, label: isSpanish ? 'General' : 'Overview' },
    { id: 'features', icon: Star, label: isSpanish ? 'Características' : 'Features' },
    { id: 'commands', icon: Terminal, label: isSpanish ? 'Comandos' : 'Commands' },
    { id: 'systems', icon: Skull, label: isSpanish ? 'Sistemas' : 'Systems' },
    { id: 'install', icon: Download, label: isSpanish ? 'Instalación' : 'Install' },
  ];

  const toggleSection = (id: string) => {
    playClick();
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <PageTransition>
      {/* Static overlay on entry */}
      {showStatic && (
        <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center animate-pulse">
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }} />
          <span className="font-pixel text-red-500 text-lg animate-pulse tracking-[0.5em]">
            HE'S WATCHING...
          </span>
        </div>
      )}

      <div className={`min-h-screen bg-[#1a0a0a] relative ${glitching ? 'slender-glitch' : ''}`}>
        {/* Fog overlay */}
        <div className="fixed inset-0 pointer-events-none z-30 opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(80,0,0,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Scanlines */}
        <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.15) 2px, rgba(255,0,0,0.15) 4px)',
          }}
        />

        {/* ===== WINDOWS XP TITLE BAR ===== */}
        <div className="sticky top-0 z-50 select-none">
          {/* XP-style title bar */}
          <div className="flex items-center h-8 px-1"
            style={{
              background: 'linear-gradient(180deg, #3a0000 0%, #1a0000 50%, #2a0000 100%)',
              borderBottom: '1px solid #500000',
            }}
          >
            <img src={slendermanIcon} alt="" className="w-4 h-4 mr-2 opacity-80" />
            <span className="font-['Tahoma',sans-serif] text-[11px] text-red-200/90 flex-1 truncate">
              SlendermanPlugin v1.5.0 - {isSpanish ? 'Documentación' : 'Documentation'}
            </span>
            <div className="flex gap-[2px]">
              {/* Minimize */}
              <button className="w-[21px] h-[21px] flex items-center justify-center rounded-sm text-red-300/70 hover:text-red-100 transition-colors"
                style={{ background: 'linear-gradient(180deg, #4a0000 0%, #2a0000 100%)', border: '1px solid #600000' }}
                onClick={() => { playClick(); navigate('/proyectos'); }}
                onMouseEnter={playHover}
              >
                <span className="text-[10px] leading-none">_</span>
              </button>
              {/* Maximize */}
              <button className="w-[21px] h-[21px] flex items-center justify-center rounded-sm text-red-300/70 hover:text-red-100 transition-colors"
                style={{ background: 'linear-gradient(180deg, #4a0000 0%, #2a0000 100%)', border: '1px solid #600000' }}
                onMouseEnter={playHover}
              >
                <span className="text-[10px] leading-none">□</span>
              </button>
              {/* Close */}
              <button className="w-[21px] h-[21px] flex items-center justify-center rounded-sm text-red-100 hover:bg-red-600 transition-colors"
                style={{ background: 'linear-gradient(180deg, #8b0000 0%, #5a0000 100%)', border: '1px solid #a00000' }}
                onClick={() => { playClick(); navigate('/proyectos'); }}
                onMouseEnter={playHover}
              >
                <X size={10} />
              </button>
            </div>
          </div>

          {/* XP Menu bar */}
          <div className="flex items-center h-6 px-2 gap-4 bg-[#1a0505] border-b border-red-900/40">
            {['File', 'Edit', 'View', 'Help'].map((m) => (
              <span key={m} className="font-['Tahoma',sans-serif] text-[11px] text-red-300/60 hover:text-red-200 cursor-default">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 relative z-10">
          
          {/* Hero Banner */}
          <div className="relative rounded-sm overflow-hidden mb-6 border border-red-900/50 shadow-[0_0_40px_rgba(139,0,0,0.3)]">
            <img src={slendermanBanner} alt="Slenderman" className="w-full h-48 md:h-64 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a0a] via-[#1a0a0a]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0a]/60 to-transparent" />
            
            {/* Hero content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <div className="flex items-end gap-4">
                <img src={slendermanIcon} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-sm border-2 border-red-700 shadow-[0_0_20px_rgba(255,0,0,0.4)] hidden md:block" />
                <div className="flex-1">
                  <h1 className="font-pixel text-lg md:text-2xl text-red-400 mb-1 tracking-wider drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                    🕯️ SLENDERMAN PLUGIN
                  </h1>
                  <p className="font-['Tahoma',sans-serif] text-xs md:text-sm text-red-200/70 mb-3">
                    {isSpanish 
                      ? 'Minijuego de horror profesional para Minecraft • Creado por Maximo'
                      : 'Professional horror minigame for Minecraft • Created by Maximo'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-red-900/60 border border-red-700/50 rounded-sm text-[10px] font-['Tahoma',sans-serif] text-red-300">
                      Minecraft 1.19-1.21.x
                    </span>
                    <span className="px-2 py-0.5 bg-red-900/60 border border-red-700/50 rounded-sm text-[10px] font-['Tahoma',sans-serif] text-red-300">
                      Java 17+
                    </span>
                    <span className="px-2 py-0.5 bg-red-900/60 border border-red-700/50 rounded-sm text-[10px] font-['Tahoma',sans-serif] text-red-300">
                      Paper/Spigot
                    </span>
                    <span className="px-2 py-0.5 bg-green-900/60 border border-green-700/50 rounded-sm text-[10px] font-['Tahoma',sans-serif] text-green-300">
                      MIT License
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleDownload}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-red-700 to-red-900 border border-red-600 
                rounded-sm font-pixel text-[10px] text-red-100 shadow-[0_0_15px_rgba(255,0,0,0.3)]
                hover:from-red-600 hover:to-red-800 hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] 
                active:translate-y-[1px] transition-all"
            >
              <Download size={14} /> {isSpanish ? 'DESCARGAR v1.5.0' : 'DOWNLOAD v1.5.0'}
            </button>
            <button
              onClick={() => handleExternalLink('https://github.com/virgenes/SlendermanPlugin')}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a0a0a] border border-red-900/50 
                rounded-sm font-['Tahoma',sans-serif] text-xs text-red-300/80
                hover:border-red-700 hover:text-red-200 transition-all"
            >
              <Github size={14} /> GitHub
            </button>
            <button
              onClick={() => handleExternalLink('https://modrinth.com/plugin/slendermanplugin')}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a0a0a] border border-green-900/50 
                rounded-sm font-['Tahoma',sans-serif] text-xs text-green-300/80
                hover:border-green-700 hover:text-green-200 transition-all"
            >
              <ExternalLink size={14} /> Modrinth
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-1 mb-4 border-b border-red-900/40 pb-[1px]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { playClick(); setActiveTab(tab.id); }}
                  onMouseEnter={playHover}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-sm font-['Tahoma',sans-serif] text-[11px] whitespace-nowrap
                    border border-b-0 transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#2a0a0a] border-red-700/60 text-red-300 -mb-[1px] pb-[9px]'
                      : 'bg-[#150505] border-red-900/30 text-red-400/50 hover:text-red-300/70 hover:bg-[#200808]'
                  }`}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content - XP Window style */}
          <div className="bg-[#120505] border border-red-900/40 rounded-sm p-4 md:p-6 mb-6 min-h-[400px]
            shadow-[inset_0_1px_0_rgba(255,0,0,0.05)]">
            
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-pixel text-sm text-red-400 mb-3 flex items-center gap-2">
                    <Eye size={16} /> {isSpanish ? 'DESCRIPCIÓN' : 'DESCRIPTION'}
                  </h2>
                  <p className="font-['Tahoma',sans-serif] text-sm text-red-200/70 leading-relaxed">
                    {isSpanish 
                      ? 'SlendermanPlugin es un minijuego de horror profesional y rico en funciones para servidores Paper/Spigot. Colecciona 8 páginas antes de que el Slenderman te atrape — si te atreves. Incluye sistema de cordura, perks, disfraces, economía, progresión, multi-arena y mucho más.'
                      : 'SlendermanPlugin is a professional, feature-rich Slender Man horror minigame for Paper/Spigot servers. Collect 8 pages before the Slenderman catches you — if you dare. Includes sanity system, perks, disguises, economy, progression, multi-arena and much more.'}
                  </p>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { icon: Gamepad2, text: isSpanish ? '8 páginas, cordura, ruido' : '8 pages, sanity, noise', color: 'text-red-400' },
                    { icon: Skull, text: isSpanish ? 'Sistema de cordura visual' : 'Visual sanity system', color: 'text-red-500' },
                    { icon: Swords, text: isSpanish ? '9 perks superviviente + 3 Slender' : '9 survivor + 3 Slender perks', color: 'text-orange-400' },
                    { icon: Eye, text: isSpanish ? '6 disfraces de Slenderman' : '6 Slenderman disguises', color: 'text-purple-400' },
                    { icon: Star, text: isSpanish ? 'XP, niveles, rangos' : 'XP, levels, ranks', color: 'text-yellow-400' },
                    { icon: Map, text: isSpanish ? 'Multi-arena ilimitada' : 'Unlimited multi-arena', color: 'text-green-400' },
                    { icon: Globe, text: isSpanish ? '6 idiomas soportados' : '6 languages supported', color: 'text-blue-400' },
                    { icon: Shield, text: isSpanish ? 'Sistema de economía' : 'Economy system', color: 'text-amber-400' },
                    { icon: Terminal, text: 'PlaceholderAPI + ProtocolLib', color: 'text-cyan-400' },
                  ].map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="flex items-start gap-2 p-2 bg-[#1a0808] rounded-sm border border-red-900/20">
                        <Icon size={14} className={`${f.color} mt-0.5 flex-shrink-0`} />
                        <span className="font-['Tahoma',sans-serif] text-[11px] text-red-200/60">{f.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Changelog */}
                <div>
                  <h3 className="font-pixel text-xs text-red-400 mb-2 flex items-center gap-2">
                    <Zap size={14} /> CHANGELOG v1.5.0
                  </h3>
                  <div className="bg-[#0a0303] p-3 rounded-sm border border-red-900/20 font-['Courier_New',monospace] text-[11px] text-red-300/60 space-y-1">
                    <p>+ Complete rewrite and bug fixes</p>
                    <p>+ Internal disguise system (no LibsDisguises)</p>
                    <p>+ Sanity system with visual bar</p>
                    <p>+ 9 survivor perks + 3 Slenderman perks</p>
                    <p>+ 6 Slenderman skins in shop</p>
                    <p>+ Economy system with balance commands</p>
                    <p>+ PlaceholderAPI integration</p>
                    <p>+ 6-language support</p>
                    <p>+ Game logging system</p>
                    <p>+ ViaVersion compatibility via ProtocolLib</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-4">
                <h2 className="font-pixel text-sm text-red-400 mb-4 flex items-center gap-2">
                  <Star size={16} /> {isSpanish ? 'TODAS LAS CARACTERÍSTICAS' : 'ALL FEATURES'}
                </h2>
                
                {[
                  { id: 'gameplay', title: isSpanish ? '🎮 Gameplay' : '🎮 Gameplay', items: [
                    isSpanish ? 'Colección de 8 páginas' : '8-page collection',
                    isSpanish ? 'Sistema de cordura' : 'Sanity system',
                    isSpanish ? 'Mecánicas de ruido' : 'Noise mechanics',
                    isSpanish ? 'Múltiples arenas simultáneas' : 'Multiple simultaneous arenas',
                  ]},
                  { id: 'perks', title: isSpanish ? '⚔️ Perks de Superviviente' : '⚔️ Survivor Perks', items: [
                    'Runaway - Speed II (5s)',
                    'Better Together - Regeneration + ally',
                    'Archaeologist - Compass → nearest page',
                    'Iron Will - Resistance I (8s)',
                    'Shadow Step - Invisibility (4s)',
                    'Last Stand - Speed III + Strength I',
                    'Resilience - 40% less sanity drain',
                    'Tracker - Compass → page (10s)',
                    'Spirit - On death, slows Slenderman',
                  ]},
                  { id: 'slenderperks', title: isSpanish ? '👹 Perks de Slenderman' : '👹 Slenderman Perks', items: [
                    'Blood Hunt - Speed II + Slowness on survivors',
                    'Terrify - Nausea + Darkness on nearby',
                    'Aura Sense - Survivors glow on page pickup',
                  ]},
                  { id: 'disguises', title: isSpanish ? '🎭 Disfraces' : '🎭 Disguises', items: [
                    'Enderman', 'Wither', 'Phantom', 'Ravager', 'Elder Guardian', 'Warden',
                  ]},
                ].map((section) => (
                  <div key={section.id} className="border border-red-900/30 rounded-sm overflow-hidden">
                    <button 
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-3 bg-[#1a0808] hover:bg-[#200a0a] transition-colors"
                    >
                      <span className="font-['Tahoma',sans-serif] text-sm text-red-300">{section.title}</span>
                      {expandedSection === section.id ? <ChevronDown size={14} className="text-red-400" /> : <ChevronRight size={14} className="text-red-400" />}
                    </button>
                    {expandedSection === section.id && (
                      <div className="p-3 bg-[#0a0303] space-y-1">
                        {section.items.map((item, i) => (
                          <p key={i} className="font-['Tahoma',sans-serif] text-[11px] text-red-200/60 flex items-center gap-2">
                            <span className="text-red-500">▸</span> {item}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'commands' && (
              <div className="space-y-4">
                <h2 className="font-pixel text-sm text-red-400 mb-4 flex items-center gap-2">
                  <Terminal size={16} /> {isSpanish ? 'COMANDOS' : 'COMMANDS'}
                </h2>
                
                {/* Player Commands */}
                <div>
                  <h3 className="font-['Tahoma',sans-serif] text-xs text-red-300 mb-2 font-bold">
                    {isSpanish ? '👤 Comandos de Jugador' : '👤 Player Commands'}
                  </h3>
                  <div className="bg-[#0a0303] rounded-sm border border-red-900/20 overflow-x-auto">
                    <table className="w-full font-['Courier_New',monospace] text-[11px]">
                      <thead>
                        <tr className="border-b border-red-900/30">
                          <th className="text-left p-2 text-red-400">{isSpanish ? 'Comando' : 'Command'}</th>
                          <th className="text-left p-2 text-red-400">{isSpanish ? 'Descripción' : 'Description'}</th>
                        </tr>
                      </thead>
                      <tbody className="text-red-200/50">
                        {[
                          ['/sis join <arena>', isSpanish ? 'Unirse a una arena' : 'Join an arena'],
                          ['/sis leave', isSpanish ? 'Salir de la arena actual' : 'Leave current arena'],
                          ['/sis balance', isSpanish ? 'Ver balance de monedas' : 'View coin balance'],
                          ['/sis baltop', 'Top 10'],
                          ['/sis pay <player> <amount>', isSpanish ? 'Enviar monedas' : 'Send coins'],
                        ].map(([cmd, desc], i) => (
                          <tr key={i} className="border-b border-red-900/10 hover:bg-red-900/10">
                            <td className="p-2 text-green-400/70">{cmd}</td>
                            <td className="p-2">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Admin Commands */}
                <div>
                  <h3 className="font-['Tahoma',sans-serif] text-xs text-red-300 mb-2 font-bold">
                    {isSpanish ? '🔧 Comandos de Admin' : '🔧 Admin Commands'}
                  </h3>
                  <div className="bg-[#0a0303] rounded-sm border border-red-900/20 overflow-x-auto">
                    <table className="w-full font-['Courier_New',monospace] text-[11px]">
                      <thead>
                        <tr className="border-b border-red-900/30">
                          <th className="text-left p-2 text-red-400">{isSpanish ? 'Comando' : 'Command'}</th>
                          <th className="text-left p-2 text-red-400">{isSpanish ? 'Descripción' : 'Description'}</th>
                        </tr>
                      </thead>
                      <tbody className="text-red-200/50">
                        {[
                          ['/sis setlobby', isSpanish ? 'Establecer lobby' : 'Set lobby location'],
                          ['/sis createarena <id>', isSpanish ? 'Crear arena' : 'Create arena'],
                          ['/sis editarena <id>', isSpanish ? 'Editar arena' : 'Edit arena'],
                          ['/sis deletearena <id>', isSpanish ? 'Eliminar arena' : 'Delete arena'],
                          ['/sis start <arena>', isSpanish ? 'Forzar inicio' : 'Force-start'],
                          ['/sis money give <p> <n>', isSpanish ? 'Dar monedas' : 'Give coins'],
                          ['/sis money take <p> <n>', isSpanish ? 'Quitar monedas' : 'Take coins'],
                          ['/sis money reload', isSpanish ? 'Recargar config' : 'Reload config'],
                        ].map(([cmd, desc], i) => (
                          <tr key={i} className="border-b border-red-900/10 hover:bg-red-900/10">
                            <td className="p-2 text-yellow-400/70">{cmd}</td>
                            <td className="p-2">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'systems' && (
              <div className="space-y-6">
                <h2 className="font-pixel text-sm text-red-400 mb-4 flex items-center gap-2">
                  <Skull size={16} /> {isSpanish ? 'SISTEMAS DEL JUEGO' : 'GAME SYSTEMS'}
                </h2>

                {/* Sanity */}
                <div className="bg-[#1a0808] p-4 rounded-sm border border-red-900/30">
                  <h3 className="font-pixel text-xs text-red-400 mb-3">🧠 {isSpanish ? 'SISTEMA DE CORDURA' : 'SANITY SYSTEM'}</h3>
                  <p className="font-['Tahoma',sans-serif] text-[11px] text-red-200/60 mb-3">
                    {isSpanish 
                      ? 'Los supervivientes tienen 0-100 de cordura. Se drena al mirar al Slenderman, estar en oscuridad o cerca de él.'
                      : 'Survivors have 0-100 sanity. It drains when looking at Slenderman, in darkness, or near him.'}
                  </p>
                  <div className="space-y-2">
                    {[
                      { range: '75-100', effect: 'Normal', color: 'bg-green-600' },
                      { range: '50-74', effect: isSpanish ? 'Sonidos ambientales' : 'Ambient sounds', color: 'bg-yellow-600' },
                      { range: '25-49', effect: isSpanish ? 'Náuseas, lentitud, ceguera' : 'Nausea, slowness, blindness', color: 'bg-orange-600' },
                      { range: '0-24', effect: isSpanish ? '¡PÁNICO! — Efectos severos' : 'PANIC! — Severe effects', color: 'bg-red-600' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-16 h-4 ${s.color} rounded-sm flex items-center justify-center`}>
                          <span className="font-['Courier_New',monospace] text-[9px] text-white font-bold">{s.range}</span>
                        </div>
                        <span className="font-['Tahoma',sans-serif] text-[11px] text-red-200/50">{s.effect}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ranks */}
                <div className="bg-[#1a0808] p-4 rounded-sm border border-red-900/30">
                  <h3 className="font-pixel text-xs text-red-400 mb-3">📊 {isSpanish ? 'RANGOS' : 'RANKS'}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { level: '0-4', rank: 'Initiate', color: 'text-gray-400' },
                      { level: '5-9', rank: 'Adventurer', color: 'text-green-400' },
                      { level: '10-19', rank: 'Survivor', color: 'text-blue-400' },
                      { level: '20-29', rank: 'Expert', color: 'text-purple-400' },
                      { level: '30-49', rank: 'Master', color: 'text-orange-400' },
                      { level: '50+', rank: '★ Legend', color: 'text-yellow-400' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-[#0a0303] rounded-sm">
                        <span className="font-['Courier_New',monospace] text-[10px] text-red-300/40">Lv.{r.level}</span>
                        <span className={`font-['Tahoma',sans-serif] text-xs font-bold ${r.color}`}>{r.rank}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Placeholders */}
                <div className="bg-[#1a0808] p-4 rounded-sm border border-red-900/30">
                  <h3 className="font-pixel text-xs text-red-400 mb-3">📊 PlaceholderAPI</h3>
                  <div className="bg-[#0a0303] p-3 rounded-sm font-['Courier_New',monospace] text-[11px] text-green-400/60 space-y-1">
                    {['%slender_level%', '%slender_rank%', '%slender_coins%', '%slender_wins%', '%slender_pages%', '%slender_deaths%', '%slender_games%', '%slender_sanity%'].map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'install' && (
              <div className="space-y-6">
                <h2 className="font-pixel text-sm text-red-400 mb-4 flex items-center gap-2">
                  <Download size={16} /> {isSpanish ? 'INSTALACIÓN' : 'INSTALLATION'}
                </h2>

                <div className="bg-[#0a0303] p-4 rounded-sm border border-red-900/20 space-y-3">
                  {[
                    isSpanish ? '1. Descarga StopItSlender-1.5.0.jar' : '1. Download StopItSlender-1.5.0.jar',
                    isSpanish ? '2. Colócalo en la carpeta plugins/ de tu servidor' : '2. Place it in your server\'s plugins/ folder',
                    isSpanish ? '3. Instala ProtocolLib (requerido)' : '3. Install ProtocolLib (required)',
                    isSpanish ? '4. Inicia el servidor — los archivos de configuración se generan automáticamente' : '4. Start the server — config files auto-generate',
                    isSpanish ? '5. Establece el lobby: /sis setlobby' : '5. Set the lobby: /sis setlobby',
                    isSpanish ? '6. Crea tu primera arena: /sis createarena <id>' : '6. Create your first arena: /sis createarena <id>',
                    isSpanish ? '7. Configura: /sis editarena <id>' : '7. Configure it: /sis editarena <id>',
                    isSpanish ? '8. Guarda y juega: /sis admin save <id>' : '8. Save and play: /sis admin save <id>',
                  ].map((step, i) => (
                    <p key={i} className="font-['Tahoma',sans-serif] text-sm text-red-200/60 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">▸</span> {step}
                    </p>
                  ))}
                </div>

                {/* Requirements */}
                <div className="bg-[#1a0808] p-4 rounded-sm border border-red-900/30">
                  <h3 className="font-pixel text-xs text-red-400 mb-3">📋 {isSpanish ? 'REQUISITOS' : 'REQUIREMENTS'}</h3>
                  <div className="space-y-2 font-['Tahoma',sans-serif] text-[11px] text-red-200/60">
                    <p><strong className="text-red-300">Server:</strong> Paper or Spigot 1.19 – 1.21.x</p>
                    <p><strong className="text-red-300">Java:</strong> 17 or higher</p>
                    <p><strong className="text-red-300">{isSpanish ? 'Requerido' : 'Required'}:</strong> ProtocolLib</p>
                    <p><strong className="text-red-300">Optional:</strong> PlaceholderAPI, ViaVersion</p>
                  </div>
                </div>

                {/* Download buttons */}
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleDownload} onMouseEnter={playHover}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-b from-red-700 to-red-900 border border-red-600 
                      rounded-sm font-pixel text-[10px] text-red-100 shadow-[0_0_15px_rgba(255,0,0,0.3)]
                      hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] active:translate-y-[1px] transition-all">
                    <Download size={16} /> {isSpanish ? 'DESCARGA DIRECTA (.jar)' : 'DIRECT DOWNLOAD (.jar)'}
                  </button>
                  <button onClick={() => handleExternalLink('https://modrinth.com/plugin/slendermanplugin')} onMouseEnter={playHover}
                    className="flex items-center gap-2 px-4 py-3 bg-[#1a0a0a] border border-green-900/50 
                      rounded-sm font-['Tahoma',sans-serif] text-xs text-green-300/80 hover:border-green-700 transition-all">
                    <ExternalLink size={14} /> Modrinth
                  </button>
                  <button onClick={() => handleExternalLink('https://github.com/virgenes/SlendermanPlugin')} onMouseEnter={playHover}
                    className="flex items-center gap-2 px-4 py-3 bg-[#1a0a0a] border border-red-900/50 
                      rounded-sm font-['Tahoma',sans-serif] text-xs text-red-300/80 hover:border-red-700 transition-all">
                    <Github size={14} /> GitHub
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* XP Taskbar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 h-8 flex items-center px-2 justify-between md:flex hidden"
            style={{
              background: 'linear-gradient(180deg, #3a0000 0%, #1a0000 50%, #2a0000 100%)',
              borderTop: '1px solid #500000',
            }}
          >
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 h-6 rounded-sm text-[10px] font-bold text-red-200"
                style={{ background: 'linear-gradient(180deg, #5a0000 0%, #3a0000 100%)', border: '1px solid #700000' }}>
                <Skull size={12} /> Start
              </button>
              <div className="h-5 w-[1px] bg-red-900/40" />
              <span className="text-[10px] text-red-300/50 font-['Tahoma',sans-serif] flex items-center gap-1">
                <img src={slendermanIcon} alt="" className="w-3 h-3" /> SlendermanPlugin.exe
              </span>
            </div>
            <div className="flex items-center gap-2 px-2 h-6 rounded-sm"
              style={{ background: 'linear-gradient(180deg, #2a0000 0%, #1a0000 100%)', border: '1px solid #400000' }}>
              <Volume2 size={10} className="text-red-400/50" />
              <span className="text-[10px] text-red-300/60 font-['Tahoma',sans-serif]">{xpTime}</span>
            </div>
          </div>
        </div>

        {/* CSS for glitch effect */}
        <style>{`
          .slender-glitch {
            animation: slenderGlitch 0.15s ease-in-out;
          }
          @keyframes slenderGlitch {
            0% { transform: translate(0); filter: none; }
            20% { transform: translate(-3px, 2px); filter: hue-rotate(90deg); }
            40% { transform: translate(2px, -1px); filter: saturate(3); }
            60% { transform: translate(-1px, -2px); filter: hue-rotate(-90deg); }
            80% { transform: translate(3px, 1px); filter: brightness(1.5); }
            100% { transform: translate(0); filter: none; }
          }
        `}</style>

        <ExternalLinkDialog
          isOpen={!!externalLink}
          url={externalLink || ''}
          onConfirm={() => { window.open(externalLink!, '_blank'); setExternalLink(null); }}
          onCancel={() => setExternalLink(null)}
        />
      </div>
    </PageTransition>
  );
};

export default SlendermanPage;
