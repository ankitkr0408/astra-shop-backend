const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUserProfile, getUsers, deleteUser, getUserById, updateUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile);
router.route('/users').get(protect, admin, getUsers);
router.route('/users/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;
