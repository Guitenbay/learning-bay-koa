const fs = require('fs');
/**
 * thunkify stat
 */

async function stat(file) {
  return new Promise(function(resolve, reject) {
    fs.stat(file, function(err, stat) {
      if (err) {
        reject(err);
      } else {
        resolve(stat);
      }
    });
  });
}

function getBuffer(ctx) {
  return new Promise((resolve, reject) => {
    try {
      let buf = [];
      let allData;
      ctx.req.on("data",(data)=>{
          buf.push(data);
      });
      ctx.req.on("end",(data)=>{
        allData = Buffer.concat(buf);
        resolve(allData);
      })
    } catch(err) {
      reject(err);
    }
  });
}

module.exports = { stat, getBuffer }