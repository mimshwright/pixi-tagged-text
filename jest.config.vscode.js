module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFiles: [
    "<rootDir>/test/support/mockContext.ts",
    "<rootDir>/test/support/mockConsole.ts",
  ],
};
