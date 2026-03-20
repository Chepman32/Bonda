module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/Pods/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/components/AppErrorBoundary.tsx',
    'src/components/PrimaryButton.tsx',
    'src/services/clusteringService.ts',
    'src/services/contactImportService.ts',
    'src/services/insightService.ts',
    'src/services/scoringService.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/clusteringService.ts': {
      branches: 60,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/services/contactImportService.ts': {
      branches: 65,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/services/insightService.ts': {
      branches: 55,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/scoringService.ts': {
      branches: 60,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
