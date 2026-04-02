import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '@/components/GameCard';
import { RetroButton } from '@/components/RetroButton';
import { StarBackground } from '@/components/StarBackground';
import { MobileLayout } from '@/components/MobileLayout';
import { PageTransition } from '@/components/PageTransition';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { projects } from '@/data/projectsData';
import { ArrowLeft, ExternalLink, Github, Download, Star, Code2, Folder } from 'lucide-react';
import slendermanIcon from '@/assets/projects/slenderman-icon.png';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const { language } = useSettings();
  const isSpanish = language === 'es';

  const handleProjectClick = (project: typeof projects[0]) => {
    playMenuOpen();
    if (project.detailPage) {
      navigate(project.detailPage);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative">
        <StarBackground />

        {/* Mobile Layout */}
        <MobileLayout>
          <div className="px-4 py-4 pb-24">
            <GameCard hoverable={false}>
              <h1 className="font-pixel text-base text-primary mb-4 text-center neon-text">
                📁 {isSpanish ? 'PROYECTOS' : 'PROJECTS'} 📁
              </h1>
              <p className="font-retro text-sm text-muted-foreground text-center mb-6">
                {isSpanish 
                  ? 'Proyectos creados por los miembros de La Cueva' 
                  : 'Projects created by members of La Cueva'}
              </p>

              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className="group cursor-pointer bg-muted/30 rounded-sm border-2 border-border 
                      hover:border-neon-cyan active:scale-[0.98] transition-all duration-200
                      hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] relative overflow-hidden"
                  >
                    {project.featured && (
                      <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-star-gold rounded-sm">
                        <span className="font-pixel text-[8px] text-night-deep flex items-center gap-1">
                          <Star size={10} /> FEATURED
                        </span>
                      </div>
                    )}
                    
                    <div className="relative h-32 bg-gradient-to-br from-red-900/40 to-night-deep overflow-hidden">
                      <img 
                        src={slendermanIcon}
                        alt={project.title}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-transparent to-transparent" />
                    </div>

                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Code2 size={14} className="text-neon-cyan" />
                        <h3 className="font-pixel text-[9px] text-primary">{project.title}</h3>
                        <span className="font-retro text-[10px] text-star-gold">v{project.version}</span>
                      </div>
                      <p className="font-retro text-sm text-muted-foreground line-clamp-2">
                        {isSpanish ? project.description : project.descriptionEn}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-retro text-[10px] text-neon-pink">by {project.creator}</span>
                        <div className="flex gap-1 ml-auto">
                          {project.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 bg-muted rounded-sm font-retro text-[9px] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GameCard>
          </div>
        </MobileLayout>

        {/* Desktop Layout */}
        <div className="hidden md:block relative z-10 max-w-6xl mx-auto px-4 py-6">
          <RetroButton variant="cyan" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft size={14} className="mr-2" />{isSpanish ? 'Volver al Inicio' : 'Back to Home'}
          </RetroButton>

          <GameCard hoverable={false}>
            <h1 className="font-pixel text-lg md:text-xl text-primary mb-2 text-center neon-text">
              📁 {isSpanish ? 'PROYECTOS' : 'PROJECTS'} 📁
            </h1>
            <p className="font-retro text-base text-muted-foreground text-center mb-8">
              {isSpanish 
                ? 'Proyectos creados por los miembros de La Cueva de los Vírgenes'
                : 'Projects created by members of La Cueva de los Vírgenes'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  onMouseEnter={playHover}
                  className="group cursor-pointer bg-gradient-to-br from-muted/40 to-night-deep/60 rounded-sm border-2 border-border 
                    hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all duration-300 transform hover:scale-[1.03]
                    relative overflow-hidden"
                >
                  {project.featured && (
                    <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-star-gold rounded-sm shadow-pixel">
                      <span className="font-pixel text-[8px] text-night-deep flex items-center gap-1">
                        <Star size={10} /> FEATURED
                      </span>
                    </div>
                  )}

                  <div className="relative h-44 bg-gradient-to-br from-red-950/60 to-night-deep overflow-hidden">
                    <img 
                      src={slendermanIcon}
                      alt={project.title}
                      className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-transparent to-transparent" />
                    {/* Static noise overlay */}
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }}
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 size={16} className="text-red-400" />
                      <h3 className="font-pixel text-xs text-primary group-hover:text-red-400 transition-colors">
                        {project.title}
                      </h3>
                      <span className="font-retro text-sm text-star-gold ml-auto">v{project.version}</span>
                    </div>
                    <p className="font-retro text-sm text-muted-foreground line-clamp-2 mb-3">
                      {isSpanish ? project.description : project.descriptionEn}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-retro text-sm text-neon-pink">by {project.creator}</span>
                      <div className="flex gap-1">
                        {project.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-red-900/30 border border-red-500/30 rounded-sm font-retro text-[10px] text-red-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GameCard>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProjectsPage;
