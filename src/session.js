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
    .get('/user/knowledge/graph', async ctx => {
      if (ctx.session.userInfo) {
        const { courseUri } = ctx.request.query;
        const resp = await axios.get(Config.fusekiURL+"/user/knowledge/graph", 
          { params: { userUri: ctx.session.userInfo.uri, courseUri } });
        ctx.body = resp.data;
      } else {
        ctx.body = { res: false };
      }
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
          let knowledgeStates = [];
          const userUri = ctx.session.userInfo.uri;
          // 若通过检验，则设置知识状态为 3
          if (analyseResult.checkResult) knowledgeStates = analyseResult.updateKeList.map(uri => ({uri, state: 3}));
          // 否则设为 -1，表示从原有状态减一
          else knowledgeStates = analyseResult.updateKeList.map(uri => ({uri, state: -1}));
          // 更新知识状态
          const params = Object.assign({ userUri }, { knowledgeStates });
          const resp = await axios.post(Config.fusekiURL+"/user/knowledge-state", params, {headers: {'Content-Type': 'application/json'}});
          // 若成功更新知识状态
          if (resp.data.res) {
            if (analyseResult.checkResult) {
              const { data } = await axios.get(Config.fusekiURL+"/recommend", {params: {uri: userUri}});
              ctx.body = { res: true, data: { result: analyseResult.checkResult, list: data.data }};
            } else {
              const { data } = await axios.get(Config.fusekiURL+"/recommend/review", {params: {uri: userUri}});
              ctx.body = { res: true, data: { result: analyseResult.checkResult, list: data.data }};
            }
            return;
          }
        }
        ctx.body = { res: false };
      }
    })
  return router;
}

module.exports = setSessionRoute;