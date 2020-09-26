declare const window: any

export interface FrameUpdateFn {
  (now: number): boolean | void
}

export function raf(update: FrameUpdateFn) {}

export interface FrameStartFn {
  (): boolean | void
}

raf.onStart = () => {}

raf.clear = () => {
  time = -1
  startQueue = []
  updateQueue = []
}

type NativeRaf = (cb: Function) => any

let nativeRaf: NativeRaf =
  typeof window !== 'undefined' ? window.requestAnimationFrame : () => {}

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
 * Override this if you're using React, or else libraries can
 * accidentally trigger excessive re-rendering.
 */
raf.batchedUpdates = (fn: () => void) => fn()

let time = -1
let startQueue: FrameStartFn[] = []
let updateQueue: FrameUpdateFn[] = []

function start() {
  if (time < 0) {
    time = 0
    raf(loop)
  }
}

function loop() {
  if (time < 0) return
  raf(loop)

  const lastTime = time
  time = raf.now()

  // http://gafferongames.com/game-physics/fix-your-timestep/
  const dt = lastTime ? Math.min(64, time - lastTime) : 100 / 6
}

type AnyFn = (...args: any[]) => any

function flush<T extends AnyFn>(queue: T[], arg: Parameters<T>[0]) {
  if (queue.length) {
  }
}
