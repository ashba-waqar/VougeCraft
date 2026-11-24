import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import { Profile } from '../types/database';
import { getCachedSignedUrl } from './boardRepository';
import { showToast } from '../utils/toast';

const LOCAL_PROFILE_KEY = '@voguecraft_user_profile_v1';
const LOCAL_STATS_KEY = '@voguecraft_user_stats_v1';

export interface UserProfileData {
  id: string;
  displayName: string;
  roleTitle: string;
  avatarUrl: string | null;
  storagePath: string | null;
}

export interface UserStats {
  sketchCount: number;
  boardCount: number;
}

const DEFAULT_PROFILE: UserProfileData = {
  id: 'guest',
  displayName: 'Studio Atelier',
  roleTitle: 'Couture designer',
  avatarUrl: null,
  storagePath: null,
};

function base64ToUint8Array(base64: string): Uint8Array {
  const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(pureBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const profileRepository = {
  /**
   * Fetch current user profile
   */
  async getProfile(): Promise<UserProfileData> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const localRaw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
        return localRaw ? JSON.parse(localRaw) : DEFAULT_PROFILE;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        // Try creating default row if missing
        const { data: created } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            display_name: 'Studio Atelier',
            role_title: 'Couture designer',
          })
          .select()
          .single();

        if (created) {
          const profile: UserProfileData = {
            id: created.id,
            displayName: created.display_name || 'Studio Atelier',
            roleTitle: created.role_title || 'Couture designer',
            avatarUrl: null,
            storagePath: null,
          };
          await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
          return profile;
        }

        const localRaw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
        return localRaw ? JSON.parse(localRaw) : DEFAULT_PROFILE;
      }

      let signedAvatarUrl: string | null = null;
      if (data.avatar_url) {
        if (data.avatar_url.startsWith('http')) {
          signedAvatarUrl = data.avatar_url;
        } else {
          signedAvatarUrl = await getCachedSignedUrl('board-photos', data.avatar_url);
        }
      }

      const profile: UserProfileData = {
        id: data.id,
        displayName: data.display_name || 'Studio Atelier',
        roleTitle: data.role_title || 'Couture designer',
        avatarUrl: signedAvatarUrl,
        storagePath: data.avatar_url,
      };

      await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.warn('VogueCraft: getProfile error:', err);
      const localRaw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
      return localRaw ? JSON.parse(localRaw) : DEFAULT_PROFILE;
    }
  },

  /**
   * Update display name and role title
   */
  async updateProfile(updates: {
    displayName?: string;
    roleTitle?: string;
  }): Promise<UserProfileData | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const patch: any = {};
      if (updates.displayName !== undefined) patch.display_name = updates.displayName.trim();
      if (updates.roleTitle !== undefined) patch.role_title = updates.roleTitle.trim();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .update(patch)
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.warn('VogueCraft: updateProfile error:', error);
          showToast('Could not save profile changes');
          return null;
        }

        if (data) {
          let signedAvatarUrl: string | null = null;
          if (data.avatar_url) {
            signedAvatarUrl = data.avatar_url.startsWith('http')
              ? data.avatar_url
              : await getCachedSignedUrl('board-photos', data.avatar_url);
          }

          const updated: UserProfileData = {
            id: data.id,
            displayName: data.display_name || 'Studio Atelier',
            roleTitle: data.role_title || 'Couture designer',
            avatarUrl: signedAvatarUrl,
            storagePath: data.avatar_url,
          };
          await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
          showToast('Profile updated');
          return updated;
        }
      }

      // Guest / offline fallback
      const localRaw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
      const current: UserProfileData = localRaw ? JSON.parse(localRaw) : DEFAULT_PROFILE;
      const updated: UserProfileData = {
        ...current,
        displayName: updates.displayName !== undefined ? updates.displayName : current.displayName,
        roleTitle: updates.roleTitle !== undefined ? updates.roleTitle : current.roleTitle,
      };
      await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      showToast('Profile updated');
      return updated;
    } catch (err) {
      console.warn('VogueCraft: updateProfile exception:', err);
      showToast('Error updating profile');
      return null;
    }
  },

  /**
   * Upload user avatar photo (compressed to 512px)
   */
  async uploadAvatar(imageUri: string): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Compress to 512px max dimension
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 512, height: 512 } }],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulated.base64) return null;

      if (!user) {
        // Guest mode local URI
        const localRaw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
        const current: UserProfileData = localRaw ? JSON.parse(localRaw) : DEFAULT_PROFILE;
        const updated = { ...current, avatarUrl: manipulated.uri };
        await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
        return manipulated.uri;
      }

      const storagePath = `${user.id}/avatar_${Date.now()}.jpg`;
      const bytes = base64ToUint8Array(manipulated.base64);

      const { error: uploadError } = await supabase.storage
        .from('board-photos')
        .upload(storagePath, bytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.warn('VogueCraft: Avatar upload error:', uploadError);
        showToast('Could not upload avatar image');
        return null;
      }

      // Update profile avatar_url
      await supabase
        .from('profiles')
        .update({ avatar_url: storagePath })
        .eq('id', user.id);

      const signedUrl = await getCachedSignedUrl('board-photos', storagePath);

      const localRaw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
      const current: UserProfileData = localRaw ? JSON.parse(localRaw) : DEFAULT_PROFILE;
      const updated = {
        ...current,
        avatarUrl: signedUrl,
        storagePath,
      };
      await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));

      showToast('Avatar updated');
      return signedUrl;
    } catch (err) {
      console.warn('VogueCraft: uploadAvatar exception:', err);
      showToast('Error uploading avatar');
      return null;
    }
  },

  /**
   * Get real count of non-deleted sketches and boards for logged-in user
   */
  async getStats(): Promise<UserStats> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const localRaw = await AsyncStorage.getItem(LOCAL_STATS_KEY);
        return localRaw ? JSON.parse(localRaw) : { sketchCount: 0, boardCount: 0 };
      }

      // Count non-deleted sketches
      const { count: sketchCount, error: sketchError } = await supabase
        .from('sketches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null);

      // Count boards
      const { count: boardCount, error: boardError } = await supabase
        .from('boards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const stats: UserStats = {
        sketchCount: !sketchError && typeof sketchCount === 'number' ? sketchCount : 0,
        boardCount: !boardError && typeof boardCount === 'number' ? boardCount : 0,
      };

      await AsyncStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
      return stats;
    } catch (err) {
      console.warn('VogueCraft: getStats error:', err);
      const localRaw = await AsyncStorage.getItem(LOCAL_STATS_KEY);
      return localRaw ? JSON.parse(localRaw) : { sketchCount: 0, boardCount: 0 };
    }
  },
};
