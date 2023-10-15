"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
particlesJS.load("particles-js", "particles.json", function () {
  console.log("callback - particles.js config loaded");
});

(function () {
  _toConsumableArray(document.querySelectorAll(".control")).forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelector(".active-btn").classList.remove("active-btn");
      this.classList.add("active-btn");
      document.querySelector(".active").classList.remove("active");
      document.getElementById(button.dataset.id).classList.add("active");
    });
  });

  document.querySelector(".theme-btn").addEventListener("click", function () {
    document.body.classList.toggle("light-mode");
  });
})(); // var target = document.getElementById('target');
// var targetBox = document.getElementById('target-box');
// targetBox.addEventListener('click', mouseClicked);
// function mouseClicked (event){
//   var xposition = (event.clientX - target.offsetLeft - target.offsetWidth/2);
//   var yposition = (event.clientY - target.offsetTop - target.offsetHeight/2);
//   target.style.transform = "translate("+ xposition + "px," + yposition + "px)";}