const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  const from = process.env.EMAIL_FROM || "BuildSupply <onboarding@resend.dev>";
  console.log("Testing Resend with from:", from);
  try {
    const result = await resend.emails.send({
      from,
      to: ["bigguy.owens@gmail.com"],
      subject: "Test — BuildSupply Password Reset Email",
      html: "<h1>Test email from BuildSupply</h1><p>The forgot password flow is working!</p>",
    });
    if (result.error) console.log("ERROR:", result.error.message);
    else console.log("SUCCESS! Email ID:", result.data?.id);
  } catch (e) {
    console.error("EXCEPTION:", e.message);
  }
}
test();
