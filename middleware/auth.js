const { auth } = require("firebase-admin");
const { parsePhoneNumbers, normalize } = require("../parser");

/**
 * @type {import("express").Handler}
 */
module.exports = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(400).json({ message: "You did not specify idToken." });
  } else if (req.headers.cBotAuth) {
    if (req.headers.cBotAuth == process.env.BOT_AUTH_TOKEN) {
      if (req.query.vol_phone_no) {
        let parsedPhoneNo = parsePhoneNumbers(
          normalize(String(req.query.vol_phone_no))
        );

        if (parsedPhoneNo[0]) {
          req.vol_phone_no = parsedPhoneNo[0];
          next();
        } else {
          return res.status(400).send({ errr: "Invalid vol_phone_no" });
        }
      }
    } else {
      return res.status(401).send({ errr: "Invalid cBotAuthToken" });
    }
  } else {
    try {
      const user = await auth().verifyIdToken(token);
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).send({ message: "Unable to verify user." });
      }
    } catch {
      res.status(500).send({ message: "Unable to verify user." });
    }
  }
};