import type {
  FrameFn,
  FrameUpdateFn,
  NativeRaf,
  Rafz,
  Timeout,
  Throttled,
} from './types'

export { FrameFn, FrameUpdateFn, Timeout, Throttled }

let updates = new Set<FrameUpdateFn>()

/**
 * Schedule an update for next frame.
 * Your function can return `true` to repeat next frame.
 *
 * ☠️ Recursive calls are synchronous.
 */
export const raf: Rafz = update => schedule(update, updates)
raf.cancel = update => updates.delete(update)

let writes = new Set<FrameFn>()
raf.write = fn => schedule(fn, writes)

let onStartQueue = new Set<FrameFn>()
raf.onStart = fn => schedule(fn, onStartQueue)

let onFrameQueue = new Set<FrameFn>()
raf.onFrame = fn => schedule(fn, onFrameQueue)

let onFinishQueue = new Set<FrameFn>()
raf.onFinish = fn => schedule(fn, onFinishQueue)

let timeouts: Timeout[] = []
raf.setTimeout = (handler, ms) => {
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

raf.sync = fn => {
  sync = true
  raf.batchedUpdates(fn)
  sync = false
}

raf.throttle = fn => {
  let lastArgs: any
  let queuedFn = () => fn(...lastArgs)
  function throttled(...args: any) {
    schedule(queuedFn, onStartQueue)
    lastArgs = args
  }
  throttled.handler = fn
  throttled.cancel = () => {
    onStartQueue.delete(queuedFn)
    lastArgs = null
  }
  return throttled as any
}

raf.idle = () => !(timeouts.length || updates.size)

raf.clear = () => {
  ts = -1
  timeouts = []
  onStartQueue.clear()
  updates.clear()
  onFrameQueue.clear()
  writes.clear()
  onFinishQueue.clear()
}

let nativeRaf =
  typeof window != 'undefined'
    ? (window.requestAnimationFrame as NativeRaf)
    : () => {}

raf.use = impl => (nativeRaf = impl)
raf.now = typeof performance != 'undefined' ? () => performance.now() : Date.now
raf.batchedUpdates = fn => fn()
raf.catch = console.error

/** The most recent timestamp. */
let ts = -1

/** When true, scheduling is disabled. */
let sync = false

/** Schedule a function and start the update loop if needed. */
function schedule<T extends Function>(fn: T, queue: Set<T>) {
  if (sync) {
    queue.delete(fn)
    fn(0)
  } else {
    queue.add(fn)
    start()
  }
}

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

  onStartQueue = flush(onStartQueue)
  updates = flush(updates, prevTs ? Math.min(64, ts - prevTs) : 16.667)
  onFrameQueue = flush(onFrameQueue)
  writes = flush(writes)
  onFinishQueue = flush(onFinishQueue)
}

type ZeroArgFn = () => void
type SingleArgFn<T> = (arg: T) => void

function flush(queue: Set<ZeroArgFn>): typeof queue
function flush<T>(queue: Set<SingleArgFn<T>>, arg: T): typeof queue
function flush(queue: Set<Function>, arg?: any) {
  if (queue.size) {
    let next = new Set<Function>()
    eachSafely(queue, fn => fn(arg) && next.add(fn))
    return next
  }
  return queue
}

interface Eachable<T> {
  forEach(cb: (value: T) => void): void
}

function eachSafely<T>(queue: Eachable<T>, each: (value: T) => void) {
  queue.forEach(arg => {
    try {
      each(arg)
    } catch (e) {
      raf.catch(e)
    }
  })
}
