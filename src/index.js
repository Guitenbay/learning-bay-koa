const Koa     = require('koa');
const Router  = require('@koa/router');
const logger  = require('koa-logger');
const cors    = require('koa-cors');

const fs      = require('fs');
const path    = require('path');
const extname = path.extname;
const Utils   = require('./utils');
const koaBody = require('koa-body');
const cp      = require('child_process');
const Base64  = require('js-base64').Base64;

const app     = new Koa();
const router  = new Router();

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
    } else {
      ctx.body = { res: false };
    }
  })
  .post('/video/:filename', ctx => {
    const content = Base64.decode(Object.keys(ctx.request.body)[0]);
    fs.appendFileSync(path.join(__dirname, `/video/${ctx.params.filename}`), `${content}\r\n`);
    ctx.body = { res: true };
  })
  .post('/code/:extname/:filename', async ctx => {
    // /code/:extname/:filename?uid=:uid
    const { extname, filename } = ctx.params;
    const { uid } = ctx.query;
    const totalname = `${filename}-${uid}.${extname}`;
    const totalPath = path.join(__dirname, `/cache-code/${totalname}`);
    const codeContent = Base64.decode(ctx.request.body.code);
    fs.writeFileSync(totalPath, `${codeContent}`);
    let output = '';
    try {
      output = cp.execSync(`node ${totalname}`, {
        cwd: path.join(__dirname, `/cache-code/`), timeout: 3000, windowsHide: true, encoding: 'utf8'
      });
    } catch(error) {
      output = error.toString().split('\r\n\r\n')[1].slice(0, 100);
    }
    ctx.body = { res: true, result: output };
    fs.unlinkSync(totalPath);
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
  console.log('start listening on 3000...')
});