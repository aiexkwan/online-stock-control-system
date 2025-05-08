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
  'https://wonderful-icecream-2e5.notion.site/image/attachment%3Acc29babe-4a18-4f90-82ac-80ab639d2fdb%3AP_Logo_DB.jpg?table=block&id=1ecea6a0-a03e-80ec-ad56-cf3d49ff147b&spaceId=8b44b340-b032-4818-8d92-a05586933829&width=310&userId=&cache=v2';

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
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 0,
  },
  mainTableCellFirst: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
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
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 0,
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
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderBottomWidth: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  workOrderValue: {
    padding: 4,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
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
      <Image src={LOGO_URL} style={styles.logo} />
      <Image src={`https://api.qrserver.com/v1/create-qr-code/?data=${qrValue || productCode}&size=200x200`} style={styles.qrCode} />
      <Text style={[styles.centerText, styles.line1]}>Product Code</Text>
      <Text style={[styles.centerText, styles.line2]}>{productCode}</Text>
      <Text style={[styles.centerText, styles.line3]}>Description</Text>
      <Text style={[styles.centerText, styles.line4]}>{description}</Text>
      {/* 主資料表格 */}
      <View style={styles.mainTable}>
        <View style={styles.mainTableRow}>
          <Text style={styles.mainTableHeaderFirst}>Quantity</Text>
          <Text style={styles.mainTableHeader}>Date</Text>
          <Text style={styles.mainTableHeader}>Operator Clock Num</Text>
          <Text style={styles.mainTableHeaderLast}>Q.C. Clock Num</Text>
        </View>
        <View style={styles.mainTableRow}>
          <Text style={styles.mainTableCellFirst}>{quantity}</Text>
          <Text style={styles.mainTableCell}>{date}</Text>
          <Text style={styles.mainTableCell}>{operatorClockNum}</Text>
          <Text style={styles.mainTableCellLast}>{qcClockNum}</Text>
        </View>
      </View>
      {/* Work Order Table */}
      <View style={styles.workOrderTable}>
        <Text style={styles.workOrderLabel}>Work Order Number</Text>
        <Text style={styles.workOrderValue}>{workOrderNumber}</Text>
      </View>
      {/* Pallet Num */}
      <Text style={styles.palletNum}>Pallet Num : {palletNum}</Text>
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