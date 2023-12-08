/**
 * The list message types sent by the worker.
 */
export type WorkerMessageType = 'unload' | 'load';

/**
 * A message sent by the worker to other parts of extensions.
 */
export interface IWorkerMessage {
  type: WorkerMessageType;
}

/**
 * The list message types sent by a content script to the worker.
 */
export type ContentMessageType = 'play' | 'stop' | 'image' | 'list-voices';

/**
 * A message sent by the content script to the worker.
 */
export interface IContentMessage {
  type: ContentMessageType;
  /**
   * Optional data specific to the `type`.
   */
  data?: unknown;
}

export interface ITextSynthesisDictionary {
  quot: string;
  quest: string;
  tagStart: string;
  tagEnd: string;
  threeDots: string;
}
