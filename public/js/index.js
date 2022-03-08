import "@babel/polyfill";
import { login, logout } from "./login";
import { signup } from "./signup";
import { displayMap } from "./mapbox";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";
//DOM ELEMENTS
const mapbox = document.getElementById("map");

const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");

const signupForm = document.querySelector("#signupForm");

const userDataForm = document.querySelector(".form-user-data");
const userPassForm = document.querySelector(".form-user-password");

const bookBtn = document.getElementById("book-tour");
if (mapbox) {
  const locations = JSON.parse(
    document.getElementById("map").dataset.locations
  );
  displayMap(locations);
}

if (signupForm) {
  document.querySelector("#signupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const signupemail = document.querySelector("#signupemail")?.value;
    const signuppassword = document.querySelector("#signuppassword")?.value;
    const signupname = document.querySelector("#signupname")?.value;
    signup({ email: signupemail, password: signuppassword, name: signupname });
  });
}
if (loginForm) {
  document.querySelector(".form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    login({ email, password });
  });
}
if (logOutBtn) {
  logOutBtn.addEventListener("click", logout);
}
if (userDataForm) {
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);

    updateSettings(form, "data");
  });
}
if (userPassForm) {
  userPassForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await updateSettings(
      { passwordCurrent, passwordConfirm, password },
      "password"
    );
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
    document.querySelector(".btn--save-password").textContent = "SAVE PASSWORD";
  });
}
if (bookBtn)
  bookBtn.addEventListener("click", (e) => {
    e.target.textContent = "Processing...";
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
