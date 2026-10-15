import { initials } from '../lib/format';
import type { PersonaProfile } from '../data/seed/personas';

export function Avatar({ persona, size = 44 }: { persona: PersonaProfile; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-sans font-extrabold"
      style={{ width: size, height: size, background: persona.avatar.bg, color: persona.avatar.fg, fontSize: size * 0.4 }}
    >
      {initials(persona.name)}
    </span>
  );
}
