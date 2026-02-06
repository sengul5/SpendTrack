import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, useTransactions } from '../context/TransactionContext';

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addTransaction, updateTransaction, transactions, categories, addCategory, deleteCategory } = useTransactions();
  
  const isEditing = !!params.id; // id varsa duzenleme modundayiz

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alışveriş');
  const [note, setNote] = useState('');

  const [isModalVisible, setModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('star');

  const ICON_OPTIONS = [
    'game-controller', 'paw', 'airplane', 'gift',
    'wifi', 'bicycle', 'book', 'construct',
    'desktop', 'flower', 'hammer', 'key',
    'musical-notes', 'pizza', 'rocket', 'shirt',
    'tennisball', 'water', 'bandage', 'bed',
    'camera', 'car-sport', 'diamond', 'fitness'
  ];

  // eger duzenleme modundaysak verileri doldur
  useEffect(() => {
    if (isEditing) {
      const transactionToEdit = transactions.find(t => t.id === params.id);
      if (transactionToEdit) {
        setType(transactionToEdit.type);
        setAmount(transactionToEdit.amount.toString());
        setSelectedCategory(transactionToEdit.title);
        setNote(transactionToEdit.note || '');
      }
    }
  }, [params.id]);

  const handleSave = async () => {
    if (!amount) {
      Alert.alert("Hata", "Lütfen bir tutar girin.");
      return;
    }
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount)) {
      Alert.alert("Hata", "Geçersiz tutar.");
      return;
    }

    if (isEditing) {
      // guncelleme islemi
      await updateTransaction(params.id as string, {
        title: selectedCategory,
        amount: numericAmount,
        type: type as 'expense' | 'income',
        note: note
      });
    } else {
      // yeni ekleme islemi
      await addTransaction({
        title: selectedCategory,
        amount: numericAmount,
        type: type as 'expense' | 'income',
        date: new Date().toISOString(),
        note: note
      });
    }

    router.back();
  };

  const handleAddCategory = async () => {
    if (newCatName.trim() === '') {
      Alert.alert("Uyarı", "Lütfen kategori ismi girin.");
      return;
    }
    
    await addCategory(newCatName, selectedIcon);
    setSelectedCategory(newCatName);
    setModalVisible(false);
    setNewCatName('');
    setSelectedIcon('star');
  };

  const handleLongPressCategory = (cat: Category) => {
    if (!cat.isCustom) {
      Alert.alert("Bilgi", "Varsayılan kategoriler silinemez.");
      return;
    }

    Alert.alert(
      "Kategoriyi Sil",
      `'${cat.name}' kategorisini silmek istiyor musunuz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: async () => {
            await deleteCategory(cat.id);
            if (selectedCategory === cat.name) {
              setSelectedCategory('Alışveriş');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        <View style={styles.header}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>{isEditing ? 'İşlemi Düzenle' : 'İşlem Ekle'}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          <View style={styles.tabContainer}>
             <TouchableOpacity style={[styles.tab, type === 'expense' && styles.activeTabExpense]} onPress={() => setType('expense')}>
               <Text style={[styles.tabText, type === 'expense' && styles.activeTabText]}>Gider</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.tab, type === 'income' && styles.activeTabIncome]} onPress={() => setType('income')}>
               <Text style={[styles.tabText, type === 'income' && styles.activeTabText]}>Gelir</Text>
             </TouchableOpacity>
          </View>

          <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>TUTAR</Text>
              <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₺</Text>
                  <TextInput
                      style={styles.amountInput}
                      placeholder="0,00"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                  />
              </View>
          </View>

          <Text style={styles.sectionTitle}>Kategori Seç</Text>
          <View style={styles.categoryGrid}>
              
              {categories.map((cat) => (
                  <TouchableOpacity 
                      key={cat.id} 
                      style={styles.categoryItem}
                      onPress={() => setSelectedCategory(cat.name)}
                      onLongPress={() => handleLongPressCategory(cat)}
                      delayLongPress={500}
                  >
                      <View style={[
                          styles.categoryIconBox, 
                          selectedCategory === cat.name && { backgroundColor: type === 'expense' ? '#FEE2E2' : '#DCFCE7' }
                      ]}>
                          <Ionicons 
                              name={cat.icon as any} 
                              size={24} 
                              color={selectedCategory === cat.name ? (type === 'expense' ? '#EF4444' : '#16A34A') : '#6B7280'} 
                          />
                      </View>
                      <Text style={[
                          styles.categoryText, 
                          selectedCategory === cat.name && { color: '#1F2937', fontWeight: '600' }
                      ]} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.categoryItem} onPress={() => setModalVisible(true)}>
                  <View style={[styles.categoryIconBox, { backgroundColor: '#E5E7EB', borderStyle: 'dashed', borderWidth: 1, borderColor: '#9CA3AF' }]}>
                      <Ionicons name="add" size={24} color="#4B5563" />
                  </View>
                  <Text style={styles.categoryText}>Ekle</Text>
              </TouchableOpacity>

          </View>

          <View style={styles.noteContainer}>
              <Ionicons name="create-outline" size={20} color="#9CA3AF" />
              <TextInput
                  style={styles.noteInput}
                  placeholder="Not ekle..."
                  value={note}
                  onChangeText={setNote}
              />
          </View>
          <View style={{ height: 20 }} />

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{isEditing ? 'Güncelle' : 'Kaydet'}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Yeni Kategori</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>KATEGORİ İSMİ</Text>
                <TextInput 
                    style={styles.modalInput}
                    placeholder="Örn: Oyun, Kira, Kedi..."
                    value={newCatName}
                    onChangeText={setNewCatName}
                />

                <Text style={styles.modalLabel}>İKON SEÇ</Text>
                <View style={styles.emojiGrid}>
                    {ICON_OPTIONS.map((iconName, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={[
                                styles.emojiItem, 
                                selectedIcon === iconName && { backgroundColor: '#E0E7FF', borderColor: '#4B3FF6', borderWidth: 1 }
                            ]}
                            onPress={() => setSelectedIcon(iconName)}
                        >
                            <Ionicons 
                                name={iconName as any} 
                                size={28} 
                                color={selectedIcon === iconName ? '#4B3FF6' : '#6B7280'} 
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.modalSaveButton} onPress={handleAddCategory}>
                    <Text style={styles.modalSaveText}>Kategoriyi Ekle</Text>
                </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  footer: { backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 24, marginTop: 10 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTabExpense: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FEE2E2' },
  activeTabIncome: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DCFCE7' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#1F2937', fontWeight: '600' },
  inputCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16 },
  inputLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 32, fontWeight: '600', color: '#1F2937', marginRight: 8 },
  amountInput: { fontSize: 40, fontWeight: '700', color: '#1F2937', flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  
  // duzeltilmis grid stilleri
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 12, paddingHorizontal: 5 },
  categoryItem: { width: '22%', alignItems: 'center', marginBottom: 20 },
  
  categoryIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  noteContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 20 },
  noteInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1F2937' },
  saveButton: { backgroundColor: '#2D55FF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#2D55FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', borderRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, letterSpacing: 1 },
  modalInput: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, fontSize: 16, color: '#1F2937', marginBottom: 20 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  emojiItem: { width: '18%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginBottom: 10, backgroundColor: '#F9FAFB' },
  modalSaveButton: { backgroundColor: '#2D55FF', padding: 15, borderRadius: 16, alignItems: 'center' },
  modalSaveText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});