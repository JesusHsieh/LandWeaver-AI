import { useState } from 'react';

export function useGroundCoverState() {
  // ── 第7條：法定空地 — 生態複層 ────────────────────────────────────────────
  const [ecoLayerArea, setEcoLayerArea] = useState('');

  // ── 第7條：法定空地 — 灌木、其他植栽 ────────────────────────────────────
  const [groundShrub, setGroundShrub] = useState('');
  const [groundGrass, setGroundGrass] = useState('');
  const [groundDitch, setGroundDitch] = useState('');
  const [groundBrick, setGroundBrick] = useState('');
  const [groundPond,  setGroundPond]  = useState('');
  const [groundWallW, setGroundWallW] = useState('');
  const [groundWallF, setGroundWallF] = useState('');

  // ── 第8條：立體綠化 — 灌木、其他 ─────────────────────────────────────────
  const [vertShrub, setVertShrub] = useState('');
  const [vertOther, setVertOther] = useState('');

  return {
    ecoLayerArea, setEcoLayerArea,
    groundShrub, setGroundShrub,
    groundGrass, setGroundGrass,
    groundDitch, setGroundDitch,
    groundBrick, setGroundBrick,
    groundPond,  setGroundPond,
    groundWallW, setGroundWallW,
    groundWallF, setGroundWallF,
    vertShrub, setVertShrub,
    vertOther, setVertOther,
  };
}
