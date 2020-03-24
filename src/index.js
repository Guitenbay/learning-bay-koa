const Koa     = require('koa');
const logger  = require('koa-logger');
const cors    = require('koa-cors');
const koaBody = require('koa-body');
const Http    = require('http')

const router  = require('./router');
const io      = require('./socket');
const setSessionRouter = require('./session');

const app     = new Koa();

// logger
app.use(logger());
app.use(cors({
  credentials: true,
  origin: 'http://localhost:8080'
}));

app.use(koaBody({
  multipart:true, // 支持文件上传
}));

sessionRouter = setSessionRouter(app, router);

app
  .use(sessionRouter.routes())
  .use(sessionRouter.allowedMethods());

const server = Http.createServer(app.callback());
io.attach(server);

server.listen(3000, () => {
  console.log('start listening on 3000...')
});