<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warehouse Management System - Standard Operating Procedures</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .header {
            background-color: #1e3a8a;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            font-size: 1.2em;
            margin-top: 10px;
        }
        .section {
            background-color: white;
            padding: 30px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #1e3a8a;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .section h3 {
            color: #2563eb;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        .screenshot {
            border: 2px solid #e5e5e5;
            border-radius: 8px;
            margin: 20px 0;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .screenshot img {
            width: 100%;
            display: block;
        }
        .caption {
            background-color: #f8f9fa;
            padding: 10px;
            font-size: 0.9em;
            color: #666;
            text-align: center;
            font-style: italic;
        }
        .step {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 15px 0;
        }
        .step-number {
            background-color: #3b82f6;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 10px;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
        }
        .warning::before {
            content: "  ";
            font-size: 1.2em;
        }
        .success {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 15px 0;
        }
        .success::before {
            content: " ";
            font-size: 1.2em;
        }
        .info {
            background-color: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 15px 0;
        }
        .info::before {
            content: "9 ";
            font-size: 1.2em;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        table th {
            background-color: #1e3a8a;
            color: white;
            padding: 12px;
            text-align: left;
        }
        table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .toc {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .toc h2 {
            color: #1e3a8a;
            margin-top: 0;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 20px;
        }
        .toc a {
            color: #2563eb;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .feature-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
        }
        .feature-card h4 {
            color: #1e3a8a;
            margin-top: 0;
        }
        .button-example {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 6px;
            font-weight: bold;
            text-decoration: none;
            color: white;
        }
        .btn-primary {
            background-color: #3b82f6;
        }
        .btn-success {
            background-color: #10b981;
        }
        .btn-danger {
            background-color: #ef4444;
        }
        .btn-warning {
            background-color: #f59e0b;
        }
    </style>
</head>
<body>

<div class="header">
    <h1>Warehouse Management System</h1>
    <div class="subtitle">Standard Operating Procedures</div>
    <div style="margin-top: 20px;">Version 3.0 | December 2024</div>
</div>

<div class="section toc">
    <h2>Table of Contents</h2>
    <ul>
        <li><a href="#introduction">1. Introduction</a></li>
        <li><a href="#system-access">2. System Access</a></li>
        <li><a href="#qc-label-printing">3. QC Label Printing</a></li>
        <li><a href="#grn-label-printing">4. GRN Label Printing</a></li>
        <li><a href="#stock-counting">5. Stock Counting</a></li>
        <li><a href="#stock-transfer">6. Stock Transfer</a></li>
        <li><a href="#order-loading">7. Order Loading</a></li>
        <li><a href="#void-pallet">8. Void Pallet</a></li>
        <li><a href="#reports">9. Reports & Analytics</a></li>
        <li><a href="#admin-functions">10. Admin Functions</a></li>
    </ul>
</div>

<div class="section" id="introduction">
    <h2>1. Introduction</h2>
    <p>This document outlines the standard operating procedures for the Warehouse Management System (WMS). All warehouse staff must follow these procedures to ensure accurate inventory management and efficient operations.</p>
    
    <h3>System Overview</h3>
    <div class="feature-grid">
        <div class="feature-card">
            <h4><÷ Label Management</h4>
            <p>Print QC and GRN labels for incoming goods and quality control processes.</p>
        </div>
        <div class="feature-card">
            <h4>=Ê Inventory Control</h4>
            <p>Track stock levels, perform cycle counts, and manage stock movements.</p>
        </div>
        <div class="feature-card">
            <h4>=æ Order Processing</h4>
            <p>Manage order loading, ACO orders, and shipment preparation.</p>
        </div>
        <div class="feature-card">
            <h4>=È Reporting</h4>
            <p>Generate comprehensive reports for inventory analysis and decision making.</p>
        </div>
    </div>
</div>

<div class="section" id="system-access">
    <h2>2. System Access</h2>
    
    <h3>2.1 Login Process</h3>
    
    <div class="screenshot">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 60px; text-align: center;">
            <div style="background: white; border-radius: 10px; padding: 40px; max-width: 400px; margin: 0 auto;">
                <h3 style="color: #1e3a8a; margin-bottom: 30px;">Warehouse Management System</h3>
                <div style="margin-bottom: 20px;">
                    <input type="email" placeholder="Email" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 15px;">
                    <input type="password" placeholder="Password" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <button style="width: 100%; padding: 12px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Sign In</button>
                <div style="margin-top: 20px;">
                    <a href="#" style="color: #3b82f6; text-decoration: none;">Forgot Password?</a>
                </div>
            </div>
        </div>
        <div class="caption">Figure 1: Login Screen</div>
    </div>
    
    <div class="step">
        <span class="step-number">1</span>
        Navigate to the WMS login page using your web browser
    </div>
    
    <div class="step">
        <span class="step-number">2</span>
        Enter your registered email address
    </div>
    
    <div class="step">
        <span class="step-number">3</span>
        Enter your password
    </div>
    
    <div class="step">
        <span class="step-number">4</span>
        Click "Sign In" to access the system
    </div>
    
    <div class="warning">
        For security reasons, passwords must be changed every 90 days. The system will prompt you when your password is due for renewal.
    </div>
    
    <h3>2.2 Main Dashboard</h3>
    
    <div class="screenshot">
        <div style="background: #1a1a1a; padding: 20px;">
            <div style="background: #2a2a2a; border-radius: 10px; padding: 30px;">
                <h2 style="color: white; text-align: center; margin-bottom: 40px;">Warehouse Management System</h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                    <div style="background: #3a3a3a; padding: 30px; border-radius: 8px; text-align: center; cursor: pointer;">
                        <div style="font-size: 48px; margin-bottom: 10px;"><÷</div>
                        <h3 style="color: white;">Print QC Label</h3>
                    </div>
                    <div style="background: #3a3a3a; padding: 30px; border-radius: 8px; text-align: center; cursor: pointer;">
                        <div style="font-size: 48px; margin-bottom: 10px;">=Ë</div>
                        <h3 style="color: white;">Print GRN Label</h3>
                    </div>
                    <div style="background: #3a3a3a; padding: 30px; border-radius: 8px; text-align: center; cursor: pointer;">
                        <div style="font-size: 48px; margin-bottom: 10px;">=Ê</div>
                        <h3 style="color: white;">Stock Count</h3>
                    </div>
                    <div style="background: #3a3a3a; padding: 30px; border-radius: 8px; text-align: center; cursor: pointer;">
                        <div style="font-size: 48px; margin-bottom: 10px;">=</div>
                        <h3 style="color: white;">Stock Transfer</h3>
                    </div>
                    <div style="background: #3a3a3a; padding: 30px; border-radius: 8px; text-align: center; cursor: pointer;">
                        <div style="font-size: 48px; margin-bottom: 10px;">=æ</div>
                        <h3 style="color: white;">Order Loading</h3>
                    </div>
                    <div style="background: #3a3a3a; padding: 30px; border-radius: 8px; text-align: center; cursor: pointer;">
                        <div style="font-size: 48px; margin-bottom: 10px;">L</div>
                        <h3 style="color: white;">Void Pallet</h3>
                    </div>
                </div>
            </div>
        </div>
        <div class="caption">Figure 2: Main Dashboard</div>
    </div>
</div>

<div class="section" id="qc-label-printing">
    <h2>3. QC Label Printing</h2>
    
    <h3>3.1 Overview</h3>
    <p>QC (Quality Control) labels are printed for products that have passed quality inspection. These labels contain essential product information and tracking codes.</p>
    
    <h3>3.2 Printing Process</h3>
    
    <div class="screenshot">
        <div style="background: #f3f4f6; padding: 30px;">
            <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1e3a8a; margin-bottom: 30px;">QC Label Printing</h2>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Product Code *</label>
                    <input type="text" value="SL-001" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Quantity *</label>
                    <input type="number" value="50" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Container Number</label>
                    <input type="text" value="CONT-2024-001" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Remark</label>
                    <textarea style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; height: 80px;">Quality checked and approved</textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button style="flex: 1; padding: 12px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: bold;">Print Label</button>
                    <button style="padding: 12px 24px; background-color: #6b7280; color: white; border: none; border-radius: 6px;">Clear</button>
                </div>
            </div>
        </div>
        <div class="caption">Figure 3: QC Label Form</div>
    </div>
    
    <div class="step">
        <span class="step-number">1</span>
        Select "Print QC Label" from the main dashboard
    </div>
    
    <div class="step">
        <span class="step-number">2</span>
        Enter or scan the product code
    </div>
    
    <div class="step">
        <span class="step-number">3</span>
        Input the quantity to be labeled
    </div>
    
    <div class="step">
        <span class="step-number">4</span>
        Add container number and remarks if applicable
    </div>
    
    <div class="step">
        <span class="step-number">5</span>
        Click "Print Label" to generate the QC label
    </div>
    
    <div class="info">
        The system automatically generates a unique pallet number and series number for tracking purposes.
    </div>
    
    <h3>3.3 Label Format</h3>
    
    <div class="screenshot">
        <div style="background: white; border: 2px solid #000; padding: 20px; max-width: 400px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">PENNINE</h2>
                <p style="margin: 5px 0;">Quality Control Label</p>
            </div>
            <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin: 15px 0;">
                <p><strong>Product:</strong> SL-001 - Slate Tile 600x300</p>
                <p><strong>Quantity:</strong> 50 pcs</p>
                <p><strong>Pallet:</strong> 241215/01</p>
                <p><strong>Date:</strong> 15/12/2024</p>
            </div>
            <div style="text-align: center;">
                <div style="display: inline-block; width: 150px; height: 150px; background: repeating-linear-gradient(0deg, #000, #000 2px, #fff 2px, #fff 4px);">
                    <p style="margin-top: 60px;">QR CODE</p>
                </div>
                <p style="margin-top: 10px;"><strong>Series:</strong> 240001-001</p>
            </div>
        </div>
        <div class="caption">Figure 4: QC Label Example</div>
    </div>
</div>

<div class="section" id="grn-label-printing">
    <h2>4. GRN Label Printing</h2>
    
    <h3>4.1 Overview</h3>
    <p>GRN (Goods Received Note) labels are printed for incoming shipments to track receipt and storage of products.</p>
    
    <h3>4.2 Printing Process</h3>
    
    <div class="screenshot">
        <div style="background: #f3f4f6; padding: 30px;">
            <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1e3a8a; margin-bottom: 30px;">GRN Label Printing</h2>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Supplier *</label>
                        <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option>ABC Trading Co.</option>
                            <option>XYZ Suppliers Ltd.</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: bold;">GRN Number *</label>
                        <input type="text" value="GRN-2024-1215" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <h4 style="margin-top: 0;">Product Details</h4>
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 15px;">
                        <input type="text" placeholder="Product Code" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <input type="number" placeholder="Quantity" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <button style="padding: 10px; background-color: #10b981; color: white; border: none; border-radius: 6px;">Add</button>
                    </div>
                </div>
                
                <table style="width: 100%; margin-bottom: 25px;">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Product Code</th>
                            <th style="text-align: left;">Description</th>
                            <th style="text-align: center;">Quantity</th>
                            <th style="text-align: center;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>SL-001</td>
                            <td>Slate Tile 600x300</td>
                            <td style="text-align: center;">100</td>
                            <td style="text-align: center;">
                                <button style="padding: 5px 10px; background-color: #ef4444; color: white; border: none; border-radius: 4px;">Remove</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <button style="width: 100%; padding: 12px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: bold;">Print GRN Labels</button>
            </div>
        </div>
        <div class="caption">Figure 5: GRN Label Form</div>
    </div>
    
    <table>
        <tr>
            <th>Field</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
        <tr>
            <td>Supplier</td>
            <td>Select the supplier from the dropdown list</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>GRN Number</td>
            <td>Enter the Goods Received Note number</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Product Code</td>
            <td>Enter or scan the product code</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Quantity</td>
            <td>Enter the received quantity</td>
            <td>Yes</td>
        </tr>
    </table>
</div>

<div class="section" id="stock-counting">
    <h2>5. Stock Counting</h2>
    
    <h3>5.1 Cycle Count Process</h3>
    
    <div class="screenshot">
        <div style="background: #0f172a; padding: 30px;">
            <div style="text-align: center; color: white;">
                <h2 style="margin-bottom: 30px;">Cycle Count</h2>
                
                <div style="background: #1e293b; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                    <button style="padding: 15px 30px; background-color: #10b981; color: white; border: none; border-radius: 8px; font-size: 18px; margin-bottom: 20px;">
                        Enable Batch Mode
                    </button>
                    
                    <div style="background: #334155; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 15px;">Scan QR Code or Enter Pallet Number</h3>
                        <div style="display: inline-block; width: 200px; height: 200px; background: white; border-radius: 8px;">
                            <p style="color: black; margin-top: 90px;">=÷ Camera View</p>
                        </div>
                    </div>
                    
                    <button style="padding: 10px 20px; background-color: #8b5cf6; color: white; border: none; border-radius: 6px;">
                        Manual Input
                    </button>
                </div>
            </div>
        </div>
        <div class="caption">Figure 6: Stock Count Interface</div>
    </div>
    
    <h3>5.2 Batch Mode Operation</h3>
    
    <div class="step">
        <span class="step-number">1</span>
        Enable "Batch Mode" to scan multiple pallets
    </div>
    
    <div class="step">
        <span class="step-number">2</span>
        Scan each pallet QR code or enter pallet number manually
    </div>
    
    <div class="step">
        <span class="step-number">3</span>
        Enter the counted quantity for each pallet
    </div>
    
    <div class="step">
        <span class="step-number">4</span>
        Review the batch list and submit all counts together
    </div>
    
    <div class="screenshot">
        <div style="background: #0f172a; padding: 30px;">
            <div style="background: #1e293b; border-radius: 10px; padding: 20px;">
                <h3 style="color: white; margin-bottom: 20px;">Batch Scan List (3 items)</h3>
                
                <div style="background: #334155; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; color: white;">
                        <div>
                            <p style="margin: 0;"><strong>SL-001</strong> - 241215/01</p>
                            <p style="margin: 0; font-size: 14px; color: #94a3b8;">Slate Tile 600x300</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span>Qty: 50</span>
                            <button style="padding: 5px 10px; background-color: #3b82f6; color: white; border: none; border-radius: 4px;">Edit</button>
                            <button style="padding: 5px 10px; background-color: #ef4444; color: white; border: none; border-radius: 4px;">Delete</button>
                        </div>
                    </div>
                </div>
                
                <button style="width: 100%; padding: 12px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; margin-top: 20px;">
                    Submit Batch (3 items)
                </button>
            </div>
        </div>
        <div class="caption">Figure 7: Batch Mode List</div>
    </div>
    
    <div class="warning">
        Each pallet can only be counted once per day. The system will alert you if you attempt to count the same pallet twice.
    </div>
    
    <h3>5.3 Stock Count Report</h3>
    
    <div class="screenshot">
        <div style="background: #f3f4f6; padding: 30px;">
            <div style="background: white; border-radius: 10px; padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 style="color: #1e3a8a; margin: 0;">Stock Count Report</h2>
                    <div style="display: flex; gap: 10px;">
                        <input type="date" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        <button style="padding: 8px 16px; background-color: #3b82f6; color: white; border: none; border-radius: 6px;">Export CSV</button>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="color: #6b7280; margin: 0;">Total Products</p>
                        <p style="font-size: 24px; font-weight: bold; margin: 5px 0;">25</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="color: #6b7280; margin: 0;">Counted Products</p>
                        <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 5px 0;">18</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="color: #6b7280; margin: 0;">Total Variance</p>
                        <p style="font-size: 24px; font-weight: bold; color: #f59e0b; margin: 5px 0;">+45</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="color: #6b7280; margin: 0;">High Variance Items</p>
                        <p style="font-size: 24px; font-weight: bold; color: #ef4444; margin: 5px 0;">3</p>
                    </div>
                </div>
                
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Product Code</th>
                            <th>Description</th>
                            <th style="text-align: right;">Start Stock</th>
                            <th style="text-align: right;">Counted</th>
                            <th style="text-align: right;">System Stock</th>
                            <th style="text-align: right;">Variance</th>
                            <th style="text-align: right;">Variance %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>SL-001</td>
                            <td>Slate Tile 600x300</td>
                            <td style="text-align: right;">500</td>
                            <td style="text-align: right;">485</td>
                            <td style="text-align: right;">500</td>
                            <td style="text-align: right; color: #ef4444;">-15</td>
                            <td style="text-align: right;">-3.0%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="caption">Figure 8: Stock Count Report</div>
    </div>
</div>

<div class="section" id="stock-transfer">
    <h2>6. Stock Transfer</h2>
    
    <h3>6.1 Transfer Process</h3>
    
    <div class="screenshot">
        <div style="background: #f3f4f6; padding: 30px;">
            <div style="background: white; border-radius: 10px; padding: 30px;">
                <h2 style="color: #1e3a8a; margin-bottom: 30px;">Stock Transfer</h2>
                
                <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #1e3a8a; margin-top: 0;">Step 1: Select Source Location</h3>
                    <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <option>Warehouse A - Main Storage</option>
                        <option>Warehouse B - Secondary Storage</option>
                    </select>
                </div>
                
                <div style="background: #dcfce7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #16a34a; margin-top: 0;">Step 2: Select Destination Location</h3>
                    <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <option>Loading Bay 1</option>
                        <option>Quality Control Area</option>
                    </select>
                </div>
                
                <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #d97706; margin-top: 0;">Step 3: Scan Products to Transfer</h3>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" placeholder="Scan or enter pallet number" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <button style="padding: 10px 20px; background-color: #f59e0b; color: white; border: none; border-radius: 6px;">Add</button>
                    </div>
                </div>
                
                <button style="width: 100%; padding: 12px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: bold;">
                    Complete Transfer
                </button>
            </div>
        </div>
        <div class="caption">Figure 9: Stock Transfer Form</div>
    </div>
    
    <div class="info">
        Stock transfers are tracked in real-time. The system automatically updates inventory levels at both source and destination locations.
    </div>
</div>

<div class="section" id="order-loading">
    <h2>7. Order Loading</h2>
    
    <h3>7.1 Loading Process</h3>
    
    <div class="screenshot">
        <div style="background: #f3f4f6; padding: 30px;">
            <div style="background: white; border-radius: 10px; padding: 30px;">
                <h2 style="color: #1e3a8a; margin-bottom: 30px;">Order Loading</h2>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
                    <div style="background: #f0f9ff; border-radius: 8px; padding: 20px;">
                        <h3 style="color: #1e3a8a; margin-top: 0;">Order Information</h3>
                        <p><strong>Order #:</strong> ORD-2024-1215</p>
                        <p><strong>Customer:</strong> ABC Construction Ltd.</p>
                        <p><strong>Status:</strong> <span style="background: #fbbf24; padding: 2px 8px; border-radius: 4px;">Pending</span></p>
                    </div>
                    <div style="background: #f0fdf4; border-radius: 8px; padding: 20px;">
                        <h3 style="color: #16a34a; margin-top: 0;">Loading Progress</h3>
                        <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
                            <div style="background: #10b981; width: 60%; height: 100%;"></div>
                        </div>
                        <p style="text-align: center; margin-top: 10px;">12 of 20 items loaded</p>
                    </div>
                </div>
                
                <table style="width: 100%; margin-bottom: 25px;">
                    <thead>
                        <tr>
                            <th>Product Code</th>
                            <th>Description</th>
                            <th style="text-align: center;">Ordered</th>
                            <th style="text-align: center;">Loaded</th>
                            <th style="text-align: center;">Remaining</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>SL-001</td>
                            <td>Slate Tile 600x300</td>
                            <td style="text-align: center;">100</td>
                            <td style="text-align: center;">60</td>
                            <td style="text-align: center;">40</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="display: flex; gap: 10px;">
                    <input type="text" placeholder="Scan pallet to load" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    <button style="padding: 10px 20px; background-color: #10b981; color: white; border: none; border-radius: 6px;">Load Pallet</button>
                </div>
            </div>
        </div>
        <div class="caption">Figure 10: Order Loading Interface</div>
    </div>
    
    <h3>7.2 ACO Order Processing</h3>
    
    <div class="warning">
        ACO (Approved Customer Orders) require special handling. Ensure all documentation is complete before processing.
    </div>
    
    <table>
        <tr>
            <th>Order Type</th>
            <th>Processing Time</th>
            <th>Special Requirements</th>
        </tr>
        <tr>
            <td>Standard Order</td>
            <td>Same day</td>
            <td>None</td>
        </tr>
        <tr>
            <td>ACO Order</td>
            <td>24-48 hours</td>
            <td>Customer approval required</td>
        </tr>
        <tr>
            <td>Express Order</td>
            <td>4 hours</td>
            <td>Priority loading</td>
        </tr>
    </table>
</div>

<div class="section" id="void-pallet">
    <h2>8. Void Pallet</h2>
    
    <h3>8.1 Voiding Process</h3>
    
    <div class="screenshot">
        <div style="background: #fee2e2; padding: 30px;">
            <div style="background: white; border-radius: 10px; padding: 30px;">
                <h2 style="color: #dc2626; margin-bottom: 30px;">  Void Pallet</h2>
                
                <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <p style="color: #dc2626; margin: 0;"><strong>Warning:</strong> Voiding a pallet is irreversible. Please ensure this action is necessary.</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Pallet Number *</label>
                    <input type="text" placeholder="Enter pallet number to void" style="width: 100%; padding: 10px; border: 2px solid #fecaca; border-radius: 6px;">
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Reason for Voiding *</label>
                    <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <option>Damaged goods</option>
                        <option>Quality issues</option>
                        <option>Incorrect labeling</option>
                        <option>Customer rejection</option>
                        <option>Other</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Additional Notes</label>
                    <textarea style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; height: 80px;" placeholder="Provide detailed reason..."></textarea>
                </div>
                
                <button style="width: 100%; padding: 12px; background-color: #dc2626; color: white; border: none; border-radius: 6px; font-weight: bold;">
                    Confirm Void Pallet
                </button>
            </div>
        </div>
        <div class="caption">Figure 11: Void Pallet Form</div>
    </div>
    
    <div class="step">
        <span class="step-number">1</span>
        Enter or scan the pallet number to be voided
    </div>
    
    <div class="step">
        <span class="step-number">2</span>
        Select the reason for voiding from the dropdown
    </div>
    
    <div class="step">
        <span class="step-number">3</span>
        Provide additional details in the notes field
    </div>
    
    <div class="step">
        <span class="step-number">4</span>
        Confirm the void action (this cannot be undone)
    </div>
</div>

<div class="section" id="reports">
    <h2>9. Reports & Analytics</h2>
    
    <h3>9.1 Available Reports</h3>
    
    <div class="feature-grid">
        <div class="feature-card">
            <h4>=Ê Stock Count Report</h4>
            <p>Daily variance analysis and counting progress</p>
        </div>
        <div class="feature-card">
            <h4>=È Inventory Movement</h4>
            <p>Track all stock transfers and movements</p>
        </div>
        <div class="feature-card">
            <h4>=Ë Order Fulfillment</h4>
            <p>Monitor order loading and completion rates</p>
        </div>
        <div class="feature-card">
            <h4><÷ Label History</h4>
            <p>View all printed labels and their status</p>
        </div>
    </div>
    
    <h3>9.2 Generating Reports</h3>
    
    <div class="info">
        All reports can be exported to CSV format for further analysis in Excel or other spreadsheet applications.
    </div>
</div>

<div class="section" id="admin-functions">
    <h2>10. Admin Functions</h2>
    
    <h3>10.1 Admin Panel Access</h3>
    
    <div class="screenshot">
        <div style="background: #1a1a1a; padding: 30px;">
            <div style="background: #2a2a2a; border-radius: 10px; padding: 30px;">
                <h2 style="color: white; text-align: center; margin-bottom: 30px;">Admin Panel</h2>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div style="background: #3a3a3a; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #3b82f6; margin-top: 0;">= Ask Database</h3>
                        <p style="color: #94a3b8;">Query system data using natural language</p>
                    </div>
                    <div style="background: #3a3a3a; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #10b981; margin-top: 0;">=ä Upload Files</h3>
                        <p style="color: #94a3b8;">Import orders and product data</p>
                    </div>
                    <div style="background: #3a3a3a; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #f59e0b; margin-top: 0;">= Product Update</h3>
                        <p style="color: #94a3b8;">Manage product information</p>
                    </div>
                    <div style="background: #3a3a3a; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #ef4444; margin-top: 0;">=Ê View History</h3>
                        <p style="color: #94a3b8;">Access system audit logs</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="caption">Figure 12: Admin Panel</div>
    </div>
    
    <h3>10.2 User Management</h3>
    
    <table>
        <tr>
            <th>Role</th>
            <th>Access Level</th>
            <th>Permissions</th>
        </tr>
        <tr>
            <td>Warehouse Operator</td>
            <td>Basic</td>
            <td>Label printing, stock counting, transfers</td>
        </tr>
        <tr>
            <td>Supervisor</td>
            <td>Advanced</td>
            <td>All basic functions + void pallet, reports</td>
        </tr>
        <tr>
            <td>Administrator</td>
            <td>Full</td>
            <td>All functions + admin panel, user management</td>
        </tr>
    </table>
    
    <div class="success">
        Regular training sessions are conducted for all staff to ensure proper system usage and compliance with SOPs.
    </div>
</div>

<div class="section">
    <h2>System Support</h2>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
        <h3>Need Help?</h3>
        <p>For technical support or questions about these procedures, please contact:</p>
        <p><strong>IT Support:</strong> support@warehouse.com | ext. 1234</p>
        <p><strong>System Administrator:</strong> admin@warehouse.com | ext. 5678</p>
    </div>
</div>

</body>
</html>