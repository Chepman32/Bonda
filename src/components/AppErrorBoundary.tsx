import type { PropsWithChildren } from 'react';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AtmosphereBackdrop } from '@/components/AtmosphereBackdrop';
import { GlassCard } from '@/components/GlassCard';
import { useAppTheme } from '@/theme';

interface AppErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class AppErrorBoundary extends React.Component<
  PropsWithChildren,
  AppErrorBoundaryState
> {
  public constructor(props: PropsWithChildren) {
    super(props);
    this.state = {
      hasError: false,
      message: undefined,
    };
  }

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  public override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <ErrorFallback message={this.state.message} />;
  }
}

function ErrorFallback({ message }: { message?: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <AtmosphereBackdrop />
      <GlassCard style={styles.card}>
        <Text style={[styles.title, { color: theme.text }]}>
          Something went wrong
        </Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          {message ?? 'Bonda hit an unexpected rendering error.'}
        </Text>
        <Pressable onPress={() => {}} style={styles.button}>
          <Text style={[styles.buttonText, { color: theme.text }]}>
            Restart the app to recover.
          </Text>
        </Pressable>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
