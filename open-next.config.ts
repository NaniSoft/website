import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// OpenNext Cloudflare config. Uses the default worker bundle; extend here when
// you need custom middleware, cache, or streaming overrides.
// https://opennext.js.org/cloudflare
export default defineCloudflareConfig()