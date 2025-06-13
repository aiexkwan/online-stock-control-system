# Warehouse Management System (WMS) Standard Operating Procedures

## Table of Contents
1. [System Overview](#system-overview)
2. [User Login Procedures](#user-login-procedures)
3. [Quality Control Label Printing](#quality-control-label-printing)
4. [Goods Receipt Label Printing](#goods-receipt-label-printing)
5. [Stock Transfer Operations](#stock-transfer-operations)
6. [Pallet Void Procedures](#pallet-void-procedures)
7. [Stock Take Operations](#stock-take-operations)
8. [Admin Panel Operations](#admin-panel-operations)
9. [Report Generation and Export](#report-generation-and-export)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose
This Warehouse Management System is specifically designed for Pennine Manufacturing Industries, providing a comprehensive warehouse operations management solution.

### Key Features
- Real-time inventory tracking and management
- Pallet management with automatic numbering
- Quality control and goods receipt label printing
- Intelligent stock transfer system
- Complete audit trail
- Multi-format report generation

### System Architecture
- **User Interface**: Modern responsive design supporting various devices
- **Real-time Updates**: All data synchronized instantly
- **Security**: Multi-level access control

---

## User Login Procedures

### Step-by-Step Instructions

1. **Access the System**
   - Open web browser
   - Enter system URL
   - System automatically redirects to login page

2. **Enter Credentials**
   - Email Address: Use company email (format: employee-number@pennineindustries.com)
   - Password: Enter personal password
   - Click "Login" button

3. **First-time Login**
   - New users must register first
   - Register using company email
   - Set password meeting requirements
   - Complete email verification

4. **Successful Login**
   - System redirects to home page
   - Personalized dashboard displays
   - Begin operations

### Important Notes
- Password must contain uppercase, lowercase, numbers, and special characters
- Account temporarily locks after 5 consecutive failed attempts
- Use "Forgot Password" function to reset if needed

---

## Quality Control Label Printing

### Application Scenarios
- Quality marking after product completion
- New batch product identification
- Special order tracking labels

### Operation Process

#### 1. Access Label Printing Module
- Select "Print Label" from main menu
- System displays label printing form

#### 2. Product Information Entry
- **Product Code**: Enter or scan product code
- **Quantity**: Enter batch quantity
- **Count**: Enter packaging count
- System automatically displays product details

#### 3. Special Product Handling

**Order Products**
- System automatically identifies order products
- Select corresponding order reference
- Confirm order quantity

**Slate Products**
- Enter batch number
- Fill special specification information

**Regular Products**
- Fill basic information directly
- Confirm product description accuracy

#### 4. Confirmation and Printing
- Enter operator clock number
- Verify all information correct
- Click "Generate Labels"
- System generates PDF and saves
- Automatically sends to printer

### Label Format
- Contains barcode/QR code
- Displays pallet number (format: date-sequence)
- Product information and quantity
- Production date and operator

---

## Goods Receipt Label Printing

### Application Scenarios
- Raw material arrival
- Supplier deliveries
- Purchased product warehousing

### Operation Process

#### 1. Access GRN Label Module
- Select "Print GRN Label" function
- Enter GRN label form

#### 2. Receipt Information Registration
- **GRN Reference**: Enter receipt number
- **Supplier Code**: Enter or select supplier
- **Material Code**: Enter material number
- System validates code validity

#### 3. Weight Information Entry
- **Package Type**: Select pallet or package
- **Gross Weight**: Enter each package gross weight
- **Net Weight**: System calculates automatically
- Supports up to 22 pallets

#### 4. Generation and Printing
- Confirm all information
- Click "Generate Labels"
- Print GRN labels
- Update inventory records

### Weight Calculation Rules
- Pallets: Gross weight minus standard pallet weight
- Packages: Gross weight equals net weight
- Automatic total weight accumulation

---

## Stock Transfer Operations

### Application Scenarios
- Production line supply
- Location adjustment
- Order preparation

### Transfer Rules

1. **Standard Process**
   - First move: Await ’ Injection
   - Second move: Injection ’ Fold
   - Subsequent: Injection ÷ Fold

2. **Special Cases**
   - Other areas ’ Injection
   - Damage area requires special handling

### Operating Steps

#### 1. Pallet Query
- Scan pallet barcode
- Or manually enter pallet/series number
- System displays current location

#### 2. Confirm Transfer
- System automatically calculates target location
- Displays suggested transfer path
- Confirm target location correct

#### 3. Execute Transfer
- Enter operator clock number
- Click "Confirm Transfer"
- System updates inventory location
- Records transfer history

### Important Notes
- Ensure physical movement synchronizes with system
- Special areas require supervisor approval
- Maintain complete transfer records

---

## Pallet Void Procedures

### Application Scenarios
- Product damage
- Label errors
- Quantity errors
- Quality issues

### Operation Process

#### 1. Access Void Function
- Select "Void Pallet"
- Enter pallet number
- System displays pallet information

#### 2. Select Void Reason
- Damage
- Error
- Wrong Product
- Lost
- Other (requires explanation)

#### 3. Fill Details
- **Damage Quantity**: If partially damaged
- **Detailed Description**: Describe specific situation
- **Reprint Required**: Select Yes/No

#### 4. Confirm Void
- Enter operator clock number
- Confirm void operation
- System updates inventory
- Order quantity automatically restored

### Reprint Handling
- System prepares new label after selecting reprint
- Maintains original pallet number
- Corrects error information

---

## Stock Take Operations

### Stock Take Types

1. **Cycle Count**
   - Regular small-scale counts
   - High-turnover products priority
   - Zone-based execution

2. **Full Stock Take**
   - Annual/quarterly execution
   - All inventory counting
   - Suspend other operations

### Operating Steps

#### 1. Access Stock Take Module
- Select "Stock Take"
- Choose count type
- Set count scope

#### 2. Execute Count
- Print count list
- Physical quantity count
- Record actual quantities

#### 3. Variance Handling
- Enter count results
- System calculates variances
- Investigate variance causes
- Submit adjustment request

#### 4. Complete Count
- Supervisor reviews variances
- Confirm inventory adjustments
- Generate count report

---

## Admin Panel Operations

### Function Overview
Admin panel provides system management and data analysis functions, accessible only to authorized users.

### Main Functions

#### 1. Dashboard
- **Production Statistics**: Daily/weekly production data
- **Order Progress**: Real-time order status
- **Inventory Distribution**: Chart display
- **Quick Search**: Multi-criteria query

#### 2. System Tools

**File Upload**
- Upload order documents
- System automatic parsing
- Duplicate order detection

**History Query**
- Operation record query
- Time range filtering
- Export query results

**Product/Supplier Updates**
- Add product data
- Update supplier information
- Maintain master data

#### 3. Intelligent Query
- Natural language questions
- System intelligent parsing
- Returns formatted results
- Supports English/Chinese queries

### Operating Permissions
- General Users: View permissions
- Supervisors: Edit permissions
- Administrators: Full permissions

---

## Report Generation and Export

### Report Types

1. **Order Reports**
   - Order completion status
   - Product details
   - Delivery tracking

2. **Receipt Reports**
   - Supplier statistics
   - Material receipt records
   - Quality inspection results

3. **Inventory Reports**
   - Real-time stock levels
   - Stock age analysis
   - Turnover statistics

4. **Transaction Reports**
   - All movement records
   - Operator performance
   - Exception event tracking

### Generation Steps

#### 1. Select Report Type
- Access report center
- Select required report
- Set query criteria

#### 2. Set Parameters
- Time range
- Product/supplier filters
- Specific condition settings

#### 3. Generate and Export
- Preview report content
- Select export format (Excel/PDF)
- Download or email send

### Report Scheduling
- Set recurring reports
- Automatic send to designated personnel
- Exception alert notifications

---

## Troubleshooting

### Login Issues

**Issue: Cannot login to system**
- Check network connection
- Confirm email format correct
- Verify password case
- Clear browser cache

**Issue: Forgot password**
- Click "Forgot Password"
- Enter registered email
- Check reset email
- Set new password

### Printing Issues

**Issue: Labels won't print**
- Check printer connection
- Confirm printer status
- Regenerate PDF
- Contact IT support

**Issue: Barcode won't scan**
- Clean scanner lens
- Adjust scan distance
- Check barcode quality
- Enter number manually

### Data Issues

**Issue: Inventory quantity mismatch**
- Execute immediate count
- Check recent transactions
- Investigate variance causes
- Submit adjustment request

**Issue: Cannot find product**
- Confirm product code
- Use fuzzy search
- Check product status
- Contact supervisor for confirmation

### System Issues

**Issue: System running slowly**
- Check network speed
- Clear browser cache
- Avoid peak hours
- Report to IT department

**Issue: Function unavailable**
- Confirm user permissions
- Check browser version
- Try logging in again
- Contact system administrator

---

## Best Practice Recommendations

### Daily Operations
1. Check pending tasks daily
2. Update stock movements promptly
3. Maintain label printing records
4. Regular backup of important data

### Data Accuracy
1. Scanning preferred over manual entry
2. Correct errors immediately
3. Keep physical and system synchronized
4. Execute regular counts

### Security Standards
1. Don't share login information
2. Change passwords regularly
3. Confirm complete logout
4. Report unusual activities

### Efficiency Enhancement
1. Use keyboard shortcuts
2. Batch process similar tasks
3. Utilize search functions
4. Set common report templates

---

## Contact Support

### Technical Support
- System issues: Contact IT department
- Operation queries: Contact direct supervisor
- Emergencies: Call support hotline

### Problem Reporting
- Describe problem symptoms in detail
- Provide error screenshots
- Explain operation steps
- Record occurrence time

### Improvement Suggestions
- Collect user feedback
- Propose optimization suggestions
- Participate in system evaluation
- Continuous process improvement

---

*This Standard Operating Procedure will be regularly revised according to system updates and business requirements*

*Last Updated: January 2025*