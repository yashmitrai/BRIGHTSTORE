import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Retailer } from './models/Retailer';
import { Product } from './models/Product';
import { Address } from './models/Address';
import { Notification } from './models/Notification';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brightstore');
    console.log('Database connected.');

    // Clear existing data
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Retailer.deleteMany({});
    await Product.deleteMany({});
    await Address.deleteMany({});
    await Notification.deleteMany({});
    console.log('Collections cleared.');

    // 1. Create Users
    console.log('Creating seed users...');
    
    // Admin
    const adminUser = await User.create({
      name: 'BrightStore Admin',
      email: 'admin@brightstore.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 9999999999',
    });

    // Retailer 1 (Verified owner)
    const owner1 = await User.create({
      name: 'Rajesh Kumar',
      email: 'retailer1@brightstore.com',
      password: 'retailer123',
      role: 'retailer',
      phone: '+91 9876543210',
    });

    // Retailer 2 (Unverified owner)
    const owner2 = await User.create({
      name: 'Sunita Sharma',
      email: 'retailer2@brightstore.com',
      password: 'retailer123',
      role: 'retailer',
      phone: '+91 8765432109',
    });

    // Retailer 3 (Verified owner)
    const owner3 = await User.create({
      name: 'Amit Patel',
      email: 'retailer3@brightstore.com',
      password: 'retailer123',
      role: 'retailer',
      phone: '+91 7654321098',
    });

    // Customer
    const customerUser = await User.create({
      name: 'Yashmit Rai',
      email: 'customer@brightstore.com',
      password: 'customer123',
      role: 'customer',
      phone: '+91 9500000000',
    });

    console.log('Users created.');

    // 2. Create Retailers
    console.log('Creating retailer store profiles...');
    
    const retailer1 = await Retailer.create({
      owner: owner1._id,
      storeName: 'QuickMart Local Express',
      storeAddress: '12, 100 Feet Rd, Indiranagar, Bangalore, Karnataka 560038',
      location: {
        type: 'Point',
        coordinates: [77.6413, 12.9716], // Indiranagar [lng, lat]
      },
      category: ['Groceries', 'Vegetables', 'Fruits', 'Dairy'],
      description: 'Your friendly neighborhood shop delivering fresh vegetables, organic fruits, and kitchen essentials in record time.',
      isVerified: true,
      rating: 4.8,
      reviewsCount: 124,
    });

    const retailer2 = await Retailer.create({
      owner: owner2._id,
      storeName: 'Sunrise Daily & Organic Needs',
      storeAddress: '432, 80 Feet Rd, Koramangala 4th Block, Bangalore, Karnataka 560034',
      location: {
        type: 'Point',
        coordinates: [77.6245, 12.9348], // Koramangala
      },
      category: ['Organic', 'Dairy', 'Snacks', 'Beverages'],
      description: 'All kinds of organic pulses, grains, farm-fresh milk, and dairy items. Freshness guaranteed.',
      isVerified: false, // Unverified initially
      rating: 4.2,
      reviewsCount: 15,
    });

    const retailer3 = await Retailer.create({
      owner: owner3._id,
      storeName: 'Aone Supermarket',
      storeAddress: '78, Hal 2nd Stage, Indiranagar, Bangalore, Karnataka 560008',
      location: {
        type: 'Point',
        coordinates: [77.6450, 12.9690], // Indiranagar area
      },
      category: ['Groceries', 'Beverages', 'Snacks', 'Household'],
      description: 'Providing wide range of quality grocery products, soft drinks, packed chips, soaps, and home cleanup necessities.',
      isVerified: true,
      rating: 4.6,
      reviewsCount: 89,
    });

    console.log('Retailers created.');

    // 3. Create Sample Products
    console.log('Seeding products catalog...');

    const productsData = [
      // Retailer 1 Products
      {
        retailer: retailer1._id,
        name: 'Fresh Organic Tomatoes',
        description: 'Naturally grown farm-fresh tomatoes, rich in vitamins. Handpicked daily.',
        price: 45,
        category: 'Vegetables',
        imageUrl: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600',
        stock: 50,
        sku: 'VEG-TOM-001',
      },
      {
        retailer: retailer1._id,
        name: 'Farm Fresh Potato (Alloo)',
        description: 'Premium quality potatoes, perfect for backing, frying, or boiling.',
        price: 35,
        category: 'Vegetables',
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600',
        stock: 120,
        sku: 'VEG-POT-002',
      },
      {
        retailer: retailer1._id,
        name: 'Fresh Coriander Bunch',
        description: 'Fragrant and clean green coriander leaves. Perfect for garnishing.',
        price: 15,
        category: 'Vegetables',
        imageUrl: 'https://images.unsplash.com/photo-1515668236457-83c3b8764839?auto=format&fit=crop&q=80&w=600',
        stock: 40,
        sku: 'VEG-COR-003',
      },
      {
        retailer: retailer1._id,
        name: 'Full Cream Fresh Milk 1L',
        description: 'Pasteurized homogenized cow milk. Packed with high nutrients.',
        price: 64,
        category: 'Dairy',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
        stock: 80,
        sku: 'DRY-MILK-001',
      },
      {
        retailer: retailer1._id,
        name: 'Salted Amul Butter 500g',
        description: 'Delicious creamy butter, a favorite breakfast spread for generations.',
        price: 275,
        category: 'Dairy',
        imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600',
        stock: 35,
        sku: 'DRY-BUTT-002',
      },
      {
        retailer: retailer1._id,
        name: 'Premium Basmati Rice 5kg',
        description: 'Long grain aromatic basmati rice. Aged to perfection.',
        price: 650,
        category: 'Groceries',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
        stock: 15,
        sku: 'GRO-RICE-001',
      },
      
      // Retailer 3 Products
      {
        retailer: retailer3._id,
        name: 'Organic Cavendish Bananas',
        description: 'Sweet, energy-packed yellow bananas. Set of 6 pieces.',
        price: 48,
        category: 'Fruits',
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=600',
        stock: 30,
        sku: 'FRU-BAN-001',
      },
      {
        retailer: retailer3._id,
        name: 'Brown Farm Eggs 12pk',
        description: 'Nutritious brown eggs, high in protein. Cleaned and safely packed.',
        price: 96,
        category: 'Dairy',
        imageUrl: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=600',
        stock: 60,
        sku: 'DRY-EGG-003',
      },
      {
        retailer: retailer3._id,
        name: 'Classic Potato Chips Salted',
        description: 'Crispy salted snacks for quick munching during study or work.',
        price: 30,
        category: 'Snacks',
        imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d20?auto=format&fit=crop&q=80&w=600',
        stock: 100,
        sku: 'SNA-CHIP-001',
      },
      {
        retailer: retailer3._id,
        name: 'Coca Cola Soft Drink 750ml',
        description: 'Chilled sparkling carbonated drink. Best served cold.',
        price: 45,
        category: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600',
        stock: 45,
        sku: 'BEV-COKE-001',
      }
    ];

    await Product.create(productsData);
    console.log('Products seeded successfully.');

    // 4. Create Saved Customer Address
    console.log('Seeding customer address...');
    await Address.create({
      user: customerUser._id,
      tag: 'Home',
      street: 'Flat No 404, Maple Block, Prestige Ferns Apartments, Indiranagar',
      city: 'Bangalore',
      postalCode: '560038',
      latitude: 12.9720,
      longitude: 77.6410,
    });

    await Address.create({
      user: customerUser._id,
      tag: 'Work',
      street: 'Tower C, RMZ Infinity, Old Madras Road, Bennigana Halli',
      city: 'Bangalore',
      postalCode: '560016',
      latitude: 12.9918,
      longitude: 77.6601,
    });

    console.log('Addresses seeded.');

    // 5. Create In-App Notifications
    console.log('Seeding initial notifications...');
    
    // Notifications for Customer
    await Notification.create({
      recipient: customerUser._id,
      title: 'Welcome to BrightStore!',
      message: 'Find local stores, request products, select the best offer, and get lightning-fast delivery!',
      type: 'general',
    });

    // Notification for Retailer 1
    await Notification.create({
      recipient: owner1._id,
      title: 'Profile Verified',
      message: 'Your store "QuickMart Local Express" is verified by BrightStore. You can now accept customer bids.',
      type: 'verification_status',
    });

    // Notification for Retailer 2
    await Notification.create({
      recipient: owner2._id,
      title: 'Verification Pending',
      message: 'Your store details are under review. BrightStore admin team will verify you shortly.',
      type: 'verification_status',
    });

    console.log('Notifications seeded.');
    console.log('Database seeded SUCCESSFULLY.');

    // Terminate DB connection
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
};

seedData();
