import { LocalRepository } from './localRepository';
import { RoutingRepository } from './routing';

// A short artificial delay in development only, so loading states can be seen and checked.
// Production builds have none.
const latency = import.meta.env.DEV ? 140 : 0;

/** The fictional people, in this browser. */
export const personaRepository = new LocalRepository(window.localStorage, latency);
/** The person's own profile on this device, in its own namespace. */
export const deviceProfileRepository = new LocalRepository(window.localStorage, latency, 'tengo.profile.v1');

/** The single place that picks the data implementation. UI code only ever uses this. */
export const repository = new RoutingRepository(personaRepository, deviceProfileRepository);

export * from './repository';
