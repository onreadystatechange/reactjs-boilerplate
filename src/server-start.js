import 'config/environment'
import 'helpers/cssModulesHook'
import 'helpers/cleanAssetJson'
import { argv } from 'yargs'
import http from 'http'
import serve from 'koa-static'
import open from 'open'
import hotReload from 'helpers/hotReload'
import { isEnv } from 'app/utils'
import { ROOT, SERVER, SOCKETS, STATIC } from 'config/paths'
import { isomorphicTools, isomorphicPlugin } from 'server/isomorphicTools'
import app from 'server-instance'

const log = debug('app')

if (isEnv('development')) {
  isomorphicPlugin.development()
  hotReload(app)
} else {
  const static_cache_expired = 1000 * 60 * 60 * 24
  app.use(serve(STATIC, { maxage: static_cache_expired }))
}

isomorphicTools.server(ROOT, () => {
  if (isEnv('development')) {
    app.use(async (ctx, next) => {
      const { rootRouter, setRoutes } = require(`${SERVER}/router`)
      setRoutes(isomorphicTools.assets())
      await rootRouter.routes()(ctx, next)
    })
  } else {
    const { rootRouter, setRoutes } = require(`${SERVER}/router`)
    setRoutes(isomorphicTools.assets())
    app.use(rootRouter.routes())
  }
})

const server = http.createServer(app.callback())

// If SOCKET_FLAG is true, open socket
if(process.env.SOCKET_FLAG === 'true') {
  global.socketServer = require(SOCKETS)(server)
}

server.listen(process.env.PORT, () => {
  const URI = `http://localhost:${process.env.PORT}`
  log('Serving', URI)
  if (argv.open || argv.o) open(URI)
})
