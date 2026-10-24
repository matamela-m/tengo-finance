import { initials } from '../lib/format';
import type { PersonaProfile } from '../data/seed/personas';

const TONES: Record<PersonaProfile['avatar'], string> = {
  accent: 'bg-accent-soft text-ink border-accent/30',
  neutral: 'bg-surface-3 text-ink border-line-strong',
  inverse: 'bg-ink text-bg border-transparent',
};

/** The person's portrait when there is one, otherwise their initials. Decorative: the name is always beside it. */
export function Avatar({ persona, size = 44 }: { persona: PersonaProfile; size?: number }) {
  if (persona.photo) {
    return (
      <img
        src={persona.photo}
        alt=""
        aria-hidden
        width={size}
        height={size}
        draggable={false}
        className="shrink-0 select-none rounded-full border border-line bg-surface-2 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
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
