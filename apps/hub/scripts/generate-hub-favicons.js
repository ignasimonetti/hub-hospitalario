const fs = require('fs');
const path = require('path');

// Función para generar diferentes iconos de "hub"
function generateHubFavicons() {
  const outputDir = path.join(__dirname, '../public/icons');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const iconSize = 32;
  const strokeWidth = 2;
  const color = '#2563eb'; // Blue matching our theme

  // Icon 1: Network Hub (Nodos conectados - perfecto para "hub")
  const networkSvg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="white" rx="4"/>
      <circle cx="16" cy="8" r="3" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <circle cx="8" cy="16" r="3" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <circle cx="24" cy="16" r="3" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <circle cx="16" cy="24" r="3" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M16 8L8 16" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M16 8L24 16" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M8 16L16 24" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M24 16L16 24" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
    </svg>
  `;

  // Icon 2: Globe Hub (Conectividad global)
  const globeSvg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="white" rx="4"/>
      <circle cx="16" cy="16" r="12" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M4 16h24" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M16 4c3 4 3 20 0 24" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M10 8c-1 3-1 13 0 16" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M22 8c1 3 1 13 0 16" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M8 12l-1 2" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M24 12l1 2" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
    </svg>
  `;

  // Icon 3: Wifi Hub (Conectividad)
  const wifiSvg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="white" rx="4"/>
      <circle cx="16" cy="16" r="12" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M6 16c4-6 16-6 20 0" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M10 16c3-4 9-4 12 0" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M13 16c2-2 4-2 6 0" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <circle cx="16" cy="20" r="1.5" fill="${color}"/>
    </svg>
  `;

  // Icon 4: Radio Tower Hub (Señal central)
  const towerSvg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="white" rx="4"/>
      <path d="M16 4v12" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M16 4l-3 3" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M16 4l3 3" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M12 10l4 4l4-4" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M10 16h12" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M14 20v6" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M18 20v6" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M12 26h8" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <!-- Waves -->
      <path d="M8 8c2-3 6-3 8 0" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M4 12c3-4 9-4 12 0" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
      <path d="M0 16c4-6 16-6 20 0" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>
    </svg>
  `;

  const icons = [
    { name: 'network', svg: networkSvg },
    { name: 'globe', svg: globeSvg },
    { name: 'wifi', svg: wifiSvg },
    { name: 'tower', svg: towerSvg }
  ];

  icons.forEach(({ name, svg }) => {
    const filePath = path.join(outputDir, `hub-${name}.svg`);
    fs.writeFileSync(filePath, svg);
    console.log(`✅ Generated: hub-${name}.svg`);
  });

  console.log('\n🎯 Hub Favicon Options:');
  console.log('1. network - Nodos conectados (representa perfectamente "hub")');
  console.log('2. globe - Conectividad global');  
  console.log('3. wifi - Señal de conexión');
  console.log('4. tower - Torre de señal central');
  console.log('\n¿Cual prefieres? Te recomiendo "network" ya que es el más representativo de "hub".');

  return icons;
}

generateHubFavicons();