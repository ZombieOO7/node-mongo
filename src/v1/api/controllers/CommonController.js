class CommonController{
    async removeEmptyParams(body,type=null){
        Object.keys(body).forEach(function(key) {
            var val = body[key];
            if(val == ""){
                if(type != null){
                    body[key] = null;
                }else{
                    delete body[key];
                }
            }
        });
        return body;
    }
}

module.exports = new CommonController();
