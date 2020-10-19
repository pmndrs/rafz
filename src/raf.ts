import type {
  FrameFn,
  FrameUpdateFn,
  NativeRaf,
  Rafz,
  Timeout,
  Throttled,
} from './types'

export { FrameFn, FrameUpdateFn, Timeout, Throttled }

let updateQueue = makeQueue<FrameUpdateFn>()

/**
 * Schedule an update for next frame.
 * Your function can return `true` to repeat next frame.
 */
export const raf: Rafz = fn => schedule(fn, updateQueue)
raf.cancel = fn => updateQueue.delete(fn)

let writeQueue = makeQueue<FrameFn>()
raf.write = fn => schedule(fn, writeQueue)

let onStartQueue = makeQueue<FrameFn>()
raf.onStart = fn => schedule(fn, onStartQueue)

let onFrameQueue = makeQueue<FrameFn>()
raf.onFrame = fn => schedule(fn, onFrameQueue)

let onFinishQueue = makeQueue<FrameFn>()
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
  function queuedFn() {
    try {
      fn(...lastArgs)
    } finally {
      lastArgs = null
    }
  }
  function throttled(...args: any) {
    lastArgs = args
    raf.onStart(queuedFn)
  }
  throttled.handler = fn
  throttled.cancel = () => {
    onStartQueue.delete(queuedFn)
    lastArgs = null
  }
  return throttled as any
}

raf.clear = () => {
  ts = -1
  timeouts = []
  onStartQueue.clear()
  updateQueue.clear()
  onFrameQueue.clear()
  writeQueue.clear()
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

function schedule<T extends Function>(fn: T, queue: Queue<T>) {
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

  onStartQueue.flush()
  updateQueue.flush(prevTs ? Math.min(64, ts - prevTs) : 16.667)
  onFrameQueue.flush()
  writeQueue.flush()
  onFinishQueue.flush()
}

interface Queue<T extends Function = any> {
  add: (fn: T) => void
  delete: (fn: T) => void
  flush: (arg?: any) => void
  clear: () => void
}

function makeQueue<T extends Function>(): Queue<T> {
  let next = new Set<T>()
  let current = next
  return {
    add(fn) {
      next.add(fn)
    },
    delete(fn) {
      next.delete(fn)
    },
    flush(arg) {
      if (current.size) {
        next = new Set()
        eachSafely(current, fn => fn(arg) && next.add(fn))
        current = next
      }
    },
    clear() {
      current = next
      current.clear()
    },
  }
}

interface Eachable<T> {
  forEach(cb: (value: T) => void): void
}

function eachSafely<T>(values: Eachable<T>, each: (value: T) => void) {
  values.forEach(value => {
    try {
      each(value)
    } catch (e) {
      raf.catch(e)
    }
  })
}
