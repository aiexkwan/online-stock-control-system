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
    borderWidth: 0,
  },
  label: {
    width: '210mm',
    height: '145mm',
    padding: 14,
    boxSizing: 'border-box',
    position: 'relative',
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  logo: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 90,
    height: 24,
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  qrCode: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 60,
    height: 60,
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  centerText: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 2,
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  line1: {
    marginTop: 18,
    marginBottom: 2,
    textDecoration: 'underline',
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  line2: {
    marginBottom: 6,
    fontSize: 24,
    fontWeight: 'bold',
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  line3: {
    marginBottom: 18,
    textDecoration: 'underline',
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  line4: {
    marginBottom: 24,
    fontWeight: 'bold',
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  mainTable: {
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  mainTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0,
  },
  mainTableHeaderFirst: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    borderWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  mainTableHeader: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    borderWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  mainTableHeaderLast: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    borderWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 0,
    borderColor: '#000',
  },
  mainTableCellFirst: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
    borderWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  mainTableCell: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
    borderWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  mainTableCellLast: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
    borderWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 0,
    borderColor: '#000',
  },
  workOrderTable: {
    width: '100%',
    marginTop: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    flexDirection: 'row',
  },
  workOrderLabel: {
    padding: 4,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    borderWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderBottomWidth: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderColor: '#000',
  },
  workOrderValue: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
    borderWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderColor: '#000',
  },
  palletNum: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    fontWeight: 'bold',
    fontSize: 12,
    borderWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  dashedLine: {
    width: '100%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000',
    marginVertical: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
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
      <View style={{ width: '100%', marginTop: 10, borderWidth: 1, borderColor: '#000', borderStyle: 'solid' }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0' }}>
          <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000', height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: '100%' }}>Quantity</Text>
          </View>
          <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000', height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: '100%' }}>Date</Text>
          </View>
          <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000', height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: '100%' }}>Operator Clock Num</Text>
          </View>
          <View style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', width: '100%' }}>Q.C. Clock Num</Text>
          </View>
        </View>
        {/* Data Row */}
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000', height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, textAlign: 'center', width: '100%' }}>{quantity}</Text>
          </View>
          <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000', height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, textAlign: 'center', width: '100%' }}>{date}</Text>
          </View>
          <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000', height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, textAlign: 'center', width: '100%' }}>{operatorClockNum}</Text>
          </View>
          <View style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, textAlign: 'center', width: '100%' }}>{qcClockNum}</Text>
          </View>
        </View>
      </View>
      {/* Work Order Table - 兩個儲存格 */}
      <View style={{ width: '100%', borderWidth: 1, borderColor: '#000', borderStyle: 'solid', marginTop: 14, marginBottom: 10, flexDirection: 'row' }}>
        <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000', height: 48, alignItems: 'center', justifyContent: 'center' }}>
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