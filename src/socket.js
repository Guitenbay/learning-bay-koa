const socket  = require('socket.io');
const fs      = require('fs');
const path    = require('path');
const cp      = require('child_process');
const Base64  = require('js-base64').Base64;

const io = socket();

io.on('connection', socket => {
  console.log(`client ${socket.id} connected!`);
  socket.on('disconnect', () => console.log(`client ${socket.id} disconnected!`));
  
  socket.on('code', content => {
    console.log(`client ${socket.id} emit code message.`);
    const { extname, filename, uid, codeContent } = content;
    const totalname = `${filename}-${uid}.${extname}`;
    const totalPath = path.join(__dirname, `/cache-code/${totalname}`);
    // 创建并写入
    fs.writeFileSync(totalPath, `try{${codeContent}}catch(err){
      const arr = err.stack.match(/^[^\\(\\)]*\\([^\\(\\)]*:(\\d+):(\\d+)\\)/);
      if (arr[1] === '1') arr[2] -= 4;
      console.log(\`\${err.name}: \${err.message} in line \${arr[1]}, column \${arr[2]}\`);}`);
    try {
      const child = cp.spawn("node", [`${totalname}`], { 
        cwd: path.join(__dirname, `/cache-code/`), detached: true, encoding: 'utf8'
      });
      child.stdout.on("data", (data) => {
        io.emit('code-output', data.toString('utf-8'))
      });
      // 子进程退出
      child.on('exit', function(code, signal){
        io.emit('code-exit');
        // 删除文件
        fs.unlinkSync(totalPath);
      });
    } catch(error) {
      io.emit('code-output', error.toString());
    }
  })
})


module.exports = io;