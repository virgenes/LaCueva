import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Gamepad2, 
  Music, 
  BookOpen, 
  Palette, 
  FileText, 
  Link, 
  Star,
  Heart,
  Zap,
  MessageCircle,
  Users,
  HelpCircle,
  Mail,
  Home
} from 'lucide-react';

const iconMap = {
  games: Gamepad2,
  music: Music,
  comics: BookOpen,
  art: Palette,
  blog: FileText,
  posts: FileText,
  links: Link,
  star: Star,
  heart: Heart,
  zap: Zap,
  chat: MessageCircle,
  users: Users,
  faq: HelpCircle,
  mail: Mail,
  home: Home,
};

interface PixelIconProps {
  name: keyof typeof iconMap;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 'md',
  className,
  animated = false,
}) => {
  const Icon = iconMap[name];
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Icon 
      className={cn(
        sizeClasses[size],
        animated && 'animate-bounce-soft',
        className
      )} 
    />
  );
};
