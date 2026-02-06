import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../../context/TransactionContext';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { transactions } = useTransactions();
  
  // varsayilan gorunum hafta olarak ayarlandi
  const [filterType, setFilterType] = useState<'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- TARIH HESAPLAMALARI ---
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfWeek = (date: Date) => {
    const d = getStartOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = direction === 'next' ? 1 : -1;

    switch (filterType) {
      case 'week':
        newDate.setDate(newDate.getDate() + (val * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + val);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + val);
        break;
    }
    setCurrentDate(newDate);
  };

  // --- VERI FILTRELEME ---
  const filteredTransactions = useMemo(() => {
    const d = new Date(currentDate);
    let start, end;

    if (filterType === 'week') {
      start = getStartOfWeek(d);
      end = getEndOfWeek(d);
    } else if (filterType === 'month') {
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // yil
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, currentDate, filterType]);

  // --- Y EKSENI ICIN TEMIZ SAYI HESAPLAMA ---
  const calculateNiceMaxValue = (max: number) => {
    if (max <= 0) return 100;
    const power = Math.floor(Math.log10(max));
    const magnitude = Math.pow(10, power);
    const normalized = max / magnitude;
    let niceNormalized;
    if (normalized <= 1) niceNormalized = 1;
    else if (normalized <= 2) niceNormalized = 2;
    else if (normalized <= 5) niceNormalized = 5;
    else niceNormalized = 10;
    return niceNormalized * magnitude;
  };

  // --- GRAFIK VERISI HAZIRLAMA ---
  const { chartData, maxValue, barWidth, chartSpacing } = useMemo(() => {
    const data: any[] = [];
    let max = 0;

    // referans gorseldeki renkler (yesil ve mavi/mor)
    const COLOR_INCOME = '#6EE7B7'; // soft yesil (mint)
    const COLOR_EXPENSE = '#A5B4FC'; // soft mavi/mor (indigo)
    const BORDER_RADIUS = 10; // uclari tam yuvarlak yapmak icin yuksek deger

    // grafik ayarlari
    let _barWidth = 14;
    let _groupSpacing = 32; 
    
    if (filterType === 'week') {
      _barWidth = 16; 
      _groupSpacing = 30; 
    } else if (filterType === 'month') {
      _barWidth = 8;
      _groupSpacing = 16;
    } else if (filterType === 'year') {
      _barWidth = 12;
      _groupSpacing = 24;
    }

    const pushGroup = (label: string, income: number, expense: number) => {
      if (income > max) max = income;
      if (expense > max) max = expense;

      // GELIR CUBUGU
      data.push({
        value: income,
        label: label,
        frontColor: COLOR_INCOME,
        spacing: 8, // gelir ile gider arasindaki bosluk
        // etiketlerin kesilmemesi icin width ve textalign ayari
        labelTextStyle: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', width: 60, textAlign: 'center', marginLeft: -10 }, 
        borderTopLeftRadius: BORDER_RADIUS,
        borderTopRightRadius: BORDER_RADIUS,
      });

      // GIDER CUBUGU
      data.push({
        value: expense,
        frontColor: COLOR_EXPENSE,
        spacing: _groupSpacing, // bir sonraki gruba gecis boslugu
        borderTopLeftRadius: BORDER_RADIUS,
        borderTopRightRadius: BORDER_RADIUS,
      });
    };

    if (filterType === 'week') {
      const days = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
      days.forEach((day, index) => {
        const dayIncome = filteredTransactions.filter(t => {
          const tDate = new Date(t.date);
          let dayIndex = tDate.getDay(); 
          dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          return dayIndex === index && t.type === 'income';
        }).reduce((a, b) => a + b.amount, 0);

        const dayExpense = filteredTransactions.filter(t => {
          const tDate = new Date(t.date);
          let dayIndex = tDate.getDay(); 
          dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          return dayIndex === index && t.type === 'expense';
        }).reduce((a, b) => a + b.amount, 0);

        pushGroup(day, dayIncome, dayExpense);
      });

    } else if (filterType === 'month') {
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayIncome = filteredTransactions.filter(t => new Date(t.date).getDate() === i && t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const dayExpense = filteredTransactions.filter(t => new Date(t.date).getDate() === i && t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        
        // etiketleri seyrelt (sadece 5 ve katlari)
        const label = (i === 1 || i % 5 === 0) ? i.toString() : '';
        pushGroup(label, dayIncome, dayExpense);
      }

    } else if (filterType === 'year') {
      const months = ['OCA', 'ŞUB', 'MAR', 'NIS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKI', 'KAS', 'ARA'];
      months.forEach((month, index) => {
        const monthIncome = filteredTransactions.filter(t => new Date(t.date).getMonth() === index && t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const monthExpense = filteredTransactions.filter(t => new Date(t.date).getMonth() === index && t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        pushGroup(month, monthIncome, monthExpense);
      });
    }

    let niceMax = calculateNiceMaxValue(max);
    if (niceMax < max) niceMax = niceMax * 1.2; 
    if (niceMax === 0) niceMax = 100;

    return { chartData: data, maxValue: niceMax, barWidth: _barWidth, chartSpacing: _groupSpacing };
  }, [filteredTransactions, filterType, currentDate]);

  // --- ISTATISTIK & TESPITLER ---
  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    
    // en yuksek harcama yapilan kategori
    const catTotals: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.title] = (catTotals[t.title] || 0) + t.amount;
    });
    
    const topCategory = Object.entries(catTotals).sort((a,b) => b[1] - a[1])[0];

    return { 
      income, 
      expense, 
      balance: income - expense,
      topCatName: topCategory ? topCategory[0] : 'Yok',
      topCatAmount: topCategory ? topCategory[1] : 0
    };
  }, [filteredTransactions]);

  // basliktaki tarih yazisi
  const dateLabel = useMemo(() => {
    const trLocale = 'tr-TR';
    if (filterType === 'week') {
      const start = getStartOfWeek(currentDate);
      const end = getEndOfWeek(currentDate);
      return `${start.getDate()} - ${end.toLocaleDateString(trLocale, { day: 'numeric', month: 'long' })}`;
    } else if (filterType === 'month') {
      return currentDate.toLocaleDateString(trLocale, { month: 'long', year: 'numeric' });
    } else {
      return currentDate.getFullYear().toString();
    }
  }, [currentDate, filterType]);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* BASLIK */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Haftalık Harcama Analizi</Text>
        </View>

        {/* FILTRE & TARIH KONTROLU */}
        <View style={styles.controlsRow}>
            {/* tab switch */}
            <View style={styles.segmentedControl}>
                {['week', 'month', 'year'].map((type) => (
                    <TouchableOpacity 
                        key={type}
                        style={[styles.segmentBtn, filterType === type && styles.activeSegmentBtn]}
                        onPress={() => setFilterType(type as any)}
                    >
                        <Text style={[styles.segmentText, filterType === type && styles.activeSegmentText]}>
                            {type === 'week' ? 'Hafta' : type === 'month' ? 'Ay' : 'Yıl'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* tarih oklari */}
            <View style={styles.dateControl}>
                <TouchableOpacity onPress={() => handleNavigate('prev')}>
                    <Ionicons name="chevron-back" size={20} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.dateText}>{dateLabel}</Text>
                <TouchableOpacity onPress={() => handleNavigate('next')}>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </View>

        {/* OZET KARTLARI (GELIR - GIDER) */}
        <View style={styles.summaryRow}>
            {/* gelir karti */}
            <View style={styles.summaryCard}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom: 8}}>
                    <Ionicons name="arrow-down" size={16} color="#34D399" />
                    <Text style={[styles.summaryLabel, {color: '#34D399'}]}> GELİR</Text>
                </View>
                <Text style={styles.summaryValue}>{formatMoney(stats.income)}</Text>
                <Text style={styles.summarySub}>Bu hafta</Text>
            </View>

            {/* gider karti */}
            <View style={styles.summaryCard}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom: 8}}>
                    <Ionicons name="arrow-up" size={16} color="#F87171" />
                    <Text style={[styles.summaryLabel, {color: '#F87171'}]}> GİDER</Text>
                </View>
                <Text style={styles.summaryValue}>{formatMoney(stats.expense)}</Text>
                <Text style={styles.summarySub}>Bu hafta</Text>
            </View>
        </View>

        {/* BUYUK GRAFIK KARTI */}
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>
                    {filterType === 'year' ? 'Yıllık Performans' : filterType === 'month' ? 'Aylık Akış' : 'Haftalık Performans'}
                </Text>
                
                {/* legend (gosterge) */}
                <View style={{flexDirection:'row', gap: 10}}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={[styles.dot, {backgroundColor:'#6EE7B7'}]} />
                        <Text style={styles.legendText}>Gelir</Text>
                    </View>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={[styles.dot, {backgroundColor:'#A5B4FC'}]} />
                        <Text style={styles.legendText}>Gider</Text>
                    </View>
                </View>
            </View>

            <View style={{ marginTop: 25 }}>
                <BarChart
                    key={`${filterType}-${currentDate.toISOString()}`}
                    data={chartData}
                    barWidth={barWidth}
                    initialSpacing={15}
                    spacing={0} // ic spacing data icinde ayarlandi
                    maxValue={maxValue}
                    noOfSections={4}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    yAxisTextStyle={{ color: '#9CA3AF', fontSize: 11 }}
                    hideRules={false}
                    rulesColor="#F3F4F6"
                    isAnimated
                    animationDuration={400}
                    height={220}
                    width={screenWidth - 80}
                    scrollToEnd={false}
                />
            </View>
        </View>

        {/* ONEMLI TESPITLER (INSIGHTS) */}
        <Text style={styles.sectionTitle}>Önemli Tespitler</Text>

        {/* en yuksek harcama karti */}
        <View style={styles.insightCard}>
            <View style={[styles.insightIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="wallet-outline" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>En Yüksek Harcama</Text>
                <Text style={styles.insightDesc}>
                    {stats.topCatAmount > 0 
                        ? `Bu dönemde en çok ${stats.topCatName} kategorisine ${formatMoney(stats.topCatAmount)} harcandı.` 
                        : 'Bu dönemde henüz harcama yok.'}
                </Text>
            </View>
        </View>

        {/* butce durumu karti */}
        <View style={styles.insightCard}>
            <View style={[styles.insightIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="analytics-outline" size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>Bütçe Durumu</Text>
                <Text style={styles.insightDesc}>
                    {stats.balance >= 0 
                        ? `Tebrikler! Gelirlerin giderlerinden ${formatMoney(stats.balance)} daha fazla.` 
                        : `Dikkat! Giderlerin gelirlerini ${formatMoney(Math.abs(stats.balance))} aşmış durumda.`}
                </Text>
            </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' }, // acik gri arka plan
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  
  controlsRow: { paddingHorizontal: 20, marginBottom: 20 },
  
  // segment kontrol stili
  segmentedControl: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 15 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeSegmentBtn: { backgroundColor: '#FFF', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2 },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  activeSegmentText: { color: '#111827' },

  // tarih kontrol stili
  dateControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5 },
  dateText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  // ozet kartlari stili
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  summaryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginLeft: 4 },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginVertical: 4 },
  summarySub: { fontSize: 11, color: '#9CA3AF' },

  // grafik karti stili
  chartCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 25 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  legendText: { fontSize: 11, color: '#6B7280', marginLeft: 6, fontWeight: '500' },
  dot: { width: 8, height: 8, borderRadius: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginLeft: 20, marginBottom: 15 },
  
  // tespit kartlari stili
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5 },
  insightIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  insightTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  insightDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
});