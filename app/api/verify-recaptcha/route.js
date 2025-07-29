import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { recaptchaToken } = await req.json();

    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "reCAPTCHA token is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "reCAPTCHA secret key not configured" },
        { status: 500 }
      );
    }

    // Verify the reCAPTCHA token with Google
    const verificationResponse = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${recaptchaToken}`,
      }
    );

    const verificationData = await verificationResponse.json();

    if (verificationData.success) {
      return NextResponse.json({
        success: true,
        score: verificationData.score, // For reCAPTCHA v3
      });
    } else {
      return NextResponse.json(
        {
          error: "reCAPTCHA verification failed",
          details: verificationData["error-codes"],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error during reCAPTCHA verification" },
      { status: 500 }
    );
  }
}
