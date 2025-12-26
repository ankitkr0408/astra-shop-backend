const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
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
const getProductById = async (req, res) => {
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
const createProduct = async (req, res) => {
    try {
        const { name, price, description, images, category, stock } = req.body;
        const product = new Product({
            name, price, description, images, category, stock
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
}

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { name, price, description, images, category, stock } = req.body;

  try {
      const product = await Product.findById(req.params.id);

      if (product) {
          product.name = name || product.name;
          product.price = price || product.price;
          product.description = description || product.description;
          product.images = images || product.images;
          product.category = category || product.category;
          product.stock = stock || product.stock;

          const updatedProduct = await product.save();
          res.json(updatedProduct);
      } else {
          res.status(404).json({ message: 'Product not found' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Failed to update product', error: error.message});
  }

};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
  
      if (product) {
        await product.deleteOne(); // or product.remove() depending on mongoose version
        res.json({ message: 'Product removed' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
       res.status(500).json({ message: 'Failed to delete product', error: error.message});
    }
  };

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
