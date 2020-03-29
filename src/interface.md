# KOA Interface

## With Session
1. url: `/login` POST
params:
```json
{
  username: string,
  password: string
}
```
result:
```json
{
  res: boolean
}
```
2. url: `/session` GET
result:
```json
{
  res: boolean,
  data?: string // username
}
```
3. url: `/session` DELETE
result:
```json
{
  res: true
}
```
4. url: `/user/analyse` POST
params:
```json
{
  code: string,
  testFilename: string
}
```
result:
```json
{
  res: boolean,
  data: {
    result: boolean,// 表示分析结果: 若为 true, data 是推荐学习课程；若为 false, data 是推荐复习课程
    list: [{
      // lessons
    }]
  }
}
```

## Without Session
1. url: `/video/:filename` GET
result: 
```js
new Blob()
```

2. url: `/video/:filename` POST
result:
```js
new Blob()
```

3. url: `/audio/:filename` GET
result:
```js
new Blob()
```

4. url: `/audio/:filename` POST
result:
```js
new Blob()
```