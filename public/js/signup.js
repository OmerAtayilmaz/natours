import axios from "axios";
import { showAlert } from "./alerts";
//httpOnly -> cookie silinemez,upda edilemez anlamına gelir.
export const signup = async ({ email, password, name }) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:8000/api/v1/users/signup",
      data: {
        email: email,
        password: password,
        passwordConfirm: password,
        name: name,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "Sign up successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
