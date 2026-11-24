import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';
import { PaperGrain } from './PaperGrain';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.warn('ErrorBoundary captured atelier error:', error.message);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <PaperGrain />
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <AlertCircle size={32} color="#7F0020" strokeWidth={1.75} />
            </View>

            <Text style={styles.title}>Atelier Encountered an Issue</Text>
            <Text style={styles.subtitle}>
              An unexpected glitch occurred in the studio workspace. Your drawings and session remain safely preserved.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.debugBox}>
                <Text style={styles.debugText}>
                  {this.state.error.message || String(this.state.error)}
                </Text>
              </ScrollView>
            )}

            <View style={styles.actionRow}>
              <Button
                label="Try again"
                variant="primary"
                size="large"
                onPress={this.handleReset}
                icon={<RefreshCw size={16} color="#FFFFFF" strokeWidth={2} />}
                style={styles.retryBtn}
              />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(127, 0, 32, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.display.fontFamily,
    fontSize: 24,
    color: '#3A0A16',
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  debugBox: {
    maxHeight: 120,
    width: '100%',
    backgroundColor: '#EDE8DF',
    borderRadius: radius.buttons,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  debugText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#7F0020',
  },
  actionRow: {
    width: '100%',
    maxWidth: 240,
  },
  retryBtn: {
    backgroundColor: '#7F0020',
  },
});
