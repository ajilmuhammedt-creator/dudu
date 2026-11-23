// src/lib/pdf/report-document.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    color: '#1F2328'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7DE',
    paddingBottom: 15
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F26B1D'
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4
  },
  childInfo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2328',
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2328',
    marginBottom: 8,
    marginTop: 14
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    backgroundColor: '#F6F3EE',
    padding: 12,
    borderRadius: 8
  },
  kpiTile: {
    alignItems: 'center'
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2328'
  },
  kpiLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7DE',
    paddingBottom: 5,
    marginBottom: 5
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F6F3EE'
  },
  colChapter: { width: '60%', fontSize: 9 },
  colQuestions: { width: '20%', fontSize: 9, textAlign: 'center' },
  colMastery: { width: '20%', fontSize: 9, textAlign: 'right', fontWeight: 'bold' },
  insightBox: {
    backgroundColor: '#FFF5ED',
    borderWidth: 1,
    borderColor: '#F26B1D',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10
  },
  insightText: {
    fontSize: 9.5,
    color: '#1F2328',
    lineHeight: 1.4
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#ECE7DE',
    paddingTop: 8
  }
});

interface ReportDocumentProps {
  childName?: string;
  cbseClass?: number;
  studyTime?: string;
  examsTaken?: number;
  avgScore?: string;
  insight?: string;
}

export const ReportDocument: React.FC<ReportDocumentProps> = ({
  childName = 'Arjun',
  cbseClass = 3,
  studyTime = '3h 10m',
  examsTaken = 6,
  avgScore = '82%',
  insight = 'Subtraction with borrowing (Give and Take) is the weak spot — 3 of 5 wrong answers were a borrowing slip.'
}) => (
  <Document title={`EduBuddy Weekly Report - ${childName}`}>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>EduBuddy Parent</Text>
        <Text style={styles.subtitle}>AI Desk Robot for CBSE Students · Weekly Progress Report</Text>
        <Text style={styles.childInfo}>
          Student: {childName} · CBSE Class {cbseClass} · Mathematics & EVS
        </Text>
      </View>

      {/* KPI Tiles */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{studyTime}</Text>
          <Text style={styles.kpiLabel}>Total Study Time</Text>
        </View>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{examsTaken}</Text>
          <Text style={styles.kpiLabel}>Exams Taken</Text>
        </View>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{avgScore}</Text>
          <Text style={styles.kpiLabel}>Average Score</Text>
        </View>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>2</Text>
          <Text style={styles.kpiLabel}>Healthy Breaks</Text>
        </View>
      </View>

      {/* Chapter Mastery Table */}
      <Text style={styles.sectionTitle}>Chapter Mastery · Mathematics (Maths Mela)</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.colChapter, { fontWeight: 'bold' }]}>Chapter</Text>
        <Text style={[styles.colQuestions, { fontWeight: 'bold' }]}>Questions</Text>
        <Text style={[styles.colMastery, { fontWeight: 'bold' }]}>Mastery</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={styles.colChapter}>House of Hundreds – II (Ch 9)</Text>
        <Text style={styles.colQuestions}>12</Text>
        <Text style={styles.colMastery}>92%</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={styles.colChapter}>Give and Take (Ch 12)</Text>
        <Text style={styles.colQuestions}>14</Text>
        <Text style={styles.colMastery}>88%</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={styles.colChapter}>Give and Take: subtraction with borrowing</Text>
        <Text style={styles.colQuestions}>9</Text>
        <Text style={[styles.colMastery, { color: '#D8262B' }]}>55%</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={styles.colChapter}>Fun at Class Party! (Ch 10)</Text>
        <Text style={styles.colQuestions}>10</Text>
        <Text style={styles.colMastery}>96%</Text>
      </View>

      {/* Weak-spot Recommendation */}
      <Text style={styles.sectionTitle}>Tutor Insight & Next Steps</Text>
      <View style={styles.insightBox}>
        <Text style={styles.insightText}>{insight}</Text>
        <Text style={[styles.insightText, { marginTop: 4, fontStyle: 'italic', color: '#6B7280' }]}>
          Recommendation: Scheduled practice on two-digit subtraction with borrowing.
        </Text>
      </View>

      {/* Privacy Notice */}
      <View style={styles.footer}>
        <Text>
          EduBuddy strictly adheres to India&apos;s DPDP Act. No voice or camera recordings leave the ESP32-S3 robot.
        </Text>
      </View>
    </Page>
  </Document>
);
