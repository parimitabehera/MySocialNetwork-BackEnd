var express = require('express');
var cors =  require('cors');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var User = require('./models/user.js');
var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');
var auth = require('./auth.js');
var Post = require('./models/Post.js');
var jwt = require('jwt-simple');
var Friends = require('./models/Friends.js');

  mongoose.Promise = Promise ;



app.use(cors());
app.use(bodyParser.json());

app.post('/addFriend',(req,res) =>{
    var friendsData = req.body;
    
    try{
    
    var friend = new Friends(friendsData);
   
    friend.save((err,result)=>{
        if(err)
        {
           
             return  res.status(500).send({message: 'Failed to send friend request'});
        }
         return res.status(200).send({message:'Friend request send'});

    })
}
catch(error)
        {
            
            res.sendStatus(500);
        }

})

app.get('/posts/:id',async (req,res) =>{

    var userId = req.params.id;
    
   
   Post.aggregate([{
       "$lookup":{
           "from":"Friends",
           "localField":"author",
           "foreignField":"friendId",
           "as":"PostList"
       }}
       ,
       {"$unwind":"$PostList"}
    ,{
       "$lookup":{
           "from":"User",
           "localField":"author",
           "foreignField":"_id",
           "as":"UserPostList"
       }},
         {"$unwind":"$UserPostList"}
         ,
       {"$match":{
         "$and":[
             { "PostList.userId": mongoose.Types.ObjectId(userId)},
             { "PostList.isFriend": true }
         ]

       }},
       {"$sort":{"PostedDate" : -1}}

   ]).exec().then(function(result){
       res.send(result);

   }).catch(function(error){
      
       res.send.status(500);
   });

    

  });

app.post('/post', (req,res) => {

    var postData = req.body;
    //postData.author = req.userId;
   
    post = new Post(postData);

    post.save((err,result)=>{
        if(err)
        {
        
           return  res.status(500).send({message: 'saving post error'});
        }
        //console.log('success');
        res.send(post);

    })

})

app.get('/users',auth.checkAuthenticated,async (req,res) =>{
    try{
            //console.log(req.userId);
            var users = await User.find({},'-pwd  -__v');
            res.send(users);
        }
    catch(error)
        {
            
            res.sendStatus(500);
        }
});

app.get('/search/:searchTerm',async(req,res) =>{
    try
    {
        var query = req.params.searchTerm;
     
        var results = await User.find({fname: new RegExp('^'+ query ,"i")},'-pwd  -__v');
       
        res.send(results);
    }
    catch(error)
    {
         res.sendStatus(500);
    }
    
})

app.get('/profile/:id',auth.checkAuthenticated, async (req,res) =>{
    try{
        
    var user = await User.findById(req.userId,'-pwd  -__v');
   
    
    res.send(user);
    }
    catch(error)
    {
      
        res.sendStatus(500);
    }
});

app.post('/User', async (req,res) =>{
    try{
         var friendData =[];
         var userData = req.body;
        var user = await User.findById(userData.userId,'-pwd  -__v').populate('Friends') ; 

        Friends.find(
            {"$or":[
                {"$and":
                        [
                            {"friendId":mongoose.Types.ObjectId(userData.friendId)},
                            {"userId":mongoose.Types.ObjectId(userData.userId)}
                        ]
                    },
                    {"$and":
                        [
                            {"friendId":mongoose.Types.ObjectId(userData.userId)},
                            {"userId":mongoose.Types.ObjectId(userData.friendId)}
                        ]
                    }
                    ]   
            }
        
        ).populate('User').exec(function(err,result)
        {
      
            console.log(result);
        });
    
        res.send(user);
    }
    catch(error)
    {
      console.log(error);
        res.sendStatus(500);
    }
});

app.get('/frRequestList/:userId',async(req,res)=>{
     var userId = req.params.userId;
     var id = mongoose.Types.ObjectId(userId);
    
     var userDetails;
   
    User.aggregate([
         {"$project":{"_id":1,"fname": 1,"lname":1}},
        {"$lookup": {
         "from": "Friends",
        "localField":"_id",
        "foreignField":"userId",
        "as":"result"
    }},
     { "$unwind" : "$result" } ,
    {
        "$match":{
        "$and" : [{
        "result.friendId": id },
        { "result.isFriend" : false }]}} ]  
       ).exec().then(function(result){
       
        userDetails = result;
        res.send(userDetails);
   
    }).catch(function(err){
        res.sendStatus(500);
});    
})

app.post('/approveFrRequest',async (req,res)=>{

  var approveData = req.body;
 

  var details = await Friends.findOne({
       "userId":mongoose.Types.ObjectId(approveData.friendId),
                    "friendId":mongoose.Types.ObjectId(approveData.userId),"isFriend": false }
  );



  Friends.findOneAndUpdate(
      {
          "userId":mongoose.Types.ObjectId(approveData.friendId),
                    "friendId":mongoose.Types.ObjectId(approveData.userId),"isFriend": false },
          {
              "$set":{"isFriend": true}
          }
      
  ).exec().then(function(resp){
        friend = new Friends();
        friend.friendId = approveData.friendId;
        friend.userId = approveData.userId;
        friend.isFriend = true;
        friend.save((err,result)=>{

             if(err)
        {
             return  res.status(500).send({message: 'Failed to add friend'});
        }
         return res.status(200).send({message:'added friend'});
        })
  }).catch(function(err){
     
        res.sendStatus(500);
}); 
});

app.get('/friends/:userId',(req,res)=>{
    var reqId = req.params.userId;
    var userId = mongoose.Types.ObjectId(reqId);
    User.aggregate([
        {"$project":{"_id":1,"fname": 1,"lname":1}},
        {
        "$lookup":{
           "from":"Friends" ,
           "localField":"_id",
           "foreignField":"friendId",
           "as":"FriendList"
        }},
        { "$unwind" : "$FriendList" } 
        ,
        {
            "$match":
            {"$and" : [{
        "FriendList.userId": userId },
        {"FriendList.isFriend" : true }]
            }
        }
    ]).exec().then(function(result){
       
        res.send(result);
    }).catch(function(err){
     
        res.sendStatus(500);
});
})

mongoose.connect('mongodbConnectionString',(err)=>{
    console.log('connected to mongo');
})

app.use('/auth', auth.router);
app.listen(3000);