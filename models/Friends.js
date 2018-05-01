var mongoose = require('mongoose');

var friendsSchema = new mongoose.Schema({
    userId:{type: mongoose.Schema.Types.ObjectId,ref:'User'},
    friendId:{type: mongoose.Schema.Types.ObjectId, ref:'User'},
    isFriend:{type: Boolean, default:false}
});
module.exports = mongoose.model('Friends',friendsSchema);