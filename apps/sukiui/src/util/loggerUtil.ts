class ConsoleLogger {
  static isDebugEnabled: boolean;
  constructor(isDebugEnabled: boolean) {
    ConsoleLogger.isDebugEnabled = isDebugEnabled;
  }

  log(...varArgs: any) {
    if (ConsoleLogger.isDebugEnabled) {
      console.log(...varArgs);
    } else {
      return;
    }
  }

  error(...varArgs: any) {
    if (ConsoleLogger.isDebugEnabled) {
      console.error(...varArgs);
    } else {
      return;
    }
  }

  info(...varArgs: any) {
    if (ConsoleLogger.isDebugEnabled) {
      console.info(...varArgs);
    } else {
      return;
    }
  }
}

export { ConsoleLogger };
