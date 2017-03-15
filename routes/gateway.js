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

var init = require('../models/queue_init');


//中间件用于校验提交的数据,put/post
function validateData(req, res, next) {
    var p = new Promise(function (resolve, reject) {
        //校验
        var clientReference = req.body.clientReference;
        var payload = req.body.payload;
        if (!clientReference || !payload) {
            reject("clientReference/payload is undefined");
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
        //  curr_queue = h.get(req.query.queueScope);
    }

    //验证身份信息
    var token = require("./token");
    token.accessToken("https://id.shipxy.com/core/connect/accesstokenvalidation", "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2lkLnNoaXB4eS5jb20vY29yZSIsImF1ZCI6Imh0dHBzOi8vaWQuc2hpcHh5LmNvbS9jb3JlL3Jlc291cmNlcyIsImV4cCI6MTQ4ODg4MDg3NiwibmJmIjoxNDg4ODc3Mjc2LCJjbGllbnRfaWQiOiJkZW1vaWQiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIl0sInN1YiI6Ijk2YWU5MTQzZDJjNzBlMDkiLCJhdXRoX3RpbWUiOjE0ODg4Njg0MzgsImlkcCI6Imlkc3J2IiwiYW1yIjpbInBhc3N3b3JkIl19.ZAx35a1_ed-8aDFS-ec-AQ1e7kT9PdSyafzfmEP1Nl3cT1-FsBVsok9b4OMQg3eGNjYBacBXrLWBytxEU0inmJNNKYnp_toGhB71kqb53AjmluGk-e0aDAhq75Ms_PwbdJ87bJAb8AlbQy8jUJ8kJIh-te4FuzUfb1oZ8C0Kt9DkU3ve-xKAy3K4Ukuc9EsZ9E3tyQeKrcNJTFVoZi_X-Y2jLlCqcqoDTkJ7yqjnODlUGRAoUtupUT0FWwlFTj-Um20klmf35BV_SP2QYqaL37dZ8GQMXMZv0ibKNtAxMqE5HwTgh9qOMf7Rpgo5Ks3_CSxYYVTcQw0vbx8L6t_T-w").then(function (data) {
        console.log(data);
        if (data.Message) {
            /*sendJSONresponse(res, 200, {
             "message": "令牌失效"
             });*/
            next();
        } else {
            next();
        }

    });


    /* if (!curr_queue) {
     console.log("req.body.queueScope.." + req.body.queueScope);
     sendJSONresponse(res, 200, {
     "message": "数据校验不通过....no collection"
     });

     } else {
     next();
     }*/
});

//获取前数据校验
router.use('/getQueue/:curr_queue', function (req, res, next) {
    var curr_queue = req.params.curr_queue;
    console.log("getQueue..." + curr_queue);
    //   next();
    if (!curr_queue) {
        init.sendJSONresponse(res, 200, {
            "message": "数据校验不通过....wrong collection"
        });

    } else {
        // next();
        var h = global.queues_map;
        if (h.has(curr_queue)) {
            console.log("xx");
            next();
        } else {
            init.sendJSONresponse(res, 200, {
                "message": "数据校验不通过....wrong collection"
            });

        }
    }
});

//添加前数据校验
router.use('/addQueue', function (req, res, next) {
    console.log("addQueue...");
    if (req.method === "PUT" || req.method === "POST") {
        validateData(req, res, next).then(function (v) {
            next();
        }, function (err) {
            console.error(err);
            init.sendJSONresponse(res, 200, {
                "message": "数据校验未通过"
            });
        });

    }

});


//确认前校验数据
router.use('/ackQueue', function (req, res, next) {
    if (!curr_queue) {
        init.sendJSONresponse(res, 200, {"message": "数据校验未通过..wrong collection"});
        return;
    }
    console.log("ackQueue:" + req.body.ack);
    if (req.method === "POST") {
        //获取ack
        var ack = req.body.ack;
        if (!ack) {
            init.sendJSONresponse(res, 200, {"message": "数据校验未通过"});
        } else {
            next();
        }
    }
});

//删除前校验数据
router.use('/deleteQueue/:id', function (req, res, next) {
    console.log("deleteQueue");
    next();
});
//header的body部分转换为json
var jsonParser = bodyParser.json();


router.put("/addQueue", jsonParser, function (req, res, next) {
    // var queueName = "tms_queue";
    //添加到queue
    queueDao.puQueue(curr_queue, req).then(function (data) {
        if (!data || data == 0) {
            init.sendJSONresponse(res, 200, {
                "message": "发送失败"
            });

        } else {
            init.sendJSONresponse(res, 200, {
                "message": "发送成功"
            });

        }
    }).catch(function (err) {
        console.error(err);
    });
});


//获取消息队列中的信息
router.get('/getQueue/:curr_queue', function (req, res, next) {
    var curr_queue = req.params.curr_queue;
    //var queueName = 'tms_queue';
    console.log("get...." + curr_queue);
    //获取消息，先进先出
    queueDao.intervalQueue(curr_queue).then(function (data) {
        if (data) {
            init.sendJSONresponse(res, 200, data);
        } else {
            init.sendJSONresponse(res, 200, {"message": "没有数据"});
        }
    }).catch(function (err) {
        console.error(err);
    });
});


//修改状态为已确认，处理queue
router.post('/ackQueue', function (req, res, next) {
    var ack = req.body.ack;
    //生效时间
    var visible = req.body.visible;
    //存活时间
    var ttl = req.body.ttl;
    queueDao.ackQueue(curr_queue, ack).then(function (data) {
        console.log(data);
        init.sendJSONresponse(res, 200, {"message": "处理成功"});

    }, function (err) {
        console.error(err);
        init.sendJSONresponse(res, 200, {"message": "处理失败"});

    }).catch(function (err) {
        console.error(err);
    });
});

//获取与自己相关的所有queue

router.get('/getQueuesByMyself/:appid/:companyid/:clientReference', function (req, res, next) {
    var h = global.queues_map.keys();
    //根据平台id、租户id、用户标识获取
    queueDao.getQueuesByMyself(h[0], req.params.appid, req.params.companyid, req.params.clientReference).then(function (data) {
        var datas = [];
        datas.push(data);
        return datas;
    }, function (err) {
        console.error(err);
        return [];
    }).then(function (datas) {
        queueDao.getQueuesByMyself(h[1], req.params.appid, req.params.companyid, req.params.clientReference).then(function (data) {
            datas.push(data);
            init.sendJSONresponse(res, 200, datas);

        }, function (err) {
            console.error(err);
            init.sendJSONresponse(res, 200, {"message": "没有数据"});

        });
    }).catch(function (err) {
        console.error(err);
    });

});

router.get('/getQueuesByMyself/:appid', function (req, res, next) {
    var h = global.queues_map.keys();
    //根据平台id、租户id、用户标识获取
    var params = {"appid": req.params.appid};
    queueDao.getQueuesByMyself(h[0], params).then(function (data) {
        var datas = [];
        datas.push(data);
        return datas;
    }, function (err) {
        console.error(err);
        return [];
    }).then(function (datas) {
        queueDao.getQueuesByMyself(h[1], params).then(function (data) {
            datas.push(data);
            init.sendJSONresponse(res, 200, datas);

        }, function (err) {
            console.error(err);
            init.sendJSONresponse(res, 200, {"message": "没有数据"});

        });
    }).catch(function (err) {
        console.error(err);
    });

});


//删除queue通过_id
router.delete("/deleteQueue/:id", function (req, res, next) {
    var id = req.params.id;

    queueDao.deleteQueueById("58c8b839537af61d2079a571","tms_queue").then(function (data) {
        console.log("value:"+data.value);
        if(data.value){
            init.sendJSONresponse(res, 200, {"message": "删除成功"});

        }else{
            init.sendJSONresponse(res, 200, {"message": "删除失败"});

        }
    }, function (err) {
        init.sendJSONresponse(res, 200, {"message": "删除失败"});
        console.log(err);

    }).catch(function (err) {
        console.log(err);
    });

});

//导出路由
module.exports = router;