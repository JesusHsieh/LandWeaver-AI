import { MODULES, PHASES } from '../data/modules';
import { ModuleCard } from './ModuleCard';

interface Props {
  phase: 1 | 2 | 3;
}

export function PhaseSection({ phase }: Props) {
  const phaseData = PHASES.find(p => p.id === phase)!;
  const cards = MODULES.filter(m => m.phase === phase);

  /* Phase 01 — glitch-hover wrapper, biosphere-green divider */
  if (phase === 1) {
    return (
      <section className="space-y-lg glitch-hover">
        <div className="flex items-center gap-6">
          <span className="font-display-phase text-primary-fixed-dim border border-primary-fixed-dim/40 px-4 py-1 bg-surface-container-lowest/50 backdrop-blur-sm">
            {phaseData.label}
          </span>
          <h2 className="font-label-caps text-secondary tracking-[0.3em] glitch-text">{phaseData.subtitle}</h2>
          <div className="h-[1px] flex-grow bg-gradient-to-r from-biosphere-green/50 to-transparent" />
        </div>
        {cards.map(m => (
          <ModuleCard key={m.number} module={m} />
        ))}
      </section>
    );
  }

  /* Phase 02 — no glitch-hover on section, data-blue divider, 2-col grid */
  if (phase === 2) {
    return (
      <section className="space-y-lg">
        <div className="flex items-center gap-6">
          <span className="font-display-phase text-primary-fixed-dim border border-primary-fixed-dim/40 px-4 py-1 bg-surface-container-lowest/50 backdrop-blur-sm">
            {phaseData.label}
          </span>
          <h2 className="font-label-caps text-secondary tracking-[0.3em]">{phaseData.subtitle}</h2>
          <div className="h-[1px] flex-grow bg-gradient-to-r from-data-blue/50 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {cards.map(m => (
            <ModuleCard key={m.number} module={m} />
          ))}
        </div>
      </section>
    );
  }

  /* Phase 03 — teal/muted divider */
  return (
    <section className="space-y-lg">
      <div className="flex items-center gap-6">
        <span className="font-display-phase text-primary-fixed-dim border border-primary-fixed-dim/40 px-4 py-1 bg-surface-container-lowest/50 backdrop-blur-sm">
          {phaseData.label}
        </span>
        <h2 className="font-label-caps text-secondary tracking-[0.3em]">{phaseData.subtitle}</h2>
        <div className="h-[1px] flex-grow bg-gradient-to-r from-[#2e6767]/50 to-transparent" />
      </div>
      {cards.map(m => (
        <ModuleCard key={m.number} module={m} />
      ))}
    </section>
  );
}
