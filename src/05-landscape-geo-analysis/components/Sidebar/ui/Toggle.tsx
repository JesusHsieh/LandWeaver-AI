import React from 'react';

export const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`gis-toggle ${on ? 'on' : ''}`}
    aria-checked={on}
    role="switch"
  />
);
