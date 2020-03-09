const Router  = require('@koa/router');
const fs      = require('fs');
const path    = require('path');
const extname = path.extname;
const Base64  = require('js-base64').Base64;
const Utils   = require('./utils');

const router  = new Router();

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
    try { 
      fs.writeFileSync(path.join(__dirname, `/audio/${ctx.params.filename}`), buffer); 
      ctx.body = { res: true }; 
    } catch(err) {
      console.error(err);
      // rs.close(); ws.close();
      ctx.body = { res: false };
    }
  });

module.exports = router;