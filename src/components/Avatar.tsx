import { initials } from '../lib/format';
import type { PersonaProfile } from '../data/seed/personas';

const TONES: Record<PersonaProfile['avatar'], string> = {
  accent: 'bg-accent-soft text-ink border-accent/30',
  neutral: 'bg-surface-3 text-ink border-line-strong',
  inverse: 'bg-ink text-bg border-transparent',
};

export function Avatar({ persona, size = 44 }: { persona: PersonaProfile; size?: number }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full border font-heading font-bold tracking-tight ${TONES[persona.avatar]}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(persona.name)}
    </span>
  );
}
