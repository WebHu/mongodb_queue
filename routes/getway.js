/**
 * fileName:getway.js
 * author:gamehu
 * date:2017/3/6 15:06
 * desc:异步数据交换中心路由
 */

var express = require("express");
//获取路由对象
var router = express.Router();
//注：post请求获取参数需要
var bodyParser = require("body-parser");
var https = require("https");
//引入dao
var queueDao = require('../dao/queueDao');

//设置响应内容
var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};
//中间件用于校验提交的数据,put/post
function validateData(req, res, next) {
    var p = new Promise(function (resolve, reject) {
        //校验
        var clientReference = req.body.clientReference;
        var payload = req.body.payload;
        if (!clientReference || !payload) {
            resolve(0);
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
function validateDataForGet(req, res, next) {
    //校验
    var clientReference = req.query.clientReference;
    console.log(clientReference + "........");
    if (!clientReference) {
        return 0;
    } else {
        return 1;
    }

}
var curr_queue;
//校验是否存在queue
router.use('/', function (req, res, next) {
    var h = global.queues_map;

    console.log("....." + h.count());
    if (req.method === "PUT" || req.method === "POST") {
        curr_queue = h.get(req.body.queueScope);
    } else if (req.method === "GET") {
        curr_queue = h.get(req.query.queueScope);
    }
    console.log("curr_queue:" + curr_queue);
    if (!curr_queue) {
        console.log("req.body.queueScope.." + req.body.queueScope);
        sendJSONresponse(res, 200, {
            "message": "数据校验不通过....no collection"
        });

    } else {
        next();
    }
});

//添加前数据校验
router.use('/', function (req, res, next) {
    if (req.method === "PUT" || req.method === "POST") {
        console.log("put...");
        validateData(req, res, next).then(function (v) {
            next();

        }, function (err) {
            console.error(err);
            sendJSONresponse(res, 200, {
                "message": "数据校验未通过.."
            });
        });

    } else if (req.method === "GET") {
        next();
        /*        var v = validateDataForGet(req, res, next);
         if (v === 0) {
         sendJSONresponse(res, 200, {
         "message": "数据校验未通过..clientReference"
         });
         return;
         } else {
         next();
         }*/
    }

});

//校验数据是否正确
router.use('/ackQueue', function (req, res, next) {
    console.log("ackQueue:" + req.body.ack);
    if (req.method === "POST") {
        //获取ack
        var ack = req.body.ack;
        if (!ack) {
            sendJSONresponse(res, 200, {"message": "数据校验未通过"});
        } else {
            next();
        }
    }


});
//header的body部分转换为json
var jsonParser = bodyParser.json();


router.put("/addQueue", jsonParser, function (req, res, next) {
    // var queueName = "tms_queue";
    //添加到queue
    queueDao.puQueue(curr_queue, req).then(function (data) {
        console.log("data:" + data);
        if (!data || data == 0) {
            sendJSONresponse(res, 200, {
                "message": "queue add failed.."
            });

        } else {
            sendJSONresponse(res, 200, {
                "message": "queue add successful....."
            });

        }
    });
});


//获取消息队列中的信息
router.get('/getQueue', function (req, res, next) {

    //var queueName = 'tms_queue';
    console.log("get...." + curr_queue);
    //获取消息，先进先出
    queueDao.intervalQueue(curr_queue).then(function (data) {
        if (data) {
            sendJSONresponse(res, 200, data);
        } else {
            sendJSONresponse(res, 200, {"message": "没有数据"});
        }
    });
});


//修改状态为已确认，处理queue
router.post('/ackQueue', function (req, res, next) {

    var ack = req.body.ack;
    queueDao.ackQueue(curr_queue, ack).then(function (data) {
        console.log(data);
        sendJSONresponse(res, 200, {"message": "处理成功"});

    }, function (err) {
        console.error(err);
        sendJSONresponse(res, 200, {"message": "处理失败"});

    });

});


//导出路由
module.exports = router;