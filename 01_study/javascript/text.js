var el = document.querySelector(".style-container");


function scrollElement(event, index) {
    var elm = ".typeb-container";
    var moveTop = $(window).scrollTop();
    var elmSelecter = $(elm).eq(index);

    var dY = event.deltaY;
    var dX = event.deltaX;
    if(dY < 0) {

    } else {
        if ($(elmSelecter).next() != undefined) {
            try{
                moveTop = $(elmSelecter).next().offset().top;
            }catch(e){

            }
        }
    }

    console.log(elmSelecter);

    $("html,body").stop().animate({
        scrollTop: moveTop + 'px'
    }, {
        duration: 500,
        easing: 'easeOutQuint',
        complete: function () {
        }
    });
}

el.addEventListener("wheel", scrollElement, false);