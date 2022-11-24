const {sequelize} = require('../../data/models/index');
const db = require('../../data/models/index');

class InitializeDatabase {
    async init(allowedSync) {
        try {
            if(process.env.DB_CONNECTION =='mongodb'){
                // await client.connect();
                // await client.db("leva_app").command({ ping: 1 });
                await db.mongoose.connect(db.url,{
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                })
                console.log("Connected to mongodb database ✅");
            }else{
                await sequelize.authenticate();
                console.log('Connected to postgres SQL database ✅');

                allowedSync && await sequelize.sync({
                    force: true
                });
            }
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = InitializeDatabase;