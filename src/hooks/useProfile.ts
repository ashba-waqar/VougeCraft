import { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  profileRepository,
  UserProfileData,
  UserStats,
} from '../services/profileRepository';
import { showToast } from '../utils/toast';

export interface UseProfileResult {
  profile: UserProfileData;
  stats: UserStats;
  isLoading: boolean;
  updateProfile: (displayName: string, roleTitle: string) => Promise<boolean>;
  pickAndUploadAvatar: () => Promise<string | null>;
  refresh: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<UserProfileData>({
    id: 'guest',
    displayName: 'Studio Atelier',
    roleTitle: 'Couture designer',
    avatarUrl: null,
    storagePath: null,
  });
  const [stats, setStats] = useState<UserStats>({
    sketchCount: 0,
    boardCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, s] = await Promise.all([
        profileRepository.getProfile(),
        profileRepository.getStats(),
      ]);
      setProfile(p);
      setStats(s);
    } catch {
      showToast('Could not load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateProfile = useCallback(
    async (displayName: string, roleTitle: string): Promise<boolean> => {
      const updated = await profileRepository.updateProfile({
        displayName,
        roleTitle,
      });
      if (updated) {
        setProfile(updated);
        return true;
      }
      return false;
    },
    []
  );

  const pickAndUploadAvatar = useCallback(async (): Promise<string | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]?.uri) {
        return null;
      }

      const uploadedUrl = await profileRepository.uploadAvatar(
        result.assets[0].uri
      );
      if (uploadedUrl) {
        setProfile((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
      }
      return uploadedUrl;
    } catch {
      showToast('Could not select avatar image');
      return null;
    }
  }, []);

  return {
    profile,
    stats,
    isLoading,
    updateProfile,
    pickAndUploadAvatar,
    refresh,
  };
}
