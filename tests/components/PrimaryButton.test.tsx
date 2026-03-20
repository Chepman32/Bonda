import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { PrimaryButton } from '@/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders the label and fires the press handler', () => {
    const onPress = jest.fn();
    const screen = render(<PrimaryButton label="Continue" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Continue')).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports the secondary variant and respects the disabled state', () => {
    const onPress = jest.fn();
    const screen = render(
      <PrimaryButton
        disabled
        label="Later"
        onPress={onPress}
        variant="secondary"
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Later' }));

    expect(screen.getByText('Later')).toBeOnTheScreen();
    expect(onPress).not.toHaveBeenCalled();
  });
});
