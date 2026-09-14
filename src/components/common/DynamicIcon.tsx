import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5' }) => {
  // Safe lookup from Lucide icons
  const IconComponent = (Icons as Record<string, any>)[name] || Icons.BookOpen;
  return <IconComponent className={className} />;
};
