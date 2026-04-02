export interface Project {
  id: string;
  title: string;
  description: string;
  descriptionEn: string;
  creator: string;
  version: string;
  cover: string;
  tags: string[];
  category: 'plugin' | 'game' | 'tool' | 'mod' | 'other';
  featured: boolean;
  links: {
    github?: string;
    modrinth?: string;
    download?: string;
    website?: string;
  };
  detailPage?: string; // route to detail page
}

export const projects: Project[] = [
  {
    id: 'slenderman-plugin',
    title: 'SlendermanPlugin',
    description: 'Un plugin profesional de horror para servidores de Minecraft Paper/Spigot. Colecciona 8 páginas antes de que el Slenderman te atrape — si te atreves.',
    descriptionEn: 'A professional horror plugin for Minecraft Paper/Spigot servers. Collect 8 pages before the Slenderman catches you — if you dare.',
    creator: 'Maximo',
    version: '1.5.0',
    cover: '',
    tags: ['Minecraft', 'Horror', 'Plugin', 'Slenderman', 'Paper/Spigot'],
    category: 'plugin',
    featured: true,
    links: {
      github: 'https://github.com/virgenes/SlendermanPlugin',
      modrinth: 'https://modrinth.com/plugin/slendermanplugin',
      download: '/downloads/StopItSlender-1.5.0.jar',
    },
    detailPage: '/proyectos/slenderman',
  },
];

export const PROJECT_CATEGORIES = ['all', 'plugin', 'game', 'tool', 'mod', 'other'] as const;
