import type { PropsWithChildren } from 'react';
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';

function ThrowOnRender({
  shouldThrow,
}: PropsWithChildren<{ shouldThrow: boolean }>) {
  if (shouldThrow) {
    throw new Error('Boundary exploded');
  }

  return <Text>Safe content</Text>;
}

describe('AppErrorBoundary', () => {
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when there is no render failure', () => {
    const screen = render(
      <AppErrorBoundary>
        <ThrowOnRender shouldThrow={false} />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Safe content')).toBeOnTheScreen();
  });

  it('renders a fallback UI when a child throws', () => {
    const screen = render(
      <AppErrorBoundary>
        <ThrowOnRender shouldThrow />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.getByText('Boundary exploded')).toBeOnTheScreen();
  });
});
