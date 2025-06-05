# Pennine Manufacturing Stock Control System

### Overview
A comprehensive stock control and management system built with Next.js 14, TypeScript, and Supabase. This system provides real-time inventory tracking, pallet management, label printing, AI-powered order analysis, and administrative tools for Pennine Manufacturing Industries.

### Key Features

#### **QC Label Printing System**
- **Multi-Product Support**: Regular products, ACO orders, and Slate products
- **Automated Processing**: Pallet number and series generation
- **PDF Generation**: High-quality label output with automatic storage
- **Batch Processing**: Multiple pallet label generation with progress tracking
- **Error Handling**: Comprehensive error management and recovery

#### **GRN Label Printing System**
- **Material Receipt Management**: Complete GRN workflow
- **Weight Calculation**: Automatic net weight calculation (up to 22 pallets)
- **Supplier Validation**: Real-time supplier code verification
- **Atomic Operations**: Database consistency with RPC functions
- **Professional Labels**: Industrial-grade receipt labels

#### **Stock Transfer System**
- **Automated Transfers**: One-click pallet movement
- **Smart Location Calculation**: Predefined business rules
- **QR Code Support**: Barcode scanning integration
- **Real-time Updates**: Instant inventory adjustments
- **Transfer History**: Complete audit trail

#### **Admin Panel & Dashboard**
- **Real-time Statistics**: Daily, weekly production metrics
- **ACO Order Tracking**: Order progress monitoring
- **Quick Inventory Search**: Instant stock level queries
- **Report Generation**: ACO, GRN, Transaction, Slate reports
- **Data Export**: Comprehensive database export tools

#### **AI-Powered Features**
- **PDF Order Analysis**: Automatic order data extraction
- **Duplicate Detection**: Smart duplicate record checking
- **Natural Language Queries**: AI database querying
- **Document Processing**: Intelligent PDF content analysis

#### **System Tools**
- **File Upload**: PDF document processing
- **Pallet Voiding**: Advanced cancellation with reprint options
- **History Tracking**: Complete operation timeline
- **Database Updates**: Product master data management
- **User Management**: Role-based access control

### 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, Glassmorphism design
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **AI Integration**: OpenAI GPT-4o for document analysis
- **PDF Processing**: pdf2pic, GraphicsMagick, Ghostscript
- **UI Components**: Radix UI, Heroicons
- **State Management**: React Hooks, Custom business logic hooks
- **Authentication**: Supabase Auth with role-based permissions

### Project Structure

```
NewPennine/
├── app/
│   ├── print-label/            # QC label printing system
│   ├── print-grnlabel/         # GRN label printing
│   ├── stock-transfer/         # Automated stock movement
│   ├── admin/                  # Comprehensive admin panel
│   ├── components/             # Shared components
│   │   ├── qc-label-form/      # QC label components
│   │   ├── admin-panel-menu/   # Admin dialog components
│   │   └── print-label-pdf/    # PDF generation components
│   ├── api/                    # API endpoints
│   │   ├── analyze-order-pdf/  # AI PDF analysis
│   │   ├── export-report/      # Report generation
│   │   └── print-label-pdf/    # Label PDF generation
│   └── hooks/                  # Business logic hooks
├── components/
│   ├── ui/                     # UI component library
│   ├── qr-scanner/            # QR code scanning
│   └── products/              # Product management
├── docs/                      # Comprehensive documentation
├── lib/                       # Utility libraries
└── public/                    # Static assets
```

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NewPennine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install system dependencies**
   ```bash
   # macOS
   brew install graphicsmagick ghostscript
   
   # Ubuntu/Debian
   sudo apt-get install graphicsmagick ghostscript
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Configure your credentials:
   # - Supabase URL and Service Role Key
   # - OpenAI API Key for PDF analysis
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Authentication & Security

- **Supabase Authentication**: Secure user login with email/password
- **Role-based Access**: Multiple permission levels (Admin, QC, Receive, etc.)
- **Session Management**: Automatic session handling and cleanup
- **Route Protection**: Middleware-based route protection
- **Operation Logging**: Complete audit trail for all actions

### Database Schema

The system uses PostgreSQL through Supabase with the following main tables:
- `record_palletinfo`: Pallet information and tracking
- `record_history`: Complete audit trail of all operations
- `record_transfer`: Stock movement records
- `record_inventory`: Real-time inventory levels by location
- `record_aco`: ACO order management and tracking
- `record_grn`: GRN receipt records with weight information
- `data_code`: Product catalog and specifications
- `data_supplier`: Supplier information and validation
- `data_id`: User management and permissions
- `data_order`: AI-extracted order data

### AI Features

#### **PDF Order Analysis**
- **Document Processing**: Automatic PDF to image conversion
- **AI Vision Analysis**: OpenAI GPT-4o for data extraction
- **Smart Parsing**: Intelligent order information recognition
- **Duplicate Prevention**: Automatic duplicate record detection
- **Data Validation**: Comprehensive data integrity checks

#### **Ask Me Anything - Intelligent Database Queries**
- **Natural Language Queries**: Support for Chinese and English natural language questions
- **OpenAI SQL Generation**: Uses GPT-4o with docs/openAIprompt instructions to generate precise SQL queries
- **Intelligent Answer Generation**: OpenAI analyzes query results and generates professional British-style responses
- **Conversation Memory**: Supports contextual conversations, remembering previous query history
- **Secure Execution**: All SQL queries are security-validated, allowing only SELECT operations
- **Real-time Caching**: Intelligent caching mechanism improves query response speed
- **Token Tracking**: Complete OpenAI API usage monitoring

### Recent Updates

#### **AI Integration**
- Implemented OpenAI GPT-4o for PDF document analysis
- Added intelligent order data extraction
- Smart duplicate detection and prevention
- Automated data insertion with validation

#### **System Optimization**
- Enhanced PDF processing pipeline
- Improved error handling and recovery
- Optimized database operations
- Better user experience with progress tracking

#### **Security Enhancements**
- Strengthened authentication system
- Improved session management
- Enhanced data validation
- Better error logging and monitoring

### 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:
- [QC Label Printing](./docs/print_QC_Label.md)
- [GRN Label Printing](./docs/print_GRN_Label.md)
- [Stock Transfer System](./docs/stock_transfer.md)
- [Admin Panel Guide](./docs/admin_panel.md)
- [User Manual](./docs/userManual.md)
- [Database Structure](./docs/databaseStructure.md)

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### License

This project is proprietary software developed for Pennine Manufacturing Industries.

## System Requirements

- Node.js 18+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for Supabase integration

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all environment variables are properly configured
2. **Authentication Issues**: Check Supabase configuration and user permissions
3. **Database Connection**: Verify Supabase URL and API keys
4. **Performance Issues**: Check browser console for errors and network requests

### Getting Help

- Check the documentation in the `/docs` folder
- Review the project structure and component organization
- Ensure all dependencies are up to date
- Verify environment configuration

## Performance Features

- **Optimized Rendering**: React.memo and useMemo for efficient re-renders
- **Code Splitting**: Lazy loading for better initial load times
- **Responsive Design**: Mobile-first approach with desktop enhancements
- **Real-time Updates**: Supabase real-time subscriptions for live data
- **Error Boundaries**: Graceful error handling and recovery

## Development Tools

- **TypeScript**: Full type safety and better developer experience
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions 