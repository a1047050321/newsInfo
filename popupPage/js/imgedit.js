var workSpace = top.frames["mainFrame"];

var dnsConfig = top.globalDnsConfigVar,
    slaveAddr = dnsConfig.slaveAddr,
    bossAssetsUrl = dnsConfig.bossAssetsUrl;

//获取请求参数
var urlParams = workSpace.iHomed.query(window.location.href);

console.log( urlParams );

//初始化图片编辑器
init(urlParams);

/**
 * 初始化图片编辑器
 * @param  {Object} params 设置参数
 * @return 无返回值
 */
function init(params) {
    var options = {

        systemType: urlParams.systemType,

        posterDir: urlParams.dir,

        index: parseInt(urlParams.index) || 1,

        postUrl: '',

        accesstoken: urlParams.accesstoken,

        mediaId: urlParams.mediaId,

        videoId: urlParams.videoId,

    };

    imageEditor('init',options);

    imageEditor('addCallBackFn',function(arr,index){

        console.log(arr);

        console.log(index);

        if (!urlParams.cbf_name) return;
    
        var fn = urlParams.cbf_name.split("_");

        if (workSpace !== undefined) {
            //执行更新图片的操作
            workSpace[fn[0]][fn[1]]( arr, index );
        }

    });
}
