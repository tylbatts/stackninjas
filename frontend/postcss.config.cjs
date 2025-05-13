/**
 * PostCSS configuration for Tailwind CSS and Autoprefixer.
 */
module.exports = {
  // Only Autoprefixer: Tailwind injected via Vite plugin
  plugins: [
    require('autoprefixer'),
  ],
};