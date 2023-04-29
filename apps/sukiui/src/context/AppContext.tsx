import React from 'react';
import { ConsoleLogger } from '../util/loggerUtil';

export type ContextDataProps = {
  appDebugLogger: ConsoleLogger | null;
};

const contextData: ContextDataProps = {
  appDebugLogger: null,
};

export default React.createContext(contextData);
