/**
 * fileName:util.js
 * author:gamehu
 * date:2017/3/23 17:57
 * desc:工具类
*/

//设置响应内容
var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};
exports.sendJSONresponse=sendJSONresponse;
