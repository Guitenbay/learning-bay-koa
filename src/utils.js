const fs = require('fs');
const esprima = require('esprima');
// const knowledgeTable = require('./knowledge-table');
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

// code analyse
/**
 * type Statement = BlockStatement | BreakStatement | ContinueStatement |
    DebuggerStatement | DoWhileStatement | EmptyStatement |
    ExpressionStatement | ForStatement | ForInStatement |
    ForOfStatement | FunctionDeclaration | IfStatement |
    LabeledStatement | ReturnStatement | SwitchStatement |
    ThrowStatement | TryStatement | VariableDeclaration |
    WhileStatement | WithStatement;
 */
function analyse(code, checks) {
  let updateKeList = checks.map(({learningbay_knowledge}) => learningbay_knowledge);
  let checkResult = false;
  try {
    const stmts = esprima.parseScript(code, {tolerant: true}).body;
    const mismatched = matchStmts(stmts, checks);
    if (mismatched.length !== 0) {
      updateKeList = mismatched.map(({learningbay_knowledge}) => learningbay_knowledge);
    } else {
      checkResult = true;
    }
    return { checkResult, updateKeList };
  } catch(err) {
    return { checkResult, updateKeList };
  }
}

function matchStmts(stmts, checks) {
  for (let i=0; i<stmts.length; i++) {
    if (checks.length <= 0) break;
    for (let j=0; j<checks.length; j++) {
      if (checkStmt(stmts[i], checks[j])) {
        // 匹配则移除
        checks.splice(j, 1);
        break;
      }
    }
  };
  return checks;
}

function checkStmt(stmt, check) {
  let result = true;
  for (const key of Object.keys(check)) {
    if (/^learningbay_.*/.test(key)) continue;
    if (!isObject(check[key])) {
      result = Object.is(stmt[key], check[key]);
    } else {
      result = checkStmt(stmt[key], check[key]);
    }
    if (!result) break;
  };
  return result;
}

function isObject(target) {
  return target !== null && (typeof target === 'object');
}

module.exports = { stat, getBuffer, analyse }