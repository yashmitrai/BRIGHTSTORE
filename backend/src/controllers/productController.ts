import { Response } from 'express';
import { Product } from '../models/Product';
import { Retailer } from '../models/Retailer';
import { AuthRequest } from '../middleware/authMiddleware';

export const getProducts = async (req: AuthRequest, res: Response) => {
  const { category, search, retailerId } = req.query;
  const filter: any = {};

  if (category) {
    filter.category = String(category);
  }

  if (search) {
    filter.$or = [
      { name: { $regex: String(search), $options: 'i' } },
      { description: { $regex: String(search), $options: 'i' } },
    ];
  }

  if (retailerId) {
    filter.retailer = retailerId;
  } else if (req.user && req.user.role === 'retailer') {
    // If the caller is a retailer, default to showing their products if no explicit retailerId query is passed
    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (retailer) {
      filter.retailer = retailer._id;
    }
  }

  try {
    const products = await Product.find(filter).populate('retailer', 'storeName rating');
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  const { name, description, price, category, imageUrl, stock, sku } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (!retailer) {
      return res.status(403).json({ message: 'Retailer profile required to create products' });
    }

    const product = await Product.create({
      retailer: retailer._id,
      name,
      description,
      price,
      category,
      imageUrl,
      stock: stock || 0,
      sku,
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, price, category, imageUrl, stock, sku } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Authorization: Must be the owner retailer or admin
    if (req.user.role !== 'admin') {
      const retailer = await Retailer.findOne({ owner: req.user.id });
      if (!retailer || product.retailer?.toString() !== retailer._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to update this product' });
      }
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.category = category ?? product.category;
    product.imageUrl = imageUrl ?? product.imageUrl;
    product.stock = stock ?? product.stock;
    product.sku = sku ?? product.sku;

    await product.save();

    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Authorization
    if (req.user.role !== 'admin') {
      const retailer = await Retailer.findOne({ owner: req.user.id });
      if (!retailer || product.retailer?.toString() !== retailer._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to delete this product' });
      }
    }

    await Product.findByIdAndDelete(id);

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
