import jwt from "jsonwebtoken"

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("AUTH HEADER:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  console.log("TOKEN EXTRAÍDO:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("TOKEN DECODIFICADO:", decoded);

    req.userId = decoded.id;

    next();

  } catch (error) {
    console.log("ERRO AO VALIDAR TOKEN:", error.message);
    return res.status(401).json({ error: "Token inválido" });
  }
}