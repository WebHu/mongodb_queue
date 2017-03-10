/**
 * Created by Administrator on 2017/3/7.
 */

var list_messages=null;
var interval;
function getData(time) {
    interval =setInterval(function () {
        console.log("setInterval......")
    },time);
}




if (list_messages == null) {
    getData(1000);

    setTimeout(function () {
        clearInterval(interval);
    },10000);
}


