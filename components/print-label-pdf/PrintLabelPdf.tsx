import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image, Font } from '@react-pdf/renderer';

// 註冊 Noto Sans 字型
Font.register({
  family: 'Noto Sans',
  src: '/fonts/NotoSans-Regular.ttf',
});

// TODO: 若有 logo 圖片，請將路徑替換
// import logo from './logo.png';

export interface PrintLabelPdfProps {
  productCode: string;
  description: string;
  quantity: string | number;
  date: string;
  operatorClockNum: string;
  qcClockNum: string;
  series: string;
  palletNum: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    padding: 24,
    fontFamily: 'Noto Sans',
  },
  logo: {
    width: 270,
    height: 90,
    marginBottom: 8,
  },
  section: {
    marginBottom: 12,
    padding: 8,
    border: '1pt solid #000',
    borderRadius: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cell: {
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  bigText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  series: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
});

export const PrintLabelPdf: React.FC<PrintLabelPdfProps> = ({
  productCode,
  description,
  quantity,
  date,
  operatorClockNum,
  qcClockNum,
  series,
  palletNum,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Logo 區塊 */}
      {/* <Image src={logo} style={styles.logo} /> */}
      <Text style={styles.label}>Pallet Label</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.cell}>Product Code</Text>
          <Text style={styles.cell}>{productCode}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Description</Text>
          <Text style={styles.cell}>{description}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Quantity</Text>
          <Text style={styles.cell}>{quantity}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Date</Text>
          <Text style={styles.cell}>{date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Operator Clock Num</Text>
          <Text style={styles.cell}>{operatorClockNum}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Q.C. Clock Num</Text>
          <Text style={styles.cell}>{qcClockNum}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>Pallet Number</Text>
          <Text style={styles.cell}>{palletNum}</Text>
        </View>
      </View>
      <Text style={styles.series}>Series: {series}</Text>
    </Page>
  </Document>
);

export default PrintLabelPdf; 