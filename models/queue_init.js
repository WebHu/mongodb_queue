/**
 * fileName:queue_init.js
 * author:gamehu
 * date:2017/3/8 17:33
 * desc:初始化工作——异步数据中心
*/

//引入hashmap
var HashMap=require("hashmap");
global.queues_map = new HashMap();
//var history_queues=['his_tms_queue','his_tuochebao_queue','his_interconnectioncar_queue'];
queues_map.set("tms_queue","tms_queue");
queues_map.set("tuochebao_queue","tuochebao_queue");
global.db_queues_map = new HashMap();
db_queues_map.set("tms_queue","tms_queue");
db_queues_map.set("tuochebao_queue","tuochebao_queue");
//设置响应内容
var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};
exports.sendJSONresponse=sendJSONresponse;

/*
function getConn() {
    var p=new Promise(function (resove,reject) {

        resove(db.dbConn);

    });
    return p;
}
getConn().then(function (conn) {
    console.log(conn);
    queues.forEach(function (queue,index) {
        //创建queue
        var deadQueue = mongoDbQueue(conn, dead_queues[index],{
            visibility: 30000,
            delay: 0
        });
        console.log("created deadQueue :"+deadQueue.name);
        //创建异步数据交换 核心queue
      var que=  mongoDbQueue(conn, queue, {
            visibility: 30,
            delay: 0,
            deadQueue: deadQueue
        });
        console.log("created Queue :"+que);
        //创建history queue
        var h=conn.collection(history_queues[index]);
        console.log("created history_queue :"+h);
    });
});

*/
