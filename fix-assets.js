const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigiendo rutas de assets para GitHub Pages...');

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');
const notFoundPath = path.join(distPath, '404.html');

// Leer index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Reemplazar todas las rutas de assets
html = html.replace(/(href|src)="(\/)?(assets\/[^"]+)"/g, (match, attr, slash, assetPath) => {
  return `${attr}="./${assetPath}"`;
});

// También corregir URLs que empiecen con ./
html = html.replace(/(href|src)="\.\/(assets\/[^"]+)"/g, (match, attr, assetPath) => {
  return `${attr}="./${assetPath}"`;
});

// Escribir index.html corregido
fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ index.html corregido');

// Copiar a 404.html
fs.copyFileSync(indexPath, notFoundPath);
console.log('✅ 404.html creado/corregido');

// Verificar assets
const assetsDir = path.join(distPath, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  console.log(`📁 Assets encontrados: ${files.length} archivos`);
  files.forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log('⚠️  No se encontró carpeta assets/');
}

console.log('\n✅ ¡Corrección completada!');
console.log('🚀 Ahora ejecuta: npm run deploy');