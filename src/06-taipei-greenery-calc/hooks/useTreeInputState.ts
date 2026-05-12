import { useState } from 'react';

export function useTreeInputState() {
  // ── 第7條：法定空地 — 高遮蔭喬木（3 覆土深度 × 4 米高徑）─────────────────
  const [hs150L,setHs150L]=useState(''); const [hs150M,setHs150M]=useState('');
  const [hs150S,setHs150S]=useState(''); const [hs150P,setHs150P]=useState('');
  const [hs120L,setHs120L]=useState(''); const [hs120M,setHs120M]=useState('');
  const [hs120S,setHs120S]=useState(''); const [hs120P,setHs120P]=useState('');
  const [hs100L,setHs100L]=useState(''); const [hs100M,setHs100M]=useState('');
  const [hs100S,setHs100S]=useState(''); const [hs100P,setHs100P]=useState('');

  // ── 第7條：法定空地 — 低遮蔭喬木 ─────────────────────────────────────────
  const [ls150L,setLs150L]=useState(''); const [ls150M,setLs150M]=useState('');
  const [ls150S,setLs150S]=useState(''); const [ls150P,setLs150P]=useState('');
  const [ls120L,setLs120L]=useState(''); const [ls120M,setLs120M]=useState('');
  const [ls120S,setLs120S]=useState(''); const [ls120P,setLs120P]=useState('');
  const [ls100L,setLs100L]=useState(''); const [ls100M,setLs100M]=useState('');
  const [ls100S,setLs100S]=useState(''); const [ls100P,setLs100P]=useState('');

  // ── 第7條第2項：臨道路開放空間 ───────────────────────────────────────────
  const [roadsideSpace, setRoadsideSpace] = useState('');
  const [rsL, setRsL] = useState('');
  const [rsM, setRsM] = useState('');
  const [rsS, setRsS] = useState('');

  // ── 第8條：立體綠化 — 喬木 ───────────────────────────────────────────────
  const [vertHsL,setVertHsL]=useState(''); const [vertHsM,setVertHsM]=useState('');
  const [vertHsS,setVertHsS]=useState(''); const [vertHsP,setVertHsP]=useState('');
  const [vertLsL,setVertLsL]=useState(''); const [vertLsM,setVertLsM]=useState('');
  const [vertLsS,setVertLsS]=useState(''); const [vertLsP,setVertLsP]=useState('');

  return {
    hs150L,setHs150L, hs150M,setHs150M, hs150S,setHs150S, hs150P,setHs150P,
    hs120L,setHs120L, hs120M,setHs120M, hs120S,setHs120S, hs120P,setHs120P,
    hs100L,setHs100L, hs100M,setHs100M, hs100S,setHs100S, hs100P,setHs100P,
    ls150L,setLs150L, ls150M,setLs150M, ls150S,setLs150S, ls150P,setLs150P,
    ls120L,setLs120L, ls120M,setLs120M, ls120S,setLs120S, ls120P,setLs120P,
    ls100L,setLs100L, ls100M,setLs100M, ls100S,setLs100S, ls100P,setLs100P,
    roadsideSpace,setRoadsideSpace, rsL,setRsL, rsM,setRsM, rsS,setRsS,
    vertHsL,setVertHsL, vertHsM,setVertHsM, vertHsS,setVertHsS, vertHsP,setVertHsP,
    vertLsL,setVertLsL, vertLsM,setVertLsM, vertLsS,setVertLsS, vertLsP,setVertLsP,
  };
}
