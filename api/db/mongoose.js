//MongoDB Connection
const mongoose = require('mongoose');
const config = require('../config/config.json');

mongoose.Promise = global.Promise;

mongoose.connect(config.mongoDatabaseUri.concat(config.mongoDatabase), { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Connected successfully to MongoDB');
})
.catch((error) =>{
    console.log('Error while trying to connect to MongoDB');
    console.log(error);
});

// Deprectation warnings from MongoDB native driver
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

module.exports = {
    mongoose
};