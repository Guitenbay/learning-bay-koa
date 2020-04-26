const path = require('path');//引入原生path模块
const log4js = require('koa-log4');//引入koa-log4

log4js.configure({
  appenders: {
    // http 访问日志
    http: {
      type: 'dateFile',
      pattern: '-yyyy-MM-dd.log', // 通过日期来生成文件
      alwaysIncludePattern: true, // 文件名始终以日期区分
      encoding:"utf-8",
      filename: path.join('logs/', 'http.log') // 生成文件路径和文件名
    },
    // socket 连接日志
    socket: {
      type: 'dateFile',
      pattern: '-yyyy-MM-dd.log', // 通过日期来生成文件
      alwaysIncludePattern: true, // 文件名始终以日期区分
      encoding:"utf-8",
      filename: path.join('logs/', 'socket.log') // 生成文件路径和文件名
    },
    // 系统日志
    application: {
      type: 'dateFile',
      pattern: '-yyyy-MM-dd.log', // 通过日期来生成文件
      alwaysIncludePattern: true, // 文件名始终以日期区分
      encoding:"utf-8",
      filename: path.join('logs/', 'application.log') // 生成文件路径和文件名
    },
    out: {
      type: 'console'
    }
  },
  categories: {
    default: { appenders: [ 'out' ], level: 'info' },
    http: { appenders: [ 'http'], level: 'all' },
    socket: { appenders: [ 'socket'], level: 'info' },
    application: { appenders: [ 'application' ], level: 'warn' }
  }
});

module.exports.httpLogger = () => log4js.koaLogger(log4js.getLogger('http'), {
  // select the level all access logs will be set to, or use "auto" to choose depending on the status code (see next option)
  level: "auto",
  // if `level` is set to "auto" the default rule will map 200-299 to INFO, 300-399 to WARN and 400-599 to ERROR.
  // you can override this behavior by setting your own custom levelMapper.
  // (the example is the default implementation, do not copy unless you want to modify it)
  levelMapper: function(statusCode) {
    if (statusCode >= 400)
      return levels.ERROR
    if (statusCode >= 300)
      return levels.WARN
    return levels.INFO
  }
}); //记录 http 的日志
module.exports.socketLogger = log4js.getLogger('socket');
module.exports.systemLogger = log4js.getLogger('application');  //记录所有应用级别的日志