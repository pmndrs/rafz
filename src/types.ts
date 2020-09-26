export type NativeRaf = (cb: Function) => any

export interface Timeout {
  time: number
  handler: () => void
  cancel: () => void
}

/**
 * This function updates animation state with the delta time.
 */
export type FrameUpdateFn = (dt: number) => boolean | void

/**
 * Return true to be called again next frame.
 */
export type FrameFn = () => boolean | void

export interface Rafz {
  (update: FrameUpdateFn): void

  /**
   * Cancel an update for next frame.
   *
   * The current frame is never affected, unless called
   * from a `raf.onStart` handler.
   */
  cancel: (update: FrameUpdateFn) => void

  /**
   * To avoid performance issues, all mutations are batched with this function.
   * If the update loop is dormant, it will be started when you call this.
   */
  write: (fn: FrameFn) => void

  /**
   * Run a function before updates are flushed.
   */
  onStart: (fn: FrameFn) => void

  /**
   * Run a function before writes are flushed.
   */
  onFrame: (fn: FrameFn) => void

  /**
   * Run a function after writes are flushed.
   */
  onFinish: (fn: FrameFn) => void

  /**
   * Run a function on the soonest frame after the given time has passed,
   * and before any updates on that particular frame.
   */
  setTimeout: (handler: () => void, ms: number) => Timeout

  /**
   * Returns true when no timeouts or updates are queued.
   *
   * Useful for running to completion when testing.
   */
  idle: () => boolean

  /**
   * Stop the update loop and clear the queues.
   */
  clear: () => void

  /**
   * Override the native `requestAnimationFrame` implementation.
   *
   * You must call this if your environment never defines
   * `window.requestAnimationFrame` for you.
   */
  use: <T extends NativeRaf>(impl: T) => T

  /**
   * This is responsible for providing the current time,
   * which is used when calculating the elapsed time.
   *
   * It defaults to `performance.now` when it exists,
   * otherwise `Date.now` is used.
   */
  now: () => number

  /**
   * For update batching in React. Does nothing by default.
   */
  batchedUpdates: (cb: () => void) => void

  /**
   * The error handler used when a queued function throws.
   */
  catch: (error: Error) => void
}
