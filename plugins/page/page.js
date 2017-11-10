var Class = {
	create: function() {
		return function() { this.initialize.apply(this, arguments); }
	}
}


//页码对象
var Page = Class.create();
Page.prototype = {
  initialize: function(container, options) {
	  this.container = $(container);
	  this.inputValue = "";
	  this.dataPage = 0;
	  this.showPage = 10;
	  this.SetOptions(options);
	  this.reqData(this.options.currPage);	
	 
  },
  //设置默认属性
  SetOptions: function(options) {  
	this.options = {//默认值
		currPage:1,
		reqhttp:"",
		total:"total",
		pagenum:66,
		totalPage:1,
		data: {},
		success:function(_data,_pageidx){},
		error:function(_pageidx){}
	};
	this.options = $.extend(this.options,options);
  },
  
  initData:function(){
	  	//if(this.options.totalPage<2){
			//this.container.hide();
			//return;  
		//}
	    this.dataPage = Math.ceil(this.options.currPage/this.showPage)-1;
		this.container.html("");
		var before = "";
		if(this.options.currPage==1){
			before += '<a class="first nodis" href="javascript:void(0);">首页</a>';
			before += '<a class="pre nodis" href="#?page=2">上一页</a>';  
		}else{
			before += '<a class="first" href="javascript:void(0);">首页</a>';
			before += '<a class="pre" href="#?page=2">上一页</a>';  
		}
		var middel = "";
		for(var i = 0;i<10;i++){
			var numpage = (this.dataPage*this.showPage+(i+1));
			if(numpage<=this.options.totalPage){
				if(this.options.currPage==numpage){
					middel += '<a class="page current" href="javascript:void(0);">'+numpage+'</a>';	
				}else{
					middel += '<a class="page" href="javascript:void(0);">'+numpage+'</a>';		
				}
			}
		}
		var after = "";
		if(this.options.currPage==this.options.totalPage){
			after += '<a class="next nodis" href="javascript:void(0);">下一页</a>';
			after += '<a class="last nodis" href="javascript:void(0);">末页</a>';
		}else{
			after += '<a class="next" href="javascript:void(0);">下一页</a>';
			after += '<a class="last" href="javascript:void(0);">末页</a>';
		}
		
		after += '<span class="input"><input type="text"  value="'+this.inputValue+'" /></span><span class="totalpage">/'+this.options.totalPage+'页</span>';
		this.container.append(before+middel+after);
		this.container.show();
		var ccwidth = parseInt(this.container.css("width"));
		var parentwidth = parseInt(this.container.parent().css("width"));
		this.container.css("marginLeft",(parentwidth-ccwidth)/2+"px");
		this.initEvent();
  },
  initEvent:function(){
	  	var self = this;
		this.container.find(".first").bind("click",function(){
			if(self.options.currPage==1) return;
			self.reqData(1);
		});
		this.container.find(".last").bind("click",function(){
			if(self.options.currPage==self.options.totalPage) return;
			self.reqData(self.options.totalPage);
		});
		
		this.container.find(".pre").bind("click",function(){
			if(self.options.currPage-1<1) return;
			var numpage = self.options.currPage-1<1?1:self.options.currPage-1;
			self.reqData(numpage);
		});
		this.container.find(".next").bind("click",function(){
			if(self.options.currPage+1>self.options.totalPage) return;
			var numpage = self.options.currPage+1>self.options.totalPage?self.options.totalPage:self.options.currPage+1;
			self.reqData(numpage);
		});
		
		this.container.find(".page").bind("click",function(){
			var numpage = parseInt($(this).html());
			self.reqData(numpage);
		});
		
		this.container.find("input").bind("blur",function(){
			$(this).removeClass("focus");
			var numpage = $(this).val();
			if(isNaN(numpage) || numpage>self.options.totalPage || numpage<1){
				$(this).val("");
				return;	
			}
			self.reqData(numpage);
		});	

		this.container.find("input").bind("focus",function(){
			$(this).addClass("focus");
		});	
  },
  ajax:function(_url,_data,_success,_error){
	$.ajax({
	  type:'get',
	  url: _url,
	  dataType: "json",
	  data: _data,
	  success: function(r){
		_success(r);
	  },
	  error:function(){
		_error();
	  }
	});	  
  },
  reqData:function(_numpage){
	var self = this;
	var url = self.options.reqhttp+"?pageidx=" + (_numpage||self.options.currPage) + "&pagenum=" + self.options.pagenum;
	var data = self.options.data;
	self.ajax(url, data, function(_data){
		if(typeof _data[self.options.total] != "undefined"){
		   self.options.totalPage = Math.ceil(parseInt(_data[self.options.total])/self.options.pagenum);
	    }
		self.options.currPage = parseInt(_numpage);
		self.initData();
		self.options.success(_data,self.options.currPage)	
	},function(){
		self.initData();
		self.options.error(_numpage);	
	});  
  }
}