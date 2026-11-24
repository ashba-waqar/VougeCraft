import { useState, useEffect, useRef, useCallback } from 'react';
import { boardRepository, BoardItemData } from '../services/boardRepository';
import { BoardRow } from '../types/database';
import { supabase } from '../services/supabase';
import { showToast } from '../utils/toast';

export interface UseBoardResult {
  board: BoardRow | null;
  items: BoardItemData[];
  isLoading: boolean;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  addItem: (item: BoardItemData) => void;
  updateItemPosition: (id: string, x: number, y: number) => void;
  rotateItem: (id: string, delta?: number) => void;
  scaleItem: (id: string, direction: 'up' | 'down') => void;
  deleteItem: (id: string) => void;
  toggleGroupItem: (id: string) => void;
  uploadAndAddPhoto: (imageUri: string) => Promise<BoardItemData | null>;
  refresh: () => Promise<void>;
}

export function useBoard(): UseBoardResult {
  const [board, setBoard] = useState<BoardRow | null>(null);
  const [items, setItems] = useState<BoardItemData[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveTimerRef = useRef<any>(null);
  const itemsRef = useRef<BoardItemData[]>([]);
  itemsRef.current = items;

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await boardRepository.getUserBoard();
      setBoard(res.board);
      setItems(res.items);
    } catch {
      showToast('Could not load moodboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Debounced auto-save (1 second)
  const triggerDebouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const currentBoard = board;
      if (!currentBoard) return;
      await boardRepository.saveBoardItems(currentBoard.id, itemsRef.current);
    }, 1000);
  }, [board]);

  const addItem = useCallback(
    (item: BoardItemData) => {
      setItems((prev) => {
        const next = [...prev, item];
        return next;
      });
      triggerDebouncedSave();
    },
    [triggerDebouncedSave]
  );

  const updateItemPosition = useCallback(
    (id: string, x: number, y: number) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, x, y } : it))
      );
      triggerDebouncedSave();
    },
    [triggerDebouncedSave]
  );

  const rotateItem = useCallback(
    (id: string, delta = 15) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, rotation: (it.rotation + delta) % 360 } : it
        )
      );
      triggerDebouncedSave();
    },
    [triggerDebouncedSave]
  );

  const scaleItem = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const delta = direction === 'up' ? 0.15 : -0.15;
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === id) {
            const newScale = Math.min(Math.max(it.scale + delta, 0.6), 2.2);
            return { ...it, scale: newScale };
          }
          return it;
        })
      );
      triggerDebouncedSave();
    },
    [triggerDebouncedSave]
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
      if (selectedItemId === id) setSelectedItemId(null);
      triggerDebouncedSave();
    },
    [selectedItemId, triggerDebouncedSave]
  );

  const toggleGroupItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, groupId: it.groupId ? undefined : 'group_atelier' }
            : it
        )
      );
      triggerDebouncedSave();
    },
    [triggerDebouncedSave]
  );

  const uploadAndAddPhoto = useCallback(
    async (imageUri: string): Promise<BoardItemData | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id || 'guest';
      const uploaded = await boardRepository.uploadBoardPhoto(userId, imageUri);

      const newItem: BoardItemData = {
        id: `photo_${Date.now()}`,
        type: 'photo',
        x: 120,
        y: 100,
        scale: 1.0,
        rotation: 0,
        data: {
          uri: uploaded?.signedUrl || imageUri,
          storagePath: uploaded?.storagePath,
        },
      };

      addItem(newItem);
      return newItem;
    },
    [addItem]
  );

  return {
    board,
    items,
    isLoading,
    selectedItemId,
    setSelectedItemId,
    addItem,
    updateItemPosition,
    rotateItem,
    scaleItem,
    deleteItem,
    toggleGroupItem,
    uploadAndAddPhoto,
    refresh: loadBoard,
  };
}
