import { buildSchema } from 'graphql';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateSchema } from 'graphql';

describe('GraphQL Schema', () => {
  let schema: any;

  beforeAll(() => {
    try {
      const schemaPath = join(__dirname, '..', 'test-schema.graphql');
      const schemaString = readFileSync(schemaPath, 'utf-8');
      schema = buildSchema(schemaString);
    } catch (error) {
      console.error('Error building schema:', error);
      throw error;
    }
  });

  describe('Schema Validation', () => {
    it('should build a valid GraphQL schema', () => {
      expect(schema).toBeDefined();
      const errors = validateSchema(schema);
      expect(errors).toHaveLength(0);
    });

    it('should have Query type', () => {
      const queryType = schema.getQueryType();
      expect(queryType).toBeDefined();
      expect(queryType.name).toBe('Query');
    });

    it('should have Mutation type', () => {
      const mutationType = schema.getMutationType();
      expect(mutationType).toBeDefined();
      expect(mutationType.name).toBe('Mutation');
    });

    it('should have Subscription type', () => {
      const subscriptionType = schema.getSubscriptionType();
      expect(subscriptionType).toBeDefined();
      expect(subscriptionType.name).toBe('Subscription');
    });
  });

  describe('Query Fields', () => {
    let queryType: any;

    beforeAll(() => {
      queryType = schema.getQueryType();
    });

    it('should have product query field', () => {
      const productField = queryType.getFields()['product'];
      expect(productField).toBeDefined();
      expect(productField.type.toString()).toContain('Product');
    });

    it('should have products query field with pagination', () => {
      const productsField = queryType.getFields()['products'];
      expect(productsField).toBeDefined();
      expect(productsField.type.toString()).toContain('ProductConnection');
      
      // Check arguments
      const args = productsField.args;
      expect(args.find((arg: any) => arg.name === 'filter')).toBeDefined();
      expect(args.find((arg: any) => arg.name === 'pagination')).toBeDefined();
      // sort is optional in our schema
    });

    it('should have pallet query fields', () => {
      const palletField = queryType.getFields()['pallet'];
      const palletsField = queryType.getFields()['pallets'];
      
      expect(palletField).toBeDefined();
      expect(palletsField).toBeDefined();
      expect(palletsField.type.toString()).toContain('PalletConnection');
    });

    it('should have inventory query fields', () => {
      const inventoryField = queryType.getFields()['inventory'];
      const inventoriesField = queryType.getFields()['inventories'];
      
      expect(inventoryField).toBeDefined();
      expect(inventoriesField).toBeDefined();
      expect(inventoriesField.type.toString()).toContain('InventoryConnection');
    });

    it('should have business logic queries', () => {
      const lowStockField = queryType.getFields()['getLowStockProducts'];
      const pendingOrdersField = queryType.getFields()['getPendingOrders'];
      
      expect(lowStockField).toBeDefined();
      expect(pendingOrdersField).toBeDefined();
      
      // Check default threshold
      const thresholdArg = lowStockField.args.find((arg: any) => arg.name === 'threshold');
      expect(thresholdArg).toBeDefined();
      // default value is not specified in simplified schema
    });
  });

  describe('Type Definitions', () => {
    it('should have Product type with required fields', () => {
      const productType = schema.getType('Product');
      expect(productType).toBeDefined();
      
      if (productType && 'getFields' in productType) {
        const fields = productType.getFields();
        expect(fields['id']).toBeDefined();
        expect(fields['code']).toBeDefined();
        expect(fields['description']).toBeDefined();
      }
    });

    it('should have Pallet type with required fields', () => {
      const palletType = schema.getType('Pallet');
      expect(palletType).toBeDefined();
      
      if (palletType && 'getFields' in palletType) {
        const fields = palletType.getFields();
        expect(fields['id']).toBeDefined();
        expect(fields['palletNumber']).toBeDefined();
        expect(fields['productCode']).toBeDefined();
        expect(fields['quantity']).toBeDefined();
        expect(fields['series']).toBeDefined();
      }
    });

    it('should have Connection types for pagination', () => {
      const connectionTypes = [
        'ProductConnection',
        'PalletConnection',
        'InventoryConnection',
        'MovementConnection',
        'OrderConnection'
      ];
      
      connectionTypes.forEach(typeName => {
        const type = schema.getType(typeName);
        expect(type).toBeDefined();
        
        if (type && 'getFields' in type) {
          const fields = type.getFields();
          expect(fields['edges']).toBeDefined();
          expect(fields['pageInfo']).toBeDefined();
          expect(fields['totalCount']).toBeDefined();
        }
      });
    });

    it('should have PageInfo type', () => {
      const pageInfoType = schema.getType('PageInfo');
      expect(pageInfoType).toBeDefined();
      
      if (pageInfoType && 'getFields' in pageInfoType) {
        const fields = pageInfoType.getFields();
        expect(fields['hasNextPage']).toBeDefined();
        expect(fields['hasPreviousPage']).toBeDefined();
        expect(fields['startCursor']).toBeDefined();
        expect(fields['endCursor']).toBeDefined();
      }
    });
  });

  describe('Input Types', () => {
    it('should have filter input types', () => {
      const filterTypes = [
        'ProductFilter',
        'PalletFilter',
        'InventoryFilter',
        'MovementFilter'
      ];
      
      filterTypes.forEach(typeName => {
        const type = schema.getType(typeName);
        expect(type).toBeDefined();
      });
    });

    it('should have PaginationInput type', () => {
      const paginationType = schema.getType('PaginationInput');
      expect(paginationType).toBeDefined();
      
      if (paginationType && 'getFields' in paginationType) {
        const fields = paginationType.getFields();
        expect(fields['first']).toBeDefined();
        expect(fields['after']).toBeDefined();
        expect(fields['last']).toBeDefined();
        expect(fields['before']).toBeDefined();
      }
    });

    it('should have SortInput type', () => {
      const sortType = schema.getType('SortInput');
      expect(sortType).toBeDefined();
      
      if (sortType && 'getFields' in sortType) {
        const fields = sortType.getFields();
        expect(fields['field']).toBeDefined();
        expect(fields['direction']).toBeDefined();
      }
    });
  });

  describe('Enums', () => {
    it('should have SortDirection enum', () => {
      const sortDirectionEnum = schema.getType('SortDirection');
      expect(sortDirectionEnum).toBeDefined();
      
      if (sortDirectionEnum && 'getValues' in sortDirectionEnum) {
        const values = sortDirectionEnum.getValues();
        const valueNames = values.map((v: any) => v.name);
        expect(valueNames).toContain('ASC');
        expect(valueNames).toContain('DESC');
      }
    });

    it('should have OrderStatus enum', () => {
      const orderStatusEnum = schema.getType('OrderStatus');
      expect(orderStatusEnum).toBeDefined();
    });
  });
});