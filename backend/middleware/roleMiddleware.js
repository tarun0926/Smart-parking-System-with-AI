export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user.role}) is not authorized to access this resource`,
      });
    }

    next();
  };
};

export default authorizeRoles;
