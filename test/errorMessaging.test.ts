import { logWarning } from "../src/errorMessaging";
import { ErrorHandler, ErrorMessage } from "../src/types";

describe("errorMessaging", () => {
  describe("logWarning", () => {
    it("first accepts options for how to handle the messaging.", () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(logWarning((): void => {}, true)).toBeInstanceOf(Function);
    });
    it("has optional arguments", () => {
      expect(logWarning()).toBeInstanceOf(Function);
    });
    it("should log a warning", () => {
      const spy = jest.spyOn(console, "warn");
      logWarning(undefined, false)("code", "message");
      expect(spy).toHaveBeenCalledWith("[code] message");
    });
    it("should not log a warning if supressed", () => {
      const spy = jest.spyOn(console, "warn");
      logWarning(undefined, true)("no code", "no message");
      expect(spy).not.toHaveBeenCalledWith("[no code] no message");
    });
    it("should call the callback if provided", () => {
      const handler: ErrorHandler = (e: ErrorMessage): void => {
        expect(e.code).toBe("code");
        expect(e.message).toBe("message");
        expect(e.type).toBe("warning");
      };
      logWarning(handler)("code", "message");
    });
  });
});
