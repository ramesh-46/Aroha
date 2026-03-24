import React from "react";
import { useNavigate } from "react-router-dom";

function Terms() {
  const navigate = useNavigate();

  return (
    <div style={container}>
      <h2>Terms & Conditions</h2>

      <div style={content}>
        <p>
          Welcome to our application. By using our services, you agree to the
          following terms and conditions. Please read them carefully.
        </p>

        <h3>1. Acceptance of Terms</h3>
        <p>
          By accessing or using this application, you agree to be bound by these
          Terms & Conditions and our Privacy Policy.
        </p>

        <h3>2. User Responsibilities</h3>
        <p>
          You agree to use the application responsibly and not engage in any
          activity that could harm the platform, other users, or third parties.
        </p>

        <h3>3. Privacy</h3>
        <p>
          We respect your privacy and handle your personal information in
          accordance with our Privacy Policy.
        </p>

        <h3>4. Account Security</h3>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials. Notify us immediately of any unauthorized use.
        </p>

        <h3>5. Limitation of Liability</h3>
        <p>
          The application is provided "as is" without warranties of any kind. We
          are not liable for any damages resulting from your use of the service.
        </p>

        <h3>6. Changes to Terms</h3>
        <p>
          We reserve the right to update or modify these Terms & Conditions at
          any time. Changes will be posted on this page.
        </p>

        <h3>7. Contact</h3>
        <p>
          For questions or concerns regarding these terms, please contact us
          through the support section in the app.
        </p>

        <button style={btnStyle} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    </div>
  );
}

// ====== STYLES ======
const container = {
  maxWidth: "700px",
  margin: "50px auto",
  padding: "25px",
  border: "1px solid #ccc",
  borderRadius: "12px",
  textAlign: "left",
  fontFamily: "Arial, sans-serif",
};

const content = {
  marginTop: "20px",
  lineHeight: "1.6",
};

const btnStyle = {
  marginTop: "20px",
  padding: "12px 20px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};
/////
export default Terms;
