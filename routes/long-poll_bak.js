/**
 * fileName:long-poll.js
 * author:gamehu
 * date:2017/3/14 14:06
 * desc:长轮询实现消息的推送
 */
var express = require('express');
var router = express.Router();
// with router
var longpoll = require("express-longpoll")(router);
var init = require('../models/queue_init');
//注：post请求获取参数需要
var bodyParser = require("body-parser");
var https = require("https");
//引入dao
var queueDao = require('../dao/queueDao');
//log
var log = require("../models/logger");
var logger = log.logger;
//用于打印http日志
log.use(router);
//引入validate
var vali = require("./longpolling_validate");

//为url绑定事件
longpoll.create("/getQueueForTms");

longpoll.create("/getQueueForTms/:id", function (req, res, next) {
    req.id = req.params.id;
    next();
});
//中间件校验
router.use('/addQueueForTms', function (req, res, next) {
    try {
        //    var c_url = req.baseUrl.substr(0,req.baseUrl.lastIndexOf("/")).replace("add","get");
        /*  var c_url;
         if (req.params.id) {
         c_url = "/getQueueForTms/:id";
         } else {
         c_url = "/getQueueForTms";
         }
         //校验url是否存在
         vali.getQValidate(longpoll, c_url, req).then(function (data) {
         console.log("add.." + c_url);
         if (req.params.id) {
         longpoll.create(c_url, function (req, res, next) {
         req.id = req.params.id;
         next();
         });
         } else {
         longpoll.create(c_url);
         next();
         }
         }, function (err) {
         // logger.error(err);
         next();
         }).catch(function (err) {
         logger.error(err);
         });*/
        next();
    } catch (err) {
        logger.error(err);
    }

});
//添加前数据校验
/*router.use('/addQueueForTms', function (req, res, next) {
 if (req.method === "PUT" || req.method === "POST") {
 /!*        validateData(req, res, next).then(function (v) {
 next();
 }, function (err) {
 console.error(err);
 sendJSONresponse(res, 200, {
 "message": "数据校验未通过"
 });
 });*!/
 console.log("hehe......");
 next();
 }

 });*/


//获取前数据校验
router.use('/getQueueForTms', function (req, res, next) {
    var c_url;
    if (req.params.id) {
        c_url = "/getQueueForTms/:id";
    } else {
        c_url = "/getQueueForTms";
    }
    if (req.method === "GET") {
        //校验用户权限
        //  c_url = req.baseUrl;
        //校验url是否存在
        //    vali.getQValidate(longpoll, c_url, req).then(function (data) {
        /*  longpoll.create(c_url, function (req, res, next) {
         console.log("create..id:" + id);
         req.id = id;
         }).then(function (data) {
         next();
         }, function (err) {
         logger.error(err);
         next();
         }).catch(function (err) {
         logger.error(err);
         });*/

        next();
    }

});

//获取所有
/*router.get("/getQueueForTms", function (req, res, next) {
    console.log("getQueueForTms queue..");
    //获取消息，先进先出
    queueDao.getQue("tms_queue", null).then(function (data) {
        if (data) {
            init.sendJSONresponse(res, 200, data);
        } else {
            //init.sendJSONresponse(res, 200, {"message": "没有数据"});
            //创建监听
            //  longpoll.create("/getQueueForTms");
        }
    }, function (err) {
        logger.error(err);
    }).catch(function (err) {
        logger.error(err);
    });
});*/


//获取id对应的queue
/*router.get("/getQueueForTms/:id", function (req, res, next) {
 //debugger;
 var id = req.params.id;
 //校验url是否存在
 //获取消息，先进先出
 getQueueById("tms_queue", id, res);
 // next();

 });
 //根据id获取对应的queue
 function getQueueById(queueName, id, res) {
 queueDao.getQue(queueName, {'clientReference': id}).then(function (data) {
 if (data) {
 console.log(".................data:" + data);
 init.sendJSONresponse(res, 200, data);
 } else {
 getQueueById(queueName, id);
 }
 }, function (err) {
 logger.error(err);
 }).catch(function (err) {
 logger.error(err);
 });
 }*/


router.put("/addQueueForTms", function (req, res) {
    queueDao.puQueue("tms_queue", req, longpoll).then(function (data) {
        if (!data) {
            init.sendJSONresponse(res, 200, {
                "message": "发送失败"
            });
            return;
        } else {
            //推送id到所有/getQueueForTms请求
            // longpoll.publish("/getQueueForTms", data);
            queueDao.getQue("tms_queue").then(function (data) {
                if (data) {
                    //init.sendJSONresponse(res, 200, data);
                    longpoll.publish("/getQueueForTms", data);
                }
            }, function (err) {
                logger.error(err);
            });
            init.sendJSONresponse(res, 200, {
                "message": "发送成功"
            });

            return;
        }
    }, function (err) {
        logger.error(err);
    }).catch(function (err) {
        logger.error(err);
    });

    //  res.send("Sent data!");
});

//pushlishToid
router.put("/addQueueForTms/:id", function (req, res) {
    var id = req.params.id;
    queueDao.puQueue("tms_queue", req, longpoll).then(function (data) {
        if (!data) {
            init.sendJSONresponse(res, 200, {
                "message": "发送失败"
            });
            return;
        } else {
            //推送到所有/getQueueForTms请求
            queueDao.getQue("tms_queue", {'clientReference': id}).then(function (data) {
                if (data) {
                    console.log("id:" + id + ",data:" + data);
                    longpoll.publishToId("/getQueueForTms/:id", id, data);
                    return;
                }
            }, function (err) {
                logger.error(err);
            });
            init.sendJSONresponse(res, 200, {
                "message": "发送成功"
            });
            return;
        }
    }, function (err) {
        logger.error(err);
    }).catch(function (err) {
        logger.error(err);
    });

    //  res.send("Sent data!");
});

//慎用
/*process.on('uncaughtException', function () {
 logger.error("uncaughtException:" + err);
 });*/
module.exports = router;



