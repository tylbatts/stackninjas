/**
 * PostCSS configuration for Tailwind CSS and Autoprefixer.
 */
module.exports = {
  // Use explicit plugin functions to ensure correct resolution of the Tailwind PostCSS plugin
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
};