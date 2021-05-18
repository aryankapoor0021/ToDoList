const express=require('express');

const bodyParser=require('body-parser');

const mongoose=require('mongoose');
const app=express();

const _=require('lodash');


const port=process.env.PORT || 8000;

app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine', 'ejs');

app.use(express.static("public"));

var day="";
var time="";
//Database Conection
mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

const itemsSchema=new mongoose.Schema({
 name:String
});


const Item=mongoose.model('Item',itemsSchema);

const it1=new Item({
  name:"Welcome to your TODO List"
})
const it2=new Item({
  name:"To Add just hit + "
})
const it3=new Item({
  name:"To Del just hit - "
})

const defaultItems=[it1,it2,it3];


const listSchema=new mongoose.Schema({
  name:String,
  items:[itemsSchema]
})

const List=mongoose.model("List",listSchema);

app.get("/",function(req,res){
  
  //Date And Time Handling
  var today=new Date();
  
  var options={
  	weekday:"long",
  	day:"numeric",
  	month:"long"
  }
  var hours=today.getHours()>10?today.getHours():"0"+today.getHours();
  var minutes=today.getMinutes()>10?today.getMinutes():"0"+today.getMinutes();
  var seconds=today.getSeconds()>10?today.getSeconds():"0"+today.getSeconds();
  time = hours + ":" + minutes + ":" + seconds;
  day=today.toLocaleDateString("en-IN",options);
  //Date Handling Done
  
  //Databse Handling Started


  Item.find({},function(err,results){
  
  if(results.length==0){
    Item.insertMany(defaultItems,function(err){
      if(err)
        console.log(err);
       else
        console.log("Database initiating...");
    })
     res.redirect("/");
  }
 
  else{ 
  res.render("list",{kindOfDay:day,currTime:time,listItems:results});
  }

  });
  console.log("Database Initiated ");

});


app.get('/:customListName',function(req,res) {

  const customListName=_.capitalize(req.params.customListName);
  
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        const list=new List({

        name:customListName,
        items:defaultItems
        })
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render('list',{kindOfDay:foundList.name,currTime:time,listItems:foundList.items});
      }
  
    }
  })
  
});



app.post("/",function(req,res){

  const itemName=req.body.item;
  const listName=req.body.list;
  console.log(listName+" listName");
  const itemToBeAdded=new Item({
    name:itemName
  })

  if(listName==day){
    console.log("Home Route Insertion Active");
    itemToBeAdded.save();
    console.log("Home Route Insertion Done");
    res.redirect("/");
  } 
  else{
    List.findOne({name:listName},function(err,found){
      console.log("Found  " +listName);
      found.items.push(itemToBeAdded);
      found.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete",function(req,res){
  const checkedID=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==day)
  {
  console.log(checkedID);
  Item.findByIdAndRemove(checkedID,function(err){
    if(err)
      console.log(err);
    else
      console.log("Successfully Deleted item with id "+checkedID);
  })
  res.redirect("/");
  }
  else{
    //pull  operator pulls from that array you specified with query alongwithit:
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedID}}},
      function(err,foundList){
        console.log("Found List and Deleted From "+foundList.name);
        res.redirect("/"+listName);

      });
  }
 
})




app.listen(port,function(){
	console.log("Server is up at "+port);
})
 