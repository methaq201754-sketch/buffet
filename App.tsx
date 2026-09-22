import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- الأنواع والبيانات (Types & Interfaces) ---
type Role = 'Admin' | 'Employee';
type OrderStatus = 'قيد الانتظار' | 'مكتمل' | 'ملغي';

interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
}

interface Order {
  id: string;
  employeeName: string;
  mealName: string;
  details: string;
  price: number;
  dateTime: string;
  status: OrderStatus;
}

interface MealOption {
  id: string;
  name: string;
  price: number;
}

// البيانات الافتراضية
const INITIAL_USERS: User[] = [
  { id: '1', name: 'ميثاق', pin: '1111', role: 'Admin' },
  { id: '2', name: 'بدر', pin: '2222', role: 'Employee' },
  { id: '3', name: 'سعيد', pin: '3333', role: 'Employee' },
];

const MEAL_OPTIONS: MealOption[] = [
  { id: 'm1', name: 'وجبة إفطار مشكل', price: 15 },
  { id: 'm2', name: 'سندويش كبدة', price: 12 },
  { id: 'm3', name: 'سندويش فلافل', price: 8 },
  { id: 'm4', name: 'وجبة غداء سفري', price: 25 },
  { id: 'm5', name: 'عصير طازج', price: 7 },
  { id: 'm6', name: 'شاي / قهوة', price: 3 },
];

export default App;

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // حالات تسجيل الدخول
  const [inputName, setInputName] = useState('');
  const [inputPin, setInputPin] = useState('');

  // شاشات الموظف (Tabs)
  const [employeeTab, setEmployeeTab] = useState<'order' | 'history'>('order');

  // حالات نموذج الطلب
  const [selectedMeal, setSelectedMeal] = useState<MealOption>(MEAL_OPTIONS[0]);
  const [mealDetails, setMealDetails] = useState('');

  // حالات إدارة الموظفين (للإدارة)
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPin, setNewEmpPin] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // تحميل البيانات وإعداد العنوان عند بدء التطبيق
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'البوفية';
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('@buffet_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        await AsyncStorage.setItem('@buffet_users', JSON.stringify(INITIAL_USERS));
        setUsers(INITIAL_USERS);
      }

      const storedOrders = await AsyncStorage.getItem('@buffet_orders');
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    }
  };

  const saveUsers = async (newUsers: User[]) => {
    setUsers(newUsers);
    await AsyncStorage.setItem('@buffet_users', JSON.stringify(newUsers));
  };

  const saveOrders = async (newOrders: Order[]) => {
    setOrders(newOrders);
    await AsyncStorage.setItem('@buffet_orders', JSON.stringify(newOrders));
  };

  // --- 1. تسجيل الدخول ---
  const handleLogin = () => {
    const foundUser = users.find(
      (u) => u.name.trim() === inputName.trim() && u.pin.trim() === inputPin.trim()
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setInputName('');
      setInputPin('');
    } else {
      Alert.alert('خطأ', 'اسم المستخدم أو رمز PIN غير صحيح');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmployeeTab('order');
  };

  // --- 2. تقديم طلب جديد ---
  const handleSubmitOrder = () => {
    if (!currentUser) return;

    const newOrder: Order = {
      id: Date.now().toString(),
      employeeName: currentUser.name,
      mealName: selectedMeal.name,
      details: mealDetails.trim() || 'بدون ملاحظات',
      price: selectedMeal.price,
      dateTime: new Date().toLocaleString('ar-EG'),
      status: 'قيد الانتظار',
    };

    const updatedOrders = [newOrder, ...orders];
    saveOrders(updatedOrders);
    setMealDetails('');
    Alert.alert('تم بنجاح', 'تم إرسال طلبك إلى البوفية بنجاح!');
  };

  // --- 3. إدارة الطلبات (للأدمن) ---
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    saveOrders(updated);
  };

  // --- 4. إدارة الموظفين (للأدمن) ---
  const handleAddOrUpdateEmployee = () => {
    if (!newEmpName.trim() || !newEmpPin.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الموظف ورمز PIN');
      return;
    }

    if (editingUserId) {
      const updated = users.map((u) =>
        u.id === editingUserId ? { ...u, name: newEmpName.trim(), pin: newEmpPin.trim() } : u
      );
      saveUsers(updated);
      setEditingUserId(null);
      Alert.alert('تم', 'تم تحديث بيانات الموظف بنجاح');
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: newEmpName.trim(),
        pin: newEmpPin.trim(),
        role: 'Employee',
      };
      saveUsers([...users, newUser]);
      Alert.alert('تم', 'تم إضافة الموظف بنجاح');
    }

    setNewEmpName('');
    setNewEmpPin('');
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setNewEmpName(user.name);
    setNewEmpPin(user.pin);
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت تأكد من حذف هذا الموظف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          const updated = users.filter((u) => u.id !== userId);
          saveUsers(updated);
        },
      },
    ]);
  };

  // --- الشاشات الواجهات (Views) ---

  // شاشة تسجيل الدخول
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.authContainer}>
          <Text style={styles.appHeaderTitle}>البوفية</Text>
          <Text style={styles.subTitle}>تسجيل الدخول للنظام</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>اسم الموظف / المسؤول:</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: ميثاق أو بدر"
              value={inputName}
              onChangeText={setInputName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>رمز PIN:</Text>
            <TextInput
              style={styles.input}
              placeholder="****"
              keyboardType="numeric"
              secureTextEntry
              value={inputPin}
              onChangeText={setInputPin}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>

          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>حسابات للتجربة:</Text>
            <Text style={styles.hintText}>• ميثاق (مدير) - PIN: 1111</Text>
            <Text style={styles.hintText}>• بدر (موظف) - PIN: 2222</Text>
            <Text style={styles.hintText}>• سعيد (موظف) - PIN: 3333</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // لوحة تحكم المدير (ميثاق)
  if (currentUser.role === 'Admin') {
    const totalOrdersToday = orders.length;
    const totalSalesAmount = orders.reduce((sum, o) => sum + o.price, 0);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>لوحة التحكم - البوفية</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>خروج</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* ملخص المبيعات والطلبات */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalOrdersToday}</Text>
              <Text style={styles.statLabel}>إجمالي الطلبات</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
              <Text style={[styles.statNumber, { color: '#2e7d32' }]}>{totalSalesAmount} ر.س</Text>
              <Text style={styles.statLabel}>إجمالي المبيعات</Text>
            </View>
          </View>

          {/* إدارة الطلبات الحية */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>متابعة طلبات الموظفين</Text>
            {orders.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد طلبات مسجلة حتى الآن.</Text>
            ) : (
              orders.map((item) => (
                <View key={item.id} style={styles.orderCardAdmin}>
                  <View style={styles.orderHeaderAdmin}>
                    <Text style={styles.empName}>{item.employeeName}</Text>
                    <Text style={styles.orderTime}>{item.dateTime}</Text>
                  </View>
                  <Text style={styles.orderDetails}>الطلب: {item.mealName}</Text>
                  <Text style={styles.orderDetails}>الملاحظات: {item.details}</Text>
                  <Text style={styles.orderPrice}>السعر: {item.price} ر.س</Text>

                  <View style={styles.statusRow}>
                    <Text style={styles.label}>الحالة: </Text>
                    <Text style={getStatusStyle(item.status)}>{item.status}</Text>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: '#ffa000' }]}
                      onPress={() => updateOrderStatus(item.id, 'قيد الانتظار')}
                    >
                      <Text style={styles.btnText}>انتظار</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: '#388e3c' }]}
                      onPress={() => updateOrderStatus(item.id, 'مكتمل')}
                    >
                      <Text style={styles.btnText}>إكمال</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: '#d32f2f' }]}
                      onPress={() => updateOrderStatus(item.id, 'ملغي')}
                    >
                      <Text style={styles.btnText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* إدارة الموظفين */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>إدارة الموظفين</Text>
            <View style={styles.addEmpForm}>
              <TextInput
                style={styles.inputSmall}
                placeholder="اسم الموظف"
                value={newEmpName}
                onChangeText={setNewEmpName}
              />
              <TextInput
                style={styles.inputSmall}
                placeholder="رمز PIN"
                keyboardType="numeric"
                value={newEmpPin}
                onChangeText={setNewEmpPin}
              />
              <TouchableOpacity style={styles.addEmpBtn} onPress={handleAddOrUpdateEmployee}>
                <Text style={styles.primaryButtonText}>
                  {editingUserId ? 'تحديث' : 'إضافة موظف'}
                </Text>
              </TouchableOpacity>
            </View>

            {users
              .filter((u) => u.role !== 'Admin')
              .map((emp) => (
                <View key={emp.id} style={styles.empRow}>
                  <Text style={styles.empRowText}>
                    {emp.name} (PIN: {emp.pin})
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => handleEditUser(emp)} style={styles.editBtn}>
                      <Text style={{ color: '#1976d2' }}>تعديل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteUser(emp.id)} style={styles.deleteBtn}>
                      <Text style={{ color: '#d32f2f' }}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // واجهة الموظفين (بدر، سعيد...)
  const myOrders = orders.filter((o) => o.employeeName === currentUser.name);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>البوفية - مرحباً {currentUser.name}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>خروج</Text>
        </TouchableOpacity>
      </View>

      {/* شريط التنقل السفلي/العلوي للموظف */}
      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.tab, employeeTab === 'order' && styles.activeTab]}
          onPress={() => setEmployeeTab('order')}
        >
          <Text style={[styles.tabText, employeeTab === 'order' && styles.activeTabText]}>
            طلب وجبة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, employeeTab === 'history' && styles.activeTab]}
          onPress={() => setEmployeeTab('history')}
        >
          <Text style={[styles.tabText, employeeTab === 'history' && styles.activeTabText]}>
            سجل طلباتي
          </Text>
        </TouchableOpacity>
      </View>

      {employeeTab === 'order' ? (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>اختر الوجبة المناسبة:</Text>

          {/* قائمة اختيار الوجبات */}
          <View style={styles.mealsGrid}>
            {MEAL_OPTIONS.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                style={[
                  styles.mealCard,
                  selectedMeal.id === meal.id && styles.selectedMealCard,
                ]}
                onPress={() => setSelectedMeal(meal)}
              >
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealPrice}>{meal.price} ر.س</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>تفاصيل أو ملاحظات إضافية (اختياري):</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="مثال: بدون شطة / زيادة كاتشب"
              multiline
              value={mealDetails}
              onChangeText={setMealDetails}
            />
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>الوصف: {selectedMeal.name}</Text>
            <Text style={styles.summaryText}>السعر الإجمالي: {selectedMeal.price} ر.س</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitOrder}>
            <Text style={styles.primaryButtonText}>إرسال الطلب الآن</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>سجل طلباتك السابقة</Text>
          {myOrders.length === 0 ? (
            <Text style={styles.emptyText}>لم تقم بطلب أي وجبة حتى الآن.</Text>
          ) : (
            <FlatList
              data={myOrders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.orderCardUser}>
                  <View style={styles.orderHeaderAdmin}>
                    <Text style={styles.mealName}>{item.mealName}</Text>
                    <Text style={getStatusStyle(item.status)}>{item.status}</Text>
                  </View>
                  <Text style={styles.orderDetails}>التفاصيل: {item.details}</Text>
                  <Text style={styles.orderTime}>التاريخ والوقت: {item.dateTime}</Text>
                  <Text style={styles.orderPrice}>السعر: {item.price} ر.س</Text>
                </View>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// دالة مساعدة لتحديد لون حالة الطلب
const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'مكتمل':
      return { color: '#2e7d32', fontWeight: 'bold' as const };
    case 'ملغي':
      return { color: '#c62828', fontWeight: 'bold' as const };
    default:
      return { color: '#ef6c00', fontWeight: 'bold' as const };
  }
};

// --- الأنماط والتصميم (Styles) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    direction: 'rtl',
  },
  appHeaderTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerBar: {
    backgroundColor: '#d32f2f',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: '#d32f2f',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintBox: {
    marginTop: 30,
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  hintTitle: {
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 5,
    textAlign: 'right',
  },
  hintText: {
    color: '#e65100',
    textAlign: 'right',
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderColor: '#d32f2f',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  mealCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedMealCard: {
    borderColor: '#d32f2f',
    borderWidth: 2,
    backgroundColor: '#ffebee',
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mealPrice: {
    fontSize: 14,
    color: '#2e7d32',
    marginTop: 5,
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#e0f2f1',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#00695c',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  orderCardUser: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1565c0',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 15,
  },
  orderCardAdmin: {
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  orderHeaderAdmin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  empName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderTime: {
    fontSize: 12,
    color: '#777',
  },
  orderDetails: {
    fontSize: 14,
    color: '#444',
    textAlign: 'right',
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 3,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addEmpForm: {
    marginBottom: 15,
  },
  inputSmall: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    textAlign: 'right',
  },
  addEmpBtn: {
    backgroundColor: '#388e3c',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  empRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  empRowText: {
    fontSize: 15,
  },
  editBtn: {
    marginHorizontal: 10,
  },
  deleteBtn: {},
});
