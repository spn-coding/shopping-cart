
$(document).ready(function () {

    let cartItems = {};
    let optionInputTime = false;
    let confirm = false;
    
    init();

    /**
     * initial fun 
     */
    async function init() {
        let url = `./product.json`;
        await fetch(url)
            .then((Response) => Response.json())
            .then((data) => {
            cardCreate(data);
            $('.card').click(function(){
                confirm = false;
                $('.cart').slideDown(1000).css("display","block");
                putToCart(this);
                $('.delete').click(clearCart);
                $('#order').click(orderConfirm);
            });
        });
    }

    /**
     * this function work to create card in html document
     * @param {*} data - json data
     */
    function cardCreate(data) {
        $(".category:first").text(`${data.products[0].category}`);
        for (const key in data.products[0].items) {
            $(".itembox:first").append(
                `<div class="card">
                    <div class="photo">
                    <img src="${data.products[0].items[key].img}" />
                    <div class="price">Ks ${data.products[0].items[key].price}</div>
                    </div>
                    <div class="detail">
                    <div class="pname">${data.products[0].items[key].pname}</div>
                    <div class="code">${data.products[0].items[key].pcode}</div>
                    </div>
                </div>`
            );
        }

        $(".category:last").text(`${data.products[1].category}`);
        for (const key in data.products[1].items) {
            $(".itembox:last").append(
                `<div class="card">
                    <div class="photo">
                    <img src="${data.products[1].items[key].img}" />
                    <div class="price">Ks ${data.products[0].items[key].price}</div>
                    </div>
                    <div class="detail">
                    <div class="pname">${data.products[1].items[key].pname}</div>
                    <div class="code">${data.products[1].items[key].pcode}</div>
                    </div>
                </div>`
            );
        }
    }

    /**
     * this function work to put items to cart 
     * @param {*} element - give cart element when user click cart put card
     */
    function putToCart(element) {
        let pcode = $(element).find('.code').text();
    
        if (!cartItems.hasOwnProperty(pcode)) {
            let photo = $(element).find('.photo img').attr('src');
            let pname = $(element).find('.pname').text();
            let price = parseFloat($(element).find('.price').text().replace('Ks ', ''));
            let quantity = 1;

            cartItems[pcode] = {
                pname: pname,
                price: price,
                quantity: quantity
            };

            let cartItemHTML = `<div class="item" data-pcode="${pcode}">
                <img src="${photo}" alt="${pname}">
                <div>
                    <h4>${pname}</h4>
                    <h4 id="pcode-cart">${pcode}</h4>
                </div>
                <input type="number" class="quantity" value="1" min="1" max="10">
                <ion-icon name="trash-outline" class="delete"></ion-icon>
            </div>`;

            $('.calculateitem').append(cartItemHTML);
        }else{
            Swal.fire({
                title: "Item has already in Cart !!!",
                width: 600,
                padding: "3em",
                color: "#716add",
                background: "#fff url(./hello-kitty.jpg)",
                backdrop: `
                  rgba(0,0,123,0.4)
                  url("./cat-nyan-cat.gif")
                  left top
                  no-repeat
                `
              });
        }

        // cal total amount inculde Deli cost
        if(!optionInputTime){
            putToDeliveryFeeOptions();
            optionInputTime = true;
        }

        quantityCheck();
        calculateGrandTotal();
    }

    /**
     * to assign delivery fee options in cart when restart cart
     */
    function putToDeliveryFeeOptions(){
        let options = `
            <option value="3000" selected>Yangon (+3000 Ks)</option>
            <option value="5000">Mandalay (+5000 Ks)</option>
            <option value="6000">Naypyitaw (+6000 Ks)</option>
            <option value="10000">International (+10000 Ks)</option>
        `;
        $('#delivery').append(options);
    }

    /**
     * this function work when user click trash-can icon to remove item from cart 
     * and calculate grandtotal amount
     * @param {*} event - click event when user click trashcan
     */
    function clearCart(event){
        $(event.target).parent().remove();
        let keycode = $(event.target).parent().find('#pcode-cart').text();
        // console.log(keycode);
        delete cartItems[keycode];
        calculateGrandTotal();
        // console.log(cartItems);
    }

    /**
     * this function work to check current quantity and update quantity 
     * if quantity change it will be update and calculate update grand total amount
     */
    function quantityCheck(){
        // console.log(cartItems);
        let previousVal = 1;
        $('.quantity').focus(function(){
            console.log($(this).val());
            previousVal = $(this).val();
        });
        
        $('.quantity').blur(function(){
            // console.log($(this).val());
            let pcode = $(this).closest('.item').data('pcode');
            // console.log(pcode);
            let latestVal = $(this).val();
            if(latestVal > 10 || latestVal < 0){
                Swal.fire({
                    title: "Quantity must be 1 - 10 !!!",
                    width: 600,
                    padding: "3em",
                    color: "#716add",
                    background: "#fff url(./hello-kitty.jpg)",
                    backdrop: `
                      rgba(0,0,123,0.4) 
                      url("./cat-nyan-cat.gif")
                      left top
                      no-repeat
                    `
                  });
                $(this).val(previousVal);
            }else{
                checkCartItemsQuantity(pcode,latestVal);
            }
            calculateGrandTotal();
        });
        console.log(cartItems);
    }

    /**
     * this function work to update quantity value in object that store product info 
     * @param {*} pcode  -  pcode of product
     * @param {*} latestVal - latest valid quantity val
     */
    function checkCartItemsQuantity(pcode,latestVal){
        for (const key in cartItems) {
            cartItems[pcode].quantity = latestVal;
        }
        console.log(cartItems);
    }

    /**
     * "grand total calculate function"  
     * this function will calculate all place that you need to calculate the final grand total
     * if current day is sat and sun , will calculate for discount
     */
    function calculateGrandTotal(){
        let curDay = new Date().getDay();
        let priceArrs = [0];
        let deliPrice = Number($('#delivery').children("option:selected").val());
        let sum = 0; 
        let disPercent = 15;
        for (const key in cartItems) {
            if(key){
                price = cartItems[key].price * cartItems[key].quantity;
                priceArrs.push(price);
            }
        } 

        sum = priceArrs.reduce((accu,curval)=>accu + curval);

        if(sum > 0){
            if(curDay === 0 || curDay ===6){
                let disPrice = parseInt(discountPrice(sum,disPercent));
                let grandTotalPrice = parseInt(disPrice + deliPrice);
                $("#discountprice").text(`${disPrice} Ks`);
                $("#grand").text(`${grandTotalPrice} Ks`);

                $('#delivery').change(function(){
                    // console.log("change");
                    let changeDeliPrice = Number($("#delivery").children("option:selected").val());
                    deliPrice = changeDeliPrice;
                    console.log(Number(deliPrice));
                    grandTotalPrice = parseInt(disPrice + deliPrice);
                    $("#grand").text(`${grandTotalPrice} Ks`);
                });

            }else{
                $("#discounttitle").hide();
                $("#discountprice").hide();
                $('#grand').text(`${sum + deliPrice} Ks`);

                $('#delivery').change(function(){
                    console.log("change");
                    let changeDeliPrice = Number($("#delivery").children("option:selected").val());
                    deliPrice = changeDeliPrice;
                    console.log(Number(deliPrice));
                    $('#grand').text(`${sum + deliPrice} Ks`);
                });
            }

        }else{
            optionInputTime = false;
            $('#grand').text("0 Ks");
            $('#delivery').children().remove();
            $('.cart').slideUp(1000).css("display","block");
            let name = $('#yourname').val("");
            let phone = $('#phone').val("");
            let address = $('#address').val("");
            $('#orderdetail').text("");
            orderConfirm = false;
        }
    }   

    /**
     * this function work to calculate discount price according to total product price in cart 
     * and return disocunt price
     * @param {*} totalPrice - total price of product in cart
     * @param {*} disPercent - discount percent for weekend day
     * @returns - discount price 
     */
    function discountPrice(totalPrice,disPercent = 15){
        let disPrice = 0;
        disPrice = totalPrice - ((totalPrice/100) * disPercent);
        return disPrice; 
    }

    /**
     * this function work to show display customer info to delivery when user click "Place Order" btn
     */
    function orderConfirm(){
        let name = $('#yourname').val();
        let phone = $('#phone').val();
        let address = $('#address').val();

        let htmlTem = `
            Thank You ${name} <br/>
            We received your order! <br/>
            We will Deliver to your place at ${address} <br/>
            Before delivery, we will inform to you Phone : ${phone}
        `;

        if(name && phone && address && !confirm){   
            $('#orderdetail').append(htmlTem);
            confirm = true;
        }else if(!(name && phone && address)){
            Swal.fire({
                title: "Please fill data completely!!!",
                width: 600,
                padding: "3em",
                color: "#716add",
                background: "#fff url(./hello-kitty.jpg)",
                backdrop: `
                  rgba(0,0,123,0.4)
                  url("./cat-nyan-cat.gif")
                  left top
                  no-repeat
                `
              });
        }
    }

});
