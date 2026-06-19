const express = require('express');
const router = express.Router();
const { obtenerSedes } = require('../controllers/sedeController');

router.get('/', obtenerSedes);

module.exports = router;