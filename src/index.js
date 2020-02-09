const Koa = require('koa');
const Router = require('@koa/router');
const logger = require('koa-logger');
const cors = require('koa-cors');
const fs = require('fs');
const path = require('path');
const extname = path.extname;
const Utils = require('./utils');
const koaBody = require('koa-body');
const Base64 = require('js-base64').Base64;

const app = new Koa();
const router = new Router();

// logger
app.use(logger());
app.use(cors());

app.use(koaBody({
  multipart:true, // 支持文件上传
}));

// router
router
  .get('/', (ctx, next) => {
    ctx.body = 'Hello world';
  })
  .get('/video/:filename', async (ctx) => {
    const fpath = path.join(__dirname, ctx.path);
    const fstat = await Utils.stat(fpath);
    if (fstat.isFile()) {
      ctx.type = extname(ctx.params.filename);
      ctx.body = fs.createReadStream(fpath);
    }
  })
  .post('/video/:filename', ctx => {
    const content = Base64.decode(Object.keys(ctx.request.body)[0]);
    console.log(content);
    fs.appendFileSync(path.join(__dirname, `/video/${ctx.params.filename}`), `${content}\r\n`);
    ctx.body = JSON.stringify({ state: 'ok' });
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
  console.log('start listening on 3000...')
});