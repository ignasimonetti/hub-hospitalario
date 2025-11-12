import { Globe, Network, Radio, RadioTower } from 'lucide-react';

// Componente para generar favicon del Hub Hospitalario
export function HubFavicon({ type = 'network' }) {
  const iconSize = 32;
  const iconColor = '#2563eb'; // Blue color matching our theme

  const getIcon = () => {
    switch (type) {
      case 'globe':
        return <Globe size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'network':
        return <Network size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'radio':
        return <Radio size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'tower':
        return <RadioTower size={iconSize} color={iconColor} strokeWidth={2} />;
      default:
        return <Network size={iconSize} color={iconColor} strokeWidth={2} />;
    }
  };

  return (
    <div style={{ 
      width: iconSize, 
      height: iconSize, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'white',
      borderRadius: '4px'
    }}>
      {getIcon()}
    </div>
  );
}

// Generar favicon SVG directamente
export function generateFaviconSVG(iconType = 'network') {
  const iconSize = 32;
  const strokeWidth = 2;
  
  let svgPath = '';
  
  switch (iconType) {
    case 'globe':
      svgPath = `
        <circle cx="16" cy="16" r="14" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M2 16h32" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M16 2c3 4 3 26 0 30" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M8 6c-1 3-1 19 0 22" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M24 6c1 3 1 19 0 22" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
      `;
      break;
    case 'network':
      svgPath = `
        <circle cx="16" cy="8" r="3" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <circle cx="8" cy="16" r="3" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <circle cx="24" cy="16" r="3" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <circle cx="16" cy="24" r="3" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M16 8L8 16" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M16 8L24 16" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M8 16L16 24" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M24 16L16 24" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
      `;
      break;
    default:
      svgPath = `
        <circle cx="16" cy="8" r="3" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <circle cx="8" cy="16" r="3" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <circle cx="24" cy="16" r="3" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <circle cx="16" cy="24" r="3" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M16 8L8 16" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M16 8L24 16" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M8 16L16 24" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
        <path d="M24 16L16 24" stroke="#2563eb" stroke-width="${strokeWidth}" fill="none"/>
      `;
  }
  
  return `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="white" rx="4"/>
      ${svgPath}
    </svg>
  `;
}