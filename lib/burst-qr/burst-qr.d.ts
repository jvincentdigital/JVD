// Types for burst-qr.js. `three` is loaded from a CDN at runtime, so THREE types are left loose here.

export type BurstStyle = 'realistic' | 'watercolor';

export interface BurstPalette {
  /** Colour of the QR squares. Must be dark (it sits on white). */
  dark: string;
  /** Page background behind the object (also the watercolor paper). */
  bg?: string;
  /** Watercolor wash and floor puddle tint. */
  wash?: string;
}

export interface BurstPart {
  /** Parts that share a geometry are drawn as one InstancedMesh. Faces +Z, centred near the origin. */
  geometry: any;
  /** 'soft' | 'gloss' | 'matte' or MeshPhysicalMaterial params. One material per geometry. */
  material?: string | Record<string, unknown>;
  /** Where the part sits in the object (object space). */
  matrix: any;
  /** Tint multiplied with the geometry's vertex colours. Default white. */
  color?: string | any;
  /** 'fly' parts fill QR squares; 'leaf' parts become a few accents and the rest fly off. */
  role?: 'fly' | 'leaf';
  /** Starts at size zero (a source for pieces that burst out of the object). */
  hidden?: boolean;
}

export interface BurstKit {
  THREE: any;
  /** Seeded random, so the object looks the same every time. */
  rand: () => number;
  palette: Required<BurstPalette>;
  /** Write vertex colours: fn returns a hex colour or [hex, brightness]. */
  paint: (geo: any, fn: (x: number, y: number, z: number) => string | [string, number]) => any;
  V: (x?: number, y?: number, z?: number) => any;
  lin: (hex: string) => any;
}

export interface BurstObject {
  /** Static meshes (plate, cup, vase). They fall away and fade. Keep the group's own transform at identity. */
  group?: any;
  /** Pieces that fly into the code. Leave out to sample pieces from the group's meshes. */
  parts?: BurstPart[];
  /** Called every frame: time in seconds, t = 0 (object) to 1 (code). */
  tick?: (time: number, t: number) => void;
  /** Camera angle above the horizon, radians. Default 0.2. */
  elevation?: number;
  /** Radius of the object's footprint (object units), for the floor shadow. */
  footR?: number;
}

export type BurstObjectBuilder = (kit: BurstKit) => BurstObject;

export interface BurstOptions {
  link: string;
  object: BurstObjectBuilder;
  palette?: BurstPalette;
  style?: BurstStyle;
  /** Accessible name for the canvas (it acts as a toggle button). */
  label?: string;
  /** Force a quality tier: 0 low, 1 medium, 2 high. Default: start high, step down if slow. */
  quality?: 0 | 1 | 2;
  onToggle?: (open: boolean) => void;
}

export interface BurstQR {
  toggle(): void;
  readonly isOpen: boolean;
  setStyle(style: BurstStyle): void;
  /** Throws if the link is too long for a level H code (about 119 bytes). */
  setLink(link: string): void;
  setObject(object: BurstObjectBuilder, palette?: BurstPalette): void;
  /** Square PNG of the flat code, as a data URL. */
  toPNG(px?: number): string;
  /** Test hook: freeze and draw one moment, 0 = object, 1 = code. */
  still(t: number): void;
  resume(): void;
  readonly quality: { tier: number };
  destroy(): void;
}

export function createBurstQR(el: HTMLElement, opts: BurstOptions): Promise<BurstQR>;
