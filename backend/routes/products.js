const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('seller', ['name', 'email']);
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('seller', ['name', 'email']);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/products
// @desc    Create a product
// @access  Private
router.post('/', [auth, upload.single('image')], async (req, res) => {
    const { name, description, category, price } = req.body;

    const imageUrl = req.file ? `${process.env.SERVER_BASE_URL || 'http://localhost:5000'}/uploads/${req.file.filename}` : '';
    const images = imageUrl ? [imageUrl] : [];

    try {
        const newProduct = new Product({
            name,
            description,
            category,
            price,
            images,
            seller: req.user.id
        });

        const product = await newProduct.save();
        res.status(201).json({ message: "Product saved successfully", product });
    } catch (err) {
        console.error("Backend product upload error:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        // Check user
        if (product.seller.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await product.deleteOne();

        res.json({ msg: 'Product removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET api/products/user/:userId
// @desc    Get products by user ID
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const products = await Product.find({ seller: req.params.userId }).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private
router.put('/:id', [auth, upload.single('image')], async (req, res) => {
    const { name, description, category, price } = req.body;

    // Build product object
    const productFields = {};
    if (name) productFields.name = name;
    if (description) productFields.description = description;
    if (category) productFields.category = category;
    if (price) productFields.price = price;

    // Handle Image Update
    let updatedImages = [];
    if (req.body.existingImages) {
        if (Array.isArray(req.body.existingImages)) {
            updatedImages = [...req.body.existingImages];
        } else {
            updatedImages = [req.body.existingImages];
        }
    }

    if (req.file) {
        const imageUrl = `${process.env.SERVER_BASE_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
        updatedImages = [...updatedImages, imageUrl];
    }

    productFields.images = updatedImages;

    try {
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ msg: 'Product not found' });

        // Make sure user owns product
        if (product.seller.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: productFields },
            { new: true }
        );

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/products/:id/report
// @desc    Report a product
// @access  Private
router.post('/:id/report', auth, async (req, res) => {
    const { reason } = req.body;
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        const newReport = {
            reportedBy: req.user.id,
            reason
        };

        product.reports.unshift(newReport);
        await product.save();

        res.json(product.reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
