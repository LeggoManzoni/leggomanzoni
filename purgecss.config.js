module.exports = {
  content: [
    './views/**/*.ejs',
    './views/*.ejs',
    './assets/js/*.js',
    './routes/*.js',
    './app.js'
  ],
  css: ['./assets/css/styles.css'],
  output: './assets/css/',
  // Safelist patterns to keep certain styles
  safelist: {
    standard: [
      /^btn-/,
      /^navbar-/,
      /^nav-/,
      /^dropdown-/,
      /^modal/,
      /^col-/,
      /^row/,
      /^container/,
      /^text-/,
      /^bg-/,
      /^border-/,
      /^rounded/,
      /^p[x|y|t|b|s|e]?-/,
      /^m[x|y|t|b|s|e]?-/,
      /^d-/,
      /^flex/,
      /^justify/,
      /^align/,
      /^font/,
      /^h-/,
      /^w-/,
      /^overflow/,
      /^position/,
      /^top/,
      /^bottom/,
      /^start/,
      /^end/,
      /active$/,
      /show$/,
      /collapse/,
      /collapsing/,
      // Custom classes from your app
      /normalFont/,
      /accessibilityFont/,
      /colonna/,
      /vignette/,
      /reader/,
      /testo/,
      /divider/,
      /masthead/,
      /portfolio/,
      /fixedContent/,
      /studentList/,
      /activeNav/,
      /activeBtn/,
      /aboutvignette/,
      /title-vignette/,
      /box-/,
      /row[vV]/
    ],
    deep: [
      /bi-/  // Bootstrap icons
    ],
    greedy: [
      /^sr-only/
    ]
  },
  // Extract selectors from inline styles and dynamic classes
  defaultExtractor: content => {
    const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
    const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || []
    return broadMatches.concat(innerMatches)
  },
  // Keep keyframes
  keyframes: true,
  // Keep font faces
  fontFace: true,
  // Keep CSS variables
  variables: true
}