/**
 * fileName:longpolling_validate.js
 * author:gamehu
 * date:2017/3/20 15:49
 * desc:long polling 验证器
*/

var log = require("../models/logger");
var logger = log.logger;
//通过longpolling获取时校验  注意：longpolling链接未持久化，即每次重启服务则消失
exports.getQValidate= function (longpoll,c_url) {
    var p=new Promise(function (resove,reject) {
        if (global.express_longpoll_emitters[c_url]) {
            //已存在
            reject(true);
        }else {
            resove(false);
        }
    });
    return p;
}

//中间件用于校验提交的数据,put/post
exports.validateData=function (req, res, next) {
    var p = new Promise(function (resolve, reject) {
        //校验
        var clientReference = req.body.clientReference;
        var payload = req.body.payload;
              if (!clientReference || !payload ) {
            reject("数据校验不通过");
        } else {
            try {
                //判断是否为标准的json
                JSON.parse(payload);
                resolve(1);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }
    });
    return p;


}
//get请求校验
exports.validateDataForGet=function (req, res, next) {
    //校验
    var clientReference = req.query.clientReference;
    console.log(clientReference + "........");
    if (!clientReference) {
        return 0;
    } else {
        return 1;
    }

}