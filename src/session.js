const fs      = require('fs');
const path    = require('path');
const extname = path.extname;
const session = require('koa-generic-session');
const Store   = require('koa-redis');
const axios   = require("axios");

const Config  = require('./config');
const { analyse, stat } = require('./utils');

function setSessionRoute(app, router) {
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
    // 分析代码
    .post('/code/analyse', async ctx => {
      if (!ctx.session.userInfo) ctx.body = { res: false, data: "未登录，无法解锁此功能" }
      else {
        const { code, testFilename } = ctx.request.body;
        const fpath = path.join(__dirname, "/test/", testFilename);
        const fstat = await stat(fpath);
        if (fstat.isFile()) {
          ctx.type = extname(testFilename);
          const checks = JSON.parse(fs.readFileSync(fpath));
          const analyseResult = analyse(code, checks);
          ctx.body = { res: true, data: analyseResult };
        } else {
          ctx.body = { res: false };
        }
      }
    })
  return router;
}

module.exports = setSessionRoute;