// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

globalThis.console.log = noop;
globalThis.console.warn = noop;
globalThis.console.error = noop;
