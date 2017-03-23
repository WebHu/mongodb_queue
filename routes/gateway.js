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
var util = require('../models/util');
//log
var log = require("../models/logger");
var logger = log.logger;
log.use(router);
//base64解码
var Base64 = require("../models/base64");
//引入validate
var vali = require("./validate");
//身份校验
var appid, companyid, curr_queue, access_token;
router.use('/', function (req, res, next) {
    try {
        //系统的queue集合
        var h = global.queues_map;
        //base64解码,获取appid
        access_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImtfS1JMRk9TM1dPYk9ZcUN2ZEpKS2I3ZGo1TSIsImtpZCI6ImtfS1JMRk9TM1dPYk9ZcUN2ZEpKS2I3ZGo1TSJ9.eyJpc3MiOiJodHRwczovL2lkLnNoaXB4eS5jb20vY29yZSIsImF1ZCI6Imh0dHBzOi8vaWQuc2hpcHh5LmNvbS9jb3JlL3Jlc291cmNlcyIsImV4cCI6MTQ5NzkyNzUwOSwibmJmIjoxNDkwMTUxNTA5LCJjbGllbnRfaWQiOiJkZW1vaWQiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIiwibG9nYXBpIl0sInN1YiI6Ijk2YWU5MTQzZDJjNzBlMDkiLCJhdXRoX3RpbWUiOjE0OTAxNTE1MDcsImlkcCI6Imlkc3J2IiwiYW1yIjpbInBhc3N3b3JkIl19.kbacLLITDAhRM1VBd4Jpo5lINRbz7SKC4U43Qoj9GqmW7ECyLoS3Yu-YY0QGy2ForaqhDdIeaWfQ-p-DWnS_svcoKo2nv46xD0jIwJbzLunmlUbDPWqfJVCQoRKQcCAt3KrCMw-U_K9cHduSjpWHZF8WRhdLbiNuqTQ2U5OC8op_aMestz8Tz1GXKoM-jo-HpYdGJADc_PKB5Ij8eseh6QzRsI3Dhj4079XB1Iwmz5cKYnc3oUZTsqlUo2uZf8xtFaZdvHaw4AT40--XaGDZPkBdVBEt7pvGYvXvAZ_F4Aa1CSOka9qdzcT1GrojNng20ChVdR46lknL5ZUTmeCJYw";
        //验证身份信息
        var token = require("./token");
        //校验token缓存
        token.tokenCheck(access_token).then(function (data) {
            if (data) {
                next();
            } else {
                //去用户中心校验身份
                var a_appid = access_token.split(".")[1];
                //创建base64解码对象
                var b = new Base64();
                var out = b.decode(a_appid);
                appid = JSON.parse(out).client_id;
                //获取appid（平台）对应的queue
                curr_queue = global.queues_map.get(appid);
                if (curr_queue) {
                    token.userinfo("https://id.shipxy.com/core/connect/userinfo", "Bearer " + access_token).then(function (data) {
                        console.log(data)
                        companyid = data.companyid;
                        logger.info(data.nickname + ",用户校验通过," + new Date());
                        //缓存token
                        global.token_map.set(access_token, {
                            createTime: new Date(),
                            appid: appid,
                            companyid: companyid,
                            curr_queue: curr_queue
                        });
                        next();
                    }, function (err) {
                        console.log(err);
                        util.sendJSONresponse(res, 401, {
                            "message": err
                        });
                        logger.error(err + "用户中心，校验未通过");
                    }).catch(function (err) {
                        util.sendJSONresponse(res, 401, {
                            "message": "未授权"
                        });
                        logger.error(err + ",身份校验异常");
                    });
                } else {
                    util.sendJSONresponse(res, 401, {
                        "message": "未授权"
                    });
                    logger.error(500+",身份校验异常,不存在对应的queue");
                }
            }
        }, function (err) {
            logger.error(401 + ",缓存身份校验出错")
        });
    } catch (err) {
        util.sendJSONresponse(res, 401, {
            "message": "未授权"
        });
        logger.error(err);
    }

});

//获取前数据校验
router.use('/getQueue', function (req, res, next) {
    //   var curr_queue = req.body.curr_queue;
    try {
        console.log("getQueue...");
        next();
    } catch (err) {
        logger.error(err);
    }

});

//添加前数据校验
router.use('/addQueue', function (req, res, next) {
    try {
        console.log("addQueueForTms use...");
        if (req.method === "PUT" || req.method === "POST") {
            vali.validateData(req, res, next).then(function (v) {
                next();
            }, function (err) {
                console.error(err);
                logger.error(err);
                util.sendJSONresponse(res, 200, {
                    "message": "数据校验未通过"
                });
            });

        }
    } catch (err) {
        logger.error(err);
    }
});


//确认(处理)前校验数据
router.use('/ackQueue/:qid', function (req, res, next) {

    try {
        if (req.method === "POST") {
            //获取ack
            var ack = req.body.qid;
            if (!ack) {
                util.sendJSONresponse(res, 200, {"message": "数据校验未通过"});
            } else {
                next();
            }
        } else if (req.method === "GET") {
            //获取ack
            var ack = req.params.qid;
            if (!ack) {
                util.sendJSONresponse(res, 200, {"message": "数据校验未通过"});
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

//获取消息队列中的信息
router.get('/getQueue/:queueName', function (req, res, next) {
    try {
        var queueName;
        if (curr_queue) {
            queueName = curr_queue;
        } else {
            var val = global.token_map.get(access_token);
            queueName = val.curr_queue;
        }
        //获取消息，先进先出
        queueDao.intervalQueue(queueName,companyid).then(function (data) {
            if (data) {
                util.sendJSONresponse(res, 200, data);
                return;
            } else {
                util.sendJSONresponse(res, 200, {"message": "没有数据"});
                return;
            }
        }, function (err) {
            util.sendJSONresponse(res, 500, {"message": "获取失败"});
            logger.error(500 + ",定时器错误，" + err);
        }).catch(function (err) {
            logger.error(500 + ",定时器错误，" + err);
            util.sendJSONresponse(res, 500, {"message": "获取失败"});
        });
    } catch (err) {
        util.sendJSONresponse(res, 500, {"message": "获取失败"});
        logger.error(500 + ",获取失败，" + err);
    }

});

//添加数据 long polling ，put
router.put("/addQueue/:queueName", function (req, res) {
    var queueName = req.params.queueName;
    try {
        //添加到queue
        queueDao.puQueue(queueName, req).then(function (data) {
            if (!data || data == 0) {
                util.sendJSONresponse(res, 200, {
                    "message": "发送失败"
                });
                return;
            } else {
                util.sendJSONresponse(res, 200, {
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
                util.sendJSONresponse(res, 200, {"message": "删除成功"});
                logger.info("queue:%s删除成功", id);

            } else {
                util.sendJSONresponse(res, 200, {"message": "删除失败"});
                logger.warn("queue:%s删除失败", id);
            }
        }, function (err) {
            util.sendJSONresponse(res, 200, {"message": "删除失败"});
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
        util.sendJSONresponse(res, 200, {"message": "处理成功"});
    }, function (err) {
        console.error(err);
        logger.error(err);
        util.sendJSONresponse(res, 200, {"message": "消息已过期"});

    }).catch(function (err) {
        console.error(err);
        util.sendJSONresponse(res, 200, {"message": "处理失败"});
        logger.error(err);
    });
});

router.post('/ackQueue', function (req, res, next) {
    var ack = req.body.qid;
    //生效时间
    var visible = req.body.visible;
    //存活时间
    var ttl = req.body.ttl;
    queueDao.ackQueue(curr_queue, ack).then(function (data) {
        console.log(data);
        util.sendJSONresponse(res, 200, {"message": "处理成功"});

    }, function (err) {
        console.error(err);
        util.sendJSONresponse(res, 200, {"message": "处理失败"});

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
            util.sendJSONresponse(res, 200, datas);

        }, function (err) {
            console.error(err);
            util.sendJSONresponse(res, 200, {"message": "没有数据"});

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
                util.sendJSONresponse(res, 200, datas);

            }, function (err) {
                console.error(err);
                util.sendJSONresponse(res, 200, {"message": "没有数据"});
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
                util.sendJSONresponse(res, 200, data);
            } else {
                util.sendJSONresponse(res, 200, {"message": "没找到数据"});
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
//导出路由
module.exports = router;