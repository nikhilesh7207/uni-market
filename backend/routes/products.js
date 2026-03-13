const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
});

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

    let imageUrl = '';
    if (req.file) {
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
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
        const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
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

const Report = require('../models/Report');

// @route   POST api/products/:id/report
// @desc    Report a product
// @access  Private
router.post('/:id/report', auth, async (req, res) => {
    const { reason, description } = req.body;
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        const newReport = new Report({
            reportType: 'product',
            reporter: req.user.id,
            product: req.params.id,
            reason: reason,
            description: description || ''
        });

        await newReport.save();
        
        // Increment product report count and maintain internal reference
        product.reports.unshift({
            reportedBy: req.user.id,
            reason,
            timestamp: new Date()
        });
        product.reportCount = (product.reportCount || 0) + 1;
        await product.save();

        res.json({ success: true, report: newReport });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
