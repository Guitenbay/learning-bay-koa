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

/**
 * 分析代码函数
 * @param {*} code 
 * @param {*} checks 
 * @return { matchedKeList: 检测到的KElementUri数组, mismatchedKeList: 未检测到的KElementUri数组 }
 */
function analyse(code, checks) {
  let checkKeList = uniqueArr(checks.map(({learningbay_knowledge}) => learningbay_knowledge));
  let mismatchedKeList = matchedKeList = [];
  try {
    const stmts = esprima.parseScript(code, {tolerant: true, attachComment: true}).body;
    // const esprimaAnalyse = esprima.parseScript(code, {tolerant: true, comment: true});
    // const stmts = esprimaAnalyse.body;
    // console.log(esprimaAnalyse.comments);
    const mismatched = matchStmts(stmts, checks);
    if (mismatched.length !== 0) {
      mismatchedKeList = uniqueArr(mismatched.map(({learningbay_knowledge}) => learningbay_knowledge));
    }
    matchedKeList = checkKeList.filter(checkUri => {
      return !mismatchedKeList.includes(checkUri);
    })
    return { matchedKeList, mismatchedKeList };
  } catch(err) {
    // 若 code 本身有问题 matchedKeList 为空
    mismatchedKeList = checkKeList;
    return { matchedKeList, mismatchedKeList };
  }
}

function uniqueArr(arr) {
  const set = new Set(arr);
  result = [];
  set.forEach(value => {
    result.push(value);
  })
  return result;
}

/**
 * 匹配句子
 * @param {*} stmts : 句子
 * @param {*} checks : 检测数据
 */
function matchStmts(stmts, checks) {
  for (let i=0; i<stmts.length; i++) {
    if (checks.length <= 0) break;
    for (let j=0; j<checks.length; j++) {
      if (checkStmt(stmts[i], checks[j])) {
        // 匹配则移除
        checks.splice(j, 1);
        // stmts 重新开始
        i=-1;
        break;
      }
    }
  };
  return checks;
}

/**
 * 检测句子函数
 * @param {*} stmts : 句子
 * @param {*} checks : 检测数据
 */
function checkStmt(stmt, check) {
  let result = true;
  for (const key of Object.keys(check)) {
    if (/^learningbay_knowledge$/.test(key)) continue;
    if (/^learningbay_type$/.test(key)) {
      result = Object.is(typeof stmt["value"], check[key]);
    } else if (/^learningbay_include_string$/.test(key)) {
      result = stmt["value"].includes(check[key]);
    } else if (!isObject(check[key])) {
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