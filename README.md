##安装
>npm i -gd atm3-command-upload

##配置项
>-f, --from     来源

>-t, --to       服务器位置

>-i, --ignore   过滤规则，使用正则

##示例
#####上传文件/文件夹(zip文件会自动解压--服务端处理)
>atm upload -f t.txt

>atm upload -f ./

>atm upload -f t.zip

默认上传到 `/data/wapstatic/tmp`
#####上传到指定目录并过滤`点开头文件(夹)`和`zip文件`
>atm upload -f ./publish -t /data/wapstatic/v_lchliu/160601index -i "/(^\.)|(\.zip$)/i"

#####使用fis-conf.js进行配置
```
    fis.set("atm", {
        uploadService: 'http://wapstatic.kf0309.3g.qq.com/deploy',
        uploadConfig: {
            from: "./publish",
            to: "/data/wapstatic/v_lchliu/160601index",
            ignore: /(^\.)|(\.zip$)/i
        }
    });
```
**注意**：控制台中的配置会`覆盖`fis-conf.js的配置!


##Change Log
#####2016-07-18 　v0.0.4
1.增加文件(夹)过滤
2.增加fis-conf.js配置