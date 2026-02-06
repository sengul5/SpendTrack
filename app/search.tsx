import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Transaction, useTransactions } from '../context/TransactionContext';

export default function SearchScreen() {
  const router = useRouter();
  const { transactions } = useTransactions();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Transaction[]>([]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const lowerText = query.toLowerCase();
    
    const filtered = transactions.filter(t => {
      const titleMatch = t.title.toLowerCase().includes(lowerText);
      const noteMatch = t.note ? t.note.toLowerCase().includes(lowerText) : false;
      return titleMatch || noteMatch;
    });

    setResults(filtered);
  }, [query, transactions]);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
                style={styles.input}
                placeholder="İşlem ara (Örn: Migros...)"
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
                autoFocus={true}
            />
            {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
            )}
        </View>
        
        <TouchableOpacity style={styles.cancelButton} onPress={() => {
            Keyboard.dismiss();
            router.back();
        }}>
            <Text style={styles.cancelText}>Vazgeç</Text>
        </TouchableOpacity>
      </View>

      {/* 2. liste */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
        
        ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
                {query.length > 0 ? (
                    <>
                        <Ionicons name="alert-circle-outline" size={48} color="#E5E7EB" />
                        <Text style={styles.emptyText}>
                            &quot;{query}&quot; ile eşleşen işlem bulunamadı.
                        </Text>
                    </>
                ) : (
                    <>
                         <Ionicons name="search-outline" size={48} color="#E5E7EB" />
                         <Text style={styles.emptyText}>Aramak için yazmaya başla.</Text>
                    </>
                )}
            </View>
        }

        renderItem={({ item }) => (
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
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {item.note ? item.note : new Date(item.date).toLocaleDateString('tr-TR')}
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
        )}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', 
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 10, 
  borderBottomWidth: 1, 
  borderBottomColor: '#F3F4F6', 
  backgroundColor: '#FFF' },
  searchBar: { flex: 1, flexDirection: 'row', 
  alignItems: 'center', 
  backgroundColor: '#F3F4F6', 
  borderRadius: 10, 
  paddingHorizontal: 12, 
  paddingVertical: 8, 
  marginRight: 12 },
  input: { flex: 1, 
  fontSize: 16, 
  color: '#1F2937', 
  height: '100%' },
  cancelButton: {},
  cancelText: { color: '#4B3FF6', fontSize: 16, fontWeight: '500' },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  details: { flex: 1, marginRight: 10 },
  title: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280' },
  amount: { fontSize: 16, fontWeight: '700' },
});