# Pennine Industries Stock Control System

A comprehensive stock control and management system built with Next.js 14, TypeScript, and Supabase. This system provides real-time inventory tracking, pallet management, label printing, and administrative tools for Pennine Industries.

## 🚀 Key Features

### **Home Dashboard**
- Real-time inventory overview with interactive charts
- History log with enhanced display (25% larger viewing area)
- User-friendly interface with improved navigation

### **Label Printing System**
- **QC Label Printing**: Support for regular products, ACO orders, and Slate products
- **GRN Label Printing**: Material receipt label generation
- **PDF Generation**: High-quality label output with barcode support
- **Batch Processing**: Multiple pallet label generation

### **Stock Management**
- **Stock Transfer**: Location-based inventory movement
- **Inventory Tracking**: Real-time stock levels across multiple locations
- **Void Pallet**: Pallet cancellation and management
- **History Tracking**: Complete audit trail of all operations

### **Admin Panel**
- **Dual Header Design**: Global navigation + dedicated admin navigation
- **Transparent Navigation**: Seamless integration with page content
- **Hover-based Interactions**: Intuitive dropdown menus without clicking
- **Dashboard Analytics**: Real-time statistics and performance metrics
- **User Management**: Role-based access control
- **Report Generation**: ACO, GRN, Transaction, and Slate reports

### **Enhanced UI/UX**
- **50% Larger GlobalHeader**: Improved readability and accessibility
- **Hover-based Navigation**: Floating dropdown menus for better UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark Theme**: Professional appearance with consistent styling

## 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **PDF Generation**: React-PDF, jsPDF
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: React Hooks, Context API
- **Authentication**: Supabase Auth with role-based access

## 📁 Project Structure

```
online-stock-control-system/
├── app/
│   ├── home/                    # Main dashboard (formerly /dashboard/access)
│   ├── admin/                   # Admin panel with dual header design
│   ├── print-label/            # QC label printing system
│   ├── print-grnlabel/         # GRN label printing
│   ├── stock-transfer/         # Stock movement management
│   ├── void-pallet/            # Pallet cancellation
│   ├── users/                  # User management
│   ├── products/               # Product catalog
│   ├── tables/                 # Database structure viewer
│   └── components/             # Shared components
├── components/
│   ├── ui/                     # UI component library
│   ├── GlobalHeader.tsx        # Enhanced global navigation
│   └── products/               # Product-related components
├── docs/                       # Comprehensive documentation
├── lib/                        # Utility libraries
└── public/                     # Static assets
```

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd online-stock-control-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Configure your Supabase credentials
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🔐 Authentication & Security

- **Supabase Authentication**: Secure user login with email/password
- **Role-based Access**: Different permission levels (Admin, QC, Receive, etc.)
- **Session Management**: Automatic session handling and cleanup
- **Route Protection**: Middleware-based route protection

## 📊 Database Schema

The system uses PostgreSQL through Supabase with the following main tables:
- `record_palletinfo`: Pallet information and tracking
- `record_history`: Complete audit trail
- `record_transfer`: Stock movement records
- `record_inventory`: Real-time inventory levels
- `data_id`: User management and permissions
- `data_code`: Product catalog and specifications

## 🚀 Recent Updates (v4.0.0)

### **Path Restructuring**
- Renamed `/dashboard/access` to `/home` for better user understanding
- Updated all navigation and authentication checks
- Maintained backward compatibility with redirects

### **GlobalHeader Enhancements**
- Increased height by 50% (`h-16` → `h-24`) for better visibility
- Implemented hover-based hamburger menu (no clicking required)
- Improved text sizing and icon scaling
- Removed complex sidebar animations for simpler dropdown menus

### **Admin Panel Improvements**
- Removed "Admin Panel" title and icon for cleaner design
- Transparent background navigation bar
- Seamless integration with GlobalHeader
- Hover-based sub-menu interactions

### **Home Page UI Improvements**
- History Log height increased by 25% for more data visibility
- Enhanced scrolling and pagination functionality
- Better information density

## 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:
- [Dashboard Documentation](./docs/dashboard.md)
- [Admin Panel Guide](./docs/adminPanel.md)
- [Global Layout System](./docs/globalLayout.md)
- [Project Details](./docs/projectDetail.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for Pennine Manufacturing.

## 🔍 System Requirements

- Node.js 18+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for Supabase integration

## 🚨 Troubleshooting

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

## 🎯 Performance Features

- **Optimized Rendering**: React.memo and useMemo for efficient re-renders
- **Code Splitting**: Lazy loading for better initial load times
- **Responsive Design**: Mobile-first approach with desktop enhancements
- **Real-time Updates**: Supabase real-time subscriptions for live data
- **Error Boundaries**: Graceful error handling and recovery

## 🔧 Development Tools

- **TypeScript**: Full type safety and better developer experience
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions 