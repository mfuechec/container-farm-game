/**
 * Leaf Shape Renderers
 * 
 * Strategy pattern for drawing different leaf shapes.
 * Each plant type can have a distinct visual appearance.
 * 
 * Note: PixiJS v8 doesn't have translate/rotate on Graphics.
 * We transform coordinates manually.
 */

import { Graphics } from 'pixi.js';

export type LeafShape = 'rounded' | 'serrated' | 'feathery' | 'fan' | 'blade';

export interface LeafParams {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: number;
  alpha?: number;
}

/**
 * Transform a point by rotation around origin, then translate
 */
function transformPoint(px: number, py: number, rotation: number, tx: number, ty: number): { x: number; y: number } {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: tx + px * cos - py * sin,
    y: ty + px * sin + py * cos,
  };
}

/**
 * Draw a rounded leaf (basil-style)
 * Smooth, oval shape
 */
function drawRoundedLeaf(g: Graphics, params: LeafParams): void {
  const { x, y, size, rotation, color, alpha = 1 } = params;
  
  // Main leaf body - oval (draw at origin, transformed)
  const leafCenterY = -size * 0.3;
  const center = transformPoint(0, leafCenterY, rotation, x, y);
  
  // For ellipse, we need to handle rotation differently
  // Simple approach: draw rotated ellipse using path
  const w = size * 0.4;
  const h = size * 0.6;
  const steps = 16;
  
  g.moveTo(
    ...Object.values(transformPoint(w, 0, rotation, x, y + leafCenterY)) as [number, number]
  );
  
  for (let i = 1; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const px = Math.cos(angle) * w;
    const py = Math.sin(angle) * h;
    const p = transformPoint(px, py + leafCenterY, rotation, x, y);
    g.lineTo(p.x, p.y);
  }
  
  g.closePath();
  g.fill({ color, alpha });
}

/**
 * Draw a serrated leaf (mint-style)
 * Oval with jagged edges
 */
function drawSerratedLeaf(g: Graphics, params: LeafParams): void {
  const { x, y, size, rotation, color, alpha = 1 } = params;
  
  // Serrated edge using zigzag path
  const points = 8;
  const startP = transformPoint(0, size * 0.2, rotation, x, y);
  g.moveTo(startP.x, startP.y);
  
  // Right side (going up)
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const bulge = Math.sin(t * Math.PI);
    const serration = i % 2 === 0 ? 1 : 0.7;
    const baseX = bulge * size * 0.35 * serration;
    const baseY = size * 0.2 - t * size * 0.9;
    const p = transformPoint(baseX, baseY, rotation, x, y);
    g.lineTo(p.x, p.y);
  }
  
  // Left side (going down)
  for (let i = points; i >= 0; i--) {
    const t = i / points;
    const bulge = Math.sin(t * Math.PI);
    const serration = i % 2 === 0 ? 1 : 0.7;
    const baseX = -bulge * size * 0.35 * serration;
    const baseY = size * 0.2 - t * size * 0.9;
    const p = transformPoint(baseX, baseY, rotation, x, y);
    g.lineTo(p.x, p.y);
  }
  
  g.closePath();
  g.fill({ color, alpha });
}

/**
 * Draw a feathery leaf (parsley-style)
 * Multiple small segments
 */
function drawFeatheryLeaf(g: Graphics, params: LeafParams): void {
  const { x, y, size, rotation, color, alpha = 1 } = params;
  
  // Small leaflets along the stem
  const leaflets = 4;
  for (let i = 0; i < leaflets; i++) {
    const t = (i + 1) / (leaflets + 1);
    const leafY = size * 0.1 - t * size * 0.7;
    const leafSize = size * 0.25 * (1 - t * 0.3);
    
    // Left leaflet
    const leftP = transformPoint(-leafSize * 0.6, leafY, rotation, x, y);
    g.ellipse(leftP.x, leftP.y, leafSize * 0.4, leafSize * 0.25);
    g.fill({ color, alpha });
    
    // Right leaflet
    const rightP = transformPoint(leafSize * 0.6, leafY, rotation, x, y);
    g.ellipse(rightP.x, rightP.y, leafSize * 0.4, leafSize * 0.25);
    g.fill({ color, alpha });
  }
  
  // Top leaflet
  const topP = transformPoint(0, -size * 0.6, rotation, x, y);
  g.ellipse(topP.x, topP.y, size * 0.12, size * 0.18);
  g.fill({ color, alpha });
}

/**
 * Draw a fan-shaped leaf (cilantro-style)
 * Delicate, spread out
 */
function drawFanLeaf(g: Graphics, params: LeafParams): void {
  const { x, y, size, rotation, color, alpha = 1 } = params;
  
  // Fan of small rounded lobes
  const lobes = 5;
  const spread = Math.PI * 0.5;
  
  for (let i = 0; i < lobes; i++) {
    const angle = spread * (i / (lobes - 1) - 0.5);
    const lobeX = Math.sin(angle) * size * 0.35;
    const lobeY = -Math.cos(angle) * size * 0.4 - size * 0.2;
    
    const p = transformPoint(lobeX, lobeY, rotation, x, y);
    g.ellipse(p.x, p.y, size * 0.12, size * 0.18);
    g.fill({ color, alpha });
  }
}

/**
 * Draw a blade-shaped leaf (chives-style)
 * Tall, thin, grass-like
 */
function drawBladeLeaf(g: Graphics, params: LeafParams): void {
  const { x, y, size, rotation, color, alpha = 1 } = params;
  
  // Tall thin blade as a triangle
  const p1 = transformPoint(0, size * 0.1, rotation, x, y);
  const p2 = transformPoint(-size * 0.06, -size * 0.3, rotation, x, y);
  const p3 = transformPoint(0, -size * 0.9, rotation, x, y);
  const p4 = transformPoint(size * 0.06, -size * 0.3, rotation, x, y);
  
  g.moveTo(p1.x, p1.y);
  g.lineTo(p2.x, p2.y);
  g.lineTo(p3.x, p3.y);
  g.lineTo(p4.x, p4.y);
  g.closePath();
  g.fill({ color, alpha });
}

/**
 * Leaf shape renderers map
 */
export const leafRenderers: Record<LeafShape, (g: Graphics, params: LeafParams) => void> = {
  rounded: drawRoundedLeaf,
  serrated: drawSerratedLeaf,
  feathery: drawFeatheryLeaf,
  fan: drawFanLeaf,
  blade: drawBladeLeaf,
};

/**
 * Draw a leaf with the specified shape
 */
export function drawLeaf(g: Graphics, shape: LeafShape, params: LeafParams): void {
  leafRenderers[shape](g, params);
}
