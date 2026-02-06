import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Transaction, useTransactions } from '../../context/TransactionContext';

export default function RecordsScreen() {
  const router = useRouter();
  const { transactions, deleteTransaction } = useTransactions();

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { title: string; data: Transaction[] }[] = [];
    
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach((item) => {
      const date = new Date(item.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let title = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }).toUpperCase();

      if (date.toDateString() === today.toDateString()) {
        title = 'BUGÜN';
      } else if (date.toDateString() === yesterday.toDateString()) {
        title = 'DÜN';
      }

      const existingGroup = groups.find((group) => group.title === title);
      if (existingGroup) {
        existingGroup.data.push(item);
      } else {
        groups.push({ title, data: [item] });
      }
    });

    return groups;
  };

  const sectionData = groupTransactionsByDate(transactions);

  const handleLongPress = (id: string) => {
    Alert.alert(
      "İşlemi Sil",
      "Bu işlemi silmek istediğine emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: async () => await deleteTransaction(id) 
        }
      ]
    );
  };

  // yeni: tiklaninca duzenlemeye git
  const handlePress = (id: string) => {
    router.push({ pathname: '/add-transaction', params: { id } });
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
             <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>İşlem Geçmişi</Text>
        
        <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => router.push('/calendar')} style={{ marginRight: 15 }}>
                <Ionicons name="calendar-outline" size={24} color="#1F2937" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/search')}>
                <Ionicons name="search" size={24} color="#1F2937" />
            </TouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={sectionData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        
        ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Ionicons name="documents-outline" size={64} color="#E5E7EB" />
                <Text style={{ marginTop: 10, color: '#9CA3AF' }}>Henüz hiç işlem yok.</Text>
            </View>
        }

        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => handlePress(item.id)} // tiklayinca duzenle
            onLongPress={() => handleLongPress(item.id)} // basili tutunca sil
            delayLongPress={500}
            activeOpacity={0.7}
          >
            <View style={styles.card}>
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

                <View style={styles.details}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.subtitleRow}>
                        <Text style={styles.subtitle}>
                            {item.note ? item.note : (item.type === 'income' ? 'Gelir' : 'Harcama')}
                        </Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.time}>
                            {new Date(item.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>

                <Text style={[
                    styles.amount, 
                    item.type === 'income' ? { color: '#16A34A' } : { color: '#EF4444' }
                ]}>
                    {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
                </Text>
            </View>
          </TouchableOpacity>
        )}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  details: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', maxWidth: 150 },
  dot: { fontSize: 13, color: '#6B7280', marginHorizontal: 6 },
  time: { fontSize: 12, color: '#9CA3AF' },
  amount: { fontSize: 16, fontWeight: '700' },
});