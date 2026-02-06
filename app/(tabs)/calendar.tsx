import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../../context/TransactionContext'; // Veri Beynimiz

// Takvimi Türkçe Yapalım
LocaleConfig.locales['tr'] = {
  monthNames: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
  monthNamesShort: ['Oca.','Şub.','Mar.','Nis.','May.','Haz.','Tem.','Ağu.','Eyl.','Eki.','Kas.','Ara.'],
  dayNames: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],
  dayNamesShort: ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'],
  today: "Bugün"
};
LocaleConfig.defaultLocale = 'tr';

export default function CalendarScreen() {
  const router = useRouter();
  const { transactions } = useTransactions(); // Gerçek verileri çek
  
  // Başlangıçta bugünü seçili yap (YYYY-MM-DD formatında)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // --- 1. TAKVİMDEKİ NOKTALARI HAZIRLA ---
  // Hangi günlerde işlem varsa o günlere nokta koyacağız
  const markedDates = useMemo(() => {
    const marks: any = {};

    transactions.forEach(t => {
        // Tarihi al (YYYY-MM-DD)
        const dateKey = new Date(t.date).toISOString().split('T')[0];
        
        marks[dateKey] = {
            marked: true,
            dotColor: t.type === 'income' ? '#16A34A' : 'orange' // Gelirse yeşil, giderse turuncu nokta
        };
    });

    // Seçili günü de işaretle (Mavi arka plan)
    // Mevcut işaretin üzerine ekleme yapıyoruz
    marks[selectedDate] = {
        ...(marks[selectedDate] || {}), // Varsa eski nokta dursun
        selected: true,
        disableTouchEvent: true,
        selectedColor: '#2D55FF',
        selectedTextColor: 'white'
    };

    return marks;
  }, [transactions, selectedDate]);

  // --- 2. SEÇİLİ GÜNÜN İŞLEMLERİNİ FİLTRELE ---
  const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.date).toISOString().split('T')[0];
      return tDate === selectedDate;
  });

  // Seçili günün toplamı
  const dailyTotal = filteredTransactions.reduce((acc, curr) => {
      return curr.type === 'income' ? acc + curr.amount : acc - curr.amount; 
  }, 0);

  const formatMoney = (amount: number) => {
    return Math.abs(amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
             <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Takvim</Text>
        <View style={{width: 24}} /> 
      </View>

      {/* TAKVİM BİLEŞENİ */}
      <View style={styles.calendarWrapper}>
        <Calendar
            monthFormat={'MMMM yyyy'}
            markedDates={markedDates} // Hazırladığımız noktalar
            onDayPress={day => {
                setSelectedDate(day.dateString);
            }}
            theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#2D55FF',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#2D55FF',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                arrowColor: '#2D55FF',
                monthTextColor: '#1F2937',
                indicatorColor: 'blue',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13
            }}
            style={{
                borderRadius: 20,
                height: 350
            }}
        />
      </View>

      {/* SEÇİLİ GÜNÜN ÖZETİ */}
      <View style={styles.summaryContainer}>
         <View>
            <Text style={styles.dateLabel}>SEÇİLEN TARİH</Text>
            <Text style={styles.selectedDateText}>
                {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
         </View>
         <View style={{alignItems: 'flex-end'}}>
             <Text style={styles.dateLabel}>GÜNLÜK DENGESİ</Text>
             <Text style={[styles.totalAmount, { color: dailyTotal >= 0 ? '#16A34A' : '#EF4444' }]}>
                {dailyTotal >= 0 ? '+' : '-'}{formatMoney(dailyTotal)}
             </Text>
         </View>
      </View>

      {/* İŞLEM LİSTESİ */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#E5E7EB" />
                <Text style={styles.emptyText}>Bu tarihte işlem yok.</Text>
            </View>
        }
        renderItem={({ item }) => (
            <View style={styles.card}>
                <View style={[styles.iconBox, item.type === 'income' ? {backgroundColor: '#DCFCE7'} : {backgroundColor: '#FEE2E2'}]}>
                    <Ionicons name={item.type === 'income' ? 'wallet' : 'cart'} size={24} color={item.type === 'income' ? '#16A34A' : '#EF4444'} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.transTitle}>{item.title}</Text>
                    <Text style={styles.transSubtitle}>
                        {new Date(item.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                    </Text>
                </View>
                <Text style={[styles.transAmount, item.type === 'income' ? {color:'#16A34A'} : {color:'#EF4444'}]}>
                    {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
                </Text>
            </View>
        )}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  calendarWrapper: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, backgroundColor: '#fff', marginBottom: 20 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginBottom: 15 },
  dateLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '700', letterSpacing: 1 },
  selectedDateText: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, marginHorizontal: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  transTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  transSubtitle: { fontSize: 13, color: '#6B7280' },
  transAmount: { fontSize: 16, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 10, fontWeight: '500' }
});