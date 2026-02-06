import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../../context/TransactionContext'; // Verileri çektik

export default function Dashboard() {
  const router = useRouter();
  const { transactions } = useTransactions(); // Tüm işlemlerimiz burada

  // --- 1. HESAPLAMALAR ---
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  // --- 2. GRAFİK VERİSİ HAZIRLAMA ---
  // Harcamaları kategorilere göre grupla
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.title] = (expenseByCategory[t.title] || 0) + t.amount;
    });

  // Renk Paleti
  const colors = ['#4B3FF6', '#1F2937', '#E5E7EB', '#F97316', '#EF4444', '#10B981'];
  
  // Grafik formatına çevir
  let pieData = Object.keys(expenseByCategory).map((cat, index) => ({
    value: expenseByCategory[cat],
    color: colors[index % colors.length], // Renkleri sırayla seç
    text: `%${Math.round((expenseByCategory[cat] / totalExpense) * 100) || 0}`,
    category: cat // Efsane (Legend) için sakla
  }));

  // Eğer hiç harcama yoksa boş bir halka göster
  if (pieData.length === 0) {
    pieData = [{ value: 1, color: '#E5E7EB', text: '', category: 'Veri Yok' }];
  }

  // --- 3. FORMATLAMA FONKSİYONU ---
  const formatMoney = (amount: number) => {
    return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ana Sayfa</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* TOPLAM BAKİYE KARTI */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>TOPLAM BAKİYE</Text>
          <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#111827' : '#EF4444' }]}>
            {formatMoney(balance)}
          </Text>
          
          {/* Gelir / Gider Özeti (Yeni Özellik) */}
          <View style={styles.summaryRow}>
             <View style={styles.summaryItem}>
                <View style={[styles.miniIcon, {backgroundColor:'#DCFCE7'}]}>
                    <Ionicons name="arrow-down" size={14} color="#16A34A" />
                </View>
                <Text style={styles.incomeText}>{formatMoney(totalIncome)}</Text>
             </View>
             <View style={{width: 20}} />
             <View style={styles.summaryItem}>
                <View style={[styles.miniIcon, {backgroundColor:'#FEE2E2'}]}>
                    <Ionicons name="arrow-up" size={14} color="#EF4444" />
                </View>
                <Text style={styles.expenseText}>{formatMoney(totalExpense)}</Text>
             </View>
          </View>
        </View>

        {/* GRAFİK ALANI */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Aylık Harcamalar</Text>
            <TouchableOpacity onPress={() => router.push('/reports')}>
                <Text style={styles.linkText}>Raporu Gör</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <PieChart
              data={pieData}
              donut
              showText={totalExpense > 0} // Harcama varsa yazı göster
              textColor="white"
              radius={100}
              innerRadius={70}
              textSize={12}
              fontWeight="bold"
              centerLabelComponent={() => {
                return (
                  <View style={{justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontSize: 14, color: 'gray'}}>HARCANAN</Text>
                    <Text style={{fontSize: 20, fontWeight: 'bold'}}>{formatMoney(totalExpense)}</Text>
                  </View>
                );
              }}
            />
          </View>

          {/* Dinamik Kategori Açıklamaları (Legend) */}
          <View style={styles.legendContainer}>
             {totalExpense > 0 ? pieData.slice(0, 3).map((item, index) => (
                 <View key={index} style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.category}</Text>
                 </View>
             )) : (
                 <Text style={{color:'#9CA3AF', fontSize:12}}>Harcama verisi yok</Text>
             )}
          </View>
        </View>

        {/* SON İŞLEMLER (DİNAMİK) */}
        <View style={styles.transactionsSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Son İşlemler</Text>
            <TouchableOpacity onPress={() => router.push('/records')}>
                <Text style={styles.linkText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {/* İşlemleri Listele (Sadece ilk 5 tanesi) */}
          {transactions.slice(0, 5).map((item) => (
             <View key={item.id} style={styles.transactionItem}>
                 <View style={[
                     styles.iconBox, 
                     item.type === 'income' ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEE2E2' }
                 ]}>
                    <Ionicons 
                        name={item.type === 'income' ? 'wallet' : 'cart'} 
                        size={24} 
                        color={item.type === 'income' ? '#16A34A' : '#EF4444'} 
                    />
                 </View>
                 <View style={styles.transDetails}>
                    <Text style={styles.transTitle}>{item.title}</Text>
                    <Text style={styles.transDate}>
                        {/* Tarihi güzel formatla (Örn: 14 Şub 10:30) */}
                        {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} • 
                        {new Date(item.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                 </View>
                 <Text style={item.type === 'income' ? styles.incomeTextList : styles.expenseTextList}>
                    {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
                 </Text>
             </View>
          ))}

          {transactions.length === 0 && (
              <Text style={{textAlign:'center', color:'#9CA3AF', marginTop: 20}}>Henüz işlem yok.</Text>
          )}
          
          <View style={{ height: 100 }} /> 
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  balanceContainer: { alignItems: 'center', marginVertical: 25 },
  balanceLabel: { fontSize: 14, color: '#6B7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: '#111827' },
  summaryRow: { flexDirection: 'row', marginTop: 15 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  miniIcon: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  incomeText: { color: '#16A34A', fontWeight: '700', fontSize: 13 },
  expenseText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  chartCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  linkText: { color: '#4B3FF6', fontWeight: '600' },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: '#6B7280', fontSize: 12, fontWeight: '500' },
  transactionsSection: { marginTop: 25, paddingHorizontal: 20 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 5 },
  iconBox: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  transDetails: { flex: 1 },
  transTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  transDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  expenseTextList: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  incomeTextList: { fontSize: 16, fontWeight: '700', color: '#059669' },
});