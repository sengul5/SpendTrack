import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../../context/TransactionContext';

// Ekran genişliğini alıp kenar boşluklarını düşüyoruz
const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { transactions } = useTransactions();
  
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- TARİH HESAPLAMALARI ---
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
      case 'day':
        newDate.setDate(newDate.getDate() + val);
        break;
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

  // --- VERİ FİLTRELEME ---
  const filteredTransactions = useMemo(() => {
    const d = new Date(currentDate);
    let start, end;

    if (filterType === 'day') {
      start = new Date(d.setHours(0,0,0,0));
      end = new Date(d.setHours(23,59,59,999));
    } else if (filterType === 'week') {
      start = getStartOfWeek(d);
      end = getEndOfWeek(d);
    } else if (filterType === 'month') {
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, currentDate, filterType]);

  // --- GRAFİK VERİSİ HAZIRLAMA ---
  const chartData = useMemo(() => {
    const data: any[] = [];
    
    // Çubuk Kalınlığı ve Boşluk Ayarları
    // Bu değerler grafiğin sıkışmamasını sağlar
    const BAR_SPACING_INNER = 4; // Gelir ve Gider arasındaki boşluk
    const BAR_SPACING_OUTER = 24; // Günler arasındaki boşluk

    const pushGroup = (label: string, income: number, expense: number) => {
      // 1. Çubuk: GELİR (Yeşil)
      data.push({
        value: income,
        label: label, // Etiketi sadece ilk çubuğa (gelir) ekliyoruz
        frontColor: '#10B981',
        spacing: BAR_SPACING_INNER,
        labelTextStyle: { color: '#6B7280', fontSize: 11, width: 60, textAlign: 'center', marginLeft: 8 }, // Etiketi ortalamak için ince ayar
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      });

      // 2. Çubuk: GİDER (Kırmızı)
      data.push({
        value: expense,
        frontColor: '#EF4444',
        spacing: BAR_SPACING_OUTER,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      });
    };

    if (filterType === 'day') {
      const income = filteredTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
      const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
      // Günlük görünümde tek büyük çubuklar olsun
      data.push({ value: income, label: 'Gelir', frontColor: '#10B981', spacing: 20, barWidth: 40, borderTopLeftRadius: 6, borderTopRightRadius: 6 });
      data.push({ value: expense, label: 'Gider', frontColor: '#EF4444', barWidth: 40, borderTopLeftRadius: 6, borderTopRightRadius: 6 });

    } else if (filterType === 'week') {
      const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
      
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
        const dayIncome = filteredTransactions.filter(t => {
          return new Date(t.date).getDate() === i && t.type === 'income';
        }).reduce((a, b) => a + b.amount, 0);

        const dayExpense = filteredTransactions.filter(t => {
          return new Date(t.date).getDate() === i && t.type === 'expense';
        }).reduce((a, b) => a + b.amount, 0);

        // Ay görünümünde etiketleri seyrelt (1, 5, 10...)
        const label = i === 1 || i % 5 === 0 ? i.toString() : '';
        pushGroup(label, dayIncome, dayExpense);
      }

    } else if (filterType === 'year') {
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      
      months.forEach((month, index) => {
        const monthIncome = filteredTransactions.filter(t => {
          return new Date(t.date).getMonth() === index && t.type === 'income';
        }).reduce((a, b) => a + b.amount, 0);

        const monthExpense = filteredTransactions.filter(t => {
          return new Date(t.date).getMonth() === index && t.type === 'expense';
        }).reduce((a, b) => a + b.amount, 0);

        pushGroup(month, monthIncome, monthExpense);
      });
    }

    // Veri yoksa boş grafik düzgün görünsün
    if (data.length === 0) return [{ value: 0, label: '', spacing: 20 }];

    return data;
  }, [filteredTransactions, filterType, currentDate]);

  // --- İSTATİSTİKLER ---
  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const dateLabel = useMemo(() => {
    const trLocale = 'tr-TR';
    if (filterType === 'day') {
      return currentDate.toLocaleDateString(trLocale, { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (filterType === 'week') {
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
    return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Raporlar</Text>
        </View>

        {/* FİLTRE BUTONLARI */}
        <View style={styles.filterContainer}>
            {['day', 'week', 'month', 'year'].map((type) => (
                <TouchableOpacity 
                    key={type}
                    style={[styles.filterBtn, filterType === type && styles.activeFilterBtn]}
                    onPress={() => setFilterType(type as any)}
                >
                    <Text style={[styles.filterText, filterType === type && styles.activeFilterText]}>
                        {type === 'day' ? 'Gün' : type === 'week' ? 'Hafta' : type === 'month' ? 'Ay' : 'Yıl'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* TARİH GEZİNME */}
        <View style={styles.navRow}>
            <TouchableOpacity onPress={() => handleNavigate('prev')} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color="#4B5563" />
            </TouchableOpacity>
            
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            
            <TouchableOpacity onPress={() => handleNavigate('next')} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color="#4B5563" />
            </TouchableOpacity>
        </View>

        {/* ÖZET KARTLAR */}
        <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="arrow-down" size={16} color="#FFF" />
                </View>
                <Text style={styles.statLabel}>Gelir</Text>
                <Text style={[styles.statValue, { color: '#047857' }]}>{formatMoney(stats.income)}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#EF4444' }]}>
                    <Ionicons name="arrow-up" size={16} color="#FFF" />
                </View>
                <Text style={styles.statLabel}>Gider</Text>
                <Text style={[styles.statValue, { color: '#B91C1C' }]}>{formatMoney(stats.expense)}</Text>
            </View>
        </View>

        {/* NET DURUM KARTI */}
        <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Net Durum</Text>
            <Text style={[
                styles.balanceValue, 
                stats.balance >= 0 ? { color: '#10B981' } : { color: '#EF4444' }
            ]}>
                {stats.balance >= 0 ? '+' : ''}{formatMoney(stats.balance)}
            </Text>
        </View>

        {/* GRAFİK ALANI */}
        <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>
                {filterType === 'year' ? 'Aylık Performans' : filterType === 'month' ? 'Günlük Akış' : 'Karşılaştırma'}
            </Text>
            
            <View style={{ marginTop: 20 }}>
                <BarChart
                    data={chartData}
                    barWidth={18} // Çubukları kalınlaştırdık
                    initialSpacing={20} // Soldan boşluk
                    spacing={24} // Varsayılan boşluk
                    noOfSections={4}
                    barBorderRadius={4} // Köşeleri yuvarladık
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    isAnimated
                    animationDuration={600}
                    height={220}
                    // Ekran genişliğinden paddingleri düşüyoruz (40px) 
                    // Ama içerik taşarsa kütüphane otomatik scroll olmasını sağlar
                    width={screenWidth - 80} 
                    scrollToEnd={false} // Başa odaklı başlasın
                />
            </View>

            {/* AÇIKLAMA (LEGEND) */}
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>Gelir</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>Gider</Text>
                </View>
            </View>
        </View>

        {/* HAREKET LİSTESİ */}
        <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 20 }]}>Dönem Hareketleri</Text>
        
        <View style={styles.transactionList}>
            {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, 10).map((t) => (
                    <View key={t.id} style={styles.transItem}>
                         <View style={[styles.transIcon, { backgroundColor: t.type === 'income' ? '#DCFCE7' : '#FEE2E2' }]}>
                             <Ionicons 
                                name={t.type === 'income' ? 'wallet' : 'cart'} 
                                size={18} 
                                color={t.type === 'income' ? '#16A34A' : '#EF4444'} 
                             />
                         </View>
                         <View style={{flex: 1}}>
                             <Text style={styles.transTitle}>{t.title}</Text>
                             <Text style={styles.transDate}>
                                 {new Date(t.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                             </Text>
                         </View>
                         <Text style={[styles.transAmount, { color: t.type === 'income' ? '#16A34A' : '#EF4444' }]}>
                             {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                         </Text>
                    </View>
                ))
            ) : (
                <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 10 }}>Bu dönemde işlem yok.</Text>
            )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  
  filterContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 15 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeFilterBtn: { backgroundColor: '#FFF', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 },
  filterText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  activeFilterText: { color: '#1F2937', fontWeight: '700' },

  navRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  navBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 10, marginHorizontal: 15, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2 },
  dateLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937', minWidth: 140, textAlign: 'center' },

  statsGrid: { flexDirection: 'row', marginHorizontal: 20, gap: 15, marginBottom: 15 },
  statCard: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center' },
  iconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },

  balanceCard: { marginHorizontal: 20, backgroundColor: '#FFF', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 5, marginBottom: 20 },
  balanceLabel: { fontSize: 14, color: '#9CA3AF', letterSpacing: 1, fontWeight: '600' },
  balanceValue: { fontSize: 32, fontWeight: '800', marginTop: 5 },

  chartContainer: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 15, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  transactionList: { marginHorizontal: 20, marginTop: 10 },
  transItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 8 },
  transIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  transDate: { fontSize: 11, color: '#9CA3AF' },
  transAmount: { fontSize: 14, fontWeight: '700' },
});