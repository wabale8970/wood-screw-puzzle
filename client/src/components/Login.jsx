import { useState } from "react";
import "./Login.css";
import { GAME_NAME } from "../config/gameConfig";

function Login({ onSignupClick, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState(null);
  const [matchedUser, setMatchedUser] = useState(null);

  
  async function handleLogin(event) {
    event.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMatchedUser(null);

        setPopup({
          type: "error",
          title: "Login Failed!",
          message:
            data.message || "Incorrect email or password.",
        });

        return;
      }

      localStorage.setItem("woodPuzzleToken", data.token);

      setMatchedUser(data.user);

      setPopup({
        type: "success",
        title: "Login Successful!",
        message: `Welcome back, ${data.user.name}! Ready to play?`,
      });
    } catch (error) {
      setMatchedUser(null);

      setPopup({
        type: "error",
        title: "Connection Error!",
        message:
          "Cannot connect to the server. Please check that the backend is running.",
      });
    }
  }


  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-icon">🔐</div>

        <h2>Welcome Back!</h2>
        <p>Login to {GAME_NAME}</p>

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="main-button" type="submit">
          Login
        </button>

        <div className="signup-text">
          Don't have an account?{" "}
          <button type="button" onClick={onSignupClick}>
            Sign Up
          </button>
        </div>
      </form>

      {popup && (
        <div className="popup-overlay">
          <div className={`popup-card ${popup.type}`}>
            <div className="popup-icon">
              {popup.type === "success" ? "✓" : "!"}
            </div>

            <h2>{popup.title}</h2>
            <p>{popup.message}</p>

            {popup.type === "success" ? (
              <button
                type="button"
                className="popup-button"
                onClick={() => {
  if (!matchedUser) return;

  setPopup(null);

  onLoginSuccess({
    name: matchedUser.name || "Player",
    email: matchedUser.email.trim().toLowerCase(),
  });
}}
              >
                Continue to Game 🎮
              </button>
            ) : (
              <button
                type="button"
                className="popup-button"
                onClick={() => setPopup(null)}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;