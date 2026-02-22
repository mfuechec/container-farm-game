/**
 * GrowCanvas - PixiJS-based grow area renderer
 * 
 * Renders the table, pots, plants, and grow light using PixiJS.
 * React handles the UI chrome, PixiJS handles the visuals.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import { useGameStore } from '../../store/gameStore';
import { getPlantType, PlantInstance } from './types';
import { PotInstance, slotHasLight } from './equipment';

interface GrowCanvasProps {
  width: number;
  height: number;
  onSlotClick: (slotIndex: number) => void;
}

// Colors
const COLORS = {
  wood: 0x8D6E63,
  woodDark: 0x5D4037,
  woodLight: 0xA1887F,
  terracotta: 0xCD7F32,
  terracottaDark: 0x8B4513,
  terracottaLight: 0xD4A574,
  soil: 0x3E2723,
  lightGlow: 0xFFD54F,
  lightOff: 0x5D4037,
  lightFixture: 0x455A64,
  leafGreen: 0x4CAF50,
  stemGreen: 0x2E7D32,
  highlight: 0x81C784,
};

export function GrowCanvas({ width, height, onSlotClick }: GrowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const sceneRef = useRef<{
    light: Graphics;
    lightGlow: Graphics;
    table: Graphics;
    potsContainer: Container;
    pots: Map<number, Container>;
  } | null>(null);

  // Get store state
  const plantHobby = useGameStore(s => s.plantHobby);
  const { table, light, pots, plants } = plantHobby;

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new Application();
    
    const init = async () => {
      await app.init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (canvasRef.current) {
        canvasRef.current.appendChild(app.canvas);
      }

      appRef.current = app;

      // Create scene structure
      const scene = createScene(app, width, height, table.potSlots, light.coverage, onSlotClick);
      sceneRef.current = scene;

      // Initial render of pots (useEffect won't trigger since state hasn't changed)
      updatePots(scene.potsContainer, scene.pots, table.potSlots, pots, plants, light.coverage, width, height, onSlotClick);
    };

    init();

    return () => {
      app.destroy(true, { children: true });
      appRef.current = null;
      sceneRef.current = null;
    };
  }, [width, height]);

  // Update scene when state changes
  useEffect(() => {
    if (!sceneRef.current || !appRef.current) return;

    const scene = sceneRef.current;
    
    // Update light glow based on coverage
    updateLight(scene.light, scene.lightGlow, light.coverage, table.potSlots, width);
    
    // Update pots and plants
    updatePots(scene.potsContainer, scene.pots, table.potSlots, pots, plants, light.coverage, width, height, onSlotClick);
    
  }, [table, light, pots, plants, width, height, onSlotClick]);

  return (
    <div 
      ref={canvasRef} 
      style={{ 
        width, 
        height, 
        margin: '0 auto',
        borderRadius: 8,
        overflow: 'hidden',
      }} 
    />
  );
}

function createScene(
  app: Application,
  width: number,
  height: number,
  potSlots: number,
  lightCoverage: number,
  onSlotClick: (index: number) => void
) {
  // Light glow (background effect)
  const lightGlow = new Graphics();
  app.stage.addChild(lightGlow);

  // Light fixture
  const light = new Graphics();
  app.stage.addChild(light);

  // Table
  const table = new Graphics();
  drawTable(table, width, height);
  app.stage.addChild(table);

  // Pots container
  const potsContainer = new Container();
  app.stage.addChild(potsContainer);

  // Initialize pots map
  const pots = new Map<number, Container>();

  // Draw initial light
  updateLight(light, lightGlow, lightCoverage, potSlots, width);

  return { light, lightGlow, table, potsContainer, pots };
}

function drawTable(g: Graphics, width: number, height: number) {
  const tableY = height - 35;
  const tableHeight = 35;

  // Table top
  g.rect(0, tableY, width, 20);
  g.fill(COLORS.wood);

  // Wood grain lines
  for (let i = 0; i < 3; i++) {
    g.rect(0, tableY + 4 + i * 6, width, 1);
    g.fill({ color: COLORS.woodLight, alpha: 0.3 });
  }

  // Table edge
  g.rect(0, tableY + 18, width, 8);
  g.fill(COLORS.woodDark);

  // Table legs
  g.rect(20, tableY + 20, 12, 15);
  g.fill(COLORS.wood);
  g.rect(width - 32, tableY + 20, 12, 15);
  g.fill(COLORS.wood);
}

function updateLight(
  lightG: Graphics,
  glowG: Graphics,
  coverage: number,
  totalSlots: number,
  width: number
) {
  const intensity = coverage / Math.max(totalSlots, 1);
  const lightY = 10;
  const lightWidth = width * 0.7;
  const lightX = (width - lightWidth) / 2;

  // Clear previous
  lightG.clear();
  glowG.clear();

  // Glow effect
  if (intensity > 0.1) {
    const glowHeight = 120;
    glowG.ellipse(width / 2, lightY + 30 + glowHeight / 2, lightWidth * 0.4, glowHeight / 2);
    glowG.fill({ color: COLORS.lightGlow, alpha: intensity * 0.15 });
  }

  // Mounting bar
  lightG.roundRect(lightX, lightY, lightWidth, 6, 2);
  lightG.fill(0x37474F);

  // Cables
  lightG.rect(lightX + lightWidth * 0.15, lightY + 6, 2, 8);
  lightG.fill(0x212121);
  lightG.rect(lightX + lightWidth * 0.85 - 2, lightY + 6, 2, 8);
  lightG.fill(0x212121);

  // Fixture housing
  lightG.roundRect(lightX, lightY + 14, lightWidth, 14, 3);
  lightG.fill(COLORS.lightFixture);
  lightG.stroke({ color: 0x37474F, width: 1 });

  // Light panels
  const panelCount = Math.min(5, Math.ceil(coverage * 1.5));
  const panelWidth = lightWidth * 0.12;
  const panelGap = (lightWidth - panelCount * panelWidth) / (panelCount + 1);
  
  for (let i = 0; i < panelCount; i++) {
    const px = lightX + panelGap + i * (panelWidth + panelGap);
    lightG.roundRect(px, lightY + 18, panelWidth, 6, 1);
    lightG.fill(intensity > 0.2 ? COLORS.lightGlow : COLORS.lightOff);
  }

  // Power indicator
  lightG.circle(lightX + lightWidth - 8, lightY + 21, 3);
  lightG.fill(intensity > 0.1 ? 0x4CAF50 : 0x757575);
}

function updatePots(
  container: Container,
  potsMap: Map<number, Container>,
  totalSlots: number,
  potInstances: PotInstance[],
  plants: Record<string, PlantInstance>,
  lightCoverage: number,
  width: number,
  height: number,
  onSlotClick: (index: number) => void
) {
  const potWidth = 60;
  const potHeight = 50;
  const spacing = 10;
  const totalWidth = totalSlots * potWidth + (totalSlots - 1) * spacing;
  const startX = (width - totalWidth) / 2;
  const potY = height - 35 - potHeight - 5;

  // Update or create pot containers for each slot
  for (let i = 0; i < totalSlots; i++) {
    let potContainer = potsMap.get(i);
    
    if (!potContainer) {
      potContainer = new Container();
      potContainer.eventMode = 'static';
      potContainer.cursor = 'pointer';
      const slotIndex = i;
      potContainer.on('pointerdown', () => onSlotClick(slotIndex));
      container.addChild(potContainer);
      potsMap.set(i, potContainer);
    }

    // Position
    potContainer.x = startX + i * (potWidth + spacing);
    potContainer.y = potY;

    // Clear and redraw
    potContainer.removeChildren();

    const potInstance = potInstances.find(p => p.slot === i);
    const hasLight = slotHasLight(i, lightCoverage);
    const plant = potInstance?.plant ? plants[potInstance.plant] : null;

    drawPot(potContainer, potWidth, potHeight, potInstance, plant, hasLight, i);
  }

  // Remove extra slots if table was downgraded
  for (const [slotIndex, potContainer] of potsMap) {
    if (slotIndex >= totalSlots) {
      container.removeChild(potContainer);
      potsMap.delete(slotIndex);
    }
  }
}

function drawPot(
  container: Container,
  width: number,
  height: number,
  potInstance: PotInstance | undefined,
  plant: PlantInstance | null,
  hasLight: boolean,
  slotIndex: number
) {
  const g = new Graphics();
  container.addChild(g);

  if (!potInstance) {
    // Empty slot - dashed outline
    g.roundRect(5, 10, width - 10, height - 15, 4);
    g.stroke({ color: 0x9E9E9E, width: 2 });
    
    // Price label
    const style = new TextStyle({ fontSize: 11, fill: 0x9E9E9E });
    const text = new Text({ text: '$5', style });
    text.anchor.set(0.5);
    text.x = width / 2;
    text.y = height / 2;
    container.addChild(text);
    return;
  }

  // Draw plant first (behind pot rim)
  if (plant) {
    drawPlant(container, width, height, plant);
  }

  // Pot body
  g.moveTo(width * 0.18, 8);
  g.lineTo(width * 0.12, height - 8);
  g.quadraticCurveTo(width * 0.12, height, width * 0.22, height);
  g.lineTo(width * 0.78, height);
  g.quadraticCurveTo(width * 0.88, height, width * 0.88, height - 8);
  g.lineTo(width * 0.82, 8);
  g.closePath();
  g.fill(COLORS.terracotta);
  g.stroke({ color: COLORS.terracottaDark, width: 1 });

  // Pot rim
  g.ellipse(width / 2, 8, width * 0.38, 5);
  g.fill(COLORS.terracotta);
  g.stroke({ color: COLORS.terracottaDark, width: 1 });

  // Soil
  g.ellipse(width / 2, 10, width * 0.32, 4);
  g.fill(COLORS.soil);

  // Pot highlight
  g.moveTo(width * 0.22, 14);
  g.quadraticCurveTo(width * 0.18, height / 2, width * 0.2, height - 10);
  g.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.15 });

  // Light indicator
  if (hasLight) {
    g.circle(width - 8, 4, 5);
    g.fill({ color: COLORS.lightGlow, alpha: 0.9 });
  }

  // Status text
  const style = new TextStyle({ fontSize: 10, fill: 0x666666, fontFamily: 'monospace' });
  let statusText = '';
  
  if (!plant) {
    statusText = 'empty';
  } else if (plant.stage === 'harvestable') {
    style.fill = 0x4CAF50;
    style.fontWeight = 'bold';
    statusText = 'harvest!';
  } else {
    statusText = `${Math.round(plant.growthProgress * 100)}%`;
  }

  const text = new Text({ text: statusText, style });
  text.anchor.set(0.5, 0);
  text.x = width / 2;
  text.y = height + 2;
  container.addChild(text);

  // Harvest pulse animation for ready plants
  if (plant?.stage === 'harvestable') {
    const pulse = new Graphics();
    pulse.circle(width / 2, height / 2, 25);
    pulse.stroke({ color: 0x4CAF50, width: 2, alpha: 0.6 });
    container.addChildAt(pulse, 0);
    // Note: For real animation, we'd use app.ticker
  }
}

function drawPlant(container: Container, potWidth: number, potHeight: number, plant: PlantInstance) {
  const g = new Graphics();
  container.addChildAt(g, 0);

  const plantType = getPlantType(plant.typeId);
  if (!plantType) return;

  const growth = plant.growthProgress;
  const stage = plant.stage;

  // Color variations by plant type
  const hueShift = plantType.id === 'basil' ? 0 : plantType.id === 'mint' ? -15 : 10;
  const leafColor = COLORS.leafGreen;
  const stemColor = COLORS.stemGreen;

  const stemHeight = 10 + growth * 35;
  const stemX = potWidth / 2;
  const stemBase = 12; // Just above pot rim

  if (stage === 'seed') {
    // Tiny sprout
    g.moveTo(stemX, stemBase);
    g.lineTo(stemX, stemBase - 8);
    g.stroke({ color: stemColor, width: 2, cap: 'round' });
    
    g.ellipse(stemX, stemBase - 10, 5, 3);
    g.fill({ color: leafColor, alpha: 0.7 });
  } else {
    // Stem
    g.moveTo(stemX, stemBase);
    g.lineTo(stemX, stemBase - stemHeight);
    g.stroke({ color: stemColor, width: 2 + growth * 2, cap: 'round' });

    // Leaves
    const leafCount = Math.floor(2 + growth * 5);
    const leafSize = 6 + growth * 10;

    for (let i = 0; i < leafCount; i++) {
      const tier = Math.floor(i / 2);
      const y = stemBase - (tier + 1) * (stemHeight / (leafCount / 2 + 1));
      const isLeft = i % 2 === 0;
      const xOffset = leafSize * 0.5 * (isLeft ? -1 : 1);
      const rotation = isLeft ? -0.6 : 0.6;

      g.ellipse(stemX + xOffset, y, leafSize * 0.6, leafSize * 0.35);
      g.fill(leafColor);
    }

    // Flower/bud for harvestable
    if (stage === 'harvestable') {
      g.circle(stemX, stemBase - stemHeight - 5, 6);
      g.fill(COLORS.highlight);
    }
  }
}
