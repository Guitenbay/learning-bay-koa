const Koa     = require('koa');
const logger  = require('koa-logger');
const cors    = require('koa-cors');
const koaBody = require('koa-body');
const Http    = require('http')
const session = require('koa-generic-session');
const Store   = require('koa-redis');
const axios   = require("axios");

const router  = require('./router');
const io      = require('./socket');
const Config  = require('./config');

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
// Session start
app.keys = ['login secret', 'learningbay'] // 加密密钥
app.use(session({
  key: 'koa:sess',
  ttl: 3600000, // 单位 ms ，设置有效时间 1 小时
  store: new Store()
}))
router
  .post('/login', async ctx => {
    // if (ctx.session.userInfo) {
    //   ctx.body = { res: false, data: "您已登录" }
    // } else {
      const resp = await axios.post(`${Config.fusekiURL}/user/login`, ctx.request.body, {headers: {'Content-Type': 'application/json'}});
      const { res, data } = resp.data;
      if (res) {
        ctx.session.userInfo = data;
      }
      ctx.body = { res };
    // }
  })
  .get('/session', async ctx => {
    if (ctx.session.userInfo) {
      ctx.body = { res: true, data: ctx.session.userInfo.username };
    } else {
      ctx.body = { res: false }
    }
  })
  .delete('/session', async ctx => {
    ctx.session = undefined;
    ctx.body = { res: true };
  })
// Session end
app
  .use(router.routes())
  .use(router.allowedMethods());

const server = Http.createServer(app.callback());
io.attach(server);

server.listen(3000, () => {
  console.log('start listening on 3000...')
});