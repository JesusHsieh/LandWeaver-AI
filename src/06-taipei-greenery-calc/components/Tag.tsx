type Color = 'green' | 'blue' | 'purple' | 'orange';

const CLS: Record<Color, string> = {
  green:  'bg-emerald-100 text-emerald-700 border-emerald-300',
  blue:   'bg-blue-100 text-blue-700 border-blue-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
};

export function Tag({ label, color }: { label: string; color: Color }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${CLS[color]}`}>
      {label}
    </span>
  );
}
