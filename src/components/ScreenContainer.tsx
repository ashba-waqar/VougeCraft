import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useLayout } from '../theme/layout';
import { useTheme } from '../theme/theme';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  hasTabBar?: boolean;
  showsVerticalScrollIndicator?: boolean;
  edges?: ('top' | 'bottom')[];
}

const TAB_BAR_HEIGHT = 56;

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scroll = false,
  keyboardAvoiding = false,
  style,
  contentContainerStyle,
  hasTabBar = true,
  showsVerticalScrollIndicator = false,
  edges = ['top'],
}) => {
  const { insets, pagePadding, contentMaxWidth } = useLayout();
  const colors = useTheme();

  const includeTop = edges.includes('top');
  const includeBottom = edges.includes('bottom');

  const bottomPadding = hasTabBar
    ? TAB_BAR_HEIGHT + insets.bottom + 24
    : (includeBottom ? insets.bottom : 0) + 24;

  const content = (
    <View
      style={[
        styles.innerColumn,
        {
          maxWidth: contentMaxWidth,
          paddingHorizontal: pagePadding,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.paper,
    paddingTop: includeTop ? insets.top : 0,
  };

  let body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, { paddingBottom: bottomPadding }]}>
      {content}
    </View>
  );

  if (keyboardAvoiding) {
    body = (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {body}
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
  },
  staticContent: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  innerColumn: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
});
