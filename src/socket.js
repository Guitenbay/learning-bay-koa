const socket  = require('socket.io');
const fs      = require('fs');
const path    = require('path');
const cp      = require('child_process');
const logger  = require('./log4').socketLogger;

const io = socket();

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
    fs.writeFileSync(totalPath, codeContent);
    try {
      const child = cp.spawn("node", [`${totalname}`], { 
        cwd: path.join(__dirname, `/cache-code/`), detached: true, encoding: 'utf8'
      });
      child.stdout.on("data", (data) => {
        socket.emit('code-output', data.toString('utf-8'))
      });
      // 报错时
      let buffer = '';
      child.stderr.on("data", (data) => {buffer += data.toString('utf-8')})
      child.stderr.on("end", () => {
        const err = buffer;
        const rowList = err.split("\n");
        if (rowList.length > 5) {
          const arr = rowList[5].match(/^[^\(\)]*\([^\(\)]*:(\d+):(\d+)\)/);
          rowList[4] += ` in line ${arr[1]}, column ${arr[2]}`;
          socket.emit('code-output', rowList.slice(1, 5).join("\n"));
        } else {
          socket.emit('code-output', buffer);
        }
      })
      // 子进程退出
      child.on('exit', function(code, signal){
        socket.emit('code-exit');
        // 删除文件
        fs.unlinkSync(totalPath);
      });
    } catch(error) {
      socket.emit('code-output', error.toString());
    }
  })
})


module.exports = io;