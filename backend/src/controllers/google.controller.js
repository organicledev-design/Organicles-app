const prisma = require("../prisma");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google token and login/register user
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: "idToken is required" });
    }

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid Google token" });
    }

    const { sub: googleId, email, name: fullName, picture: avatar } = payload;

    // Check if user exists by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: email || undefined },
        ],
      },
    });

    if (user) {
      // Update googleId and avatar if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatar: avatar || user.avatar,
          authType: "google",
        },
      });

      return res.status(200).json({
        success: true,
        isNewUser: false,
        user,
      });
    }

    // New user - create account
    user = await prisma.user.create({
      data: {
        googleId,
        email: email || null,
        fullName: fullName || "User",
        avatar: avatar || null,
        authType: "google",
        dob: null,
        phone: null,
      },
    });

    return res.status(201).json({
      success: true,
      isNewUser: true,
      user,
    });
  } catch (error) {
    console.error("[googleAuth] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
      error: error.message,
    });
  }
};
