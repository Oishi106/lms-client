// components/OtpModal.tsx
export const verifyOtp = async (
  email: string,
  inputCode: string,
  onCheckout: () => void | Promise<void>
) => {
  const response = await fetch("/api/otp/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, code: inputCode })
  });

  if (response.ok) {
    // If OTP is valid, continue with checkout.
    await onCheckout();
  } else {
    alert("Invalid OTP");
  }
};