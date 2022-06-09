(function () {
    let webP = new Image();
    webP.src = "./check_webp_supporting.webp";
    webP.onload = function () {
        if (webP.height == 2) document.body.classList.add("webp");
    };
})();
