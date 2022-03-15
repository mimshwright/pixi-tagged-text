module.exports = {
  preset: "ts-jest",
  runner: "@jest-runner/electron",
  testEnvironment: "@jest-runner/electron/environment",
  setupFiles: ["<rootDir>/test/support/mockConsole.ts"],
};
