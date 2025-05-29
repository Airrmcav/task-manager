import jwt from "jsonwebtoken";

const createJWT = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,      
    sameSite: "Lax",
    maxAge: 24 * 60 * 60 * 1000
  });
};

export default createJWT;
