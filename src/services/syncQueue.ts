import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { showToast } from '../utils/toast';

const QUEUE_STORAGE_KEY = '@voguecraft_sync_queue_v1';

export interface QueuedSyncItem {
  id: string; // queue item id
  sketchId?: string;
  entityId: string;
  entityType?: 'sketch' | 'tech_pack' | 'board' | 'palette';
  updates: any;
  timestamp: number;
}

type SyncListener = (isSyncing: boolean, pendingCount: number) => void;

class SyncQueueManager {
  private queue: QueuedSyncItem[] = [];
  private isProcessing = false;
  private isOnline = true;
  private listeners: Set<SyncListener> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.queue = (parsed || []).map((it: any) => ({
          ...it,
          entityId: it.entityId || it.sketchId,
          entityType: it.entityType || 'sketch',
        }));
      }
    } catch {
      this.queue = [];
    }

    // Monitor connectivity
    NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      const wasOffline = !this.isOnline;
      this.isOnline = online;

      if (wasOffline && online) {
        this.flush();
      }
    });

    // Check initial state
    const currentNet = await NetInfo.fetch();
    this.isOnline = !!currentNet.isConnected && currentNet.isInternetReachable !== false;
    if (this.isOnline && this.queue.length > 0) {
      this.flush();
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.isProcessing, this.queue.length);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isProcessing, this.queue.length));
  }

  private async persistQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch {}
  }

  /**
   * Enqueue a pending sketch/techpack update when offline or saving failed
   */
  public async enqueue(
    firstArg: string,
    secondArg: any,
    thirdArg?: any,
    fourthArg?: any
  ): Promise<void> {
    await this.init();

    let entityType: 'sketch' | 'tech_pack' = 'sketch';
    let entityId = firstArg;
    let updates = secondArg;

    if (typeof thirdArg !== 'undefined') {
      entityType = firstArg as any;
      entityId = secondArg;
      updates = fourthArg !== undefined ? fourthArg : thirdArg;
    }

    // Replace existing queued item for this entity to keep latest state only
    const existingIndex = this.queue.findIndex(
      (item) => item.entityId === entityId && (item.entityType || 'sketch') === entityType
    );

    const newItem: QueuedSyncItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sketchId: entityId,
      entityId,
      entityType,
      updates,
      timestamp: Date.now(),
    };

    if (existingIndex !== -1) {
      this.queue[existingIndex] = newItem;
    } else {
      this.queue.push(newItem);
    }

    await this.persistQueue();
    this.notify();

    // Attempt flush if online
    if (this.isOnline) {
      this.flush();
    }
  }

  /**
   * Process all queued sync items when connection returns
   */
  public async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    this.notify();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        this.isProcessing = false;
        this.notify();
        return;
      }

      const remaining: QueuedSyncItem[] = [];

      for (const item of [...this.queue]) {
        try {
          const type = item.entityType || 'sketch';

          if (type === 'sketch') {
            const payload = {
              ...item.updates,
              updated_at: new Date(item.timestamp).toISOString(),
            };

            const { error } = await supabase
              .from('sketches')
              .update(payload)
              .eq('id', item.entityId)
              .eq('user_id', user.id);

            if (error) {
              if (__DEV__) {
                console.error('[VogueCraft syncQueue] Failed to sync sketch item:', {
                  message: error.message,
                  code: error.code,
                  details: error.details,
                  hint: error.hint,
                  id: item.entityId,
                  userId: user.id,
                });
              }

              if (
                error.code === '42501' ||
                error.message?.toLowerCase().includes('row-level security')
              ) {
                console.error(
                  `[VogueCraft RLS ERROR in syncQueue] ` +
                  `Policy rejection on public.sketches for user ${user.id}. Details: ${error.details || error.message}`
                );
              }

              // Do not re-queue items with invalid non-UUID IDs that will never succeed in database
              if (
                item.entityId.startsWith('blank_') ||
                item.entityId.startsWith('sketch_local_') ||
                item.entityId.startsWith('sketch_guest_') ||
                item.entityId.startsWith('tpl_')
              ) {
                console.warn(`[VogueCraft syncQueue] Dropping non-UUID entity: ${item.entityId}`);
              } else {
                remaining.push(item);
              }
            }
          } else if (type === 'tech_pack') {
            const { error } = await supabase
              .from('tech_packs')
              .update({
                unit: item.updates.unit,
                measurements: item.updates.measurements,
                fabrics: item.updates.fabrics,
                notes: item.updates.notes,
                updated_at: new Date(item.timestamp).toISOString(),
              })
              .eq('id', item.entityId)
              .eq('user_id', user.id);

            if (error) {
              remaining.push(item);
            }
          }
        } catch {
          remaining.push(item);
        }
      }

      const syncedCount = this.queue.length - remaining.length;
      this.queue = remaining;
      await this.persistQueue();

      if (syncedCount > 0) {
        showToast('All changes synced to cloud');
      }
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }
}

export const syncQueue = new SyncQueueManager();
