import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../../context/TransactionContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { transactions, categories, deleteTransaction } = useTransactions();
  
  // Bildirim ayarı (Şimdilik sadece görsel, işlevi sonra eklenebilir)
  const [isNotificationEnabled, setNotificationEnabled] = useState(true);

  // --- 1. VERİLERİ DIŞA AKTAR (EXPORT) ---
  const handleExport = async () => {
    try {
      const dataStr = JSON.stringify(transactions, null, 2);
      await Share.share({
        message: dataStr,
        title: 'Harcama Verilerim'
      });
    } catch (error) {
      Alert.alert("Hata", "Paylaşım yapılamadı.");
    }
  };

  // --- 2. VERİLERİ SIFIRLA ---
  const handleResetData = () => {
    Alert.alert(
      "Tüm Verileri Sil",
      "Bütün harcama geçmişiniz ve özel kategorileriniz silinecek. Bu işlem geri alınamaz!",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Evet, Sil", 
          style: "destructive", 
          onPress: async () => {
            const { AsyncStorage } = require('react-native');
            await AsyncStorage.clear();
            // Uygulamayı yenilemek için kullanıcıyı uyaralım
            Alert.alert("Başarılı", "Veriler silindi. Değişikliklerin görünmesi için uygulamayı yeniden başlatın.");
          } 
        }
      ]
    );
  };

  // İstatistikler
  const totalTrans = transactions.length;
  const customCats = categories.filter(c => c.isCustom).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* BAŞLIK */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Profil & Ayarlar</Text>
        </View>

        {/* PROFİL KARTI */}
        <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
                <Ionicons name="person" size={40} color="#FFF" />
            </View>
            <View>
                <Text style={styles.userName}>Misafir Kullanıcı</Text>
                <Text style={styles.userStatus}>Premium Üye</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
                <Ionicons name="pencil" size={16} color="#4B3FF6" />
            </TouchableOpacity>
        </View>

        {/* ÖZET İSTATİSTİK */}
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalTrans}</Text>
                <Text style={styles.statLabel}>İşlem</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{categories.length}</Text>
                <Text style={styles.statLabel}>Kategori</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{customCats}</Text>
                <Text style={styles.statLabel}>Özel</Text>
            </View>
        </View>

        {/* MENÜ LİSTESİ */}
        <Text style={styles.sectionTitle}>Genel Ayarlar</Text>
        
        <View style={styles.menuContainer}>
            
            {/* Bildirimler */}
            <View style={styles.menuItem}>
                <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="notifications" size={20} color="#4B3FF6" />
                </View>
                <Text style={styles.menuText}>Bildirimler</Text>
                <Switch 
                    trackColor={{ false: "#E5E7EB", true: "#4B3FF6" }}
                    thumbColor={"#FFF"}
                    onValueChange={() => setNotificationEnabled(prev => !prev)}
                    value={isNotificationEnabled}
                />
            </View>

            {/* Para Birimi (Görsel) */}
            <TouchableOpacity style={styles.menuItem}>
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="cash" size={20} color="#16A34A" />
                </View>
                <Text style={styles.menuText}>Para Birimi</Text>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={styles.valueText}>TRY (₺)</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
            </TouchableOpacity>

            {/* Verileri Dışa Aktar */}
            <TouchableOpacity style={styles.menuItem} onPress={handleExport}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="share-social" size={20} color="#D97706" />
                </View>
                <Text style={styles.menuText}>Verileri Paylaş / Yedekle</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

        </View>

        <Text style={styles.sectionTitle}>Uygulama Hakkında</Text>
        <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem}>
                <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="information-circle" size={20} color="#6B7280" />
                </View>
                <Text style={styles.menuText}>Sürüm</Text>
                <Text style={styles.valueText}>v1.0.2</Text>
            </TouchableOpacity>
        </View>

        {/* TEHLİKELİ BÖLGE */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleResetData}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Tüm Verileri Sıfırla</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, padding: 20, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4B3FF6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  userStatus: { fontSize: 14, color: '#4B3FF6', fontWeight: '500', marginTop: 2 },
  editButton: { position: 'absolute', right: 20, top: 20, padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 25 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  divider: { width: 1, backgroundColor: '#E5E7EB', height: '100%' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginLeft: 20, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  menuContainer: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 5, marginBottom: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuText: { flex: 1, fontSize: 16, color: '#1F2937', fontWeight: '500' },
  valueText: { fontSize: 14, color: '#6B7280', marginRight: 8 },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, padding: 16, borderRadius: 16, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});