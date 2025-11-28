const express = require('express');
const ctrl = require('../controllers/orderController');

const router = express.Router();

router.post('/order', ctrl.createOrder);
router.get('/order/list', ctrl.listOrders);
router.get('/order/:orderId', ctrl.getOrder);
router.put('/order/:orderId', ctrl.updateOrder);
router.delete('/order/:orderId', ctrl.deleteOrder);

module.exports = router;
