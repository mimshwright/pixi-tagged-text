import { ErrorHandler, ErrorMessage, ErrorMessageType } from "./types";

const log =
  (type: ErrorMessageType) =>
  (handler?: ErrorHandler, supressConsole = false) =>
  (code: string, message: string): void => {
    if (supressConsole !== true) {
      const method = type === "warning" ? console.warn : console.error;
      method(`[${code}] ${message}`);
    }
    if (handler) {
      handler({ code, message, type } as ErrorMessage);
    }
  };

export const logWarning = log("warning");
