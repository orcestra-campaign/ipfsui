export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info:  (message: string, ...args: any[]) => void;
  warn:  (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

export class NullLogger implements Logger {
  debug(_message: string, ..._args: any[]) { }
  info(_message: string, ..._args: any[])  { }
  warn(_message: string, ..._args: any[])  { }
  error(_message: string, ..._args: any[]) { }
}

export class BrowserLogger implements Logger {
  debug(message: string, ...args: any[]) { console.debug(message, ...args); }
  info(message: string, ...args: any[])  { console.info(message, ...args); }
  warn(message: string, ...args: any[])  { console.warn(message, ...args); }
  error(message: string, ...args: any[]) { console.error(message, ...args); }
}

function defaultLogger(): Logger {
  return new BrowserLogger();
}

let logger: Logger | undefined;

export function setLogger(l: Logger) {
  logger = l;
}

export function getLogger(): Logger {
  if (logger === undefined) logger = defaultLogger();
  return logger;
}
