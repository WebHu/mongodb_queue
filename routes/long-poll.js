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
/*
 longpoll.create("/routerpoll");

 router.get("/", function (req, res) {
 longpoll.publish("/routerpoll", {
 text: "Some data"
 });
 res.send("Sent data!");
 });*/
router.use('/',function (req,res,next) {
    console.log("all:"+global.express_longpoll_emitters["/getQueueForTms"]);
    if (!global.express_longpoll_emitters["/getQueueForTms"]) {
        longpoll.create("/getQueueForTms");
    }
    next();
});
//添加前数据校验
router.use('/addQueueForTms', function (req, res, next) {
    console.log("addQueueForTms...");
    if (req.method === "PUT" || req.method === "POST") {
        /*        validateData(req, res, next).then(function (v) {
         next();
         }, function (err) {
         console.error(err);
         sendJSONresponse(res, 200, {
         "message": "数据校验未通过"
         });
         });*/
        console.log("hehe......");
        next();
    }

});

/*router.get("/getQueueForTms", function (req, res,next) {
    console.log("ss");
    //获取消息，先进先出
    queueDao.getQue("tms_queue").then(function (data) {
        if (data) {
            init.sendJSONresponse(res, 200, data);
        } else {
            //init.sendJSONresponse(res, 200, {"message": "没有数据"});
            //创建监听
          //  longpoll.create("/getQueueForTms");
        }
    },function (err) {
        console.error(err);
    });

    //  res.send("Sent data!");
});*/



router.put("/addQueueForTms", function (req, res) {
    queueDao.puQueue("tms_queue", req,longpoll).then(function (data) {
        if (!data) {
            init.sendJSONresponse(res, 200, {
                "message": "发送失败"
            });

        } else {
            //推送到所有/getQueueForTms请求
            queueDao.getQue("tms_queue").then(function (data) {
                if (data) {
                    //init.sendJSONresponse(res, 200, data);
                    longpoll.publish("/getQueueForTms", data);
                }
            },function (err) {
                console.error(err);
            });
            init.sendJSONresponse(res, 200, {
                "message": "发送成功"
            });


        }
    }).catch(function (err) {
        console.error(err);
    });

    //  res.send("Sent data!");
});


/*var longpollWithDebug = require("express-longpoll")(app, {DEBUG: true});
 //创建监听链接
 longpoll.create("/pollForAckQueue", {maxListeners: 10}); // set max listeners
 //可设置middleware
 longpoll.create("/pollForAddQueue", function (req, res, next) {
 // do something
 console.log("pollForAddQueue")
 next();
 });*/




module.exports = router;


