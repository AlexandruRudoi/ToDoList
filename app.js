// Variabile declaration
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + '/date.js');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
mongoose.connect('mongodb://localhost/todolistDB', { useNewUrlParser: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
    name: 'Welcome to your todolist!'
});

const item2 = new Item({
    name: 'Hit the + button to add a new item.'
});

const item3 = new Item({
    name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);


// Getting the routes
app.get('/', (req, res) => {
    let day = date.getDate();  // Calling the function from date.js

    Item.find({}, (err, itemsList) => {
        if(itemsList.length === 0){
          Item.insertMany(defaultItems, (err) => { (err) ? console.log(err) : console.log("Succesfully saved defaults items to DB.") });
          itemsList = defaultItems;
        }
     
        res.render("list", {listTitle: day, newListItems: itemsList});
      });
});

app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, (err, foundList) => {
        if(!err){
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customListName);
            } else {
                res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });   
});

// Posting the data
app.post('/', (req, res) => {
    let itemName = req.body.newItem;
    let listName = req.body.list;
    let day = date.getDate();

    const item = new Item({
        name: itemName
    });

    if(listName === day){
        item.save();
        res.redirect('/');
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            foundlist.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    }
});

app.post('/delete', (req, res) => {
    const checkedItemId= req.body.checkbox;
    const listName = req.body.listName;

    if(listName === date.getDate()){
        Item.findByIdAndRemove(checkedItemId, (err) => { (err) ? console.log(err) : console.log("Succesfully deleted item.") });
        res.redirect('/');
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err) => { (err) ? console.log(err) : console.log("Succesfully deleted item.") });
        res.redirect('/' + listName);
    }
});


// Running the server
const port = 3000;
app.listen(process.env.PORT || port, () => {
    console.log(`Server is running on port ${port}.`);
});
