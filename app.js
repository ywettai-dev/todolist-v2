//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const port = 3000;
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//Create and establish database connection
mongoose.connect("mongodb+srv://admin-tai:221195JG@todocluster-qtuyb.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

mongoose.set('useFindAndModify', false);

//Setup Item schema
const itemSchema = {
  name: String
}

//Setup item model
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//Setup list schema
const listSchema = {
  name: String,
  items: [itemSchema]
}

//Setup list model
const List = mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function (req, res) {

  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      //Insert Default Items to todolistDB if the collection is empty
      Item.insertMany(defaultItems, err => {
        if (err) {
          console.log(err);
        } else {
          console.log(`Successfully saved default items to the todolistDB!`);
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {
        listTitle: 'Today',
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function (req, res) {

  const newItem = req.body.newItem;
  const listTitle = req.body.list;

  //Insert new item into items collection
  const item = new Item({
    name: newItem
  });

  if (listTitle === "Today") {
    item.save()
    res.redirect('/');
  } else {
    List.findOne({
      name: listTitle
    }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listTitle);
    });
  }
});

//Delete item
app.post('/delete', (req, res) => {
  const checkedItem = req.body.checkedbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, (err => {
      if (!err) {
        console.log(`Successfully deleted the checked item!`);
        res.redirect('/');
      }
    }));
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItem
        }
      }
    }, (err, foundList) => {
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }

});

//Express dynamic routes
app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a list route if it doesn't exist
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        //Show an existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });

});

app.listen(process.env.PORT || port, () => console.log(`Server starts on ${port}.`));