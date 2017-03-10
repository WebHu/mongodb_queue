/**
 * fileName:node_http02.js
 * author:gamehu
 * date:2017/2/27 17:10
 * desc:身份验证
 */

var https = require("https");
//restler模块封装https请求
var rest = require("restler");

//导出方法（通过access_token校验身份信息）
exports.accessToken = function (url, token) {
    var p = new Promise(function (resolve, reject) {
        rest.post(url, {
            data: {token: token},
        }).on('complete', function (data) {
            // console.log(data)
            resolve(data); // 返回请求结果
        });
    });
    return p;
};
