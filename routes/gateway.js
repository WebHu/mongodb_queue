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
//引入初始化相关信息
var init = require('../models/queue_init');
//log
var log = require("../models/logger");
var logger = log.logger;
log.use(router);
//引入validate
var vali = require("./longpolling_validate");
var curr_queue;


//身份校验
router.use('/', function (req, res, next) {
    try {
        //系统的queue集合
        var h = global.queues_map;
        /*    if (req.method === "PUT" || req.method === "POST") {
         //curr_queue = h.get(req.body.queueScope);
         } else if (req.method === "GET") {
         //  curr_queue = h.get(req.query.queueScope);
         }*/

        //验证身份信息
        var token = require("./token");
        token.accessToken("https://id.shipxy.com/core/connect/accesstokenvalidation", "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImtfS1JMRk9TM1dPYk9ZcUN2ZEpKS2I3ZGo1TSIsImtpZCI6ImtfS1JMRk9TM1dPYk9ZcUN2ZEpKS2I3ZGo1TSJ9.eyJpc3MiOiJodHRwczovL2lkLnNoaXB4eS5jb20vY29yZSIsImF1ZCI6Imh0dHBzOi8vaWQuc2hpcHh5LmNvbS9jb3JlL3Jlc291cmNlcyIsImV4cCI6MTQ5NzkyNzUwOSwibmJmIjoxNDkwMTUxNTA5LCJjbGllbnRfaWQiOiJkZW1vaWQiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIiwibG9nYXBpIl0sInN1YiI6Ijk2YWU5MTQzZDJjNzBlMDkiLCJhdXRoX3RpbWUiOjE0OTAxNTE1MDcsImlkcCI6Imlkc3J2IiwiYW1yIjpbInBhc3N3b3JkIl19.kbacLLITDAhRM1VBd4Jpo5lINRbz7SKC4U43Qoj9GqmW7ECyLoS3Yu-YY0QGy2ForaqhDdIeaWfQ-p-DWnS_svcoKo2nv46xD0jIwJbzLunmlUbDPWqfJVCQoRKQcCAt3KrCMw-U_K9cHduSjpWHZF8WRhdLbiNuqTQ2U5OC8op_aMestz8Tz1GXKoM-jo-HpYdGJADc_PKB5Ij8eseh6QzRsI3Dhj4079XB1Iwmz5cKYnc3oUZTsqlUo2uZf8xtFaZdvHaw4AT40--XaGDZPkBdVBEt7pvGYvXvAZ_F4Aa1CSOka9qdzcT1GrojNng20ChVdR46lknL5ZUTmeCJYw").then(function (data) {
            console.log(data);
            if (data.Message) {
                console.log(data.Message);
                logger.error("用户校验未通过");
                init.sendJSONresponse(res, 200, {
                    "message": "令牌失效"
                });
                return;
            } else {
                logger.info(data.sub+",用户校验通过");
                next();
            }

        });

    } catch (err) {
        logger.error(err);
    }

});

//获取前数据校验
router.use('/getQueueForTms', function (req, res, next) {
    //   var curr_queue = req.body.curr_queue;
    try {
        console.log("getQueueForTms...");
        next();
    } catch (err) {
        logger.error(err);
    }

});

//添加前数据校验
router.use('/addQueueForTms', function (req, res, next) {
    try {
        console.log("addQueueForTms use...");
        if (req.method === "PUT" || req.method === "POST") {
            vali.validateData(req, res, next).then(function (v) {
                next();
            }, function (err) {
                console.error(err);
                logger.error(err);
                init.sendJSONresponse(res, 200, {
                    "message": "数据校验未通过"
                });
            });

        }
    } catch (err) {
        logger.error(err);
    }
});


//确认(处理)前校验数据
router.use('/ackQueueForTms/:qid', function (req, res, next) {

    try {
        /*        if (!curr_queue) {
         init.sendJSONresponse(res, 200, {"message": "数据校验未通过..wrong collection"});
         return;
         }*/
        if (req.method === "POST") {
            //获取ack
            var ack = req.body.qid;
            if (!ack) {
                init.sendJSONresponse(res, 200, {"message": "数据校验未通过"});
            } else {
                next();
            }
        } else if (req.method === "GET") {
            //获取ack
            var ack = req.params.qid;
            if (!ack) {
                init.sendJSONresponse(res, 200, {"message": "数据校验未通过"});
            } else {
                next();
            }
        }

    } catch (err) {
        logger.error(err);
    }
});

//删除前校验数据
router.use('/deleteQueue/:id', function (req, res, next) {
    try {
        console.log("deleteQueue");
        next();
    } catch (err) {
        logger.error(err);
    }
});
//header的body部分转换为json
var jsonParser = bodyParser.json();

//添加数据 long polling ，put
router.put("/addQueue/:queueName", function (req, res) {
    var queueName = req.params.queueName;
    try {
        //添加到queue
        queueDao.puQueue(queueName, req).then(function (data) {
            if (!data || data == 0) {
                init.sendJSONresponse(res, 200, {
                    "message": "发送失败"
                });
                return;
            } else {
                init.sendJSONresponse(res, 200, {
                    "message": "发送成功"
                });
                return;
            }
        }).catch(function (err) {
            console.error(err);
            logger.error(err);
        });
    } catch (err) {
        logger.error(err);
    }
});


//删除queue通过_id
router.delete("/deleteQueue/:queueName/:id", function (req, res, next) {
    try {
        var id = req.params.id;
        var queueName = req.params.queueName;

        queueDao.deleteQueueById(id, queueName).then(function (data) {
            if (data.value) {
                init.sendJSONresponse(res, 200, {"message": "删除成功"});
                logger.info("queue:%s删除成功", id);

            } else {
                init.sendJSONresponse(res, 200, {"message": "删除失败"});
                logger.warn("queue:%s删除失败", id);
            }
        }, function (err) {
            init.sendJSONresponse(res, 200, {"message": "删除失败"});
            logger.error("queue:%s删除失败", id);

        }).catch(function (err) {
            logger.error("queue:%s删除失败", id);
        });
    } catch (err) {
        logger.error(err);
    }


});

//修改状态为已确认，处理queue

router.get('/ackQueue/:queueName/:ack', function (req, res, next) {
    console.log("ack..");
    var ack = req.params.ack;
    var queueName = req.params.queueName;
    queueDao.ackQueue(queueName, ack).then(function (data) {
        console.log(data);
        init.sendJSONresponse(res, 200, {"message": "处理成功"});
    }, function (err) {
        console.error(err);
        logger.error(err);
        init.sendJSONresponse(res, 200, {"message": "消息已过期"});

    }).catch(function (err) {
        console.error(err);
        init.sendJSONresponse(res, 200, {"message": "处理失败"});
        logger.error(err);
    });
});

router.post('/ackQueueForTms', function (req, res, next) {
    var ack = req.body.qid;
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
//获取queue by appid
router.get('/getQueuesByMyself/:appid', function (req, res, next) {
    try {
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
                return;
            });
        }).catch(function (err) {
            logger.error(err);
        });
    } catch (err) {
        logger.error(err);
    }


});

//获取queue by clientReference
router.get('/getQueueById/:queueName/:cid', function (req, res, next) {
    try {
        var queueName = req.params.queueName;
        var cid = req.params.cid;
        queueDao.getQueueByCid(queueName, {"clientReference": cid}).then(function (data) {
            if (data) {
                init.sendJSONresponse(res, 200, data);
            } else {
                init.sendJSONresponse(res, 200, {"message": "没找到数据"});
            }
        }, function (err) {
            console.log(err);
            logger.error(err)
        }).catch(function (err) {
            logger.error(err)
        });
    } catch (err) {
        logger.error(err);
    }


});

//获取消息队列中的信息
router.get('/getQueue/:queueName', function (req, res, next) {
    try {
        var queueName = req.params.queueName;
        //获取消息，先进先出
        queueDao.intervalQueue(queueName).then(function (data) {
            if (data) {
                init.sendJSONresponse(res, 200, data);
            } else {
                init.sendJSONresponse(res, 200, {"message": "没有数据"});
            }
        }, function (err) {
            console.error(err);
            init.sendJSONresponse(res, 200, {"message": err});
            logger.error(err);
        }).catch(function (err) {
            logger.error(err);
            init.sendJSONresponse(res, 200, {"message": err});
        });
    } catch (err) {
        logger.error(err);
    }

});


//导出路由
module.exports = router;