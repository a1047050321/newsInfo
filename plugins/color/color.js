var workSpace = top.frames["mainFrame"].window;

//获取请求参数
var urlParams =  $_GET(window.location.href);

/**
 * 取色以后的回调
 * @param  {String} content 颜色的hex值
 * @return 无返回值
 */
function colorcallback(content) {
    var fn = urlParams.cbf_name.split("_");
    
    //执行取色的回调操作
    workSpace[fn[0]][fn[1]]({
        colorfill  : 0,
        fillcontent: content
    });
}

//颜色分组
var colorGroup = [{
            "scope": ".themeColor .aloneColor",
            "module": "static",
            "serial": false,
            "start": 0,
            "end": 9,
        }, {
            "scope": ".themeColor .serialColor",
            "module": "static",
            "serial": {
                "group": 10, //组数
                "total": 5  //每组的成员数
            },
            "start": 10,
            "end": 59
        }, {
            "scope": ".standColor .aloneColor",
            "module": "static",
            "serial": false,
            "start": 60,
            "end": 69
        }, {
            "scope": ".recentColor .aloneColor",
            "module": "recent",
            "serial": false
        }, {
            "scope": ".autoColor",
            "module": "auto",
            "serial": false
        }];

//颜色块集合
var colors = {
    "auto": [
        {"hex": "#FFFFFF", "rgb": "255,255,255"}
    ],
    "static": [
        {"hex": "#FFFFFF", "rgb": "255,255,255"},{"hex": "#000000", "rgb": "0,0,0"},{"hex": "#E7E6E6", "rgb": "231,230,230"},{"hex": "#44546A", "rgb": "68,84,106"},{"hex": "#5B9BD5", "rgb": "91,155,213"},{"hex": "#ED7D31", "rgb": "237,125,49"},{"hex": "#A5A5A5", "rgb": "165,165,165"},{"hex": "#FFC000", "rgb": "255,192,0"},{"hex": "#4472C4", "rgb": "68,114,196"},{"hex": "#70AD47", "rgb": "112,173,71"},
        {"hex": "#F2F2F2", "rgb": "242,242,242"},{"hex": "#7F7F7F", "rgb": "127,127,127"},{"hex": "#D0CECE", "rgb": "208,206,206"},{"hex": "#D6DCE4", "rgb": "214,220,228"},{"hex": "#DEEBF6", "rgb": "222,235,246"},{"hex": "#FBE5D5", "rgb": "251,229,213"},{"hex": "#EDEDED", "rgb": "237,237,237"},{"hex": "#FFF2CC", "rgb": "255,242,204"},{"hex": "#D9E2F3", "rgb": "217,226,243"},{"hex": "#E2EFD9", "rgb": "226,239,217"},
        {"hex": "#D8D8D8", "rgb": "216,216,216"},{"hex": "#595959", "rgb": "89,89,89"},{"hex": "#AEABAB", "rgb": "174,171,171"},{"hex": "#ADB9CA", "rgb": "173,185,202"},{"hex": "#BDD7EE", "rgb": "189,215,238"},{"hex": "#F7CBAC", "rgb": "247,203,172"},{"hex": "#DBDBDB", "rgb": "219,219,219"},{"hex": "#FEE599", "rgb": "254,229,153"},{"hex": "#B4C6E7", "rgb": "180,198,231"},{"hex": "#C5E0B3", "rgb": "197,224,179"},
        {"hex": "#BFBFBF", "rgb": "191,191,191"},{"hex": "#3F3F3F", "rgb": "63,63,63"},{"hex": "#757070", "rgb": "117,112,112"},{"hex": "#8496B0", "rgb": "132,150,176"},{"hex": "#9CC3E5", "rgb": "156,195,229"},{"hex": "#F4B183", "rgb": "244,177,131"},{"hex": "#C9C9C9", "rgb": "201,201,201"},{"hex": "#FFD965", "rgb": "255,217,101"},{"hex": "#8EAADB", "rgb": "142,170,219"},{"hex": "#A8D08D", "rgb": "168,208,141"},
        {"hex": "#A5A5A5", "rgb": "165,165,165"},{"hex": "#262626", "rgb": "38,38,38"},{"hex": "#3A3838", "rgb": "58,56,56"},{"hex": "#323F4F", "rgb": "50,63,79"},{"hex": "#2E75B5", "rgb": "46,117,181"},{"hex": "#C55A11", "rgb": "197,90,17"},{"hex": "#7B7B7B", "rgb": "123,123,123"},{"hex": "#BF9000", "rgb": "191,144,0"},{"hex": "#2F5496", "rgb": "47,84,150"},{"hex": "#538135", "rgb": "83,129,53"},
        {"hex": "#7F7F7F", "rgb": "127,127,127"},{"hex": "#0C0C0C", "rgb": "12,12,12"},{"hex": "#171616", "rgb": "23,22,22"},{"hex": "#222A35", "rgb": "34,42,53"},{"hex": "#20507B", "rgb": "32,80,123"},{"hex": "#833C0B", "rgb": "131,60,11"},{"hex": "#525252", "rgb": "82,82,82"},{"hex": "#7F6000", "rgb": "127,96,0"},{"hex": "#1F3864", "rgb": "31,56,100"},{"hex": "#375623", "rgb": "55,86,35"},
        {"hex": "#C00000", "rgb": "192,0,0"},{"hex": "#FF0000", "rgb": "255,0,0"},{"hex": "#FFC000", "rgb": "255,192,0"},{"hex": "#FFFF00", "rgb": "255,255,0"},{"hex": "#92D050", "rgb": "146,208,80"},{"hex": "#00B050", "rgb": "0,176,80"},{"hex": "#00B0F0", "rgb": "0,176,240"},{"hex": "#0070C0", "rgb": "0,112,192"},{"hex": "#002060", "rgb": "0,32,96"},{"hex": "#7030A0", "rgb": "112,48,160"}
    ],
    "recent": [
        {"hex": "#FFFFFF", "rgb": "255,255,255"}
    ]
};

function initColorModule() {
    var g = colorGroup,
        gLen = colorGroup.length;
    var color = colors;
    for (var i = 0; i < gLen; i++) {
        var frag = document.createDocumentFragment();
        if (g[i].module == "static") {
            var cStatic = color.static;
            if (g[i].serial) {
                var group = g[i].serial.group,
                    total = g[i].serial.total;
                for (var j = 0; j < group; j++) {
                    var div = document.createElement("div");
                    for (var z = 0; z < total; z++) {
                        div.appendChild(createColorBlock(cStatic[start+j+z*group]));
                    }
                    frag.appendChild(div);
                }
            } else {
                var start = g[i].start,
                    end = g[i].end;
                while (start <= end) {
                    frag.appendChild(createColorBlock(cStatic[start]));
                    start++;
                }
            }
            
        } else if (g[i].module == "recent") {
            var cRecent = color.recent,
                cLen = cRecent.length;

            var frag = document.createDocumentFragment();
            for (var j = 0; j < cLen; j++) {
                frag.appendChild(createColorBlock(cRecent[j]));
            }
        } else if (g[i].module == "auto") {
            var cAuto = color.auto.shift();
            var frag = document.createDocumentFragment();
            frag.appendChild(createColorBlock(cAuto));
        }
        $(g[i].scope).get(0).appendChild(frag);
    }
}

function createColorBlock(color) {
    var node = document.createElement("span");
    node.setAttribute("data-color", JSON.stringify(color));
    node.style.backgroundColor = color.hex;
    return node;
}

initColorModule();
initColorBlrEvent();

var timer = null;

/**
 * 初始化色块上的事件
 * @return 无返回值
 */
function initColorBlrEvent() {
    $(".colorBoxWraper span").live({
        click: function () {
            var color = $(this).data("color");
            replaceAuto(color);
            appendRecent(color);

            /*if (timer) {
                clearTimeout(timer);
                timer = null;
            }*/

            //timer = setTimeout(function () {
            colorcallback(color.hex);
            //}, 400);
        }
    });
}

/**
 * 替换当前自动色块区域中的色块颜色
 * @param  {Object} color 色块信息
 * @return 无返回值
 */
function replaceAuto(color) {
    var $autoColor = $(".autoColor span");
    $autoColor.replaceWith($(createColorBlock(color)));
}

/**
 * 追加一个色块到最近使用颜色区域
 * @param  {Object} color 色块信息
 * @return 无返回值
 */
function appendRecent(color) {
    colors.recent.unshift(color);
    $(".recentColor .aloneColor")
        .prepend($(createColorBlock(color)));
}