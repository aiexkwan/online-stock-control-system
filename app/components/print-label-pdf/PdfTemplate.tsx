'use client';

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    width: '210mm',
    height: '145mm',
    padding: '5mm',
    position: 'relative',
  },
  logo: {
    position: 'absolute',
    top: '5mm',
    left: '5mm',
    width: '210px',
    height: '55px',
  },
  qrCode: {
    position: 'absolute',
    top: '5mm',
    right: '5mm',
    width: '200px',
    height: '200px',
  },
  centerText: {
    textAlign: 'center',
    padding: '4px',
    fontSize: 30,
  },
  line1: {
    marginTop: '10px',
    marginBottom: '5px',
    textDecoration: 'underline',
  },
  line2: {
    marginBottom: '12px',
    fontSize: 40,
    fontWeight: 'bold',
  },
  line3: {
    marginBottom: '55px',
    textDecoration: 'underline',
  },
  line4: {
    marginBottom: '65px',
    fontWeight: 'bold',
  },
  mainTable: {
    width: '100%',
    marginTop: '25px',
  },
  mainTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  mainTableHeader: {
    backgroundColor: '#f0f0f0',
    padding: '8px',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
    maxWidth: '25%',
  },
  mainTableCell: {
    padding: '8px',
    fontSize: 25,
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
    maxWidth: '25%',
    borderRightWidth: 0,
    borderRightColor: 'black',
  },
  workOrderTable: {
    width: '100%',
    marginTop: '14px',
    marginBottom: '10px',
  },
  workOrderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  workOrderLabel: {
    padding: '6px 10px',
    fontSize: 24,
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
    maxWidth: '50%',
    borderRightWidth: 1,
    borderRightColor: 'black',
  },
  workOrderValue: {
    padding: '6px 10px',
    fontSize: 26,
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
    maxWidth: '50%',
  },
  palletNum: {
    position: 'absolute',
    bottom: '5mm',
    right: '5mm',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

interface PdfTemplateProps {
  productCode?: string;
  description?: string;
  quantity?: number;
  date?: string;
  operatorClockNum?: string;
  qcClockNum?: string;
  workOrderNumber?: string;
  palletNum?: string;
}

export default function PdfTemplate({
  productCode = 'SA40-10',
  description = 'Envirocrate Heavy 40-10',
  quantity = 6,
  date = '06-May-2025',
  operatorClockNum = '5500/5579',
  qcClockNum = '5997',
  workOrderNumber = 'ACO Ref : 123456  (Plt : 1)',
  palletNum = '060525/34'
}: PdfTemplateProps) {
  return (
    <Document>
      <Page size={[210, 145]} style={styles.page}>
        {/* Logo */}
        <Image
          style={styles.logo}
          src="https://wonderful-icecream-2e5.notion.site/image/attachment%3Acc29babe-4a18-4f90-82ac-80ab639d2fdb%3AP_Logo_DB.jpg?table=block&id=1ecea6a0-a03e-80ec-ad56-cf3d49ff147b&spaceId=8b44b340-b032-4818-8d92-a05586933829&width=310&userId=&cache=v2"
        />

        {/* QR Code */}
        <Image
          style={styles.qrCode}
          src={`https://api.qrserver.com/v1/create-qr-code/?data=${productCode}&size=200x200`}
        />

        {/* Center Text */}
        <Text style={[styles.centerText, styles.line1]}>Product Code</Text>
        <Text style={[styles.centerText, styles.line2]}>{productCode}</Text>
        <Text style={[styles.centerText, styles.line3]}>Description</Text>
        <Text style={[styles.centerText, styles.line4]}>{description}</Text>

        {/* Main Table */}
        <View style={styles.mainTable}>
          <View style={styles.mainTableRow}>
            <Text style={[styles.mainTableHeader, { width: '25%' }]}>Quantity</Text>
            <Text style={[styles.mainTableHeader, { width: '25%' }]}>Date</Text>
            <Text style={[styles.mainTableHeader, { width: '25%' }]}>Operator Clock Num</Text>
            <Text style={[styles.mainTableHeader, { width: '25%' }]}>Q.C. Clock Num</Text>
          </View>
          <View style={styles.mainTableRow}>
            <Text style={[styles.mainTableCell, { width: '25%' }]}>{quantity}</Text>
            <Text style={[styles.mainTableCell, { width: '25%' }]}>{date}</Text>
            <Text style={[styles.mainTableCell, { width: '25%' }]}>{operatorClockNum}</Text>
            <Text style={[styles.mainTableCell, { width: '25%' }]}>{qcClockNum}</Text>
          </View>
        </View>

        {/* Work Order Table */}
        <View style={styles.workOrderTable}>
          <View style={styles.workOrderRow}>
            <Text style={[styles.workOrderLabel, { width: '50%' }]}>Work Order Number</Text>
            <Text style={[styles.workOrderValue, { width: '50%' }]}>{workOrderNumber}</Text>
          </View>
        </View>

        {/* Pallet Number */}
        <Text style={styles.palletNum}>Pallet Num : {palletNum}</Text>
      </Page>
    </Document>
  );
} 