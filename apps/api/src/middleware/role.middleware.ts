// function roleMiddleware(...allowedRoles) {
//     return (req, res, next) => {
//         const role = req.user?.role;
//         if(!role || !allowedRoles.includes(role)) {
//             return res.status(403).json({ error: "Forbidden: Insufficient role" });
//         }
//         next();
//     };
// }

// module.exports = roleMiddleware;

import type { Request, Response, NextFunction } from "express";

export default function roleMiddleware(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient role" });
    }
    next();
  };
}