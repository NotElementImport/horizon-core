import { comp } from '../bundle/component.mjs'
import { useCacheControl, useSyncSignal } from '../bundle/shared.mjs'
import { toDelay, useId, useRequestCapture } from '../bundle/helpers.mjs'
import { defineApp, isClient } from '../bundle/app.mjs'

const app = defineApp({ devMode: true })
const cache = useCacheControl({ shared: true })

const main = comp((_, { $ }) => {
  const userHash = useSyncSignal('none', {
    key: 'user-hash',
    onServerInit(signal) {
      signal.value = cache.tryRead('#user-hash', () => cache.write('#user-hash', useId(), toDelay('10 sec')))
    }
  })

  
  $('div', {
    'aria-label': 'User hash value',
    html: userHash
  })
})

Deno.serve(async (_) => {
  const request = useRequestCapture(_.url, Object.fromEntries(_.headers.entries()))

  console.log(request)

  return new Response(
    '', {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    }
  );
});