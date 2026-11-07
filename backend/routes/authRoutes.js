
const express = require('express');
const router = express.Router();

const { registerUser, loginUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
const protect = require('../middleware/authMiddleware');

router.get('/verify', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Authentication verified!',
        userId: req.userId
    });
});
module.exports = router;
