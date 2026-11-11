import { registerPlugin } from "@capacitor/core";
export * from "./storage/nativeLibrary";

export interface ShadowAudioPluginInterface {
  updatePlayback(options: {
    title: string;
    artist: string;
    isPlaying: boolean;
    position?: number;
    duration?: number;
  }): Promise<void>;
  stopPlayback(): Promise<void>;
  addListener(
    eventName: "nativeMediaControl" | "mediaAction",
    listenerFunc: (data: {
      action: "toggle_play" | "next" | "prev" | "play" | "pause" | "seek";
      position?: number;
    }) => void,
  ): Promise<any>;
}

export const ShadowAudio = registerPlugin<ShadowAudioPluginInterface>("ShadowAudio");
