import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { PressableScale } from './PressableScale';
import { colors, radius, spacing, typography } from '../theme';
import { triggerHaptic } from '../utils/haptics';

export interface ConfirmSheetButton {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'destructive' | 'outline' | 'ghost';
  loading?: boolean;
}

export interface ConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons: ConfirmSheetButton[];
}

export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  visible,
  onClose,
  title,
  message,
  buttons,
}) => {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handlePress = async (btn: ConfirmSheetButton, index: number) => {
    if (loadingIndex !== null) return;
    triggerHaptic('medium');

    try {
      setLoadingIndex(index);
      await btn.onPress();
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
        <View style={styles.buttonCol}>
          {buttons.map((btn, index) => {
            const isLoading = btn.loading || loadingIndex === index;
            const isDestructive = btn.variant === 'destructive';

            if (isDestructive) {
              return (
                <PressableScale
                  key={index}
                  onPress={() => handlePress(btn, index)}
                  disabled={loadingIndex !== null}
                  style={[
                    styles.destructiveButton,
                    loadingIndex !== null && loadingIndex !== index && { opacity: 0.5 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={btn.label}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.destructiveButtonText}>{btn.label}</Text>
                  )}
                </PressableScale>
              );
            }

            return (
              <Button
                key={index}
                label={btn.label}
                variant={
                  btn.variant === 'outline'
                    ? 'outline'
                    : btn.variant === 'ghost'
                    ? 'ghost'
                    : 'primary'
                }
                onPress={() => handlePress(btn, index)}
                disabled={loadingIndex !== null}
                fullWidth
                style={styles.actionBtn}
              />
            );
          })}
        </View>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  message: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  buttonCol: {
    gap: spacing.sm,
  },
  actionBtn: {
    marginVertical: 0,
  },
  destructiveButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.buttons,
    backgroundColor: '#BE123C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveButtonText: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
