let timeouts: Timeout[] = []
let onStartQueue: FrameFn[] = []
let updates: FrameUpdateFn[] = []
let onFrameQueue: FrameFn[] = []
let writes: FrameFn[] = []
let onFinishQueue: FrameFn[] = []

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

/**
 * Schedule an update for next frame.
 */
export function raf(update: FrameUpdateFn) {
  updates.push(update)
  start()
}

/**
 * Cancel an update for next frame.
 *
 * ☠️ Never call this from inside an update function!
 */
raf.cancel = (update: FrameUpdateFn) => {
  updates = updates.filter(fn => fn !== update)
}

/**
 * Run a function on the soonest frame after the given time has passed,
 * and before any updates on that particular frame.
 */
raf.setTimeout = (handler: () => void, ms: number) => {
  let time = raf.now() + ms
  let cancel = () => {
    let i = timeouts.findIndex(t => t.cancel == cancel)
    if (~i) timeouts.splice(i, 1)
  }

  let timeout: Timeout = { time, handler, cancel }
  timeouts.splice(findTimeout(time), 0, timeout)

  start()
  return timeout
}

/** Find the index where the given time is not greater. */
let findTimeout = (time: number) =>
  ~(~timeouts.findIndex(t => t.time > time) || ~timeouts.length)

/** Bind `Array#push` to a queue. */
let bindQueue = (queue: FrameFn[]) =>
  queue.push.bind(queue) as (fn: FrameFn) => void

/**
 * To avoid performance issues, all mutations are
 * batched with this function.
 */
raf.write = bindQueue(writes)

/**
 * Run a function before updates are flushed.
 */
raf.onStart = bindQueue(onStartQueue)

/**
 * Run a function before writes are flushed.
 */
raf.onFrame = bindQueue(onFrameQueue)

/**
 * Run a function after writes are flushed.
 */
raf.onFinish = bindQueue(onFinishQueue)

/**
 * Returns true when no timeouts or updates are queued.
 *
 * Useful for running to completion when testing.
 */
raf.idle = () => [timeouts, updates].every(q => !q.length)

/**
 * Stop the update loop and clear the queues.
 *
 * ☠️ Never call this from within the update loop!
 */
raf.clear = () => {
  ts = -1
  clear(timeouts)
  clear(onStartQueue)
  clear(updates)
  clear(onFrameQueue)
  clear(writes)
  clear(onFinishQueue)
}

function clear(queue: any[]) {
  queue.length = 0
}

type NativeRaf = (cb: Function) => any

let nativeRaf =
  typeof window !== 'undefined'
    ? (window.requestAnimationFrame as NativeRaf)
    : () => {}

/**
 * Override the native `requestAnimationFrame` implementation.
 *
 * You must call this if your environment never defines
 * `window.requestAnimationFrame` for you.
 */
raf.use = <T extends NativeRaf>(impl: T) => (nativeRaf = impl)

/**
 * This is responsible for providing the current time,
 * which is used when calculating the elapsed time.
 *
 * It defaults to `performance.now` when it exists,
 * otherwise `Date.now` is used.
 */
raf.now = typeof performance !== 'undefined' ? performance.now : Date.now

/**
 * For update batching in React. Does nothing by default.
 */
raf.batchedUpdates = (fn: () => void) => fn()

/**
 * The error handler used when a queued function throws.
 */
raf.catch = console.error as (error: Error) => void

// The most recent timestamp.
let ts = -1

function start() {
  if (ts < 0) {
    ts = 0
    nativeRaf(loop)
  }
}

function loop() {
  if (~ts) {
    nativeRaf(loop)
    raf.batchedUpdates(update)
  }
}

function update() {
  let prevTs = ts
  ts = raf.now()

  // Flush timeouts whose time is up.
  eachSafely(timeouts.splice(0, findTimeout(ts)), t => t.handler())

  flush(onStartQueue)
  flush(updates, prevTs ? Math.min(64, ts - prevTs) : 100 / 6)
  flush(onFrameQueue)
  flush(writes)
  flush(onFinishQueue)
}

type ZeroArgFn = () => void
type SingleArgFn<T> = (arg: T) => void

function flush(queue: ZeroArgFn[]): void
function flush<T>(queue: SingleArgFn<T>[], arg: T): void
function flush(queue: Function[], arg?: any) {
  if (queue.length) {
    let flushed = [...queue]
    clear(queue)
    eachSafely(flushed, fn => fn(arg) && queue.push(fn))
  }
}

function eachSafely<T>(queue: T[], each: (arg: T) => void) {
  queue.forEach(arg => {
    try {
      each(arg)
    } catch (e) {
      raf.catch(e)
    }
  })
}
