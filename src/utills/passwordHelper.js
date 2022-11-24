const bcrypt = require("bcrypt");
const promise = require("bluebird");
class PasswordHelper {
    async getPasswordHash(password) {
        return bcrypt.hash(password, 10);
    }

    async checkPassword(enteredPassword, storedPassword, flag) {
        try {
            let compare = await bcrypt.compare(enteredPassword, storedPassword);
            if (compare) {
                return true;
            } else {
                if (flag == 1) {
                    const error = new Error("OLD_PASSWORD");
                    error.code = 400;
                    throw error;
                }else if(flag == 2){
                    throw "INCORRECT_PASSWORD"
                }else if(flag == 3){
                    const error = new Error("OLD_PASSWORD");
                    error.code = 400;
                    throw error;
                }
            }
        } catch (error) {
            return promise.reject(error);
        }
    } 

    async checkNormalPassword(enteredPassword, storedPassword) {
        try {
            console.log("enetered password:::",enteredPassword);
            console.log("stored password:::",storedPassword);
            if (enteredPassword == storedPassword) {
                return true;
            } else {
                const error = new Error("Incorrect Password");
                error.code = 400;
                throw error;
            }
        } catch (error) {
            return promise.reject(error);
        }
    }
}

module.exports = new PasswordHelper();