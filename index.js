var Promise = require('bluebird');
var request = require('request');
var fs = require('fs');
var path = require('path');

exports.name = 'upload';
exports.desc = 'upload the target path/file to the server.';

exports.register = function (commander, settings) {
    commander.option('-f, --from <from>', 'waiting upload source (could be a file (zip file would automatically extract ) or a path. )')
        .option('-t, --to <to>', 'waiting upload to')
        .option('-i, --ignore <ignore>', 'waiting upload ignore (regular expression)')
        .option('--verbose', 'enable verbose mode')
        .action(function (template) {
            var args = [].slice.call(arguments);
            var options = args.pop();

            var cli_from = options.from,
                cli_to = options.to,
                cli_ignore = options.ignore;

            var settings = {};
            // 根据 fis-conf.js 确定 root 目录
            Promise.try(function () {
                if (!settings.root) {
                    var findup = require('findup');

                    return new Promise(function (resolve, reject) {
                        var fup = findup(process.cwd(), 'fis-conf.js');
                        var dir = null;

                        fup.on('found', function (found) {
                            dir = found;
                            fup.stop();
                        });

                        fup.on('error', reject);

                        fup.on('end', function () {
                            resolve(dir);
                        });
                    }).then(function (dir) {
                        settings.root = dir;
                    });
                }
            }).then(function () {// prompt
	            fis.log.info('Current Dir: %s', settings.root);
	            var conf, conf_from, conf_to, conf_ignore;
	            if (settings.root) {
	                require( path.join(settings.root, "fis-conf.js") );
	                conf = fis.get("atm");
	                if ( conf.uploadConfig ) {
	                    var uploadConfig = conf.uploadConfig || {};
	                    conf_from = uploadConfig.from;
	                    conf_to = uploadConfig.to;
	                    conf_ignore = uploadConfig.ignore;
	                }
	            }else{
	            	conf = {};
	            }

	            var fr = cli_from || conf_from,
	                to = cli_to || conf_to,
	                ignore = cli_ignore || conf_ignore,
	                receiver = conf.uploadService|| "http://wapstatic.kf0309.3g.qq.com/deploy",
	                // receiver = conf.uploadService|| "http://localhost:8000/deploy",
	                formData;
	            if (!fr) {
	                fis.log.error("\n　　The upload from is required [could be a file (zip file would automatically extract ) or a path. ]!\n");
	                return process.exit(0);
	            }
	            if (!to) {
	                to = '/data/wapstatic/tmp';
	            }
	            if (typeof ignore === "string"){
	            	var match = ignore.match(new RegExp('^/(.*?)/([gimy]*)$'));
					ignore = new RegExp(match[1], match[2]);
	            }
	            fis.log.info("upload from:", fr, ", to:", to, ", ignore:", ignore, ", receiver:", receiver);
                
	            var dist = path.resolve(fr);
	            fs.stat(dist, function(err, stats){
	            	if( err ){
	            		fis.log.error(fr, "does not exist.");
	            	}
	            	if(stats.isDirectory()) {
	            		fis.log.info("Start upload path->'" + dist + "' files");
	            		explorer(dist, ignore ,function (file) {
	            		    var relativePath = path.relative(dist, file);
	            		    formData = {
	            		        to: path.join(to, relativePath).replace(/\\/g, '/'),
	            		        file: fs.createReadStream(file)
	            		    };
	            		    fis.log.info("formData: to", formData.to);
	            		    request.post({ url: receiver, formData: formData }, function optionalCallback(err, httpResponse, body) {
	            		        var code = httpResponse.statusCode;
	            		        if(code == 200){
	            		        	fis.log.info("Upload " + relativePath + " successful!");
	            		        }else{
	            		        	return fis.log.error('code:', code, ' upload failed:', relativePath + "\nError:" + body);
	            		        }
	            		    });
	            		});
	            	}else if(stats.isFile()) {
	            		formData = {
	            		    to: to,
	            		    file: fs.createReadStream(path.resolve(dist))
	            		};
	            		var ext = path.extname(dist),
	            		    basename = path.basename(dist);
	            		if(ext === ".zip") {
	                        formData.type = ext.substr(1);
	                    }else{
	                        formData.to = path.join(formData.to, basename).replace(/\\/g, '/');
	                    }
	                    fis.log.info("formData: to", formData.to);
	            		fis.log.info("start upload file ", dist, ', to destination: ', formData.to);
	            		request.post({ url: receiver, formData: formData }, function optionalCallback(err, httpResponse, body) {
	            			var code = httpResponse.statusCode;
	            			if(code == 200){
	            				fis.log.info("Upload successful!");	
	            			}else{
	            				return fis.log.error('code:', code, ' upload failed:', dist + "\nError:" + body);
	            			}
	            		});
	            	}
	            	
	            });
            });
        });
};

/**
 * 读取文件路径内的所有文件
 * @param  {[string]} dpath 路径
 * @param  {[regexp]} ignore 过滤文件的正则
 * @return 
 */
function explorer(dpath, ignore, callback) {
    fs.readdir(dpath, function (err, files) {
        if (err) {
            console.log("error: \n" + err);
            return;
        }

        files.forEach(function (file) {
            fs.stat( path.join(dpath, file), function (err, stat) {
                if (err) {
                    console.log(err);
                    return;
                }
                //过滤文件
                if(ignore){
                	if(ignore.test(file)){
                		return;
                	}
                }
                if (stat.isDirectory()) {
                    explorer(path.join(dpath, file), ignore, callback);
                } else {
                    callback && callback(path.join(dpath, file));
                }
            });
        });
    });
}