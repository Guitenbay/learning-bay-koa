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
  .get('/video/:filename', async ctx => {
    const fpath = path.join(__dirname, ctx.path);
    const fstat = await Utils.stat(fpath);
    if (fstat.isFile()) {
      ctx.type = extname(ctx.params.filename);
      ctx.body = fs.createReadStream(fpath);
    } else {
      ctx.body = { res: false };
    }
  })
  .post('/video/:filename', async ctx => {
    const buffer = await Utils.getBuffer(ctx);
    const content = Base64.decode(buffer.toString('utf-8'));
    try {
      fs.appendFileSync(path.join(__dirname, `/video/${ctx.params.filename}`), `${content}\r\n`);
    } catch(err) { console.error(err); ctx.body = {res: false} }
    ctx.body = { res: true };
  })
  .get('/audio/:filename', async ctx => {
    const fpath = path.join(__dirname, ctx.path);
    const fstat = await Utils.stat(fpath);
    if (fstat.isFile()) {
      ctx.type = extname(ctx.params.filename);
      ctx.body = fs.createReadStream(fpath);
    } else ctx.body = { res: false };
  })
  .post('/audio/:filename', async ctx => {
    const buffer = await Utils.getBuffer(ctx); 
    // const ws = fs.createWriteStream();
    // const rs = fs.createReadStream(buffer);
    try { 
      fs.writeFileSync(path.join(__dirname, `/audio/${ctx.params.filename}`), buffer); 
      ctx.body = { res: true }; 
    } catch(err) {
      console.error(err);
      // rs.close(); ws.close();
      ctx.body = { res: false };
    }
  })
  .post('/code/:extname/:filename', async ctx => {
    // /code/:extname/:filename?uid=:uid
    const { extname, filename } = ctx.params;
    const { uid } = ctx.query;
    const totalname = `${filename}-${uid}.${extname}`;
    const totalPath = path.join(__dirname, `/cache-code/${totalname}`);
    const codeContent = Base64.decode(ctx.request.body.code);
    // 创建并写入
    fs.writeFileSync(totalPath, `try{${codeContent}}catch(err){
      const arr = err.stack.match(/^[^\\(\\)]*\\([^\\(\\)]*:(\\d+):(\\d+)\\)/);
      if (arr[1] === '1') arr[2] -= 4;
      console.log(\`\${err.name}: \${err.message} in line \${arr[1]}, column \${arr[2]}\`);}`);
    let output = '';
    try {
      output = cp.execSync(`node ${totalname}`, {
        cwd: path.join(__dirname, `/cache-code/`), timeout: 3000, windowsHide: true, encoding: 'utf8'
      });
    } catch(error) {
      output = error.toString()
    }
    ctx.body = { res: true, result: output };
    // 删除文件
    fs.unlinkSync(totalPath);
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
  console.log('start listening on 3000...')
});