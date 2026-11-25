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
  subjectsText?: string;
  studyTime?: string;
  sessionsCount?: number;
  examsTaken?: number;
  avgScore?: string;
  activePctText?: string;
  distractions?: number;
  sleepyChecks?: number;
  insight?: string;
}

export const ReportDocument: React.FC<ReportDocumentProps> = ({
  childName = 'Arjun',
  cbseClass = 3,
  subjectsText = 'General',
  studyTime = '0m',
  sessionsCount = 0,
  examsTaken = 0,
  avgScore = '—',
  activePctText = '—',
  distractions = 0,
  sleepyChecks = 0,
  insight = 'No sessions recorded this week.'
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>EduBuddy Parent — Weekly Progress Report</Text>
        <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString('en-IN')}</Text>
        <Text style={styles.childInfo}>
          Student: {childName} · CBSE Class {cbseClass} · {subjectsText}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Weekly Study Summary</Text>
      <View style={styles.kpiRow}>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{studyTime}</Text>
          <Text style={styles.kpiLabel}>Total Study Time</Text>
        </View>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{sessionsCount}</Text>
          <Text style={styles.kpiLabel}>Sessions</Text>
        </View>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{examsTaken}</Text>
          <Text style={styles.kpiLabel}>Exams Taken</Text>
        </View>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{avgScore}</Text>
          <Text style={styles.kpiLabel}>Average Score</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Attention &amp; Sleepiness Summary</Text>
      <View style={styles.kpiRow}>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{activePctText}</Text>
          <Text style={styles.kpiLabel}>Active Focus</Text>
        </View>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{distractions}</Text>
          <Text style={styles.kpiLabel}>Distractions</Text>
        </View>
        <View style={styles.kpiTile}>
          <Text style={styles.kpiValue}>{sleepyChecks}</Text>
          <Text style={styles.kpiLabel}>Sleepy Checks</Text>
        </View>
      </View>

      <View style={styles.insightBox}>
        <Text style={styles.insightText}>{insight}</Text>
      </View>

      <Text style={styles.footer}>
        EduBuddy Parent · Private &amp; Secure (India DPDP Act Compliant)
      </Text>
    </Page>
  </Document>
);
