import { useState } from 'react';

export function useRooftopState() {
  // ── 第9條：屋頂平臺 ───────────────────────────────────────────────────────
  const [roofTotal,    setRoofTotal]    = useState('');
  const [roofNonGreen, setRoofNonGreen] = useState('');
  const [roofHsArea,   setRoofHsArea]   = useState('');
  const [roofLsArea,   setRoofLsArea]   = useState('');
  const [roofPalmArea, setRoofPalmArea] = useState('');
  const [roofShrub,    setRoofShrub]    = useState('');
  const [roofOther,    setRoofOther]    = useState('');

  // ── 第12條：透水鋪面 ──────────────────────────────────────────────────────
  const [pavTotal, setPavTotal] = useState('');
  const [pavPerm,  setPavPerm]  = useState('');

  return {
    roofTotal,    setRoofTotal,
    roofNonGreen, setRoofNonGreen,
    roofHsArea,   setRoofHsArea,
    roofLsArea,   setRoofLsArea,
    roofPalmArea, setRoofPalmArea,
    roofShrub,    setRoofShrub,
    roofOther,    setRoofOther,
    pavTotal, setPavTotal,
    pavPerm,  setPavPerm,
  };
}
