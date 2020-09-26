# rafz

Coordinate `requestAnimationFrame` calls across your app and/or libraries.

* ~600 bytes min+gzip
* Timeout support
* Batching support (eg: `ReactDOM.unstable_batchedUpdates`)
* Uncaught errors are isolated
* Runs continuously (to reduce frame skips)

&nbsp;

## API

```ts
import { raf } from 'rafz'

// Schedule an update
raf(dt => {})

// Start an update loop
raf(dt => true)

// Cancel an update
raf.cancel(fn)

// Schedule a mutation
raf.write(() => {})

// Before any updates
raf.onStart(() => {})

// Before any mutations
raf.onFrame(() => {})

// After any mutations
raf.onFinish(() => {})

// Set a timeout that runs on nearest frame
raf.setTimeout(() => {}, 1000)

// Clear all handlers
raf.clear()

// Use a polyfill
raf.use(require('@essentials/raf').raf)

// Get the current time
raf.now() // => number

// See if any updates or timeouts are pending
raf.idle() // => boolean
```

&nbsp;

## Notes

* Functions can only be scheduled once per queue per frame.
* Thus, trying to schedule a function twice is a no-op.
* The `update` phase is for updating JS state (eg: advancing an animation).
* The `write` phase is for updating native state (eg: mutating the DOM).
* [Reading] is allowed any time before the `write` phase.
* Writing is allowed any time after the `onFrame` phase.
* Timeouts are flushed before anything else.
* Recursive calls (ie: `raf` in `raf`) are flushed in the same frame.
* Any handler (except timeouts) can return `true` to schedule itself for next frame.
* The `raf.cancel` function only works with `raf` callbacks.
* Use `raf.sync` to disable scheduling in its callback.
* Override `raf.batchedUpdates` to avoid excessive re-rendering in React.

[Reading]: https://gist.github.com/paulirish/5d52fb081b3570c81e3a

&nbsp;

## Used by

- [react-spring](https://github.com/pmndrs/react-spring)
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber)
- [use-element-size](https://github.com/alloc/use-element-size)

&nbsp;

## Prior art

- [fastdom](https://github.com/wilsonpage/fastdom)
- [framesync](https://github.com/Popmotion/popmotion/tree/master/packages/framesync)
