export type Locale = 'en' | 'es';

export type CaseStudy = {
  slug: string;
  client: string;
  color: string;
  category: Record<Locale, string>;
  brief: Record<Locale, string>;
  challenge: Record<Locale, string>;
  approach: Record<Locale, string[]>;
  outcome: Record<Locale, string>;
  stack: string[];
  liveUrl: string;
  heroImage?: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: 'imperfect-gaming',
    client: 'IMPerfect Gaming',
    color: '#C8E400',
    category: {
      en: 'Esports / Team Management',
      es: 'Esports / Gestión de Equipo',
    },
    brief: {
      en: 'A Puerto Rico esports organization competing in OW2 and Marvel Rivals needed a way to run the business side — rosters, scrims, announcements — without their coaching staff touching code.',
      es: 'Una organización de esports de Puerto Rico compitiendo en OW2 y Marvel Rivals necesitaba una forma de manejar el lado operativo — rosters, scrims, anuncios — sin que el staff de coaching tocara el código.',
    },
    challenge: {
      en: 'Building a bilingual org management system that could handle roster moves, scrim scheduling, and team announcements — all without requiring the coaching staff to touch the codebase. The solution was a role-based Team Hub with scoped permissions for Admin, Coach, and Manager roles.',
      es: 'Construir un sistema bilingüe de gestión de organización que pudiera manejar movimientos de roster, programación de scrims y anuncios del equipo — todo sin requerir que el staff de coaching tocara el código. La solución fue un Team Hub basado en roles con permisos para Admin, Coach y Manager.',
    },
    approach: {
      en: [
        'Designed a role-based permission system with three tiers: Admin, Coach, Manager',
        'Built a bilingual content system with next-intl for parallel EN/ES management',
        'Created a Team Hub dashboard for scrim scheduling and roster moves',
        'Implemented a three-strike tracking system for player accountability',
      ],
      es: [
        'Diseñamos un sistema de permisos basado en roles con tres niveles: Admin, Coach, Manager',
        'Construimos un sistema de contenido bilingüe con next-intl para gestión paralela EN/ES',
        'Creamos un dashboard Team Hub para programación de scrims y movimientos de roster',
        'Implementamos un sistema de seguimiento de tres strikes para responsabilidad del jugador',
      ],
    },
    outcome: {
      en: 'Coaching staff now runs the full organization without developer involvement. Bilingual parity across every roster announcement, scrim schedule, and team update.',
      es: 'El staff de coaching ahora maneja la organización completa sin involucrar desarrolladores. Paridad bilingüe en cada anuncio de roster, horario de scrim y actualización del equipo.',
    },
    stack: ['Next.js 14', 'TypeScript', 'Tailwind', 'next-intl', 'Supabase', 'Framer Motion'],
    liveUrl: 'https://imperfectgg.com/en',
  },
  {
    slug: 'emmalina',
    client: 'Emmalina',
    color: '#C9A96E',
    category: {
      en: 'Luxury Fashion / Personal Styling',
      es: 'Moda de Lujo / Estilismo Personal',
    },
    brief: {
      en: 'A personal stylist affiliated with Saks, Neiman Marcus, and Bergdorf Goodman needed a site that converted casual visitors into private styling clients — while still monetizing through affiliate links.',
      es: 'Una estilista personal afiliada a Saks, Neiman Marcus y Bergdorf Goodman necesitaba un sitio que convirtiera visitantes casuales en clientas de estilismo privado — mientras monetizaba a través de enlaces de afiliados.',
    },
    challenge: {
      en: 'The client needed to convert casual site visitors into private styling clients, while simultaneously driving affiliate sales through Saks, Neiman Marcus, and Bergdorf Goodman. We restructured the site around her personal brand first, with affiliate commerce as a secondary layer — not the other way around.',
      es: 'La clienta necesitaba convertir visitantes casuales en clientes de estilismo privado, mientras simultáneamente impulsaba ventas de afiliados a través de Saks, Neiman Marcus y Bergdorf Goodman. Reestructuramos el sitio alrededor de su marca personal primero, con el comercio de afiliados como capa secundaria — no al revés.',
    },
    approach: {
      en: [
        'Led with personal-brand storytelling — bio, services, and stylist voice above affiliate commerce',
        'Built a clean booking flow that routes serious inquiries into a high-intent funnel',
        'Integrated affiliate product grids as a supporting monetization layer, not the hero',
        'Designed for editorial browsing — generous typography, slow scroll pacing, luxury palette',
      ],
      es: [
        'Lideramos con narrativa de marca personal — bio, servicios y voz de estilista por encima del comercio de afiliados',
        'Construimos un flujo de reservas limpio que canaliza consultas serias hacia un embudo de alta intención',
        'Integramos grillas de productos afiliados como capa secundaria de monetización, no como protagonista',
        'Diseñamos para navegación editorial — tipografía generosa, ritmo de scroll pausado, paleta de lujo',
      ],
    },
    outcome: {
      en: 'The site now reads as a stylist brand first and a shop second. Booking inquiries arrive pre-qualified, and affiliate clicks still flow through without cannibalizing the core offer.',
      es: 'El sitio ahora se lee como una marca de estilista primero y una tienda después. Las consultas de reserva llegan pre-calificadas, y los clics de afiliados siguen fluyendo sin canibalizar la oferta principal.',
    },
    stack: ['Next.js 14', 'TypeScript', 'Tailwind', 'Framer Motion', 'Formspree'],
    liveUrl: 'https://emmalina-brand.vercel.app',
  },
  {
    slug: 'xpress-color',
    client: 'Xpress Color',
    color: '#FFD400',
    category: {
      en: 'Print & Signage / Shop Operations',
      es: 'Imprenta y Rotulación / Operaciones del Taller',
    },
    brief: {
      en: 'A print and signage shop in Puerto Rico needed its public site and its day-to-day operations in one place: quotes, work orders, invoices and the shop floor.',
      es: 'Una imprenta y taller de rótulos en Puerto Rico necesitaba su sitio público y su operación diaria en un solo lugar: cotizaciones, órdenes de trabajo, facturas y el taller.',
    },
    challenge: {
      en: 'The shop wanted quotes, work orders and invoices in one tool, and a way to be sure no job starts before its deposit comes in. We built one bilingual app: the public site, a staff tool that carries a job from quote to work order to invoice, and a rule that keeps production locked until the deposit is recorded.',
      es: 'El taller quería cotizaciones, órdenes de trabajo y facturas en una sola herramienta, y la seguridad de que ningún trabajo empiece antes de recibir su depósito. Construimos una sola aplicación bilingüe: el sitio público, una herramienta para el equipo que lleva cada trabajo de cotización a orden de trabajo y a factura, y una regla que mantiene la producción bloqueada hasta que el depósito queda registrado.',
    },
    approach: {
      en: [
        'One app for three jobs: the marketing site, the staff tool behind sign-in, and a product demo',
        'A job moves from site visit to quote, work order and invoice inside one tool',
        'Production stays locked until the deposit is recorded, a government purchase order is entered, or a supervisor signs off',
        'Roles decide who sees money: the shop floor works from a board with no prices on it',
        'Help guides written for each position, in Spanish, inside the tool',
      ],
      es: [
        'Una aplicación para tres funciones: el sitio de mercadeo, la herramienta del equipo con inicio de sesión y una demostración del producto',
        'Un trabajo pasa de la visita a la cotización, la orden de trabajo y la factura dentro de una sola herramienta',
        'La producción queda bloqueada hasta que se registra el depósito, se entra una orden de compra de gobierno o un supervisor lo autoriza',
        'Los roles deciden quién ve dinero: el taller trabaja desde un tablero sin precios',
        'Guías de ayuda escritas para cada puesto, en español, dentro de la herramienta',
      ],
    },
    outcome: {
      en: 'The public site, the staff tool and the demo run from one codebase at xpresscolorpr.com. In rehearsal, a job went from quote to final payment, and production opened only once the deposit was in.',
      es: 'El sitio público, la herramienta del equipo y la demostración corren desde una sola base de código en xpresscolorpr.com. En el ensayo, un trabajo fue de la cotización al pago final, y la producción se abrió solo cuando entró el depósito.',
    },
    stack: ['Next.js 16', 'TypeScript', 'Tailwind', 'next-intl', 'Prisma', 'Postgres'],
    liveUrl: 'https://xpresscolorpr.com/es',
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.slug === slug);
}

export function getOtherCaseStudies(slug: string): CaseStudy[] {
  return caseStudies.filter((cs) => cs.slug !== slug);
}
