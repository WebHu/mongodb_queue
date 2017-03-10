/**
 * fileName:getway.js
 * author:gamehu
 * date:2017/3/6 15:06
 * desc:异步数据交换中心路由
 */

var express = require("express");
//获取路由对象
var router = express.Router();
const mongoose = require('mongoose');
//注：post请求获取参数需要
var bodyParser = require("body-parser");
var https = require("https");
const Mq = mongoose.model('dataQueueNew');

//设置响应内容
var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};
//中间件用于校验提交的数据
function validateData(req, res, next) {

    var p = new Promise(function (resolve, reject) {
        //校验
        var clientReference = req.body.clientReference;
        var payload = req.body.payload;
        console.log(payload + "........");
        if (!clientReference || !payload) {
            resolve(0);
        } else {
            try {
                //判断是否为标准的json
                JSON.parse(payload);
                resolve(1);
            } catch (e) {
                console.log(e);
                resolve(0);
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

//添加前数据校验
router.use('/', function (req, res, next) {
    if (req.method === "PUT") {
        validateData(req, res, next).then(function (v) {
            if (v === 0) {
                sendJSONresponse(res, 200, {
                    "message": "数据校验未通过..clientReference"
                });

            } else {
                next();
            }
        });

    } else if (req.method === "GET") {
        var v = validateDataForGet(req, res, next);
        if (v === 0) {
            sendJSONresponse(res, 200, {
                "message": "数据校验未通过..clientReference"
            });

        } else {
            next();
        }
    }

});


//header的body部分转换为json
var jsonParser = bodyParser.json();
//创建待处理信息
router.put('/putData', jsonParser, function (req, res, next) {
    console.log("putdata-------");
    const token = require("./token");
    //校验身份
    token.accessToken("https://id.shipxy.com/core/connect/accesstokenvalidation", "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2lkLnNoaXB4eS5jb20vY29yZSIsImF1ZCI6Imh0dHBzOi8vaWQuc2hpcHh5LmNvbS9jb3JlL3Jlc291cmNlcyIsImV4cCI6MTQ4ODg4MDg3NiwibmJmIjoxNDg4ODc3Mjc2LCJjbGllbnRfaWQiOiJkZW1vaWQiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIl0sInN1YiI6Ijk2YWU5MTQzZDJjNzBlMDkiLCJhdXRoX3RpbWUiOjE0ODg4Njg0MzgsImlkcCI6Imlkc3J2IiwiYW1yIjpbInBhc3N3b3JkIl19.ZAx35a1_ed-8aDFS-ec-AQ1e7kT9PdSyafzfmEP1Nl3cT1-FsBVsok9b4OMQg3eGNjYBacBXrLWBytxEU0inmJNNKYnp_toGhB71kqb53AjmluGk-e0aDAhq75Ms_PwbdJ87bJAb8AlbQy8jUJ8kJIh-te4FuzUfb1oZ8C0Kt9DkU3ve-xKAy3K4Ukuc9EsZ9E3tyQeKrcNJTFVoZi_X-Y2jLlCqcqoDTkJ7yqjnODlUGRAoUtupUT0FWwlFTj-Um20klmf35BV_SP2QYqaL37dZ8GQMXMZv0ibKNtAxMqE5HwTgh9qOMf7Rpgo5Ks3_CSxYYVTcQw0vbx8L6t_T-w").then(function (data) {
        //获取校验后的返回值
        if (data.Message) {
            sendJSONresponse(res, 200, {
                "message": "令牌失效.."
            });
        } else {
            if (data.iss) {
                //身份验证通过
                console.log("身份通过...putMq..." + data.iss + "," + req.body.payload);

                var data=new Mq(req.body);
                //用model生成的实体存储
                data.save(function (err,node) {
                    if (err) {
                        console.error(err);
                        sendJSONresponse(res, 500, {"message": "存储失败.."});

                    } else {
                        sendJSONresponse(res, 200, node);

                    }
                });

                //添加数据到mongodb
/*                Mq.create({
                    clientReference: req.body.clientReference,
                    fromTenantId: req.body.fromTenantId,
                    toTenantId: req.body.toTenantId,
                    fromPlatformId: req.body.fromPlatformId,
                    toPlatformId: req.body.toPlatformId,
                    payload: JSON.parse( req.body.payload)
                }, function (err, node, num) {
                    if (err) {
                        console.error(err);
                        sendJSONresponse(res, 500, {"message": "存储失败.."});
                        return;
                    } else {
                        sendJSONresponse(res, 200, node);
                        return;
                    }
                });*/
            }
        }
    }).catch(function (err) {
        console.error(err);
        sendJSONresponse(res, 200, err);
    });
});

//从mongodb查询数据

function findByMongo(param) {
    var p = new Promise(function (resolve, reject) {
        //noinspection JSAnnotator
        Mq.find({param}, function (err, node) {
            if (err) {
                reject(err);
            } else {
                resolve(node);
            }

        });

    });
    return p;
}

//获取待处理信息
router.get('/getData', function (req, res, next) {
    //从mongodb获取
    console.log("getData-------");
    const token = require("./token");
    //校验身份
    token.accessToken("https://id.shipxy.com/core/connect/accesstokenvalidation", "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2lkLnNoaXB4eS5jb20vY29yZSIsImF1ZCI6Imh0dHBzOi8vaWQuc2hpcHh5LmNvbS9jb3JlL3Jlc291cmNlcyIsImV4cCI6MTQ4ODg4MDg3NiwibmJmIjoxNDg4ODc3Mjc2LCJjbGllbnRfaWQiOiJkZW1vaWQiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIl0sInN1YiI6Ijk2YWU5MTQzZDJjNzBlMDkiLCJhdXRoX3RpbWUiOjE0ODg4Njg0MzgsImlkcCI6Imlkc3J2IiwiYW1yIjpbInBhc3N3b3JkIl19.ZAx35a1_ed-8aDFS-ec-AQ1e7kT9PdSyafzfmEP1Nl3cT1-FsBVsok9b4OMQg3eGNjYBacBXrLWBytxEU0inmJNNKYnp_toGhB71kqb53AjmluGk-e0aDAhq75Ms_PwbdJ87bJAb8AlbQy8jUJ8kJIh-te4FuzUfb1oZ8C0Kt9DkU3ve-xKAy3K4Ukuc9EsZ9E3tyQeKrcNJTFVoZi_X-Y2jLlCqcqoDTkJ7yqjnODlUGRAoUtupUT0FWwlFTj-Um20klmf35BV_SP2QYqaL37dZ8GQMXMZv0ibKNtAxMqE5HwTgh9qOMf7Rpgo5Ks3_CSxYYVTcQw0vbx8L6t_T-w").then(function (data) {
        //获取校验后的返回值
        if (data.Message) {
            sendJSONresponse(res, 200, {
                "message": "令牌失效..getData"
            });

        } else {
            if (data.iss) {
                //身份验证通过
                console.log("身份通过...getMq..." + data.iss + "," + req.query.clientReference);
                //长轮询
                var list_messages = [];
                var interval;//setInterval 标识
                var timeOut;//setTimeout 标识
                function getData(time) {
                    console.log("time..");
                    interval = setInterval(function () {
                        //从mongodb查询
                        Mq.find({
                            clientReference: req.query.clientReference  //  /xxxx/表示模糊查询
                        }, function (err, nodes) {
                            if (err) {
                                //sendJSONresponse(res, 500, {"message": "获取失败.."});
                                console.error(err);
                                clearInterval(interval);
                            } else {
                                console.log("list_messages:....." + JSON.stringify(nodes));
                                //判断是否获取到数据
                                if (nodes.length > 0) {
                                    list_messages = nodes;
                                    clearInterval(interval);

                                }
                            }
                        });

                    }, time);
                }


                function long_polling() {
                    var p = new Promise(function (resolve, reject) {
                        console.log("begin...");
                        //10秒后如果还没有数据则停止继续轮询
                        timeOut=setTimeout(function () {
                            clearInterval(interval);
                            resolve(list_messages);
                        }, 10000);
                        //调用查询
                        getData(1000);
                    });
                    return p;
                }

                //返回处理结果
                long_polling().then(function (data) {

                    if (data == null || data.length == 0) {
                        sendJSONresponse(res, 200, {"message": "没有数据.."});

                    } else {
                        sendJSONresponse(res, 200, data);

                    }
                });
            }
        }
    }).catch(function (err) {
        console.error(err);
        sendJSONresponse(res, 200, err);

    });


});
//导出路由
module.exports = router;