/*
* @Author: zyp
* @Date: 2018/12/5
* @Last Modified by: zyp
* @Last Modified time: 2018/12/5
*/
const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

//初始url
const url = {	
    hostname: 's.weibo.com',
    path: '/top/summary?Refer=top_hot&topnav=1&wvr=6',
}
const hotInfoArr = []; // 存放热搜内容，防止重复
let i = 0; // 计数
const date = getDate(); // 获取当前日期
const second = 1000;

function getDate(){
	const date = new Date(); // 热搜日期
	let day;
	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	let strDate = date.getDate();
	day = year + '-' + month + '-' + strDate;
	return day;
}

function getUrl(url){
	setInterval(function(){
			//采用https模块向服务器发起一次get请求  
			https.get(url,function(res){
				var html='';
				res.setEncoding('binary');
				//监听data事件，每次取一块数据
				res.on('data',function(chunk){
					html += chunk;
				});
				res.on('end',function(){
					var buf = new Buffer(html,'binary');
		      		var str = iconv.decode(buf,'utf-8');
					var $ = cheerio.load(str); //采用cheerio模块解析html				
					$('tbody tr').each(function (index, item) {
						var isTop = $(this).children('.td-01').text(); // 判断是否国家推广
						var isAdv = $(this).children('.td-03').text(); // 判断是否广告
						if(!(isTop.match(/^\d+$/) && isAdv !='荐')){
							return true
						}
						var title = $(this).children('.td-02').text().trim();
						title = title.split(' ')[0] // 去掉热搜后面的数量
						// contentUrl = 'https://s.weibo.com' + $(this).children('.td-02').children('a').attr('href');
						var contentUrl = {	
						    hostname: 's.weibo.com',
						    path: $(this).children('.td-02').children('a').attr('href'),
						}
						
						// 若不存在则写入文件
						if(hotInfoArr.indexOf(title)===-1){
							hotInfoArr.push(title);
							i++;
							getContent(contentUrl,title);
						}
					})				
				})
			}).on('err',function(err){
				console.log(err);
		})},second*300)
}

function getContent(url,title){
	var num = i;
	setTimeout(function(){
			//采用https模块向服务器发起一次get请求  
	https.get(url,function(res){
		var html='';
		res.setEncoding('binary');
		//监听data事件，每次取一块数据
		res.on('data',function(chunk){
			html += chunk;
		});
		res.on('end',function(){
			var buf = new Buffer(html,'binary');
      		var str = iconv.decode(buf,'utf-8');
			var $ = cheerio.load(str); //采用cheerio模块解析html
			
			var content = $('.txt').eq(0).text().trim();
			content = content == ''?'无，应该是广告':content;
			fs.appendFileSync('./data/' + date + '.txt', '标题 : ' + title + '\r\n' + '内容 : ' + content + '\r\n\r\n', 'utf-8', function (err) {
			  if (err) {
			    console.log(err);
			  }
			});
		})
		}).on('err',function(err){
			console.log(err);
	})},second*5)

}

// 将今天的数据读入
function readFile(){
	fs.readFile('./data/' + date + '.txt', function(err, data) {
		try{
		    var arr = data.toString().split('\r\n')
		    arr.forEach(val=>{
		    	hotInfoArr.push(val.split(' : ')[1])
		    	i++;
		    })
		}
		catch(err){
			console.log(err)
		}
	});
}

readFile();
getUrl(url);//主程序开始运行