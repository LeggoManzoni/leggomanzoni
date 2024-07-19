# Project Technical Documentation

## 1. Introduction

"Leggo Manzoni" is a web application developed by the Department of Classical Philology and Italian Studies (FICLIT) at the University of Bologna. The project, conceived by Paola Italia and Francesca Tomasi, started in 2019 as part of the PRIN 2017 project "Manzoni Online: unpublished manuscripts and documents, tradition and translations" (prot. 2017CFZFAY), coordinated by Giulia Raboni (University of Parma) in collaboration with the DH.arc center of the University of Bologna.

The platform offers three main components:

1. **LEGGO MANZONI (READ MANZONI)**: Provides the full text of the 1840-42 edition of "I promessi sposi" (The Betrothed) by Alessandro Manzoni, accompanied by original images and forty critical commentaries. This section allows for an "immersive" reading of the novel, guided by leading scholars of Manzoni's work.

2. **TRADUCO MANZONI (TRANSLATE MANZONI)**: Offers ten translations of the novel in various languages including French, English, German, Spanish, Dutch, Polish, Russian, and Chinese. This section uses a neural network algorithm to automatically create multilingual digital editions of literary works.

3. **VEDO MANZONI (SEE MANZONI)**: Presents the complete digitization and metadata of the original 1840-42 print edition (known as "Quarantana"), including 505 vignettes that can be explored through thematic routes.

The project is not only a scientific endeavor but also a shared laboratory between the University and high schools. It involved the active participation of 20 secondary schools across Italy in two cycles of Work-Based Learning and Career Guidance programs (PCTO), focusing on developing textual and digital skills.

### Key Features:
- Full text of "I promessi sposi" with original illustrations
- Forty critical commentaries on the novel
- Ten translations in various languages
- Digitized version of the original 1840-42 edition with metadata
- Interactive reading environment
- Educational resources and exercises

### Development Status:
The project is ongoing. Currently, it includes:
- Images for the Introduction and Chapter I
- Complete commentary by Luigi Russo and Mariarosa Bricchi
- Commentaries on the Introduction and Chapter I from other commentators
- Translations of the Introduction and Chapter I in various languages

The platform is continually updated with new commentaries and translations.

## 2. System Requirements
- Node.js
- NPM (Node Package Manager)

## 3. Dependencies
- express
- path
- ejs
- fs
- googleapis
- dotenv (for development)

## 4. Project Structure
LeggoManzoni/
│
├── app.js
├── routes/
│   ├── vedo.js
│   ├── traduco.js
│   ├── reader.js
│   ├── progetto.js
│   └── credits.js
├── views/
|   ├── partials/
│   │   ├── footer.ejs
│   │   ├── head.ejs
│   │   ├── navbar.ejs
│   │   └── scripts.ejs
│   └── commenti.ejs
│   └── credits.ejs
│   └── index.ejs
│   └── progetto.ejs
│   └── reader.ejs
│   └── traduco.ejs
│   └── vedo.ejs
├── assets/
│   └── js/
│       ├── convert.js
│       ├── chapter.xslt
│       ├── translation.xslt
│       ├── comment.xslt
│       └── [other js files]
├── quarantana/
│   └── TEI files of the novel
├── data/
├── translations/
│   └── TEI files of the translations
├── commenti/
│   └── xml/
│       └── TEI files of the comments
└── [other project files and folders]

## 5. Configuration
- Environment variables (via .env file in development)
- Google Analytics setup (requires GOOGLE_APPLICATION_CREDENTIALS and GA_PROPERTY_ID)

## 6. Main Components
### 6.1 Express Application Setup
The main application is set up in `app.js`, which initializes Express, sets up middleware, and defines the main routes.

### 6.2 Static File Serving
Static files are served from the `assets`, `quarantana`, `translations`, `commenti` and `data` directories.

### 6.3 View Engine Configuration
EJS is used as the view engine, with views located in the `views` directory.

### 6.4 Routing
The application uses several route modules:
- `progetto.js`: Handles the Progetto page
- `commenti.js`: Handles the Comments list
- `traduzione.js`: Handles the list of the translations
- `reader.js`: Handles the Leggo page
- `traduco.js`: Handles the Traduco page
- `vedo.js`: Handles a Vedo page
- `credits.js`: Handles the Credits page

### 6.5 XML to HTML Conversion
The application includes functionality to convert TEI/XML content to HTML, including special handling for the Quarantana text, comments and translations.

### 6.6 ID Extraction Functionality
There's a function to extract IDs from HTML content, specifically targeting spans with IDs in a certain format.

### 6.7 Google Analytics Integration
The application integrates with Google Analytics 4 to fetch analytics data.

## 7. API Endpoints
- GET `/`: Renders the index page
- GET `/introduzione`: Renders the introduction page
- GET `/progetto`: (Functionality not provided)
- GET `/commenti`: (Functionality not provided)
- GET `/traduzione`: (Functionality not provided)
- GET `/reader`: Renders the reader page with chapters and comments
- GET `/traduco`: Renders the translation page with chapters and languages
- GET `/vedo`: Renders the "vedo" page
- GET `/credits`: Renders the credits page
- GET `/extract-ids`: Extracts IDs from a specific HTML file
- GET `/get-chapter/:chapterName`: Retrieves and converts a specific chapter to HTML
- GET `/get-chapter-with-images/:chapterName`: Retrieves and converts a specific chapter to HTML, including images
- GET `/get-comment/:authorName?`: Retrieves and converts comments for a specific author
- GET `/get-comment/:authorName/:chapterName?`: Retrieves and converts comments for a specific author and chapter
- GET `/get-translation/:language?`: Retrieves and converts translations for a specific language
- GET `/visitors`: Retrieves Google Analytics data

## 8. Data Processing
- XML to HTML conversion for chapters, comments, and translations
- JSON parsing for comments and translations information

## 9. External Integrations
- Google Analytics for visitor data

## 10. Deployment
The application is set to run on port 8000 by default. Deployment instructions are not provided in the given code.

## 11. Troubleshooting
- Ensure all required environment variables are set
- Check file paths for JSON and XML files if data loading issues occur
- Verify Google Analytics credentials if analytics data retrieval fails