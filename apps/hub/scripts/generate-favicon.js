const { createSvg } = require('lucide-react');
const fs = require('fs');
const path = require('path');

// Iconos que representan el concepto de "hub"
const hubIcons = [
  { name: 'Radio', icon: 'Radio' },
  { name: 'Globe', icon: 'Globe' }, 
  { name: 'Network', icon: 'Network' },
  { name: 'RadioTower', icon: 'RadioTower' },
  { name: 'Link', icon: 'Link' },
  { name: 'Wifi', icon: 'Wifi' }
];

const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

hubIcons.forEach(({ name, icon }) => {
  try {
    const lucideIcon = require('lucide-react')[icon];
    if (lucideIcon) {
      const svgString = lucideIcon({ 
        size: 32, 
        color: '#2563eb',
        strokeWidth: 2 
      });
      
      const filePath = path.join(outputDir, `${name.toLowerCase()}.svg`);
      fs.writeFileSync(filePath, svgString);
      console.log(`✅ Generated ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error generating ${name}:`, error.message);
  }
});

console.log('\n🎯 Disponible en:', outputDir);
console.log('Selecciona el icono que mejor represente "Hub" y crearemos el favicon desde ahí.');