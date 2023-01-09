alert("about");
require("./modules/check_webp_support");
import moveElem from "./modules/moveElem.js";

const lol = 4;

console.log(2);
const block = document.querySelector(".block");
const newPlace = document.querySelector(".mobile");

moveElem(block, newPlace, "(max-width: 768px)", "append");

console.log(2);

lol = 5;
