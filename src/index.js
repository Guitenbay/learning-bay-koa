const Koa     = require('koa');
const cors    = require('@koa/cors');
const koaBody = require('koa-body');
const Http    = require('http');

const router  = require('./router');
const io      = require('./socket');
const setSessionRouter = require('./session');
const Config  = require('./config');
const { 
  httpLogger, systemLogger 
} = require('./log4');

const app     = new Koa();

// logger
app.use(httpLogger());
app.use(cors({
  credentials: true,
  origin: Config.corsConf.origin
}));

app.use(koaBody({
  multipart:true, // 支持文件上传
}));

sessionRouter = setSessionRouter(app, router);

app
  .use(sessionRouter.routes())
  .use(sessionRouter.allowedMethods());

app.on('error', err => systemLogger.error(err));

const server = Http.createServer(app.callback());
io.attach(server);

server.listen(3000, () => {
  console.log('start listening on 3000...')
});