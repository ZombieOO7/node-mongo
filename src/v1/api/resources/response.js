const messages = require('../../../../config/constant.json');

class ResponseHelper {
    error(res, msg, code = null) {
        var language = 'en';
        if (code == null || code == 500) {
            code = 500;
            msg = 'INTERNAL_SERVER_ERROR';
        }
        let response = {
            code: code,
            status: 'FAIL',
            message: this.getMessage(msg, language) ? this.getMessage(msg, language) : msg,
            data: {}
        }
        res.writeHead(code, {
            'Content-Type': 'application/json'
        })
        res.write(JSON.stringify(response))
        res.end()
    }
    success(res, msg,data,langauge) {
        if(data.length == 0){
            const result = Array.isArray(data);
            if(result == true){
                data = [];
            }else{
                data = {};
            }
        }
        var code = 200;
        var language = 'en';
        let response = {
            code: code,
            status: 'SUCCESS',
            message: this.getMessage(msg, language),
            data: data
        }
        res.writeHead(code, {
            'Content-Type': 'application/json'
        })
        res.write(JSON.stringify(response))
        res.end()
    }
    getMessage(msg, language) {
        // console.log(msg)
        let lang = 'en';
        if (language) {
            lang = language;
        }
        if (msg.param && msg.param.includes('email')) {
            msg.param = 'email';
        }
        if (msg.type && msg.type.includes('and')) {
            return msg.message;
        }
    
        if (msg.param && msg.type) {
            if (msg.type.includes('required')) {
                return messages[lang]['PARAM_REQUIRED'].replace('PARAM', msg.param);
            } else if (msg.type.includes('min')) {
                return msg.message;
            } else {
                return messages[lang]['INVALID_PARAM'].replace('PARAM', msg.param);
            }
        } else if (msg.toString().includes('ReferenceError:')) {
            // console.log('======================ERROR=====================')
            // console.log(msg)
            // console.log('================================================')
            return messages[lang]['INTERNAL_SERVER_ERROR'];
        } else {
            return messages[lang][msg];
        }
    }
}
module.exports = new ResponseHelper();