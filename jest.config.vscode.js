module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFiles: [
    "<rootDir>/test/mockConsole.ts",
    "<rootDir>/test/mockContext.ts",
  ],
};
