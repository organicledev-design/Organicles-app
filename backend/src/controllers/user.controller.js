const prisma = require("../prisma");

const normalizePhone = (phone = "") => String(phone).replace(/\s+/g, "").trim();

exports.upsertProfile = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const fullName = String(req.body.fullName || "").trim();
    const dob = String(req.body.dob || "").trim();
    const email = String(req.body.email || "").trim();

    if (!phone || !fullName || !dob) {
      return res.status(400).json({
        success: false,
        message: "phone, fullName and dob are required",
      });
    }

    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        fullName,
        dob,
        email: email || null,
      },
      create: {
        phone,
        fullName,
        dob,
        email: email || null,
      },
    });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save profile",
      error: error.message,
    });
  }
};

exports.getProfileByPhone = async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: "phone is required" });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};
