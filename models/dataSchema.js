/**
 * fileName:dataSchema.js
 * author:gamehu
 * date:2017/3/6 15:02
 * desc:异步数据交换中心的 数据载体 schema
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

DataSchema = new Schema({
    clientReference: {//发送方的唯一标识
        type: String,
        require: true
    },
    fromTenantId: {//发送租户标识
        type: String,
        require: true
    },
    toTenantId: {//接收租户标识
        type: String,
        require: true
    }, fromPlatformId: {//平台标识
        type: String,
        require: true
    }, toPlatformId: {//平台标识
        type: String,
        require: true
    }, priority: {
        type: Number,
        default: 1//优先级别1-9，默认1
    }, visible: {
        type: Number,
        default: 10000//默认存活时间10000毫秒？
    }, payload: {
        type: String,//交互内容
        require: true
    }
});
//schema转换为model，model对应着mongodb的collection，如果不存在则新建collection为messageQueue
mongoose.model('dataQueueNew', DataSchema);
