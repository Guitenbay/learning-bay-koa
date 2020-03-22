
// create xhr object cross browser  
function createXHR() {  
    if(typeof XMLHttpRequest != 'undefined'){  
        return new XMLHttpRequest();  
    }  
    else if(typeof ActiveXObject != 'undefined'){  
        if(typeof arguments.callee.activeXString != 'string'){  
            var versions = ['MSXML2.XMLHttp.6.0','MSXML2.XMLHttp.3.0' ,'MSXML2.XMLHttp'], // ie browser different vesions  
                i,len;  
            for(i=0,len=versions.length; i<len;i++){  
                try{  
                    new ActiveXObject(versions[i]);  
                    arguments.callee.activeXString = versions[i];  
                    break;  
                }  
                catch(ex){  
                    // jump  
                }  
            }  
        }  
        return new ActiveXObject(arguments.callee.activeXString);  
          
    }  
    else{  
        throw new Error('No XHR object available.');  
    }  
}  
  
function $ajax(obj){
    console.log(1);  
    var xhr = createXHR();  
    xhr.onreadystatechange = function(){  
        if(xhr.readyState == 4){  
            if((xhr.status >= 200 && xhr.status<300) || xhr.status == 304){  //200 表示相应成功 304 表示缓存中存在请求的资源  
                obj.success();
            }  
            else{  
                obj.error();
            }  
        }  
    }  
    xhr.open(obj.type,obj.url,async);  
    xhr.send();  
} 

$ajax({
    url:"/",
    type:"GET",
    async:true,
    success:function(){
        console.log("success");
    },
    error:function(){
        console.log("error");
    }
});


