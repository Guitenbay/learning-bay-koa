// const fusekiURL = 'http://139.196.179.105:8000/fuseki';
const fusekiURL = 'http://localhost:8000/fuseki';

const corsConf = {
  origin: (ctx) => {
    const origin = ctx.request.header.origin;
    if (['http://localhost', 'http://139.196.179.105', 'http://www.biki.wiki'].includes(origin)) {
      return origin;
    }
  }
}

const redisConf = {
  host: 'localhost'
}

module.exports = { fusekiURL, corsConf, redisConf };