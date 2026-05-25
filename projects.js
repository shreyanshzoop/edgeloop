/* ============================================================
   EDGELOOP — projects.js
   Single source of truth for all category-page project content.
   Edit this file to add / remove / reorder projects.
   Each category renders exactly the entries listed below.
   ============================================================

   Per project:
     title   — display name
     cat     — small caption above the title on hover
     video   — relative path inside /videos/ (optional)
     image   — relative path inside /images/ (optional fallback)
     poster  — relative path to a still frame (optional, for video)

   If neither video nor image is provided, the slot shows a
   styled "coming soon" placeholder — never the old "drop video
   here" file-picker that didn't persist.
   ============================================================ */

window.EDGELOOP_PROJECTS = {

  anamorphic: {
    meta: {
      eyebrow: 'edgeloop · category 01',
      title:   '3D Anamorphic',
      tags:    ['OOH', 'Immersive', 'LED Installations'],
      desc:    'Large-format illusion content engineered for LED cubes, mega screens, and out-of-home installations. Brands like Novo Nordisk, EXCON, Tata AI Summit, and Aditya Birla.',
      footerLinks: [
        { href: 'brand.html',  label: 'brand work →'     },
        { href: 'artist.html', label: 'artist visuals →' },
      ],
    },
    projects: [
      { title: 'Novo Nordisk NSM', cat: 'Anamorphic 3D · 2025', video: 'novo-nordisk.mp4',   poster: 'posters/novo-nordisk.jpg' },
      { title: 'Tata AI Summit',   cat: 'Anamorphic 3D · Tech', video: 'tata-ai-summit.mp4', poster: 'posters/tata-ai-summit.jpg' },
      { title: 'EXCON Showcase',   cat: 'LED Cube · 2024',      video: 'excon.mp4',          poster: 'posters/excon.jpg' },
      { title: 'Aditya Birla',     cat: '3D Visual · Brand',    video: 'aditya-birla.mp4',   poster: 'posters/aditya-birla.jpg' },
      { title: 'Coming soon',      cat: 'Reserved slot' },
      { title: 'Coming soon',      cat: 'Reserved slot' },
    ],
  },

  brand: {
    meta: {
      eyebrow: 'edgeloop · category 02',
      title:   'Brand Work',
      tags:    ['CGI', 'Motion', 'Product Visual'],
      desc:    'Product visualization, campaign motion, and digital content built for brands across advertising, retail, and consumer tech. FILA, Crocs, Foot Locker, Ace Blends, Green Ritual.',
      footerLinks: [
        { href: 'anamorphic.html', label: '3D anamorphic →'  },
        { href: 'artist.html',     label: 'artist visuals →' },
      ],
    },
    projects: [
      { title: 'FILA',         cat: 'Product CGI',      video: 'fila.mp4',         poster: 'posters/fila.jpg' },
      { title: 'Crocs',        cat: 'Campaign Motion',  video: 'crocs.mp4',        poster: 'posters/crocs.jpg' },
      { title: 'Foot Locker',  cat: 'Retail Content',   video: 'foot-locker.mp4',  poster: 'posters/foot-locker.jpg' },
      { title: 'Ace Blends',   cat: 'Product Visual',   video: 'ace-blends.mp4',   poster: 'posters/ace-blends.jpg' },
      { title: 'Green Ritual', cat: 'Brand Film',       video: 'green-ritual.mp4', poster: 'posters/green-ritual.jpg' },
      { title: 'HDFC Life',    cat: 'Motion · Finance', video: 'hdfc-life.mp4',    poster: 'posters/hdfc-life.jpg' },
    ],
  },

  artist: {
    meta: {
      eyebrow: 'edgeloop · category 03',
      title:   'Artist Visuals',
      tags:    ['Live', 'Events', 'Stage Design'],
      desc:    'Stage visuals, live event content, and immersive backdrops for artists, festivals, and performance environments. Built for impact at full scale, full crowd.',
      footerLinks: [
        { href: 'anamorphic.html', label: '3D anamorphic →' },
        { href: 'brand.html',      label: 'brand work →'    },
      ],
    },
    projects: [
      { title: 'Festival Stage A', cat: 'Live Visual · 2024' /* add video when ready */ },
      { title: 'Tour Backdrop',    cat: 'Stage Design'       /* add video when ready */ },
      { title: 'DJ Set Visual',    cat: 'Live · Motion'      /* add video when ready */ },
      { title: 'Coming soon',      cat: 'Reserved slot' },
      { title: 'Coming soon',      cat: 'Reserved slot' },
      { title: 'Coming soon',      cat: 'Reserved slot' },
    ],
  },

};
