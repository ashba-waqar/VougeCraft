import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Layers,
  BookOpen,
  RotateCcw,
  Sun,
  Moon,
  PenTool,
  LogOut,
  Edit3,
  Camera,
  Trash2,
  Shield,
  FileText,
  ChevronRight,
  UserPlus,
  LogIn,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme, useThemeStore, radius, spacing, typography } from '../../theme';
import {
  Card,
  Button,
  Chip,
  Sheet,
  ConfirmSheet,
  PressableScale,
  FadeInUp,
  PaperGrain,
} from '../../components';
import { useStudioStore } from '../../store/useStudioStore';
import { useAuth } from '../../auth/AuthProvider';
import { triggerHaptic } from '../../utils/haptics';
import { useProfile } from '../../hooks/useProfile';
import { usePalettes } from '../../hooks/usePalettes';

export const ProfileScreen: React.FC = () => {
  const colors = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [stylusMode, setStylusMode] = useState(true);
  const [gridStyle, setGridStyle] = useState<'Dots' | 'Plain' | 'Lines'>('Dots');

  const { profile, stats, updateProfile, pickAndUploadAvatar } = useProfile();
  const { palettes: savedPalettes } = usePalettes();
  const setOnboardingCompleted = useStudioStore(
    (state) => state.setOnboardingCompleted
  );
  const { user, isAnonymous, signOut, deleteAccount } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('');

  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isGuestSignInConfirmOpen, setIsGuestSignInConfirmOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE' || isDeletingAccount) return;
    triggerHaptic('medium');
    setIsDeletingAccount(true);

    try {
      const { error } = await deleteAccount({ navigation });
      if (!error) {
        setIsDeleteSheetOpen(false);
        setDeleteConfirmText('');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'VC';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleOpenEdit = () => {
    setNameInput(profile.displayName);
    setRoleInput(profile.roleTitle);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) return;
    await updateProfile(nameInput, roleInput);
    setIsEditingProfile(false);
  };

  const handleLogoutPress = () => {
    triggerHaptic('medium');
    if (isAnonymous) {
      setIsGuestSignInConfirmOpen(true);
    } else {
      setIsLogoutConfirmOpen(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={['top', 'left', 'right']}>
      <PaperGrain />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Designer Atelier Card */}
        <Card variant="elevated" style={[styles.atelierCard, { backgroundColor: colors.paperCard }]}>
          <PressableScale
            onPress={pickAndUploadAvatar}
            accessibilityLabel="Change designer avatar"
          >
            <View style={[styles.avatarLarge, { backgroundColor: '#7F0020', borderColor: '#7F0020', overflow: 'hidden' }]}>
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>
                  {getInitials(profile.displayName)}
                </Text>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={11} color="#FFFFFF" strokeWidth={2} />
              </View>
            </View>
          </PressableScale>

          <PressableScale onPress={handleOpenEdit} accessibilityLabel="Edit profile name">
            <View style={styles.designerRow}>
              <Text style={[styles.designerName, { color: colors.ink }]}>
                {profile.displayName}
              </Text>
              <Edit3 size={14} color={colors.textMuted} strokeWidth={1.75} />
            </View>
          </PressableScale>

          <Text style={[styles.designerRole, { color: colors.textMuted }]}>
            {profile.roleTitle}
          </Text>

          {/* Stats Row: Sketches, Boards */}
          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: colors.paperElevated, borderColor: colors.line }]}>
              <BookOpen size={14} color={colors.ink} strokeWidth={1.75} />
              <Text style={[styles.statText, { color: colors.ink }]}>{stats.sketchCount} sketches</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.paperElevated, borderColor: colors.line }]}>
              <Layers size={14} color={colors.ink} strokeWidth={1.75} />
              <Text style={[styles.statText, { color: colors.ink }]}>{stats.boardCount} boards</Text>
            </View>
          </View>
        </Card>

        {/* Saved Color Palettes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Saved palettes</Text>
          <View style={styles.palettesList}>
            {savedPalettes.map((p, index) => (
              <FadeInUp key={p.id} index={index}>
                <PressableScale
                  onPress={() => triggerHaptic('light')}
                  activeScale={0.96}
                >
                  <Card
                    variant="elevated"
                    style={[styles.paletteCard, { backgroundColor: colors.paperCard }]}
                  >
                    <View style={styles.paletteHeader}>
                      <Text style={[styles.paletteName, { color: colors.ink }]}>
                        {p.name}
                      </Text>
                    </View>
                    <View style={styles.paletteSwatchesRow}>
                      {p.colors.map((c, idx) => (
                        <View
                          key={idx}
                          style={[styles.paletteSwatchChip, { backgroundColor: c }]}
                        />
                      ))}
                    </View>
                  </Card>
                </PressableScale>
              </FadeInUp>
            ))}
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Studio settings</Text>

          <Card variant="elevated" style={[styles.settingsCard, { backgroundColor: colors.paperCard }]}>
            {/* Theme Toggle (Light / Dark) */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabelGroup}>
                <View style={styles.settingIconCol}>
                  {isDark ? (
                    <Moon size={16} color={colors.accent} strokeWidth={1.75} />
                  ) : (
                    <Sun size={16} color={colors.accent} strokeWidth={1.75} />
                  )}
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.ink }]}>Dark theme</Text>
                  <Text style={[styles.settingHelper, { color: colors.textMuted }]}>
                    Canvas stays paper
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => {
                  triggerHaptic('light');
                  toggleTheme();
                }}
                trackColor={{ false: colors.line, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

            {/* Grid Default */}
            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, { color: colors.ink }]}>Grid default</Text>
                <Text style={[styles.settingHelper, { color: colors.textMuted }]}>
                  Canvas background guides
                </Text>
              </View>
              <View style={styles.gridChipGroup}>
                {(['Dots', 'Plain', 'Lines'] as const).map((style) => (
                  <PressableScale
                    key={style}
                    onPress={() => setGridStyle(style)}
                  >
                    <Chip
                      label={style}
                      selected={gridStyle === style}
                      onPress={() => setGridStyle(style)}
                    />
                  </PressableScale>
                ))}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

            {/* Stylus Mode */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabelGroup}>
                <View style={styles.settingIconCol}>
                  <PenTool size={16} color={colors.ink} strokeWidth={1.75} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.ink }]}>Stylus mode</Text>
                  <Text style={[styles.settingHelper, { color: colors.textMuted }]}>
                    Pressure and palm guard
                  </Text>
                </View>
              </View>
              <Switch
                value={stylusMode}
                onValueChange={(val) => {
                  triggerHaptic('light');
                  setStylusMode(val);
                }}
                trackColor={{ false: colors.line, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

            {/* Privacy Policy */}
            <PressableScale
              onPress={() => {
                triggerHaptic('light');
                navigation.navigate('Privacy');
              }}
              style={styles.settingNavRow}
              accessibilityLabel="Privacy policy"
            >
              <View style={styles.settingLabelGroup}>
                <View style={styles.settingIconCol}>
                  <Shield size={16} color={colors.ink} strokeWidth={1.75} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.ink }]}>Privacy policy</Text>
                  <Text style={[styles.settingHelper, { color: colors.textMuted }]}>
                    Data isolation and third-party AI
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
            </PressableScale>

            <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

            {/* Terms of Service */}
            <PressableScale
              onPress={() => {
                triggerHaptic('light');
                navigation.navigate('Terms');
              }}
              style={styles.settingNavRow}
              accessibilityLabel="Terms of service"
            >
              <View style={styles.settingLabelGroup}>
                <View style={styles.settingIconCol}>
                  <FileText size={16} color={colors.ink} strokeWidth={1.75} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.ink }]}>Terms of service</Text>
                  <Text style={[styles.settingHelper, { color: colors.textMuted }]}>
                    Ownership and atelier usage
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
            </PressableScale>

            <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

            {/* Delete Account */}
            <PressableScale
              onPress={() => {
                triggerHaptic('medium');
                setIsDeleteSheetOpen(true);
              }}
              style={styles.settingNavRow}
              accessibilityLabel="Delete account"
            >
              <View style={styles.settingLabelGroup}>
                <View style={styles.settingIconCol}>
                  <Trash2 size={16} color="#BE123C" strokeWidth={1.75} />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: '#BE123C' }]}>Delete account</Text>
                  <Text style={[styles.settingHelper, { color: colors.textMuted }]}>
                    Permanently remove all data
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#BE123C" strokeWidth={1.75} />
            </PressableScale>
          </Card>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.accountHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>Account</Text>
            {isAnonymous && (
              <View
                style={[
                  styles.guestBadge,
                  {
                    backgroundColor: colors.paperElevated,
                    borderColor: colors.line,
                  },
                ]}
              >
                <Text style={[styles.guestBadgeText, { color: colors.textMuted }]}>
                  Guest
                </Text>
              </View>
            )}
          </View>

          <Card
            variant="elevated"
            style={[styles.settingsCard, { backgroundColor: colors.paperCard }]}
          >
            {isAnonymous ? (
              <>
                <PressableScale
                  onPress={() => {
                    triggerHaptic('light');
                    navigation.navigate('SignUp');
                  }}
                  style={styles.settingNavRow}
                  accessibilityLabel="Create account"
                >
                  <View style={styles.settingLabelGroup}>
                    <View style={styles.settingIconCol}>
                      <UserPlus size={16} color={colors.ink} strokeWidth={1.75} />
                    </View>
                    <View>
                      <Text style={[styles.settingLabel, { color: colors.ink }]}>
                        Create account
                      </Text>
                      <Text
                        style={[styles.settingHelper, { color: colors.textMuted }]}
                      >
                        Save your designs permanently
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
                </PressableScale>

                <View
                  style={[styles.divider, { backgroundColor: colors.lineSubtle }]}
                />

                <PressableScale
                  onPress={() => {
                    triggerHaptic('medium');
                    setIsGuestSignInConfirmOpen(true);
                  }}
                  style={styles.settingNavRow}
                  accessibilityLabel="Sign in"
                >
                  <View style={styles.settingLabelGroup}>
                    <View style={styles.settingIconCol}>
                      <LogIn size={16} color={colors.ink} strokeWidth={1.75} />
                    </View>
                    <View>
                      <Text style={[styles.settingLabel, { color: colors.ink }]}>
                        Sign in
                      </Text>
                      <Text
                        style={[styles.settingHelper, { color: colors.textMuted }]}
                      >
                        Switch to an existing account
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
                </PressableScale>
              </>
            ) : (
              <PressableScale
                onPress={() => {
                  triggerHaptic('medium');
                  setIsLogoutConfirmOpen(true);
                }}
                style={styles.settingNavRow}
                accessibilityLabel="Log out"
              >
                <View style={styles.settingLabelGroup}>
                  <View style={styles.settingIconCol}>
                    <LogOut size={16} color={colors.danger} strokeWidth={1.75} />
                  </View>
                  <View>
                    <Text style={[styles.settingLabel, { color: colors.danger }]}>
                      Log out
                    </Text>
                    <Text
                      style={[styles.settingHelper, { color: colors.textMuted }]}
                    >
                      {user?.email || 'Leave studio session'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
              </PressableScale>
            )}
          </Card>
        </View>

        {/* Walkthrough & Logout Actions */}
        <View style={styles.bottomActionsCol}>
          <Button
            label="Replay intro"
            variant="outline"
            onPress={() => {
              triggerHaptic('medium');
              setOnboardingCompleted(false);
            }}
            icon={<RotateCcw size={16} color={colors.ink} strokeWidth={1.75} />}
            fullWidth
          />

          <Button
            label={isAnonymous ? 'Sign in' : 'Sign out'}
            variant="ghost"
            onPress={handleLogoutPress}
            icon={<LogOut size={16} color={colors.danger} strokeWidth={1.75} />}
            textStyle={{ color: colors.danger }}
            fullWidth
            style={{ marginTop: spacing.xs }}
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditingProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingProfile(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsEditingProfile(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.paperCard, borderColor: colors.line },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.ink }]}>
              Edit Atelier Profile
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              Display name
            </Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Studio Atelier"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.ink,
                  borderColor: colors.line,
                  backgroundColor: colors.paperElevated,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              Role title
            </Text>
            <TextInput
              value={roleInput}
              onChangeText={setRoleInput}
              placeholder="e.g. Couture designer"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.ink,
                  borderColor: colors.line,
                  backgroundColor: colors.paperElevated,
                },
              ]}
            />

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setIsEditingProfile(false)}
              />
              <Button
                label="Save"
                variant="primary"
                onPress={handleSaveProfile}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Account Confirmation Sheet */}
      <Sheet
        visible={isDeleteSheetOpen}
        onClose={() => {
          if (!isDeletingAccount) {
            setIsDeleteSheetOpen(false);
            setDeleteConfirmText('');
          }
        }}
        title="Delete account"
      >
        <View style={styles.deleteSheetContent}>
          <Text style={[styles.deleteWarningText, { color: colors.ink }]}>
            All sketches, boards and files will be removed.
          </Text>

          <Text style={[styles.deleteInputLabel, { color: colors.textMuted }]}>
            Type DELETE to confirm:
          </Text>

          <TextInput
            value={deleteConfirmText}
            onChangeText={setDeleteConfirmText}
            placeholder="DELETE"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[
              styles.deleteInput,
              {
                borderColor: deleteConfirmText === 'DELETE' ? '#BE123C' : colors.line,
                color: colors.ink,
                backgroundColor: colors.paperElevated,
              },
            ]}
          />

          <View style={styles.deleteActionsRow}>
            <Button
              label="Cancel"
              variant="outline"
              size="medium"
              onPress={() => {
                setIsDeleteSheetOpen(false);
                setDeleteConfirmText('');
              }}
              disabled={isDeletingAccount}
              style={{ flex: 1 }}
            />
            <Button
              label={isDeletingAccount ? 'Deleting...' : 'Delete'}
              variant="primary"
              size="medium"
              disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
              onPress={handleDeleteAccount}
              style={{ flex: 1, backgroundColor: '#BE123C' }}
              textStyle={{ color: '#FFFFFF' }}
            />
          </View>
        </View>
      </Sheet>

      {/* Logout Confirmation Sheet */}
      <ConfirmSheet
        visible={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Log out?"
        message="Leave studio session?"
        buttons={[
          {
            label: 'Log out',
            variant: 'destructive',
            onPress: async () => {
              setIsLogoutConfirmOpen(false);
              await signOut({ navigateTo: 'Welcome', navigation });
            },
          },
          {
            label: 'Cancel',
            variant: 'outline',
            onPress: () => setIsLogoutConfirmOpen(false),
          },
        ]}
      />

      {/* Guest Sign In Confirmation Sheet */}
      <ConfirmSheet
        visible={isGuestSignInConfirmOpen}
        onClose={() => setIsGuestSignInConfirmOpen(false)}
        title="Sign in"
        message="Guest designs will be lost."
        buttons={[
          {
            label: 'Create account',
            variant: 'primary',
            onPress: async () => {
              setIsGuestSignInConfirmOpen(false);
              await signOut({ navigateTo: 'SignUp', navigation });
            },
          },
          {
            label: 'Sign in anyway',
            variant: 'destructive',
            onPress: async () => {
              setIsGuestSignInConfirmOpen(false);
              await signOut({ navigateTo: 'Login', navigation });
            },
          },
          {
            label: 'Cancel',
            variant: 'outline',
            onPress: () => setIsGuestSignInConfirmOpen(false),
          },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.display.fontFamily,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 90,
  },
  atelierCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7F0020',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  designerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.cards,
    padding: spacing.xl,
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: typography.title2.fontFamily,
    fontSize: 20,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.buttons,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: typography.body.fontFamily,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  avatarText: {
    fontFamily: typography.title2.fontFamily,
    fontSize: 20,
  },
  designerName: {
    fontFamily: typography.title2.fontFamily,
    fontSize: 20,
  },
  designerRole: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.chips,
    borderWidth: 1,
  },
  statText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  palettesList: {
    gap: spacing.xs,
  },
  paletteCard: {
    padding: spacing.md,
  },
  paletteHeader: {
    marginBottom: 6,
  },
  paletteName: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 13,
  },
  paletteSwatchesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paletteSwatchChip: {
    flex: 1,
    height: 24,
    borderRadius: radius.chips,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  settingsCard: {
    padding: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingIconCol: {
    width: 24,
    alignItems: 'center',
  },
  settingLabel: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 14,
  },
  settingHelper: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    marginTop: 2,
  },
  gridChipGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  bottomActionsCol: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  settingNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  deleteSheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  deleteWarningText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  deleteInputLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  deleteInput: {
    borderWidth: 1,
    borderRadius: radius.buttons,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: typography.body.fontFamily,
    marginBottom: spacing.lg,
  },
  deleteActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  guestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.chips,
    borderWidth: 1,
  },
  guestBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
