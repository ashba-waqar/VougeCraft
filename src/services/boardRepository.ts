import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import { BoardRow, BoardItemRow, BoardItemType } from '../types/database';
import { showToast } from '../utils/toast';

export interface BoardItemData {
  id: string;
  type: 'sketch' | 'swatch' | 'palette' | 'photo';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  data: any;
  groupId?: string;
  zIndex?: number;
}

const LOCAL_BOARD_KEY = '@voguecraft_local_board_v1';
const LOCAL_BOARD_ITEMS_KEY = '@voguecraft_local_board_items_v1';

// Signed URLs cache with 50-minute expiration
interface CachedSignedUrl {
  url: string;
  expiresAt: number;
}
const signedUrlCache = new Map<string, CachedSignedUrl>();

export async function getCachedSignedUrl(bucket: string, path: string): Promise<string> {
  const cacheKey = `${bucket}:${path}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    // 50 minutes = 3000 seconds
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3000);

    if (!error && data?.signedUrl) {
      signedUrlCache.set(cacheKey, {
        url: data.signedUrl,
        expiresAt: Date.now() + 50 * 60 * 1000 - 60000,
      });
      return data.signedUrl;
    }
  } catch {}

  const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
  return pubData.publicUrl;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(pureBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const boardRepository = {
  /**
   * Loads the user's board and board items. If brand new user, creates "My board".
   */
  async getUserBoard(): Promise<{
    board: BoardRow | null;
    items: BoardItemData[];
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Fallback to local storage for guests
        const localItems = await AsyncStorage.getItem(LOCAL_BOARD_ITEMS_KEY);
        return {
          board: {
            id: 'local_board',
            user_id: 'guest',
            title: 'My board',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          items: localItems ? JSON.parse(localItems) : [],
        };
      }

      // 1. Get or create user board
      const { data: existingBoards, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      let board: BoardRow;

      if (boardError || !existingBoards || existingBoards.length === 0) {
        const { data: newBoard, error: createError } = await supabase
          .from('boards')
          .insert({
            user_id: user.id,
            title: 'My board',
          })
          .select()
          .single();

        if (createError || !newBoard) {
          showToast('Could not initialize moodboard');
          const localItems = await AsyncStorage.getItem(LOCAL_BOARD_ITEMS_KEY);
          return {
            board: null,
            items: localItems ? JSON.parse(localItems) : [],
          };
        }
        board = newBoard;
      } else {
        board = existingBoards[0];
      }

      // 2. Fetch board items
      const { data: itemRows, error: itemsError } = await supabase
        .from('board_items')
        .select('*')
        .eq('board_id', board.id)
        .eq('user_id', user.id)
        .order('z_index', { ascending: true });

      if (itemsError) {
        showToast('Could not fetch moodboard items');
        const localItems = await AsyncStorage.getItem(LOCAL_BOARD_ITEMS_KEY);
        return {
          board,
          items: localItems ? JSON.parse(localItems) : [],
        };
      }

      // 3. Resolve item payloads and photo signed URLs
      const mappedItems: BoardItemData[] = await Promise.all(
        (itemRows || []).map(async (row: BoardItemRow) => {
          const payload = (row.payload as any) || {};
          let itemData = payload;

          if (row.type === 'photo' && payload.storagePath) {
            const signedUrl = await getCachedSignedUrl('board-photos', payload.storagePath);
            itemData = {
              ...payload,
              uri: signedUrl,
            };
          }

          return {
            id: row.id,
            type: row.type as 'sketch' | 'swatch' | 'palette' | 'photo',
            x: row.x,
            y: row.y,
            scale: row.scale,
            rotation: row.rotation,
            zIndex: row.z_index,
            data: itemData,
            groupId: payload.groupId,
          };
        })
      );

      // Cache locally
      await AsyncStorage.setItem(LOCAL_BOARD_ITEMS_KEY, JSON.stringify(mappedItems));

      return { board, items: mappedItems };
    } catch (err) {
      console.warn('VogueCraft: getUserBoard error:', err);
      showToast('Error syncing moodboard');
      const localItems = await AsyncStorage.getItem(LOCAL_BOARD_ITEMS_KEY);
      return {
        board: null,
        items: localItems ? JSON.parse(localItems) : [],
      };
    }
  },

  /**
   * Save all board items to Supabase (debounced by 1s)
   */
  async saveBoardItems(boardId: string, items: BoardItemData[]): Promise<boolean> {
    try {
      // 1. Cache locally first
      await AsyncStorage.setItem(LOCAL_BOARD_ITEMS_KEY, JSON.stringify(items));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return true;

      // Clean existing board items for this board to sync current items layout
      await supabase
        .from('board_items')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', user.id);

      if (items.length === 0) return true;

      const rowsToInsert = items.map((it, idx) => ({
        id: it.id.includes('-') && it.id.length === 36 ? it.id : undefined,
        board_id: boardId,
        user_id: user.id,
        type: it.type as BoardItemType,
        x: Math.round(it.x),
        y: Math.round(it.y),
        scale: Math.round(it.scale * 100) / 100,
        rotation: Math.round(it.rotation * 10) / 10,
        z_index: it.zIndex || idx + 1,
        payload: {
          ...it.data,
          groupId: it.groupId,
        },
      }));

      const { error } = await supabase.from('board_items').insert(rowsToInsert as any);

      if (error) {
        console.warn('VogueCraft: Error saving board items:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('VogueCraft: saveBoardItems error:', err);
      return false;
    }
  },

  /**
   * Upload photo to bucket board-photos at {user_id}/{uuid}.jpg (compressed to max 1600px)
   */
  async uploadBoardPhoto(
    userId: string,
    imageUri: string
  ): Promise<{ storagePath: string; signedUrl: string } | null> {
    try {
      // Compress to max 1600px width with quality 0.8
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1600 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulated.base64) return null;

      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      const storagePath = `${userId}/${uuid}.jpg`;
      const bytes = base64ToUint8Array(manipulated.base64);

      const { error: uploadError } = await supabase.storage
        .from('board-photos')
        .upload(storagePath, bytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.warn('VogueCraft: Board photo upload error:', uploadError);
        showToast('Could not upload photo to cloud');
        return { storagePath, signedUrl: manipulated.uri };
      }

      const signedUrl = await getCachedSignedUrl('board-photos', storagePath);
      return { storagePath, signedUrl };
    } catch (err) {
      console.warn('VogueCraft: uploadBoardPhoto error:', err);
      showToast('Photo processing failed');
      return null;
    }
  },
};
