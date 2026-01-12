import express from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';

const router = express.Router();

// Simple routes without middleware
router.route('/')
  .get(getProducts)
  .post(createProduct); // Remove multer middleware temporarily

router.route('/:id')
  .get(getProductById)
  .put(updateProduct) // Remove multer middleware temporarily
  .delete(deleteProduct);

export default router;