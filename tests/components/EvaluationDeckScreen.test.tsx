import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { DEFAULT_SETTINGS } from '@/constants/app';
import { EvaluationDeckScreen } from '@/screens/EvaluationDeckScreen';
import { useAppStore } from '@/store/useAppStore';

import { makeContact, makeSession } from '../factories/entities';
import { resetAppTestState } from '../helpers/resetStore';

jest.mock('react-native-gesture-handler', () => {
  const MockReact = require('react');
  const { View } = require('react-native');

  const createGesture = () => ({
    enabled() {
      return this;
    },
    minDistance() {
      return this;
    },
    onEnd() {
      return this;
    },
    onFinalize() {
      return this;
    },
    onStart() {
      return this;
    },
    onUpdate() {
      return this;
    },
  });

  return {
    Gesture: {
      Exclusive: (...gestures: unknown[]) => gestures[0],
      Pan: createGesture,
      Tap: createGesture,
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) =>
      MockReact.createElement(View, null, children),
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
      MockReact.createElement(View, null, children),
  };
});

jest.mock('@/hooks/useHotReloadContactAvatars', () => ({
  useHotReloadContactAvatars: jest.fn(),
}));

jest.mock('@/components/EvaluationDotMatrix', () => ({
  EvaluationDotMatrix: ({
    interactionDisabled,
    onColumnSelect,
  }: {
    interactionDisabled?: boolean;
    onColumnSelect: (colIndex: number, rowIndex: number) => void;
  }) => {
    const { Pressable, Text, View } = require('react-native');

    return (
      <View testID="evaluation-dot-matrix">
        <Text>Evaluation Dot Matrix</Text>
        {Array.from({ length: 5 }).map((_, index) => (
          <Pressable
            key={index}
            accessibilityLabel={`Matrix column ${index}`}
            accessibilityRole="button"
            disabled={interactionDisabled}
            onPress={() => onColumnSelect(index, index)}
          >
            <Text>{`Matrix column ${index}`}</Text>
          </Pressable>
        ))}
      </View>
    );
  },
}));

function createNavigation() {
  return {
    navigate: jest.fn(),
    replace: jest.fn(),
  };
}

function seedDeck(mode: 'quick' | 'deep', overrides?: Record<string, unknown>) {
  useAppStore.setState({
    ...useAppStore.getState(),
    settings: DEFAULT_SETTINGS,
    contacts: [makeContact()],
    session: makeSession({
      id: `session-${mode}`,
      mode,
      importedCount: 1,
      readyCount: 1,
    }),
    selectedContactId: 'contact-1',
    evaluations: {},
    reviewQueueIds: [],
    ...overrides,
  });
}

describe('EvaluationDeckScreen', () => {
  beforeEach(async () => {
    await resetAppTestState();
    jest.clearAllMocks();
  });

  it('keeps swipe controls in quick mode', () => {
    seedDeck('quick');
    const navigation = createNavigation();
    const screen = render(
      <EvaluationDeckScreen
        navigation={navigation as never}
        route={undefined as never}
      />,
    );

    expect(screen.getByRole('button', { name: 'Like' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeOnTheScreen();
    expect(screen.queryByTestId('evaluation-dot-matrix')).toBeNull();
  });

  it('renders the matrix in deep mode and commits after all columns are selected', async () => {
    const commitMatrixEvaluation = jest.fn().mockResolvedValue(undefined);
    seedDeck('deep', {
      commitMatrixEvaluation,
    });
    const navigation = createNavigation();
    const screen = render(
      <EvaluationDeckScreen
        navigation={navigation as never}
        route={undefined as never}
      />,
    );

    expect(screen.getByTestId('evaluation-dot-matrix')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Like' })).toBeNull();

    for (let index = 0; index < 5; index += 1) {
      fireEvent.press(
        screen.getByRole('button', { name: `Matrix column ${index}` }),
      );
    }

    await waitFor(() => {
      expect(commitMatrixEvaluation).toHaveBeenCalledTimes(1);
      expect(commitMatrixEvaluation).toHaveBeenCalledWith({
        selections: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 },
        columnCount: 5,
        rowCount: 9,
      });
    });
  });
});
