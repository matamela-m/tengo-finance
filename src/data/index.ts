import { LocalRepository } from './localRepository';
import type { TengoRepository } from './repository';

/** The single place that picks the data implementation. Swap for a hosted one later. */
// A short artificial delay in development only, so loading states can be seen and checked.
// Production builds have none.
export const repository: TengoRepository = new LocalRepository(window.localStorage, import.meta.env.DEV ? 140 : 0);

export * from './repository';
