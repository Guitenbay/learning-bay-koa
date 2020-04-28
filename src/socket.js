const socket  = require('socket.io');
const fs      = require('fs');
const path    = require('path');
const cp      = require('child_process');
const logger  = require('./log4').socketLogger;

const io = socket();

const TIMEOUT = 10000; // 10s

io.on('connection', socket => {
  logger.info(`client ${socket.id} connected!`);
  socket.on('disconnect', () => logger.info(`client ${socket.id} disconnected!`));
  
  socket.on('code', content => {
    logger.info(`client ${socket.id} emit code message.`);
    const { extname, filename, uid, codeContent } = content;
    const totalname = `${filename}-${uid}.${extname}`;
    const totalPath = path.join(__dirname, `/cache-code/${totalname}`);
    // 创建并写入
    // fs.writeFileSync(totalPath, `try{${codeContent}}catch(err){
    //   const arr = err.stack.match(/^[^\\(\\)]*\\([^\\(\\)]*:(\\d+):(\\d+)\\)/);
    //   if (arr[1] === '1') arr[2] -= 4;
    //   console.log(\`\${err.name}: \${err.message} in line \${arr[1]}, column \${arr[2]}\`);}`);
    fs.writeFileSync(totalPath, `const {NodeVM, VMScript} = require('vm2');
    const vm = new NodeVM({
        console: 'inherit',
        sandbox: {},
    });
    try {
      var script = new VMScript(\`${codeContent}\`).compile();
    } catch (err) {
      console.error('Failed to compile script.', err);
    }
    try {
      vm.run(script);
    } catch (err) {
      console.error('Failed to execute script.', err);
    }
    process.on('uncaughtException', (err) => {
      console.error('Asynchronous error caught.', err);
    })`);
    try {
      let child_stoped = false;
      const child = cp.spawn("node", [`${totalname}`], { 
        cwd: path.join(__dirname, `/cache-code/`), detached: true, encoding: 'utf8'
      });
      child.unref();
      child.stdout.on("data", (data) => {
        socket.emit('code-output', data.toString('utf-8'))
      });
      // 报错时
      let buffer = '';
      child.stderr.on("data", (data) => {buffer += data.toString('utf-8')})
      child.stderr.on("end", () => {
        const err = buffer;
        const rowList = err.split("\n");
        if (rowList.length > 4) {
          // const arr = rowList[5].match(/^[^\(\)]*\([^\(\)]*:(\d+):(\d+)\)/);
          // rowList[4] += ` in line ${arr[1]}, column ${arr[2]}`;
          // socket.emit('code-output', rowList.slice(1, 5).join("\n"));
          if (rowList[0].startsWith('Failed to compile script.')) {
            rowList[0] = rowList[0].replace('vm', 'index');
            socket.emit('code-output', rowList.slice(0, 5).join("\n"));
          } else if (rowList[0].startsWith('Failed to execute script.')) {
            socket.emit('code-output', rowList[0]);
          } else if (rowList[0].startsWith('Asynchronous error caught.')) {
            socket.emit('code-output', buffer);
          } else {
            const line = rowList[0].match(/^[^\(\)]*:(\d+)/)[1];
            rowList[1] = rowList[1].replace('var script = new VMScript(`', '').trim();
            rowList[4] += ` in line ${line}`
            socket.emit('code-output', rowList.slice(1, 5).join("\n"))
          }
        } else {
          socket.emit('code-output', buffer);
        }
      })
      // 子进程退出
      child.on('exit', function(code, signal){
        child_stoped = true;
        socket.emit('code-exit');
        // 删除文件
        fs.unlinkSync(totalPath);
      });
      setTimeout(() => {
        if (!child_stoped) {
          socket.emit('code-output', "> 超过本平台设置的程序允许运行时间，程序即将退出 <")
          child.kill("SIGKILL");
        }
      }, TIMEOUT);
    } catch(error) {
      socket.emit('code-output', error.toString());
    }
  })
})


module.exports = io;