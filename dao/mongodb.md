#mongodb的操作
## 一：Insert操作
> 文档是采用“K-V”格式存储的，我们知道JSON里面Value，可能是“字符串”，可能是“数组”，又有可能是内嵌的一个JSON对象，相同的方式也适合于BSON。
 >> 常见的插入操作也就两种形式存在：“单条插入”和“批量插入”。
    ①  单条插入
         insert
    ② 批量插入
         insertMany

## 二：Find操作

* <1> ： >, >=, <, <=, !=, =。对应mongodb："$gt", "$gte", "$lt", "$lte", "$ne", "没有特殊关键字"
* <2> ：And，OR，In，NotIn。对应mongodb："无关键字“, "$or", "$in"，"$nin"
* <3> ：在mongodb中还有一个特殊的匹配，那就是“正则表达式”
    ![正则表达式](http://pic002.cnblogs.com/images/2012/214741/2012021900232833.png)
* <4> 有时查询很复杂，可以用$where


