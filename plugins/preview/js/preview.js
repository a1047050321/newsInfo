var listArr = [];

window.onload = function () {
    listArr = top.Poster.list;

    init();
};

function init(){
   initImgContainer();
   initList();
}

window.onresize = function(){
    initImgContainer();
    initList();
}

var parmObj = {
    DivId:        "L",             //行DIV的ID名称   
    focusId:      "focus",         //焦点的ID
    arrLength:     listArr.length, //数据总长度
    listSize:      7,              //行数
    rowHeight:     95,             //行高
    focusStartPos: 0,              //显示的第一行焦点Y轴坐标
    direction:     "left"             //方向 top 纵向 left 横向
};

var currsize = 97;
var count = 30;
var totalPage = 0;
var pagecount = 0;
var listPos = 0;
var previewPositionXY = 32;
var thumbnaillistwidth = 0;
var previewcontainerW = 0;
var previewcontainerH = 0;

function initImgContainer(){
    keyFlag = 0;
    $(".thumbnaillist ul").html("");
    $(".thumbnaillist ul").css("left",2);
    initContainerHeight();
    totalPage = Math.ceil(listArr.length/pagecount);
}

function initContainerHeight(){
    var height = $(window).height();
    var width = $(window).width();
    thumbnaillistwidth = $(".thumbnaillist").width();
    thumbnaillistwidth = thumbnaillistwidth - thumbnaillistwidth%currsize;
    pagecount = thumbnaillistwidth/currsize;
    var previewthumbnailheight = $(".previewthumbnail").height();
    $(".pre_arrow,.next_arrow").css("height",height-previewthumbnailheight);
    $(".previewcontainer").css({"width":width-previewPositionXY*2,"height":height-previewthumbnailheight-previewPositionXY*2,"left":previewPositionXY,"top":previewPositionXY});
    previewcontainerW = width-previewPositionXY*2;
    previewcontainerH = height-previewthumbnailheight-previewPositionXY*2;
}

function initList(){
    locationImage();
    initlistEvent();
    focusMove(0);
}

function createList(_count,_num){
    var active = "";
    var select = "";
    if(_num>0){
        var index = $(".thumbnaillist ul li:last-child").attr("data-index");
        index = index === undefined ? 0 : parseInt(index)+1;
        for(var i= 0; i<_count; i++){
          if(index+i == listPos){
            active = "active";
            select = "select";
          }else{
            active = "";
            select = "";
          }
          $(".thumbnaillist ul").append('<li id="L'+(index+i)+'" class="position">'+
                '<span class="verticalAlign"></span>'+
                '<img src="img/tm.gif" height="60" width="80" />'+
                '<div class="imgcover '+active+'"></div>'+
                '<div class="imgfocus '+select+'"></div>'+
            '</li>');  
            showlist(index+i);
        } 
    }else{
        var index = $(".thumbnaillist ul li:first-child").attr("data-index");
        index = index === undefined ? 0 : parseInt(index)-1;
        for(var i= 0; i<_count; i++){
          if(index-i == listPos){
            active = "active";
            select = "select";
          }else{
            active = "";
            select = "";
          }
          $(".thumbnaillist ul").prepend('<li id="L'+(index-i)+'" class="position">'+
                '<span class="verticalAlign"></span>'+
                '<img src="img/tm.gif" height="60" width="80" />'+
                '<div class="imgcover '+active+'"></div>'+
                '<div class="imgfocus '+select+'"></div>'+
            '</li>');  
            showlist(index-i);
        } 
    }

    bindimgEvent();
}


function locationImage(){
    var index = listPos - listPos%pagecount;
    currpage = Math.ceil((listPos+1) / pagecount);
    var _count = 0;
    if(index+count>listArr.length-1){
        _count = listArr.length-index;
    }else{
        _count = index+count;
    }
    $(".thumbnaillist ul").html("");
    var active = "";
    var select = "";
    for(var i= 0; i<_count; i++){
      if(index+i == listPos){
        active = "active";
        select = "select";
      }else{
        active = "";
        select = "";
      }
      $(".thumbnaillist ul").append('<li id="L'+(index+i)+'" class="position">'+
            '<span class="verticalAlign"></span>'+
            '<img src="img/tm.gif" height="60" width="80" />'+
            '<div class="imgcover '+active+'"></div>'+
            '<div class="imgfocus '+select+'"></div>'+
        '</li>');  
        showlist(index+i);
    }

    bindimgEvent();
}

var clickFlag = 0;
var currpage = 1;
var opreaFlag = 0;
var keyFlag = 0;
function nextPageList(){
    if(opreaFlag) return;
    var index = $(".thumbnaillist ul li:last-child").attr("data-index");
    var left = parseInt($(".thumbnaillist ul").css("left"))-thumbnaillistwidth;
    if(currpage+1>totalPage) return;
    opreaFlag = 1;
    currpage++;
    if(Math.abs(left)>count*currsize-thumbnaillistwidth){
        var tempcount = 0;
        if(index+count>listArr.length-1){
            tempcount = listArr.length-index-1;
        }else{
            tempcount = index+count;
        }
        createList(tempcount,1);
        $(".thumbnaillist ul").animate({"left":left},function(){
            for(var i=0;i<tempcount;i++){
                $(".thumbnaillist ul li:first-child").remove();
            }
            $(".thumbnaillist ul").css("left",parseInt($(".thumbnaillist ul").css("left"))+tempcount*currsize)
            opreaFlag = 0;
        });
    } else {
        $(".thumbnaillist ul").animate({"left":left},function(){
            opreaFlag = 0;
        });
    }
}

function PrePageList(){
    if(opreaFlag) return;
    var temppage = currpage;
    var index = $(".thumbnaillist ul li:first-child").attr("data-index");
    var left = parseInt($(".thumbnaillist ul").css("left"))+thumbnaillistwidth;
    if(parseInt($(".thumbnaillist ul").css("left")) == 2 && index==0) return;
    if(currpage<0) return;
    opreaFlag = 1;
    currpage--;
    if(index==0 && left > 2) left = 2;
    if(left>2){
        var tempcount = index-count;
        if(tempcount<0) tempcount = index;
        else tempcount = count;
        $(".thumbnaillist ul").css("left",parseInt($(".thumbnaillist ul").css("left"))-tempcount*currsize);
        createList(tempcount,-1);
        left = parseInt($(".thumbnaillist ul").css("left"))+thumbnaillistwidth;
        $(".thumbnaillist ul").animate({"left":left},function(){
            var removecount = temppage==totalPage?listArr.length%pagecount-1: pagecount;
            for(var i=0;i<removecount;i++){
                $(".thumbnaillist ul li:last-child").remove();
            }
            opreaFlag = 0;
        });
    }else{
        $(".thumbnaillist ul").animate({"left":left},function(){
            opreaFlag = 0;
        });
    }
}

function showlist(_pos){
    var img = new Image();
    var imgsrc = listArr[_pos];
    img.src = imgsrc+"?_="+($.now());
    img.onload = function(){
        var obj = AutoResizeImage(90,90,this.width,this.height);
        $("#L"+_pos).attr("data-index",_pos);
        $("#L"+_pos).find("img").attr({"src":this.src,"width":parseInt(obj.w),"height":parseInt(obj.h)});
    }

}


function focusMove(_num){
    if(keyFlag) return;
    keyFlag = 1;
    setTimeout(function(){
        keyFlag = 0;
    },100);
    if(listPos+_num > listArr.length-1 || listPos+_num<0) return;
    listPos += _num;
    if(clickFlag){
        clickFlag = 0;
        init();
        return;
    }
    if((listPos+1)%pagecount == 1 && _num>0){
        nextPageList();
    }else if((listPos+1)%pagecount == 0 && _num<0){
        PrePageList();
    }
    $(".imgcover").removeClass("active");
    $(".imgfocus").removeClass("select");
    $("#L"+listPos).find(".imgcover").addClass("active");
    $("#L"+listPos).find(".imgfocus").addClass("select");
    showImg();
}

function showImg(){
    clickFlag = 0;
    var imgsrc = listArr[listPos];
    var imgname = imgsrc.substring(imgsrc.lastIndexOf("/")+1);
    var img = new Image();
    img.src = imgsrc+"?_="+($.now());
    img.onload = function(){
        var obj = AutoResizeImage(previewcontainerW,previewcontainerH,this.width,this.height);
        $(".previewcontainer").find("img").attr({"src":this.src,"width":parseInt(obj.w),"height":parseInt(obj.h)});
        $(".imgInfo span").html(imgname+" | "+parseInt(obj.w)+"x"+parseInt(obj.h)); 
        $(".thumbnailpage").html((listPos+1)+"/"+(listArr.length));
    } 
}


function initlistEvent(){
    $(document).unbind();
    $(document).keydown(function(event){  
        event = event || window.event;
        if(event.keyCode==38){  //上
            focusMove(-1)
        }else if(event.keyCode==40){  //下
            focusMove(1)
        }else if(event.keyCode==37){  //左
            focusMove(-1); 
        }else if(event.keyCode==39){  //右
            focusMove(1); 
        }if(event.keyCode==8){  //返回
            top.closeFrame(); 
            return false;
        }if(event.keyCode==27){  //esc
            top.closeFrame(); 
            return false;
        }

    });

    $(".pre_thumbnailarrow").unbind();
    $(".pre_thumbnailarrow").bind({
        mouseenter:function(){
            $(this).find(".thumbnailleft").addClass("hover");
        },
        mouseleave:function(){
            $(this).find(".thumbnailleft").removeClass("hover");
        },
        click:function(){
            clickFlag = 1;
            PrePageList();
        }
    });

    $(".next_thumbnailarrow").unbind();
    $(".next_thumbnailarrow").bind({
        mouseenter:function(){
            $(this).find(".thumbnailright").addClass("hover");
        },
        mouseleave:function(){
            $(this).find(".thumbnailright").removeClass("hover");
        },
        click:function(){
            clickFlag = 1;
            nextPageList();
        }
    });


    $(".pre_arrow").unbind();
    $(".pre_arrow").bind({
        mouseenter:function(){
            $(this).find(".arrowleft").addClass("hover");
        },
        mouseleave:function(){
            $(this).find(".arrowleft").removeClass("hover");
        },
        click:function(){
            focusMove(-1);    
        }
    });

    $(".next_arrow").unbind();
    $(".next_arrow").bind({
        mouseenter:function(){
            $(this).find(".arrowright").addClass("hover");
        },
        mouseleave:function(){
            $(this).find(".arrowright").removeClass("hover");
        },
        click:function(){
            focusMove(1);    
        }
    });

    $(".previewclose").unbind();
    $(".previewclose").bind({
        mouseenter:function(){
            $(this).addClass("hover");
        },
        mouseleave:function(){
            $(this).removeClass("hover");
        },
        click:function(){
            //隐藏预览窗口
            top.$("#previewFrame").fadeOut(300);

            //显示海报弹出窗
            top.tLayer("show", "layer-upload-poster");
        }
    });


    $(".thumbnailopen").unbind();
    $(".thumbnailopen").bind({
        mouseenter:function(){
            $(this).find(".thumbicon").addClass("hover");
        },
        mouseleave:function(){
            $(this).find(".thumbicon").removeClass("hover");
        },
        click:function(){
           var isOpen = $(this).find(".thumbicon").hasClass("open");
            if(isOpen){
                $(this).find(".thumbicon").removeClass("open");
                $(this).find(".thumbicon").addClass("close");
                $(".previewthumbnail").css({"height":30});
                $(".thumbnailright,.thumbnailleft").hide();
            }else{
               $(this).find(".thumbicon").removeClass("close");
                $(this).find(".thumbicon").addClass("open"); 
                $(".previewthumbnail").css({"height":130});
                $(".thumbnailright,.thumbnailleft").show();
            } 
             initContainerHeight();
            showImg();
        }
    });
}


function bindimgEvent(){
    $(".thumbnaillist ul li").unbind();
    $(".thumbnaillist ul li").bind({
        mouseenter:function(){
            $(this).find(".imgcover").addClass("hover");
        },
        mouseleave:function(){
            $(this).find(".imgcover").removeClass("hover");
        },
        click:function(){
            var tempPos = listPos;
            var index = parseInt($(this).attr("data-index"));
            listPos = index;
            if((listPos+1)%pagecount == 1 && tempPos<listPos){
                nextPageList();
            }else if((listPos+1)%pagecount == 1 && tempPos>listPos){
                PrePageList();
            }
            $(".imgcover").removeClass("active");
            $(".imgfocus").removeClass("select");
            $("#L"+listPos).find(".imgcover").addClass("active");
            $("#L"+listPos).find(".imgfocus").addClass("select");
            showImg();
        }
    });
}

//等比缩略图
function AutoResizeImage(_maxwidth,_maxheight,_imgwidth,_imgheight){
    var obj = {w:0,h:0};
    var maxWidth = _maxwidth; 
    var maxHeight = _maxheight; 
    var hRatio;
    var wRatio;
    var Ratio = 1;
    var w = _imgwidth;
    var h = _imgheight;
    wRatio = maxWidth / w;
    hRatio = maxHeight / h;
    if (maxWidth ==0 && maxHeight==0){
      Ratio = 1;
    }else if (maxWidth==0){//
      if (hRatio<1) Ratio = hRatio;
    }else if (maxHeight==0){
      if (wRatio<1) Ratio = wRatio;
    }else if (wRatio<1 || hRatio<1){
      Ratio = (wRatio<=hRatio?wRatio:hRatio);
    }
    if (Ratio<1){
      w = w * Ratio;
      h = h * Ratio;
    }

    obj.w = w;
    obj.h = h;
    return obj;
}


