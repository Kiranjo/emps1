var express = require("express");
let passport=require("passport");
let jwt=require("jsonwebtoken");
let JWTStrategy=require("passport-jwt").Strategy;
let ExtractJWT=require("passport-jwt").ExtractJwt;

let {employees}=require("./empData.js");
var app = express();
app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
//  res.header("Access-Control-Expose-Headers","Authorization");  
  res.header("Access-Control-Expose-Headers","X-Auth-Token"); 
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS,HEAD");
  next();
});

app.use(passport.initialize());
//const port= 2410;
var port=process.env.PORT||2410;
app.listen(port, ()=> console.log(`Node app listening on port ${port}!`));
const cookieParser=require("cookie-parser");
app.use(cookieParser("abcde-43245"));

const params={
    jwtFromRequest : ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: "jwtsecret23647832",
}
const jwtExpirySeconds=300;
let cookieData={name:"Guest",url:"/tracker",date:Date.now()};

let strategyAll= new JWTStrategy(params, function(token, done){
  console.log("token",token);
    console.log("In JWTStrategy-All", token);
    let user1= employees.find((u)=> u.empCode===token.id);
    console.log("user",user1);
    if(!user1)
    return done(null, false, {message:"Incorrect username or password"});
    else return done(null,user1);
});



passport.use("roleAll",strategyAll);


app.post("/login",function(req,res){
    let {name,empCode}=req.body;
    let user= employees.find((u)=> u.name==name && u.empCode==empCode);
    console.log("user",user);
    if(user){
        let payload={id:user.empCode};
      let token= jwt.sign(payload, params.secretOrKey, {
        algorithm :"HS256",
        expiresIn: jwtExpirySeconds,
      });
   res.setHeader("X-Auth-Token",token);
    //  res.send({token:"bearer "+token});
    console.log(token,"token");
      // res.setHeader("Authorization",token);
      console.log(payload);
      res.cookie("userdata",{user:user.name, pages:[]},{maxAge:30000,signed: true});
      let user1={};
      user1.name=user.name;
      user1.url="/post";
      user1.date=Date.now();
      cookieData=user1;
       res.send(payload);
     
    }else res.sendStatus(401);
});


app.get("/myDetails", passport.authenticate("roleAll",{session :false}),
function(req,res){
    console.log("In GET /myDetails",req.user);
    let user1={};
    user1.name=cookieData.name;
    user1.url="/myDetails";
    user1.date=Date.now();
    cookieData=user1;
    res.cookie("userdata",
    {user:req.user.name,url:"/myDetails",date:Date.now(), pages:[]},{maxAge:30000,signed: true});
    res.send(req.user);
  
});


app.get("/myJuniors", passport.authenticate("roleAll",{session :false}),
function(req,res){
    console.log("In GET /myOrders",req.user);
    let orders1=[];
    if(req.user.designation=="VP")
  orders1=employees.filter((ord)=>
   ord.designation=== "Manager" || ord.designation=="Trainee");
  else if(req.user.designation=="Manager")
   orders1=employees.filter((ord)=>ord.designation=="Trainee");
   let user1={};
    user1.name=cookieData.name;
    user1.url="/myJuniors";
    user1.date=Date.now();
    cookieData=user1;
   res.cookie("userdata",
   {user:req.user.name,url:"/myJuniors",date:Date.now(),pages:[]},{maxAge:30000,signed: true});
    res.send(orders1);
  
});
app.get("/company",
function(req,res){
    console.log("In GET /company");
    let user1={};
    user1.name="Guest";
    user1.url="/company";
    user1.date=Date.now();
    cookieData=user1;
    res.send(" Welcome to the Employee Portal of XYZ Company");
});

app.get("/cookieData", function(req,res){
  let userdata=req.signedCookies.userdata;
   res.send(userdata);
});
app.get("/tracker", function(req,res){
  let userdata=req.signedCookies.userdata;
  console.log(`userdata : ${JSON.stringify(userdata)}`);
  if(!userdata) userdata={user:"Guest",pages:[]};
 // userdata.pages.push({url:"/tracker",date:Date.now()});
  res.cookie("userdata",userdata, {maxAge:30000,signed:true});
//  res.send(userdata);
res.send(cookieData);
});
