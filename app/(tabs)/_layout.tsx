import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// Tasarımdaki Renk Paletimiz
const COLORS = {
  primary: '#2D55FF', 
  secondary: '#FF4C4C', 
  background: '#FFFFFF',
  text: '#1F2937',
  inactive: '#9CA3AF', 
};

// Ortadaki Özel "+" Butonu
const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -25, // Biraz daha yukarı aldık
      justifyContent: 'center',
      alignItems: 'center',
      ...styles.shadow,
    }}
    onPress={onPress}
  >
    <View
      style={{
        width: 64, // Biraz büyüttük
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#F9FAFB', // Arka planla kaynaşması için beyaz çerçeve
      }}
    >
      {children}
    </View>
  </TouchableOpacity>
);

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginBottom: 5,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          backgroundColor: '#ffffff',
          borderRadius: 24,
          height: 80, // Yüksekliği artırdık
          paddingBottom: 10, // Yazılar ezilmesin
          paddingTop: 10,
          ...styles.shadow,
        },
      }}
    >
      {/* 1. SOL: HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 2. SOL: STATS (RAPORLAR) */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Raporlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 3. ORTA: EKLEME BUTONU */}
      <Tabs.Screen
        name="add"
        options={{
          title: '', 
          tabBarIcon: ({ focused }) => (
            <Ionicons name="add" size={32} color="#fff" />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              onPress={() => router.push('/add-transaction')}
            />
          ),
        }}
        listeners={() => ({
            tabPress: (e) => {
                e.preventDefault();
                router.push('/add-transaction');
            },
        })}
      />

      {/* 4. SAĞ: RECORDS */}
      <Tabs.Screen
        name="records"
        options={{
          title: 'Cüzdan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 5. SAĞ: PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />

      {/* --- GİZLİ EKRANLAR (En Alta Koyduk) --- */}
      
      {/* TAKVİM (Menüde görünmesin ama erişilsin) */}
      <Tabs.Screen
        name="calendar"
        options={{
          href: null, 
        }}
      />
      
      {/* Eğer başka gizli ekran varsa buraya ekle */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#7F5DF0',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});