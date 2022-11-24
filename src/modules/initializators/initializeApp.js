const http = require('http');
const https = require('https');
const fs = require('fs')
class App {
    constructor({app, database}){
        this.app = app;
        this.database = database;
    }
   

    async run({host, port, isSSL, allowedSync}) {
        await this.database.init(allowedSync);
        let server
        if(isSSL==true){
            const privateKey = fs.readFileSync("./ssl/leva_letsecrypt_key.pem", "utf8");
            const certificate = fs.readFileSync("./ssl/leva_letsecrypt_cert.pem", "utf8");
            const chain = fs.readFileSync("./ssl/leva_fullchain.pem", "utf8");
            const credentials = {
                key: privateKey,
                cert: certificate,
                ca:chain,
            };
            server = https.createServer(credentials, this.app)
        }else{
            server = http.Server(this.app)
        }
        server.listen(port, () => {
            console.info(`Server is running on port : http://${host}:${port} ✅`);
        })
    }
}

module.exports = App