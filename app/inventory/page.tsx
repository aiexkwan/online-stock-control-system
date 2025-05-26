'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  StockMovementLayout, 
  StatusMessage, 
  ActivityLog 
} from '../../components/ui/stock-movement-layout';
import { UnifiedSearch } from '../../components/ui/unified-search';
import { useStockMovement } from '../hooks/useStockMovement';
import { Package, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

type OperationType = 'receive' | 'issue' | 'transfer';

interface FormData {
  productId: number;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  notes: string;
}

export default function InventoryPage() {
  const {
    isLoading,
    products,
    activityLog,
    fetchProducts,
    executeInventoryOperation
  } = useStockMovement();

  const [operationType, setOperationType] = useState<OperationType>('receive');
  const [showHelp, setShowHelp] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    productId: 0,
    quantity: 1,
    fromLocation: '',
    toLocation: '',
    notes: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const operationSteps = {
    receive: [
      "Select receive operation type",
      "Search and select product",
      "Enter receive quantity and location",
      "Confirm receive information",
      "Complete receive operation"
    ],
    issue: [
      "Select issue operation type",
      "Search and select product",
      "Enter issue quantity (check stock)",
      "Confirm issue information",
      "Complete issue operation"
    ],
    transfer: [
      "Select transfer operation type",
      "Search and select product",
      "Set transfer target location",
      "Confirm transfer information",
      "Complete transfer operation"
    ]
  };

  const helpContent = (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-blue-400 mb-2">Operation Steps:</h4>
        <ol className="space-y-2">
          {operationSteps[operationType].map((step, index) => (
            <li
              key={index}
              className={`flex items-center space-x-3 ${
                index === currentStep
                  ? 'text-blue-400 font-semibold'
                  : index < currentStep
                  ? 'text-green-400'
                  : 'text-gray-400'
              }`}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                  index === currentStep
                    ? 'bg-blue-400 text-gray-900'
                    : index < currentStep
                    ? 'bg-green-400 text-gray-900'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  // Handle product selection
  const handleProductSelection = (result: any) => {
    if (result.data.type === 'product') {
      const product = result.data;
      setFormData(prev => ({
        ...prev,
        productId: product.id,
        fromLocation: product.location,
        toLocation: product.location
      }));
      setCurrentStep(2);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    
    // Basic validation
    if (!formData.productId) {
      setStatusMessage({ type: 'error', message: 'Please select a product' });
      return;
    }
    
    if (formData.quantity <= 0) {
      setStatusMessage({ type: 'error', message: 'Quantity must be greater than zero' });
      return;
    }
    
    if (operationType === 'issue' || operationType === 'transfer') {
      const selectedProduct = products.find(p => p.id === formData.productId);
      if (selectedProduct && formData.quantity > selectedProduct.quantity) {
        setStatusMessage({ type: 'error', message: 'Issue quantity cannot exceed current stock' });
        return;
      }
    }
    
    if (operationType === 'transfer' && formData.fromLocation === formData.toLocation) {
      setStatusMessage({ type: 'error', message: 'Transfer target location cannot be the same as current location' });
      return;
    }
    
    setCurrentStep(3);
    setShowConfirmModal(true);
  };
  
  // Confirm and execute inventory operation
  const confirmOperation = async () => {
      setShowConfirmModal(false);
    setCurrentStep(4);
    
    const success = await executeInventoryOperation(
      operationType,
      formData.productId,
      formData.quantity,
      formData.fromLocation,
      formData.toLocation,
      formData.notes
    );
      
    if (success) {
      setStatusMessage({
        type: 'success',
        message: `${getOperationName(operationType)} operation completed successfully`
      });
      
      // Reset form
      setFormData({
        productId: 0,
        quantity: 1,
        fromLocation: '',
        toLocation: '',
        notes: ''
      });
      setSearchTerm('');
      setCurrentStep(0);
    } else {
      setCurrentStep(3);
    }
  };

  const getOperationName = (type: OperationType) => {
    const names = { receive: 'Receive', issue: 'Issue', transfer: 'Transfer' };
    return names[type];
  };

  const getOperationIcon = (type: OperationType) => {
    const icons = {
      receive: ArrowDown,
      issue: ArrowUp,
      transfer: ArrowRight
    };
    return icons[type];
  };

  const getOperationColor = (type: OperationType) => {
    const colors = {
      receive: 'bg-green-600 hover:bg-green-700',
      issue: 'bg-red-600 hover:bg-red-700',
      transfer: 'bg-blue-600 hover:bg-blue-700'
    };
    return colors[type];
  };

  // Filter product list
  const filteredProducts = products.filter((product) => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <StockMovementLayout
      title="Inventory Operations"
      description="Manage product receive, issue and transfer operations"
      isLoading={isLoading}
      loadingText="Processing operation..."
      helpContent={helpContent}
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
    >
      {/* Status Messages */}
      {statusMessage && (
        <StatusMessage
          type={statusMessage.type}
          message={statusMessage.message}
          onDismiss={() => setStatusMessage(null)}
        />
      )}

      <div className="space-y-6">
        {/* Operation Area */}
        <div className="space-y-6">
          {/* Operation Type Selection */}
          <Card className="border-gray-600 bg-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-blue-400">Select Operation Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {(['receive', 'issue', 'transfer'] as OperationType[]).map((type) => {
                  const Icon = getOperationIcon(type);
                  return (
                    <Button
                      key={type}
                      onClick={() => {
                        setOperationType(type);
                        setCurrentStep(1);
                        setFormData(prev => ({ ...prev, productId: 0 }));
                      }}
                      variant={operationType === type ? 'default' : 'outline'}
                      className={`h-20 flex flex-col space-y-2 ${
                        operationType === type 
                          ? getOperationColor(type) + ' text-white' 
                          : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span>{getOperationName(type)}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
            
          {/* Product Search */}
          {currentStep >= 1 && (
            <Card className="border-gray-600 bg-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-blue-400">Select Product</CardTitle>
              </CardHeader>
              <CardContent>
                <UnifiedSearch
                  searchType="product"
                  placeholder="Search product name or SKU"
                  onSelect={handleProductSelection}
                  products={products}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  isLoading={isLoading}
                  disabled={isLoading}
                  enableQrScanner={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Operation Form */}
          {currentStep >= 2 && selectedProduct && (
            <Card className="border-blue-400 bg-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  {getOperationName(operationType)} Operation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selected Product Information */}
                  <div className="p-3 bg-gray-700 rounded-md border border-gray-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-300">Product Name:</span>
                        <span className="text-white ml-2">{selectedProduct.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-300">Product SKU:</span>
                        <span className="text-white ml-2">{selectedProduct.sku}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-300">Current Stock:</span>
                        <span className={`font-semibold ml-2 ${
                          selectedProduct.quantity <= 0 ? 'text-red-400' : 
                          selectedProduct.quantity <= 10 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {selectedProduct.quantity}
                        </span>
              </div>
              <div>
                        <span className="font-medium text-gray-300">Current Location:</span>
                        <span className="text-white ml-2">{selectedProduct.location}</span>
                      </div>
                    </div>
              </div>
              
                  {/* Quantity Input */}
              <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Quantity
                </label>
                    <Input
                  type="number"
                  min="1"
                      max={operationType === 'issue' ? selectedProduct.quantity : undefined}
                  value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, 
                        quantity: parseInt(e.target.value) || 0
                      }))}
                      className="w-full bg-gray-700 border-gray-600 text-white"
                  required
                />
                    {operationType === 'issue' && (
                      <p className="text-xs text-gray-400 mt-1">
                        Maximum issue quantity: {selectedProduct.quantity}
                      </p>
                    )}
              </div>
              
                  {/* Location Inputs */}
              {(operationType === 'issue' || operationType === 'transfer') && (
                <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Current Location
                  </label>
                      <Input
                    type="text"
                    value={formData.fromLocation}
                        onChange={(e) => setFormData(prev => ({
                          ...prev, 
                          fromLocation: e.target.value
                        }))}
                        className="w-full bg-gray-600 border-gray-600 text-gray-300"
                    readOnly
                  />
                </div>
              )}
              
              {(operationType === 'receive' || operationType === 'transfer') && (
                <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {operationType === 'receive' ? 'Receive Location' : 'Target Location'}
                  </label>
                      <Input
                    type="text"
                    value={formData.toLocation}
                        onChange={(e) => setFormData(prev => ({
                          ...prev, 
                          toLocation: e.target.value
                        }))}
                        className="w-full bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              )}
              
                  {/* Notes */}
              <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Notes
                </label>
                <textarea
                  value={formData.notes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, 
                        notes: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                  rows={3}
                      placeholder="Optional: Enter operation notes"
                />
              </div>
              
                  {/* Submit Button */}
                  <Button
                type="submit"
                    disabled={isLoading}
                    className={`w-full ${getOperationColor(operationType)} text-white`}
                  >
                    Confirm {getOperationName(operationType)}
                  </Button>
                </form>
              </CardContent>
            </Card>
                )}
          </div>
          
        {/* Product List and Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product List */}
          <Card className="border-gray-600 bg-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-blue-400">Stock List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 rounded-md border cursor-pointer hover:bg-gray-700 ${
                        product.id === formData.productId 
                          ? 'border-blue-400 bg-gray-700' 
                          : 'border-gray-600'
                      }`}
                      onClick={() => handleProductSelection({
                        data: { type: 'product', ...product }
                      })}
                    >
                      <div className="font-medium text-sm text-white">{product.name}</div>
                      <div className="text-xs text-gray-400">{product.sku}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs font-medium ${
                          product.quantity <= 0 ? 'text-red-400' : 
                          product.quantity <= 10 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          Stock: {product.quantity}
                        </span>
                        <span className="text-xs text-gray-400">{product.location}</span>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-center text-gray-400 py-4">No products found</p>
                  )}
            </div>
          </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <ActivityLog
            activities={activityLog}
            title="Operation Log"
            maxHeight="h-64"
          />
        </div>
      </div>
      
      {/* Confirm Operation Dialog */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md border-gray-600 bg-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-blue-400">Confirm Operation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                {operationType === 'receive' && 
                  `Are you sure you want to receive ${formData.quantity} units of ${selectedProduct.name} to location ${formData.toLocation}?`}
                {operationType === 'issue' && 
                  `Are you sure you want to issue ${formData.quantity} units of ${selectedProduct.name} from location ${formData.fromLocation}?`}
                {operationType === 'transfer' && 
                  `Are you sure you want to transfer ${selectedProduct.name} from location ${formData.fromLocation} to location ${formData.toLocation}?`}
            </p>
              
              {formData.notes && (
                <div className="p-2 bg-gray-700 rounded border border-gray-600">
                  <span className="text-sm font-medium text-gray-300">Notes:</span>
                  <span className="text-sm text-white ml-2">{formData.notes}</span>
                </div>
              )}
              
            <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setCurrentStep(2);
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                  Cancel
                </Button>
                <Button
                onClick={confirmOperation}
                  className={getOperationColor(operationType) + ' text-white'}
              >
                  Confirm
                </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}
    </StockMovementLayout>
  );
} 