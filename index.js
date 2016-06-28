var request = require('request');
var fs = require('fs');
var path = require('path');

exports.name = 'upload';
exports.desc = 'upload file or the files of destination path.';

exports.register = function (commander, settings) {
    commander.option('-p, --path <path>', 'set path')
             .option('-f, --file <file>', 'set file')
             .action(function (template) {
                var args = [].slice.call(arguments);
                var options = args.pop();

                var to = args[0],
                    distPath = options.path,
                    filePath = options.file,
                    receiver = "http://wapstatic.kf0309.3g.qq.com/receiver/receiver2.php",
                    formData;

                if(!filePath && !distPath){
                    fis.log.error("file or path is required!");
                    return process.exit(0);
                }

                if(!to || typeof to === "object"){
                    to = '/data/wapstatic/tmp';
                }

                if(distPath){
                    distPath = path.resolve(distPath);
                    fis.log.info("Start upload path->'"+ distPath +"' files");
                    explorer(distPath, function(file){
                        var relativePath = path.relative(distPath, file),
                            basename = path.basename(file); //TODO 过滤文件
                        formData = {
                            to: to + "/" + relativePath,
                            file: fs.createReadStream(file)
                        };
                        request.post({url:receiver, formData: formData}, function optionalCallback(err, httpResponse, body) {
                            if (err) {
                                return fis.log.error('upload failed:', relativePath + "\n Error:" +  err);
                            }
                            fis.log.info("Upload "+ relativePath +" successful!");
                        });
                    });
                }else{
                    formData = {
                        to: to,
                        file: fs.createReadStream(path.resolve(filePath))
                    };
                    var ext = path.extname(filePath),
                        basename = path.basename(filePath);
                    if(ext === ".zip") {
                        formData.type = ext.substr(1);
                    }else{
                        formData.to = formData.to + "/" + basename
                    }
                    request.post({url:receiver, formData: formData}, function optionalCallback(err, httpResponse, body) {
                        if (err) {
                            return fis.log.error('upload failed:', filePath + "\n Error:" +  err);
                        }
                        fis.log.info("Upload successful!");
                    });
                }
            });
};

/**
 * 读取文件路径内的所有文件
 * @param  {[string]} dpath 路径
 * @return 
 */
function explorer(dpath, callback) {
    fs.readdir(dpath, function(err, files) {
        if (err) {
            console.log("error: \n" + err);
            return;
        }

        files.forEach(function(file) {
            fs.stat(dpath + "\\" + file + "",function(err,stat){
                if(err){
                    console.log(err);
                    return;
                }

                if(stat.isDirectory()){
                    explorer(dpath+"\\"+file, callback);
                }else{
                    callback && callback(dpath+"\\"+file);
                }
            });
        });
    });    
}