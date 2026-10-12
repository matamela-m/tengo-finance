import { LocalRepository } from './localRepository';
import type { TengoRepository } from './repository';

/** The single place that picks the data implementation. Swap for a hosted one later. */
export const repository: TengoRepository = new LocalRepository(window.localStorage, 140);

export * from './repository';
