import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export interface Track {
  id: string;
  index: string;
  title: string;
  duration: string;
  filename?: string;
  endTime?: number;
  localUri?: string;
}

export interface ShadowAudioPluginInterface {
  updatePlayback(options: { title: string; artist: string; isPlaying: boolean }): Promise<void>;
  stopPlayback(): Promise<void>;
  addListener(
    eventName: "nativeMediaControl",
    listenerFunc: (data: { action: "toggle_play" | "next" | "prev" }) => void,
  ): Promise<any>;
}

export const ShadowAudio = registerPlugin<ShadowAudioPluginInterface>("ShadowAudio");

const PREF_ASSIGNMENTS_KEY = "slplayer_assignments";
const PREF_CUSTOM_TRACKS_KEY = "slplayer_custom_tracks";
const PREF_API_HOST_KEY = "slplayer_api_host";

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Resolves the audio source URL for playback.
 * - If running natively and has localUri: converts via Capacitor.convertFileSrc
 * - In production/standalone: resolves to relative ./media/<filename>
 * - In local dev with backend: streams from backend API
 */
export const getAudioUrl = (track: Track, apiBase: string): string => {
  if (track.localUri && isNativeAndroid()) {
    return Capacitor.convertFileSrc(track.localUri);
  }

  const filename = track.filename || `${track.id}.mp3`;
  
  if (import.meta.env.PROD || isNativeAndroid()) {
    return `./media/${filename}`;
  }

  return `${apiBase}/api/stream/${encodeURIComponent(track.id)}`;
};

/**
 * Native assignment persistence via Capacitor Preferences (SharedPreferences)
 */
export const loadNativeAssignments = async (
  fallback: Record<string, string> = {},
): Promise<Record<string, string>> => {
  try {
    const { value } = await Preferences.get({ key: PREF_ASSIGNMENTS_KEY });
    if (value) {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return { ...fallback, ...parsed };
      }
    }
  } catch (err) {
    console.warn("[NativeStorage] Failed to read assignments:", err);
  }
  return fallback;
};

export const saveNativeAssignments = async (
  assignments: Record<string, string>,
): Promise<void> => {
  try {
    await Preferences.set({
      key: PREF_ASSIGNMENTS_KEY,
      value: JSON.stringify(assignments),
    });
  } catch (err) {
    console.error("[NativeStorage] Failed to persist assignments:", err);
  }
};

/**
 * Native custom track storage for on-device downloaded songs
 */
export const loadNativeCustomTracks = async (): Promise<Track[]> => {
  try {
    const { value } = await Preferences.get({ key: PREF_CUSTOM_TRACKS_KEY });
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[NativeStorage] Failed to read custom tracks:", err);
  }
  return [];
};

export const saveNativeCustomTrack = async (track: Track): Promise<void> => {
  try {
    const existing = await loadNativeCustomTracks();
    const updated = [track, ...existing.filter((t) => t.id !== track.id)];
    await Preferences.set({
      key: PREF_CUSTOM_TRACKS_KEY,
      value: JSON.stringify(updated),
    });
  } catch (err) {
    console.error("[NativeStorage] Failed to save custom track:", err);
  }
};

/**
 * Configurable host IP for communicating with Desktop backend over Wi-Fi
 */
export const getStoredApiHost = async (): Promise<string | null> => {
  try {
    const { value } = await Preferences.get({ key: PREF_API_HOST_KEY });
    return value;
  } catch {
    return null;
  }
};

export const setStoredApiHost = async (host: string): Promise<void> => {
  try {
    await Preferences.set({ key: PREF_API_HOST_KEY, value: host.trim() });
  } catch (err) {
    console.error("[NativeStorage] Failed to store API host:", err);
  }
};
