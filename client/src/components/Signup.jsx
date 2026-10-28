import React, { useState } from "react";
import "./Login.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function Signup({ onLoginClick }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState(null);

  
  async function handleSignup(event) {
    event.preventDefault();

    if (password.length < 8) {
      setPopup({
        type: "error",
        title: "Password Too Short!",
        message: "Password must be at least 8 characters.",
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setPopup({
          type: "error",
          title: "Signup Failed!",
          message: data.message || "Unable to create your account.",
        });
        return;
      }


const newUser = {
  name: data.user.name,
  email: data.user.email.trim().toLowerCase(),
};

const existingUsers = JSON.parse(
  localStorage.getItem("woodPuzzleUsers") || "[]"
);

const userExists = existingUsers.some(
  (user) =>
    user.email?.trim().toLowerCase() === newUser.email
);

if (!userExists) {
  localStorage.setItem(
    "woodPuzzleUsers",
    JSON.stringify([...existingUsers, newUser])
  );
}

      setPopup({
        type: "success",
        title: "Signup Successful!",
        message: `Welcome ${data.user.name}! Your account is created.`,
      });
    } catch (error) {
      setPopup({
        type: "error",
        title: "Connection Error!",
        message:
          "Cannot connect to the server. Please try again.",
      });
    }
  }


  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSignup}>
        <div className="form-icon">🎮</div>

        <h2>Create Account</h2>
        <p>Join Wood Screw Puzzle</p>

        <label>Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <button className="main-button" type="submit">
          Create Account
        </button>

        <div className="signup-text">
          Already have an account?{" "}
          <button type="button" onClick={onLoginClick}>
            Login
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
                className="popup-button"
                onClick={() => {
                  setPopup(null);
                  onLoginClick();
                }}
              >
                Go to Login →
              </button>
            ) : (
              <button
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

export default Signup;