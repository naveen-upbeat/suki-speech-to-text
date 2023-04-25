import { environment as ProdEnvironments } from '../environments/environment.prod';
import { environment as LocalEnrionments } from '../environments/environment';

export const ENV_VALUES = {
  production: 'production',
  development: 'development',
};
export const LOCAL_HOST = 'localhost';

export function isProductionEnv() {
  const hasNodeEnv = process.env.NODE_ENV ?? false;
  return (
    hasNodeEnv &&
    hasNodeEnv.toLowerCase() === ENV_VALUES.production.toLowerCase()
  );
}

function getEnvironmentConfig() {
  let currentEnvironments = LocalEnrionments;
  if (isProductionEnv()) {
    currentEnvironments = ProdEnvironments;
  }
  return currentEnvironments;
}

function mergeEnvironmentConfig(currentEnvironments: any) {
  const updatedEnvironmentConfig = { ...currentEnvironments };

  if (typeof process.env['NX_DEBUG_ENABLED'] !== 'undefined') {
    updatedEnvironmentConfig.isDebugEnabled = process.env[
      'NX_DEBUG_ENABLED'
    ] as unknown as boolean;
  }

  return updatedEnvironmentConfig;
}

function resolveCurrentEnvironments() {
  const currentEnvironments = getEnvironmentConfig();
  return mergeEnvironmentConfig(currentEnvironments);
}

function evaluateHostBasedOnEnvironment() {
  const explicitHostFromEnv = process.env.HOST;
  const explicitHostFromFlyHostEnv = process.env['FLY_HOST'];
  const currentHostFromWindowLocation = window.location.hostname;
  const leastAssumption = LOCAL_HOST;

  return (
    explicitHostFromEnv ??
    (isProductionEnv()
      ? explicitHostFromFlyHostEnv ?? currentHostFromWindowLocation
      : leastAssumption)
  );
}

export { resolveCurrentEnvironments, evaluateHostBasedOnEnvironment };
