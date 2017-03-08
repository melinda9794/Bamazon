
var mysql = require('mysql');
var prompt = require('prompt');
var colors = require('colors/safe');
var Table = require('cli-table');
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 's1nger89',
	database: 'bamazon', 
});

var productPurchased = [];

connection.connect();

//connect to the mysql database and pull the information from the Products database to display to the user
connection.query('SELECT item_id, product_name, price, stock_quantity FROM products', function(err, result){
	if(err) console.log(err);

	//creates a table for the information from the mysql database to be placed
	var table = new Table({
		head: ['item_id', 'product_name', 'price', 'stock_quantity'],
		style: {
			head: ['blue'],
			compact: false,
			colAligns: ['center'],
		}
	});

	//loops through each item in the mysql database and pushes that information into a new row in the table
	for(var i = 0; i < result.length; i++){
		table.push(
			[result[i].item_id, result[i].product_name, result[i].price]
		);
	}
	console.log(table.toString());

	purchase();
});

//the purchase function so the user can purchase one of the items listed above
var purchase = function(){

	//creates the questions that will be prompted to the user
	var productInfo = {
		properties: {
			item_id:{description: colors.blue('Please enter the ID # of the item you wish to purchase!')},
			Quantity:{description: colors.green('How many items would you like to purchase?')}
		},
	};

	prompt.start();

	//gets the responses to the prompts above
	prompt.get(productInfo, function(err, res){

		//places these responses in the variable custPurchase
		var custPurchase = {
			item_id: res.item_id,
			Quantity: res.Quantity
		};
		
		//the variable established above is pushed to the productPurchased array defined at the top of the page
		productPurchased.push(custPurchase);

		//connects to the mysql database and selects the item the user selected above based on the item id number entered
		connection.query('SELECT * FROM products WHERE item_id=?', productPurchased[0].item_id, function(err, res){
				if(err) console.log(err, 'That item ID doesn\'t exist');
				
				//if the stock quantity available is less than the amount that the user wanted to purchase then the user will be alerted that the product is out of stock
				if(res[0].StockQuantity < productPurchased[0].Quantity){
					console.log('That product is out of stock!');
					connection.end();

				//otherwise if the stock amount available is more than or equal to the amount being asked for then the purchase is continued and the user is alerted of what items are being purchased, how much one item is and what the total amount is
				} else if(res[0].StockQuantity >= productPurchased[0].Quantity){

					console.log('');

					console.log(productPurchased[0].stock_quantity + ' items purchased');

					console.log(res[0].product_name + ' ' + res[0].price);

					//this creates the variable SaleTotal that contains the total amount the user is paying for this total puchase
					var saleTotal = res[0].price * productPurchased[0].Quantity;

					//connect to the mysql database Departments and updates the saleTotal for the id of the item purchased
					connection.query("UPDATE Departments SET TotalSales = ? WHERE department_name = ?;", [saleTotal, res[0].department_name], function(err, resultOne){
						if(err) console.log('error: ' + err);
						return resultOne;
					})

					console.log('Total: ' + saleTotal);

					//this variable contains the newly updated stock quantity of the item purchased
					newQuantity = res[0].stock_quantity - productPurchased[0].stock_quantity;
			
					// connects to the mysql database products and updates the stock quantity for the item puchased
					connection.query("UPDATE products SET stock_quantity = " + newQuantity +" WHERE item_id = " + productPurchased[0].item_id, function(err, res){
						// if(err) throw err;
						// console.log('Problem ', err);
						console.log('');
						console.log(colors.cyan('Your order has been processed.  Thank you for shopping with us!'));
						console.log('');

						connection.end();
					})

				};

		})
	})

};