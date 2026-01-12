import { Request, Response } from 'express';
import Product from '../models/Product';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req: Request, res: Response) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const { name, price, description, category, stock } = req.body;

    // Handle images
    let images: string[] = [];
    
    // If files were uploaded
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      // For now, just use the file path or buffer
      images = files.map(file => {
        // If file has path property (from multer)
        if (file.path) {
          return file.path;
        }
        // If file has buffer (in-memory storage)
        if (file.buffer) {
          return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        }
        return '';
      }).filter(Boolean);
    } 
    // If images sent as URLs (from form data)
    else if (req.body.images) {
      if (typeof req.body.images === 'string') {
        images = [req.body.images];
      } else if (Array.isArray(req.body.images)) {
        images = req.body.images;
      }
    }

    console.log('Images to save:', images);

    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      images,
      category,
      stock: parseInt(stock, 10)
    });

    const createdProduct = await product.save();
    console.log('Product created:', createdProduct);
    
    res.status(201).json(createdProduct);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      message: 'Failed to create product', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, description, category, stock } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name || product.name;
    product.price = price ? parseFloat(price) : product.price;
    product.description = description || product.description;
    product.category = category || product.category;
    product.stock = stock ? parseInt(stock, 10) : product.stock;

    // Handle images if provided
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      product.images = files.map(file => file.path).filter(Boolean);
    } else if (req.body.images) {
      if (typeof req.body.images === 'string') {
        product.images = [req.body.images];
      } else if (Array.isArray(req.body.images)) {
        product.images = req.body.images;
      }
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      message: 'Failed to update product', 
      error: error.message 
    });
  }
};


// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

export { getProducts, getProductById, createProduct, updateProduct, deleteProduct };