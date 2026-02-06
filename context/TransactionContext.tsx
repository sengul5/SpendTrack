import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isCustom: boolean;
}

interface TransactionContextType {
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updatedFields: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (name: string, icon: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Alışveriş', icon: 'cart', isCustom: false },
  { id: '2', name: 'Yiyecek', icon: 'fast-food', isCustom: false },
  { id: '3', name: 'Ulaşım', icon: 'bus', isCustom: false },
  { id: '4', name: 'Sağlık', icon: 'medkit', isCustom: false },
  { id: '5', name: 'Faturalar', icon: 'receipt', isCustom: false },
  { id: '6', name: 'Eğlence', icon: 'film', isCustom: false },
  { id: '7', name: 'Eğitim', icon: 'school', isCustom: false },
  { id: '8', name: 'Diğer', icon: 'grid', isCustom: false },
];

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedTrans = await AsyncStorage.getItem('@transactions');
      if (storedTrans) setTransactions(JSON.parse(storedTrans));

      const storedCats = await AsyncStorage.getItem('@categories');
      if (storedCats) {
        setCategories(JSON.parse(storedCats));
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (newTrans: Omit<Transaction, 'id'>) => {
    const transaction = { ...newTrans, id: Date.now().toString() };
    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    await AsyncStorage.setItem('@transactions', JSON.stringify(updatedTransactions));
  };

  const updateTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    const updatedTransactions = transactions.map(t => 
      t.id === id ? { ...t, ...updatedFields } : t
    );
    setTransactions(updatedTransactions);
    await AsyncStorage.setItem('@transactions', JSON.stringify(updatedTransactions));
  };

  const deleteTransaction = async (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    await AsyncStorage.setItem('@transactions', JSON.stringify(updatedTransactions));
  };

  const addCategory = async (name: string, icon: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: name,
      icon: icon,
      isCustom: true
    };
    
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await AsyncStorage.setItem('@categories', JSON.stringify(updatedCategories));
  };

  const deleteCategory = async (id: string) => {
    const updatedCategories = categories.filter(c => c.id !== id);
    setCategories(updatedCategories);
    await AsyncStorage.setItem('@categories', JSON.stringify(updatedCategories));
  };

  return (
    <TransactionContext.Provider value={{ transactions, categories, addTransaction, updateTransaction, deleteTransaction, addCategory, deleteCategory, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransactions must be used within a TransactionProvider');
  return context;
};