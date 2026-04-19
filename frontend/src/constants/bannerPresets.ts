export const GRADIENTS = [
  { id: 'royal',    name: 'Royal',       css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',                dark: false },
  { id: 'sunset',   name: 'Sunset',      css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',                dark: false },
  { id: 'ocean',    name: 'Ocean',       css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',                dark: false },
  { id: 'fire',     name: 'Fire',        css: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',                dark: false },
  { id: 'forest',   name: 'Forest',      css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',                dark: true  },
  { id: 'midnight', name: 'Midnight',    css: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',                dark: false },
  { id: 'rose',     name: 'Rose',        css: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',                dark: false },
  { id: 'sage',     name: 'Sage',        css: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',                dark: false },
  { id: 'gold',     name: 'Gold',        css: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',                dark: true  },
  { id: 'carbon',   name: 'Carbon',      css: 'linear-gradient(135deg, #1c1c1c 0%, #434343 100%)',                dark: false },
  { id: 'aurora',   name: 'Aurora',      css: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',                dark: true  },
  { id: 'deep',     name: 'Deep Night',  css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',  dark: false },
  { id: 'peach',    name: 'Peach',       css: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',                dark: true  },
  { id: 'spring',   name: 'Spring',      css: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',                dark: true  },
  { id: 'wine',     name: 'Wine',        css: 'linear-gradient(135deg, #4a0000 0%, #8b0000 100%)',                dark: false },
  { id: 'ice',      name: 'Ice',         css: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',                dark: true  },
] as const;

export type GradientId = (typeof GRADIENTS)[number]['id'];

export const FONT_PAIRS = [
  { id: 'modern',  name: 'Modern',   heading: 'Montserrat',         body: 'Open Sans',     weight: 700 },
  { id: 'elegant', name: 'Elegant',  heading: 'Playfair Display',   body: 'Lato',          weight: 700 },
  { id: 'impact',  name: 'Impact',   heading: 'Oswald',             body: 'Source Sans 3', weight: 600 },
  { id: 'minimal', name: 'Minimal',  heading: 'Poppins',            body: 'Poppins',       weight: 600 },
  { id: 'luxe',    name: 'Luxe',     heading: 'Cormorant Garamond', body: 'Montserrat',    weight: 600 },
  { id: 'dynamic', name: 'Dynamic',  heading: 'Raleway',            body: 'Roboto',        weight: 800 },
] as const;

export type FontId = (typeof FONT_PAIRS)[number]['id'];

export const POSITIONS = [
  { id: 'center',        flex: 'items-center justify-center', textAlign: 'center' },
  { id: 'bottom-left',   flex: 'items-end justify-start',     textAlign: 'left'   },
  { id: 'bottom-center', flex: 'items-end justify-center',    textAlign: 'center' },
  { id: 'top-left',      flex: 'items-start justify-start',   textAlign: 'left'   },
] as const;

export type PositionId = (typeof POSITIONS)[number]['id'];

export const SIZES = [
  { id: 'square',    name: 'Instagram Post',  ratio: '1 / 1',   label: '1080 × 1080', px: [1080, 1080] as [number, number] },
  { id: 'story',     name: 'Story / Reel',    ratio: '9 / 16',  label: '1080 × 1920', px: [1080, 1920] as [number, number] },
  { id: 'landscape', name: 'Facebook / X',    ratio: '16 / 9',  label: '1200 × 628',  px: [1200, 628]  as [number, number] },
  { id: 'linkedin',  name: 'LinkedIn Banner', ratio: '4 / 1',   label: '1584 × 396',  px: [1584, 396]  as [number, number] },
  { id: 'rectangle', name: 'Display Ad',      ratio: '6 / 5',   label: '300 × 250',   px: [300, 250]   as [number, number] },
] as const;

export const PLATFORMS = [
  { id: 'instagram-post',  name: 'Instagram Post',  px: [1080, 1080] as [number, number], ratio: '1/1',  sizeId: 'square'    },
  { id: 'instagram-story', name: 'Instagram Story', px: [1080, 1920] as [number, number], ratio: '9/16', sizeId: 'story'     },
  { id: 'facebook',        name: 'Facebook Feed',   px: [1200, 628]  as [number, number], ratio: '16/9', sizeId: 'landscape' },
  { id: 'linkedin',        name: 'LinkedIn Banner', px: [1584, 396]  as [number, number], ratio: '4/1',  sizeId: 'linkedin'  },
  { id: 'tiktok',          name: 'TikTok',          px: [1080, 1920] as [number, number], ratio: '9/16', sizeId: 'story'     },
  { id: 'display',         name: 'Display Ad',      px: [300, 250]   as [number, number], ratio: '6/5',  sizeId: 'rectangle' },
] as const;
