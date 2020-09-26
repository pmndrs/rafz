# rafz

Coordinate `requestAnimationFrame` calls across your app and/or libraries.

- Under 600 bytes min+gzip
- Timeout support
- Batching support (eg: `ReactDOM.unstable_batchedUpdates`)
- Uncaught errors are isolated
- Runs continuously (to reduce frame skips)

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

## Used by

- [react-spring](https://github.com/pmndrs/react-spring)
- [use-element-size](https://github.com/alloc/use-element-size)

&nbsp;

## Prior art

- [fastdom](https://github.com/wilsonpage/fastdom)
- [framesync](https://github.com/Popmotion/popmotion/tree/master/packages/framesync)
