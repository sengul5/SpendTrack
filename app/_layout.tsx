import { Stack } from 'expo-router';
import { TransactionProvider } from '../context/TransactionContext'; // Yolu kontrol et

export default function RootLayout() {
  return (
    // Tüm uygulamayı Provider ile sarmaladık
    <TransactionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal' }} />
      </Stack>
    </TransactionProvider>
  );
}