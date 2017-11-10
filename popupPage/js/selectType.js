//获取请求参数
var TOKEN       = iHomed.data( "token" ),
    USERID      = iHomed.data( "userid" ),
    PARAMS      = iHomed.query( window.location.href ),
    NEWSID    = PARAMS.newsid,
    DEVICE      = (PARAMS.device || "0").split("|");

NEWSID = NEWSID.indexOf( "|" ) != -1 ? NEWSID.split( "|" ) : NEWSID;

var topFrame = top;

// 系统设置参数
var SYSTEM_PARAMS = iHomed.data( "systemParameter" ) || {},
    LIMIT_FLAG = SYSTEM_PARAMS[ "26001" ] == 1 ? true : false;

// 与属性页相关的对象
var IFRAME,
    LAYERID,
    $TITLE;

var PLATFORM_MAP = iHomed.data( "devicetype" ) || {};

var SelectType = {
    /**
     * [treeData 符合tree结构分类列表数据]
     */
    treeData: [],
    /**
     * [singTreeClass 用于标志单棵树的root结点的class]
     * @type {String}
     */
    singTreeClass:"single-tree",
    /**
     * 提供商id，由于修改信息时不传这个参数，
     * 接口会自动赋默认值，所以要吧提供商id
     * 传过去，防止被覆盖
     */
    // providerid: "",
    /**
     * [init 页面初始化]
     * @return {[type]} [description]
     */
    init: function () {
        var url, param;

        if ( typeof NEWSID == "object" ) {
            SelectType.getLabelList( [] );
            return;
        }

        url = "get_news_info";

        param = {
            accesstoken : TOKEN,
            newsid    : NEWSID,
        };

        var options = {
            url     : url,
            timeout : 3600000,
            data: param,
            success: function (data) {
                if (data.ret == 0) {
                    var info = data.info || {},
                        checkedData = info.column || [];

                    DEVICE = ( info.copyrightdevice || "0" ).split( "|" );

                    SelectType.getLabelList( checkedData );

                    // 更新属性页标题
                    $TITLE.text( $TITLE.text() + " - " + info.title );
                } else {
                    $.alert({
                        content: {
                            html: "获取栏目信息失败！"
                        },
                        footer: {
                            buttons: [{
                                callback: function(){
                                    tLayer( "close", LAYERID );
                                }
                            }]
                        }
                    });
                }
            },
            error: function () {
                $.alert({
                    content: {
                        html: "获取栏目信息失败！"
                    },
                    footer: {
                        buttons: [{
                            callback: function(){
                                tLayer( "close", LAYERID );
                            }
                        }]
                    }
                });
            }
        };

        iHomed( "getData", options);
    },
    /**
     * 获取栏目列表
     * @param  {array} checkedData 已选的数据
     * @return 无
     */
    getLabelList: function( checkedData ){
        var data = {
            accesstoken: TOKEN,
            label: 0,
            ishide: 1, // 显示隐藏的栏目
        };

        if ( DEVICE[0] != "0" ) {
            data.devicetype = DEVICE.join("|");
        }

        var options = {
            url     : "get_label_list",
            timeout : 3600000,
            data: data,
            success: function (data) {
                if (data.ret == 0) {
                    SelectType.formatToTreedata(data.typelist[0].children, SelectType.treeData, checkedData);
                    
                    SelectType.initTree();
                } else {
                    $.alert({
                        content: {
                            html: "获取栏目树失败，请检查是否已分配栏目树管理的权限"
                        },
                        footer: {
                            buttons: [{
                                callback: function(){
                                    tLayer( "close", LAYERID );
                                }
                            }]
                        }
                    });
                }
            },
            error: function () {
                $.alert({
                    content: {
                        html: "获取栏目树失败！"
                    },
                    footer: {
                        buttons: [{
                            callback: function(){
                                tLayer( "close", LAYERID );
                            }
                        }]
                    }
                });
            }
        };

        iHomed( "getData", options);
    },
    /**
     * 将分类列表转化为easyui的tree接收的数据格式
     * @param  {array} data        [分类列表数据]
     * @param  {array} treeData    [最后返回的符合tree结构的数据]
     * @param  {array} checkedData [被选中的项]
     * @param  {number} level       [当前层级]
     * @param  {boolean} hasParentRight   [是否有父节点的权限]
     * @return 由于js函数传值的特性，treeData传进来被修改后，外部也被修改，所以不需要返回
     */
    formatToTreedata: function (data, treeData, checkedData, level, hasParentRight) {
        level = level || 0;     //结构层级

        for (var i = 0, n = 0, l = data.length; i < l; i++) {
            var tmpData = data[i],
                tmpDevice = (tmpData.devicetype || "").split("|"),
                rightlist = tmpData.rightlist || [],
                rightLength = rightlist.length,
                hasRight = rightLength > 0 ? false : ( typeof hasParentRight == "undefined" ? true : hasParentRight );

            var node = {
                id: tmpData.id,
                text: tmpData.name,
                relate: tmpData.islist == 1 ? true : false,
                attributes: level
            };

            // 系统开启了挂栏目的限制时，只显示有权限的树
            if ( LIMIT_FLAG ) {
                for ( var j = 0; j < rightLength; ++j ) {
                    var uids = ( rightlist[ j ].userid || "" ).split( "|" );

                    if ( $.inArray( USERID + "", uids ) != -1 ) {
                        hasRight = true;
                        break;
                    }
                }
            } else {
                hasRight = true;
            }

            // if(!hasRight)continue;

            node.hasRight = hasRight;

            if ( !hasRight ) node.text = '<font class="disable">' + node.text + '</font>';

            // 系统开启了挂栏目的限制时，只显示有权限的树
            // if ( LIMIT_FLAG && tmpData.userid != 0 && tmpData.userid != USERID ) continue;

            //如果为第一层的节点，需要记录其所属分类及平台名称
            //ADD:zhanglun
            if (level === 0) {
                var allFlag = DEVICE.indexOf( "0" ) != -1,
                    nodeFlag = true;

                node.devicename = [];

                //可能属于多个平台
                node.devicetype = $.grep( tmpDevice, function( val, i ) {
                    if ($.trim(val) !== "") {
                        if ( !allFlag && DEVICE.indexOf( val ) == -1 ) {
                            nodeFlag = false;
                        }

                        node.devicename.push(PLATFORM_MAP[val] || val);
                        tmpDevice[ i ] = tmpDevice[ i ];
                        return true;
                    }else{
                        return false;
                    }
                } );

                // 过滤掉版权平台不符合要求或子栏目为空的栏目树
                if ( !nodeFlag || !tmpData.children || tmpData.children.length == 0 ) continue;

                //如果平台名称为空则显示未设定
                node.devicename = node.devicename.length === 0 ? "未设定" : node.devicename.join("|");

                //如果groupids为空，则关联用户组显示未设定
                node.groupids = $.grep( (tmpData.groupids || "").split("|"), function( val ) {
                    return $.trim( val ).length > 0;
                } );

                node.groupname = $.grep( (tmpData.groupnames || "").split("|"), function( val ) {
                    return $.trim( val ).length > 0;
                } );

                // 去掉无用id
                node.groupids.length = node.groupname.length;

                node.groupname  = node.groupids.length == 0 ? "未设定" : node.groupname.join( "|" );
            }

            //判断该节点是否需要勾选
            for (var j in checkedData) {
                if (tmpData.id == checkedData[j]) {
                    node.isDefault = true;
                    node.checked = true;
                    node.state = "open";
                }
            }

            treeData.push(node);

            if (tmpData.children && tmpData.children.length > 0) {
                treeData[n].state = level < 1 ? "open" : "closed";  //只有第一层需要展开
                treeData[n].children = [];

                arguments.callee(tmpData.children, treeData[n].children, checkedData, level+1, hasRight);
            }

            n++;
        }
    },
    /**
     * [initTree 初始化树形结构]
     * @return {[type]} [description]
     */
    initTree: function () {
        var treeData = SelectType.treeData;

        if ( treeData.length == 0 ) {
            if ( LIMIT_FLAG ) {
                $.alert( "暂无您可操作的栏目树" );
            } else {
                $.alert( "剧集当前可用版权平台暂无可选栏目树，请修改版权时间或到栏目管理系统添加对应栏目树" );
            }
            return;
        }

        $( "#tt" ).tree({
            data: treeData,
            checkbox: true,

            //ADD zhanglun 定义是否级联检查
            cascadeCheck:false,

            //ADD zhanglun 定义是否只在叶节点前显示复选框,定义为false则在每个节点前都显示复选框
            onlyLeafCheck: false,

            onLoadSuccess: function (node, data) {

                //去掉图标DOM
                // $( "#tt .tree-icon" ).remove();
                
                //去掉选择框前面多余的占位符
                //ADD zhanglun 需要排除折叠展开图标
                $( "#tt .tree-checkbox" ).prev().not(".tree-hit").remove();

                //ADD zhanglun 去掉顶部节点的多选框，其为栏目的名称，不应该被选择
                $( "#tt > li > .tree-node > .tree-checkbox" ).remove();

                //将第一排设为横排显示
                //按照目前需求，第一排的节点即为一个独立的分类结构
                //ADD:zhanglun
                $( "#tt > li" ).css({
                    // width: 99/($( "#tt > li" ).length) + "%",
                    // float: "left"
                    "display": "inline-block",
                    "vertical-align": "top"
                }).addClass(SelectType.singTreeClass);

                //将选中的节点默认展开
                var checkedNodes = $( "#tt" ).tree( "getChecked" );

                for (var i = 0, l = checkedNodes.length; i < l; i++) {
                    $( "#tt" ).tree( "expandTo", checkedNodes[i].target );
                }

                // 对于独立的分类树结构需要显示其平台名称和所属用户组名称
                //ADD:zhanglun
                SelectType.appendDesc();

                SelectType.adjustPage();
            },
            // 获取被选中的节点的所有父级节点，并选中，此方法会递归执行
            // ADD ：zhangluun 20160406 chenmj 要求
            onCheck: function(node){
                var $tt = $( "#tt" );

                // 当前节点是否关联父节点
                if ( node.relate ) {
                    var parentNodes = $tt.tree( "getParent", node.target ) || {},
                        $parent = $(parentNodes.target),
                        $children = $parent.siblings("ul").find("> li > .tree-node").has(".tree-checkbox1"),
                        hasRelate = false;

                    $children.each( function() {
                        var node = $tt.tree( "getNode", this );

                        if ( node.relate ) {
                            hasRelate = true;
                            return false;
                        }
                    } );

                    if ( hasRelate && $parent.has(".tree-checkbox1").length == 0 ) {
                        $tt.tree("check",parentNodes.target);
                    } else if ( !hasRelate && $parent.has(".tree-checkbox1").length > 0 ) {
                        $tt.tree("uncheck",parentNodes.target);
                    }

                }
            },
            onBeforeCheck: function(node, target){
                // 如果没有权限，则没法操作该节点
                if ( !node.hasRight && (!node.isDefault || node.checked) ) return false;
            }


        });
        
    },
    /**
     * [appendDesc 为没个独立的栏目树根节点添加描述信息，包括支持平台和用户组]
     * @return {[type]} [description]
     */
    appendDesc : function(){
        $("."+SelectType.singTreeClass).each(function(index){
            var $this = $(this),
                $div = $this.find("div:eq(0)"),
                name = $div.find(".tree-title").text(),
                devicename = SelectType.treeData[index].devicename,
                groupname  = SelectType.treeData[index].groupname;

            $this.attr( "title", '名称：' + name + '\n平台：' + devicename + '\n用户组：' + groupname );
            
            var descStr = 
                    "<ul class='tree-desc'> \
                        <li class='tree-desc-platform' title='"+ devicename +"'><font>支持平台：</font>"+
                            devicename +
                        "</li> \
                        <li class='tree-desc-groupname' title='"+ groupname +"'><font>关联用户组：</font>"+
                            groupname +
                        "</li> \
                    </ul>";
                    

            $(descStr).appendTo($div);

        });
    },
    /**
     * [submitSelectType 确认提交分类选择]
     * @param  {jQ对象} $focus [mainFrame中被选中的行]
     * @param  {function} $fn [操作完成回调函数，供mainFrame刷新页面]
     * @return 无返回值
     */
    submitSelectType: function (fn) {
        //获取被选中的节点
        var $tt = $('#tt'),
            nodes = $("#tt").tree("getChecked"),
            label = [];

        if (typeof PARAMS.label != "undefined" && nodes.length == 0) {
            $.msg( "请选择栏目" );
            return;
        }

        for ( var i = 0; i < nodes.length; i++ ) {
            label.push( nodes[i].id );
        }

        // 先将id排序
        label.sort( function( a, b ) {
            return a - b;
        } );
        
        label = label.join( "|" );

        this.submitAjax( typeof NEWSID == "object" ? NEWSID.slice(0) : [ NEWSID ], label, fn );
    },

    submitAjax: function ( nid, label, fn ) {
        var self = this;

        // 保存属性数据设置
        var option = {
            url: "post_adjust_news",
            type: "POST",
            data: {
            accesstoken : TOKEN,
            newsid      : nid.pop(),
            label       : label
        },
            success: function ( data ) {

                if ( data.ret == 0 ) { // 设置成功

                    if ( nid.length > 0 ) {

                        self.submitAjax( nid, label, fn );

                    } else {

                        tLayer( "close", LAYERID );

                        iHomed.runFunction( fn );

                    }

                } else {

                    option.error();

                }

            },
            error: function () {
                $.alert( "挂载栏目失败！" );
            }
        };

        // 开始保存
        iHomed( "setData", option );
    },
    /**
     * 调整弹窗尺寸
     * @return 无
     */
    adjustPage: function() {
        var $layer = topFrame.$( "#selectType" ).find( ".layer-box-table" ),
            length = $( "#tt > li" ).length;

        length = length < 3 ? 3 : length;
        length = length > 7 ? 7 : length;

        var width = 150 * length;

        //如果第一层的树宽度小于150px，则为tt容器增加宽度
        //ADD:zhanglun
        // if($( "#tt > li:eq(0)" ).outerWidth() < 150) {
        //     $("#tt").width(150 * $( "#tt > li" ).length);
        // }

        $layer.width(width).find( ".layer-box-header h4" ).width(width - 60);

        // 解决窗口宽度不变化时，高度不会调整的问题
        $(window).trigger( 'resize' );

        if ( $layer.css( "position" ) == "absolute" ) {
            var $body = $layer.closest('body'),
                bodyWidth = $body.width(),
                left = ( bodyWidth - 150 * length ) / bodyWidth / 2 * 100;

            $layer.css( "left", left + "%" );
        }
    }
};

/**
 * 立即执行
 */
$(document).ready(function () {

    var body = document.body,
        host = document.location.host,
        $iframe;

    // 过滤掉跨域iframe，避免浏览器报错
    $( 'iframe', top.document ).each(function(){
        var src = this.src || "";
        if ( src.indexOf( host ) == -1 ) return true;
        if ( $iframe ) {
            $iframe = $iframe.add( this );
        } else {
            $iframe = $( this );
        }
    });

    // 获取当前页面的iframe
    $iframe.each( function() {
        if(body.ownerDocument === this.contentWindow.document) {
            var $this = $( this ),
                $wraper = $this.closest('.layer-box-wraper');

            IFRAME = this;
            LAYERID = $wraper.attr( "id" );
            $TITLE = $wraper.find('.layer-box-header h4');
        }
        return !IFRAME;
    } );

    window.onresize = function () {
        var height = $( window ).height();

        $( "#tt" ).height( height - 50 );
    }

    SelectType.init();

});