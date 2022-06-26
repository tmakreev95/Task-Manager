const config = require('./../../config/config.json');
const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

//JWT Secret
const jwtSecret = config.jwtSecret;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 1
    },
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Number,
            required: true
        }
    }]
});

/** Instance Methods **/
//toJSON Impl
UserSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    return _.omit(userObject, ['password', 'sessions']);
} 

UserSchema.methods.generateAccessAuthToken = function() {
    const user = this;

    return new Promise((resolve, reject) => {
        jwt.sign({ _id: user._id.toHexString() }, jwtSecret, { expiresIn: config.jwtExpiration }, (error, token) => {
            if(!error) {
                resolve(token);
            } else {
                reject();
            }
        });
    });    
} 

UserSchema.methods.generateRefreshAuthToken = function() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (error, buffer) => {
            if(!error) {
                let token = buffer.toString('hex');

                return resolve(token);
            } else {
                reject();
            }
        });        
    });    
} 

UserSchema.methods.createSession = function () {
    let user = this;

    return user.generateRefreshAuthToken().then((refreshToken) => {
        return saveSessionToDatabase(user, refreshToken);
    }).then((refreshToken) =>{
        return refreshToken;
    }).catch((ex) => {
        return Promise.reject("Failed to save session to database. \n" + ex);
    });
}
/** Instance Methods */

/** Model Methods (static) */

UserSchema.statics.getJWTSecret = () => {
    return jwtSecret;
} 

UserSchema.statics.findByIdAndToken = function (_id, token) {
    const User = this;

    return User.findOne({ _id, 'sessions.token': token });
}


/** Middleware */
UserSchema.pre('save', function(next) {
    let user = this;
    let costFactor = config.costFactor;

    if(user.isModified('password')) {
        bcrypt.genSalt(costFactor, (error, salt) => {
            bcrypt.hash(user.password, salt, (error, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

UserSchema.statics.findByCredentials = function (email, password) {
    const User = this;

    return User.findOne({ email }).then((user) => {
        if(!user) {
            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (error, result) => {
                if(result) {
                    resolve(user);
                } else {
                    reject();
                }
            });
        });
    });
}

UserSchema.statics.hasRefreshTokenExpired = (expiresAt) => {
    let secondsSinceEpoch = Date.now() / 1000;

    if(expiresAt > secondsSinceEpoch) {
        return false;
    } else {
        return true;
    }

}
/** Model Methods (static) */

/** Helper Methods */
/** Generating Unix Timestamp (configured in config.json) days from now */
let generateRefreshTokenExpiration = () => {
    let daysUntilExpire = config.refreshTokenDaysUntilExpire;
    let secondsUntilExpire = ((daysUntilExpire * 24) * 60) * 60;

    return ((Date.now() / 1000) + secondsUntilExpire);
}

let saveSessionToDatabase = (user, refreshToken) => {
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshTokenExpiration();

        user.sessions.push({ 'token': refreshToken, expiresAt }); 
        
        user.save().then(() => {
            return resolve(refreshToken);
        }).catch((ex) =>{
            reject(ex);
        });
    });
}
/** Helper Methods */

const User = mongoose.model('User', UserSchema);

module.exports = { User };