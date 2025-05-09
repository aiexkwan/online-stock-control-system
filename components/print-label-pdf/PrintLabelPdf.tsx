import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';

export interface PrintLabelPdfProps {
  productCode: string;
  description: string;
  quantity: string | number;
  date: string;
  operatorClockNum: string;
  qcClockNum: string;
  workOrderNumber: string;
  palletNum: string;
  qrValue?: string;
}

const LOGO_URL =
  'https://bbmkuiplnzvpudszrend.supabase.co/storage/v1/object/public/web-ui/P_Logo_DB.PNG';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    padding: 0,
    width: '210mm',
    height: '297mm',
    flexDirection: 'column',
    alignItems: 'center',
  },
  label: {
    width: '210mm',
    height: '145mm',
    padding: 14,
    boxSizing: 'border-box',
    position: 'relative',
  },
  logo: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 90,
    height: 24,
  },
  qrCode: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 60,
    height: 60,
  },
  centerText: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 2,
  },
  line1: {
    marginTop: 18,
    marginBottom: 2,
    textDecoration: 'underline',
  },
  line2: {
    marginBottom: 6,
    fontSize: 24,
    fontWeight: 'bold',
  },
  line3: {
    marginBottom: 18,
    textDecoration: 'underline',
  },
  line4: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  mainTable: {
    width: '100%',
    marginTop: 10,
  },
  mainTableRow: {
    flexDirection: 'row',
  },
  mainTableHeaderFirst: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  mainTableHeader: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  mainTableHeaderLast: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  mainTableCellFirst: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  mainTableCell: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  mainTableCellLast: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  workOrderTable: {
    width: '100%',
    marginTop: 6,
    marginBottom: 4,
    flexDirection: 'row',
  },
  workOrderLabel: {
    padding: 4,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  workOrderValue: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  palletNum: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    fontWeight: 'bold',
    fontSize: 12,
  },
  dashedLine: {
    width: '100%',
    marginVertical: 8,
    height: 1,
    backgroundColor: '#ccc',
  },
});

function LabelBlock({
  productCode,
  description,
  quantity,
  date,
  operatorClockNum,
  qcClockNum,
  workOrderNumber,
  palletNum,
  qrValue,
}: PrintLabelPdfProps) {
  return (
    <View style={styles.label}>
      {/* Logo */}
      <Image src={LOGO_URL} style={{ position: 'absolute', top: 14, left: 14, width: 180, height: 48 }} />
      {/* QR Code */}
      <Image src={`https://api.qrserver.com/v1/create-qr-code/?data=${qrValue || productCode}&size=150x150`} style={{ position: 'absolute', top: 14, right: 14, width: 140, height: 140 }} />
      {/* Product Code 標題 */}
      <Text style={{ textAlign: 'center', fontSize: 16, marginTop: 30, marginBottom: 10, textDecoration: 'underline' }}>Product Code</Text>
      {/* Product Code 內容 */}
      <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginBottom: 18 }}>{productCode}</Text>
      {/* Description 標題 */}
      <Text style={{ textAlign: 'center', fontSize: 16, marginBottom: 10, textDecoration: 'underline' }}>Description</Text>
      {/* Description 內容 */}
      <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 40 }}>{description}</Text>
      {/* Main Table */}
      <View style={styles.mainTable}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0' }}>
          <View style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: '100%' }}>Quantity</Text>
          </View>
          <View style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: '100%' }}>Date</Text>
          </View>
          <View style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: '100%' }}>Operator Clock Num</Text>
          </View>
          <View style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: '100%' }}>Q.C. Clock Num</Text>
          </View>
        </View>
        {/* Data Row */}
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, textAlign: 'center', width: '100%' }}>{quantity}</Text>
          </View>
          <View style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, textAlign: 'center', width: '100%' }}>{date}</Text>
          </View>
          <View style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, textAlign: 'center', width: '100%' }}>{operatorClockNum}</Text>
          </View>
          <View style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, textAlign: 'center', width: '100%' }}>{qcClockNum}</Text>
          </View>
        </View>
      </View>
      {/* Work Order Table - 兩個儲存格 */}
      <View style={styles.workOrderTable}>
        <View style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 24, textAlign: 'center', width: '100%' }}>Work Order Number</Text>
        </View>
        <View style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 24, textAlign: 'center', width: '100%' }}>{workOrderNumber}</Text>
        </View>
      </View>
      {/* Pallet Number */}
      <Text style={{ position: 'absolute', bottom: 4, right: 14, fontWeight: 'normal', fontSize: 12, textAlign: 'right' }}>Pallet Num : {palletNum}</Text>
    </View>
  );
}

export const PrintLabelPdf: React.FC<PrintLabelPdfProps> = (props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <LabelBlock {...props} />
      <View style={styles.dashedLine} />
      <LabelBlock {...props} />
    </Page>
  </Document>
);

export default PrintLabelPdf; 