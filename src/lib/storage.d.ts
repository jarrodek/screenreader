declare class Storage {
  constructor();

  /**
   * Checks whether the user enabled the extension, meaning,
   * it should tts selected text.
   *
   * @returns True if the extension is active.
   */
  isActive(): Promise<boolean>;

  /**
   * Restores saved or creates new TTS options
   */
  getTtsOptions(): Promise<chrome.tts.SpeakOptions>;
  /**
   * Stores a single value in the sync store.
   * @param key The key under which to store option
   * @param value The value to store.
   */
  saveTtsOption(key: string, value: unknown): Promise<void>;
}
declare var instance: Storage;
export default instance;
