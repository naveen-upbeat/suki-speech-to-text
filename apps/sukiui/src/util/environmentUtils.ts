import { environment as ProdEnvironments } from '../environments/environment.prod';
import { environment as LocalEnrionments } from '../environments/environment';

function resolveCurrentEnvironments() {
  let currentEnvironments = LocalEnrionments;
  if (process.env['NODE_ENV'] === 'production') {
    currentEnvironments = ProdEnvironments;
  }

  if (typeof process.env['NX_DEBUG_ENABLED'] !== 'undefined') {
    currentEnvironments.isDebugEnabled = process.env[
      'NX_DEBUG_ENABLED'
    ] as unknown as boolean;
  }
  return currentEnvironments;
}

export { resolveCurrentEnvironments };
