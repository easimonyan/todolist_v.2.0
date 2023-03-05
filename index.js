//jshint esversion:6

//Requiring moduls that we need
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Setting PORT
const PORT = process.env.PORT || 3000;

// Setting Mongoose

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch(error) {
    console.log(error);
    process.exit(1);
  }
}

// Creating schema
const itemsSchema = new mongoose.Schema ({

  name: String

});

// Creating model
const Item = mongoose.model("Item", itemsSchema);

// 6. Creating our default items
const item1 = new Item ({ name: "Welcome to your ToDo list!"});
const item2 = new Item ({name: "Press + button to add a new task"});
const item3 = new Item ({name: "<--- Hit a checkbox to mark the task as completed"});

// Making an array of default items
const defaultItems = [item1, item2, item3];

// Creating a Schema for our new lists sites 
const listSchema = { 
  name: String, 
  items: [itemsSchema]
};

// Creating Mongoose Model for list
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {  

// Searching for our items through our website 
Item.find({}, function(err, docs){
  // Checking if array is empty - entering default docs
  if (docs.length === 0) {
      Item.insertMany(defaultItems, function(err){
      if (err) {
      console.log(err);
      } else {
      console.log("Items are successfuly saved in todolistDB");
    }
    });
  
  // Redirecting so it goes to else statement now 
  res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: docs});
  }
});

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;

  // Saving value of submit button 
  const listName = req.body.list;

  // Creating new doc for non-default items
  const newItem = new Item ({name: itemName});

  // Checking if we need to save our item to the default list or new list
  
  if (listName === "Today") {
    
    // Saving new doc 
    newItem.save();

    // Redirecting so it appears on our page 
    res.redirect("/");

  } else {

    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

// Creating app.post for our /delete
app.post("/delete", function(req, res){

  const checkedboxId = req.body.checkbox;

  // Creating const to catch up our value in hidden input
  const listName = req.body.listName;

  // Going to use if statement to check from which list we're going to delete item
  if (listName === "Today") {

    // Deleting items with checkbox clicked
    Item.findByIdAndRemove(checkedboxId, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("We've got an Id and removed a task from todo list");
  
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedboxId}}}, function(err, foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

// Creating app.get which will work for all new Lists
app.get("/:listName", function(req, res){

  // Saving to const what user is typing to the url, we'll need it later 
  const newListName = _.capitalize(req.params.listName); 

  // Using .find methode to not create a new list each time 
  List.findOne({name: newListName}, function(err, foundLists){
    if (!err) {
      if (!foundLists) {
          // Creating a new list 
          const list = new List ({
          name: newListName,
          items: defaultItems
          });

          // Saving
          list.save();

          // Redirecting so new page can be created
          res.redirect("/" + newListName);
      } else {
        // Show existing list 
        res.render("list", {listTitle: foundLists.name, newListItems: foundLists.items});
      }
    }
  });

});


app.get("/about", function(req, res){
  res.render("about");
});

connectDB().then(()=> {
  app.listen(PORT, () =>{
    console.log(`Server is up and running on port ${PORT}`);
  });
});

