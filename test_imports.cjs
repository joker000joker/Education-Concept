require('ts-node').register();
try {
  require('./src/App.tsx');
  console.log('App.tsx loaded without crashing');
} catch (err) {
  console.error('Error loading App.tsx:', err);
}
