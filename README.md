##安装
>npm i -gd atm3-command-upload

##示例
###上传文件
>atm upload -f t.txt

###上传文件夹
>atm upload -p ./

###上传zip文件
>atm upload -f t.zip

默认上传到 `/data/wapstatic/tmp`, 使用其他
>atm upload /data/wapstatic/v_lchliu/160601-index -f t.txt
