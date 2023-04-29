class ConsoleLogger {
  isDebugEnabled: boolean;
  constructor(isDebugEnabled: boolean) {
    this.isDebugEnabled = isDebugEnabled;
  }

  log(...varArgs: any) {
    if (this.isDebugEnabled) {
      console.log(...varArgs);
    } else {
      return;
    }
  }

  error(...varArgs: any) {
    if (this.isDebugEnabled) {
      console.error(...varArgs);
    } else {
      return;
    }
  }

  info(...varArgs: any) {
    if (this.isDebugEnabled) {
      console.info(...varArgs);
    } else {
      return;
    }
  }
}

export { ConsoleLogger };
