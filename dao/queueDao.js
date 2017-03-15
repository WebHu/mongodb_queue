/**
 * fileName:queueDao.js
 * author:gamehu
 * date:2017/3/9 10:11
 * desc:异步数据交换中心队列dao
 */
const mongoose = require('mongoose');
var db = require('../db/dbconnect');
//mongodb queue
var mongoDbQueue = require('mongodb-queue');
var Promise = require('bluebird');
//创建queue
exports.createCollections = function () {
    global.db_queues_map.forEach(function (value, key) {
        console.log(key + " : " + value);
        var deadQueue = mongoDbQueue(db.dbConn, 'dead-' + key, {
            visibility: 3000,
            delay: 0,
            maxRetries: 2
        });
        var queue = mongoDbQueue(db.dbConn, key, {
            visibility: 30,
            delay: 0,
            deadQueue: deadQueue,
            maxRetries: 2
        });
    });
};
//add queue
//exports.queues_map=db.queues_map;
exports.puQueue = function (queueName, req, longpoll) {
    var p = new Promise(function (resove, reject) {
        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + queueName);
        var queue = mongoDbQueue(db.dbConn, queueName, {
            deadQueue: deadQueue
        });
        var b = [];
        b = req.body;
        b["payload"] = JSON.parse(b["payload"]);
        //添加到队列
        queue.add(b, function (err, id) {
            if (err) {
                reject(err);
            } else {
                //longpoll.create("/getQueueForTms");
                resove(id);
            }
        });

    });
    return p;
};

//get queue

var getQueue = function (queueName) {
    var p = new Promise(function (resove, reject) {
        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + queueName);
        var queue = mongoDbQueue(db.dbConn, queueName, {
            visibility: 30,
            delay: 0,
            deadQueue: deadQueue,
            maxRetries: 3
        });
        queue.get(function (err, msg) {
            if (err) {
                console.error(err);
                reject(err);
            }
            else {
                resove(msg);
            }

        });

    });
    return p;
};
exports.getQue = getQueue;
//长轮询获取queue
exports.intervalQueue = function (curr_queue) {
    var p = new Promise(function (resove, reject) {
        var data;
        var interval;
        //默认一秒查询一次
        interval = setInterval(function () {
            getQueue(curr_queue).then(function (message) {
                console.log("list_messages:" + message);
                data = message;
                if (message) {
                    resove(data);
                    //查到数据clear time，然后返回
                    clearInterval(interval);
                    clearTimeout(timeOut);

                }
            }, function (err) {
                reject(err);
                //   console.error(err);
            });

        }, 1000);
        //默认10秒后停止查询
        var timeOut = setTimeout(function () {
            clearInterval(interval);
            resove(data);
        }, 5000);
    });
    return p;
};

//处理获取的queue msg

exports.ackQueue = function (queueName, ack) {
    var p = new Promise(function (resove, reject) {

        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + queueName);
        var queue = mongoDbQueue(db.dbConn, queueName, {
            deadQueue: deadQueue
        });
        queue.ack(ack, function (err, newMsg) {
            if (err) {
                reject(err);
            } else {
                resove(newMsg);
            }
        });
    });
    return p;
};

//获取某租户下某用户的queue
/*
 exports.getQueuesByMyself=function (q,appid,companyid,clientReference) {
 var p=new Promise(function (resove,reject) {
 //   queueNames.forEach(function (q) {
 var deadQueue = mongoDbQueue(db.dbConn, "dead-" + q);
 var queue = mongoDbQueue(db.dbConn, q, {
 deadQueue: deadQueue
 });
 queue.getQueuesByMyself({"appid":appid,"companyid":companyid,"clientReference":clientReference},function (err,docs) {
 if(err){
 reject(err);
 }else{
 resove(docs)
 }
 });
 //  });
 });
 return p;
 };
 */

//获取某租户下某用户的queue
exports.getQueuesByMyself = function (q, params) {
    var p = new Promise(function (resove, reject) {
        //   queueNames.forEach(function (q) {
        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + q);
        var queue = mongoDbQueue(db.dbConn, q, {
            deadQueue: deadQueue
        });
        queue.getQueuesByMyself(params, function (err, docs) {
            if (err) {
                reject(err);
            } else {
                resove(docs)
            }
        });
        //  });
    });
    return p;
};
//删除
exports.deleteQueueById = function (id, queueName) {
    var p = new Promise(function (resove, reject) {
        //根据name获取collection
        mongoose.connection.db.listCollections({name: queueName})
            .next(function (err, collinfo) {
                if (collinfo) {
                    //获取collection
                   var c=db.getCol(collinfo.name);
                    // The collection exists
                    c.findAndRemove({_id: mongoose.Types.ObjectId(id)}, function (err, node) {
                        if (err) {
                            reject(err);
                        } else {
                            resove(node);
                        }
                    });
                } else {
                    reject("no collection")
                }
            });

    });

    return p;
};