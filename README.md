# rafz

```ts
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
raf.onLayout(() => {})

// Set a timeout that runs on nearest frame
raf.setTimeout(fn, delay)

// Clear all handlers
raf.clear()

// Use a polyfill
raf.use(require('@essentials/raf').raf)
```
