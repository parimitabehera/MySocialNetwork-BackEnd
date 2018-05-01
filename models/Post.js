var mongoose = require('mongoose');

module.exports = mongoose.model('Post',
{   msg:String,
    author:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    likes: { type: mongoose.Schema.Types.Array,"default":[]},
    PostedDate: {type: mongoose.Schema.Types.Date,"default":Date.now()}
});
