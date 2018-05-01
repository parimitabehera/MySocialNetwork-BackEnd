var User = require('./models/user.js');
var express = require('express');
var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');
var router = express.Router();

router.post('/register',(req,res) => {

    var userData = req.body;
   
   var newUser = new User(userData);

   newUser.save((err,newUser) => {
        if(err)
            return res.status(401).send({message : 'saving user error'});

        createSendToken(res,newUser);
   })
});

function createSendToken(res,user)
{
    var payload = {sub: user._id}

        var token = jwt.encode(payload,'123');

         res.status(200).send({token:token,userId:user._id});
}

router.post('/login',async (req,res) => {
   var loginData = req.body ;

   var user = await User.findOne({email : loginData.email});

   if(!user)
   {
       return res.status(402).send({message : 'Invalid EmailId or Password'});
   }
   bcrypt.compare(loginData.pwd,user.pwd,(err,isMatch) =>{
        if(!isMatch)
        {
                return res.status(401).send({message: 'Invalid EmailId or Password'})
        }

        createSendToken(res,user);
   })
});



var auth = {
    router,
    checkAuthenticated: (req,res,next) => {
       // console.log('param id' + req.params.id);
        //var id  = req.params.id;
   
        if(!req.header('authorization'))
        {
            return res.status(401).send({message: 'Unauthorized. Missing auth header'})
           
        }
       
        var token = req.header('authorization').split(' ')[1];

       
         if(token === null || token === undefined)
        {
            return res.status(401).send({message: 'Unauthorized. auth header invalid'});

        }
        else
        {
           
            var payload = jwt.decode(token,'123');

            if(!payload)
            {
                return res.status(401).send({message: 'Unauthorized. auth header invalid'});

            }
            req.userId = payload.sub;

       
        }
    

        

    req.userId = req.params.id;
    next();
}
}

module.exports = auth; 