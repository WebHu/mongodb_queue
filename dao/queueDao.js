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
exports.puQueue = function (queueName, req) {
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
                resove(1);
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
            maxRetries: 2
        });
        queue.get(function (err, msg) {
            if (err) {
                console.error(err);
                reject(err);
            }
            else {
                console.log("xxxx:" + msg);
                resove(msg);
            }

        });

    });
    return p;
};

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

exports.ackQueue=function (queueName,ack) {
    var p=new Promise(function (resove,reject) {

        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + queueName);
        var queue = mongoDbQueue(db.dbConn, queueName, {
            deadQueue: deadQueue
        });
        queue.ack(ack,function (err,newMsg) {
            if(err){
                reject(err);
            }else{
                resove(newMsg);
            }
        });
    });
    return p;
};